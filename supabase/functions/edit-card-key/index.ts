import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EditCardKeyRequest {
  cardId: string;
  newDurationDays: number;
  newStatus?: string;
  newMaxMachines?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '需要认证' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '认证失败' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { cardId, newDurationDays, newStatus, newMaxMachines }: EditCardKeyRequest = await req.json();

    console.log('Editing card key:', { cardId, newDurationDays, newStatus, newMaxMachines });

    // Get the current card information with program details
    const { data: cardData, error: cardError } = await supabase
      .from('card_keys')
      .select(`
        *,
        programs (
          name,
          price
        )
      `)
      .eq('id', cardId)
      .single();

    if (cardError || !cardData) {
      console.error('Card not found:', cardError);
      return new Response(
        JSON.stringify({ error: '卡密不存在' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Business rule: Used cards cannot be changed back to unused
    if (cardData.status === 'used' && newStatus === 'unused') {
      return new Response(
        JSON.stringify({ error: '已使用的卡密不能改回未使用状态' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile if we need to update balance
    let userProfile = null;
    if (cardData.user_id && newDurationDays !== cardData.duration_days) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cardData.user_id)
        .single();

      if (profileError) {
        console.error('User profile not found:', profileError);
        return new Response(
          JSON.stringify({ error: '用户信息不存在' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      userProfile = profileData;
    }

    // Calculate balance change if duration is being modified
    let balanceChange = 0;
    let description = '';
    
    if (newDurationDays !== cardData.duration_days && cardData.user_id && userProfile) {
      const program = cardData.programs as any;
      const originalDays = cardData.duration_days;
      const daysDifference = newDurationDays - originalDays;
      
      // Calculate price per day
      const pricePerDay = program.price / originalDays;
      balanceChange = -daysDifference * pricePerDay; // Negative means user pays more
      
      description = daysDifference > 0 
        ? `卡密延长${daysDifference}天` 
        : `卡密缩短${Math.abs(daysDifference)}天`;

      // Check if user has enough balance for extending
      if (balanceChange < 0 && userProfile.balance < Math.abs(balanceChange)) {
        return new Response(
          JSON.stringify({ error: '余额不足，无法延长卡密时长' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Start transaction-like operations
    const updates: any = {
      duration_days: newDurationDays,
      updated_at: new Date().toISOString()
    };

    if (newStatus && newStatus !== cardData.status) {
      updates.status = newStatus;
    }

    if (newMaxMachines !== undefined && newMaxMachines !== cardData.max_machines) {
      updates.max_machines = newMaxMachines;
    }

    // Update the card key
    const { error: updateError } = await supabase
      .from('card_keys')
      .update(updates)
      .eq('id', cardId);

    if (updateError) {
      console.error('Failed to update card:', updateError);
      return new Response(
        JSON.stringify({ error: '更新卡密失败' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user balance if needed
    if (balanceChange !== 0 && userProfile) {
      const newBalance = userProfile.balance + balanceChange;
      
      // Update profile balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', cardData.user_id);

      if (balanceError) {
        console.error('Failed to update balance:', balanceError);
        return new Response(
          JSON.stringify({ error: '更新余额失败' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create balance record
      const { error: recordError } = await supabase
        .from('balance_records')
        .insert({
          user_id: cardData.user_id,
          type: balanceChange > 0 ? 'refund' : 'consume',
          amount: Math.abs(balanceChange),
          balance_before: userProfile.balance,
          balance_after: newBalance,
          description: description
        });

      if (recordError) {
        console.error('Failed to create balance record:', recordError);
        // Don't fail the whole operation for this
      }
    }

    console.log('Card key edited successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '卡密编辑成功',
        balanceChange: balanceChange
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in edit-card-key function:', error);
    return new Response(
      JSON.stringify({ error: '系统错误' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});