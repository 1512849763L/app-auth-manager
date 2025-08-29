import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

interface DeleteProgramRequest {
  programId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Delete program request received:', req.method, req.url);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Supabase配置缺失' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: '请求数据格式错误' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { programId }: DeleteProgramRequest = requestBody;
    console.log('Parsed request body:', requestBody);

    if (!programId) {
      console.error('Missing programId in request');
      return new Response(
        JSON.stringify({ error: '缺少程序ID' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting to delete program:', programId);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    // 验证用户身份 - 检查是否为管理员
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          console.error('Authentication failed:', authError);
          return new Response(
            JSON.stringify({ error: '身份验证失败' }), 
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 检查用户是否为管理员
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          console.error('User is not admin:', { profileError, profile });
          return new Response(
            JSON.stringify({ error: '权限不足，只有管理员可以删除程序' }), 
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('User authenticated as admin:', user.id);
      } catch (tokenError) {
        console.error('Token validation error:', tokenError);
        return new Response(
          JSON.stringify({ error: '无效的身份令牌' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: '缺少身份验证信息' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查程序是否存在
    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError) {
      console.error('Error fetching program:', programError);
      return new Response(
        JSON.stringify({ error: '程序不存在或查询失败' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取所有关联的卡密，包含程序价格信息用于退款
    const { data: cardKeysData, error: cardKeysError } = await supabase
      .from('card_keys')
      .select(`
        *,
        programs (
          name,
          price,
          cost_price
        )
      `)
      .eq('program_id', programId);

    console.log('Card keys check:', { cardKeysCount: cardKeysData?.length, cardKeysError });

    if (cardKeysError) {
      console.error('Error checking card keys:', cardKeysError);
      return new Response(
        JSON.stringify({ error: '检查关联卡密失败' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalRefunded = 0;
    let refundedCards = 0;

    // 处理所有关联卡密的退款和删除
    if (cardKeysData && cardKeysData.length > 0) {
      console.log(`Processing ${cardKeysData.length} card keys for deletion and refund`);
      
      for (const card of cardKeysData) {
        let refundAmount = 0;
        
        // 只对有用户的卡密进行退款处理
        if (card.user_id) {
          if (card.status === 'unused') {
            // 未使用的卡密全额退款
            refundAmount = Number(card.programs.price) || 0;
            console.log(`Card ${card.card_key}: unused, full refund ${refundAmount}`);
          } else if (card.status === 'used' && card.expire_at) {
            // 已使用但未到期的卡密按剩余时间比例退款
            const now = new Date();
            const expireAt = new Date(card.expire_at);
            const usedAt = new Date(card.used_at || card.created_at);
            
            if (expireAt > now) {
              const totalDuration = expireAt.getTime() - usedAt.getTime();
              const remainingDuration = expireAt.getTime() - now.getTime();
              const refundRatio = remainingDuration / totalDuration;
              refundAmount = Math.max(0, Number(card.programs.price) * refundRatio);
              console.log(`Card ${card.card_key}: used but not expired, partial refund ${refundAmount} (ratio: ${refundRatio.toFixed(2)})`);
            } else {
              console.log(`Card ${card.card_key}: expired, no refund`);
            }
          }

          // 处理退款
          if (refundAmount > 0) {
            // 获取用户当前余额
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('balance')
              .eq('id', card.user_id)
              .single();

            if (!profileError && profileData) {
              const currentBalance = Number(profileData.balance) || 0;
              const newBalance = currentBalance + refundAmount;

              // 更新用户余额
              const { error: balanceError } = await supabase
                .from('profiles')
                .update({ 
                  balance: newBalance,
                  updated_at: new Date().toISOString()
                })
                .eq('id', card.user_id);

              if (!balanceError) {
                // 记录余额变动
                await supabase
                  .from('balance_records')
                  .insert({
                    user_id: card.user_id,
                    type: 'refund',
                    amount: refundAmount,
                    balance_before: currentBalance,
                    balance_after: newBalance,
                    description: `程序删除退款: ${card.programs.name} - ${card.card_key}`
                  });

                totalRefunded += refundAmount;
                refundedCards++;
                console.log(`Refunded ${refundAmount} to user ${card.user_id} for card ${card.card_key}`);
              } else {
                console.error(`Failed to update balance for user ${card.user_id}:`, balanceError);
              }
            } else {
              console.error(`Failed to get profile for user ${card.user_id}:`, profileError);
            }
          }
        }
      }

      // 删除所有关联的卡密
      const { error: deleteCardsError } = await supabase
        .from('card_keys')
        .delete()
        .eq('program_id', programId);

      if (deleteCardsError) {
        console.error('Error deleting associated card keys:', deleteCardsError);
        return new Response(
          JSON.stringify({ error: '删除关联卡密失败' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Deleted ${cardKeysData.length} card keys, refunded ${refundedCards} cards with total amount ${totalRefunded}`);
    }

    // 删除程序相关的代理权限
    const { error: permissionsError } = await supabase
      .from('agent_permissions')
      .delete()
      .eq('program_id', programId);

    if (permissionsError) {
      console.error('Error deleting agent permissions:', permissionsError);
      return new Response(
        JSON.stringify({ error: '删除代理权限失败' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 删除程序
    const { error: deleteError } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (deleteError) {
      console.error('Error deleting program:', deleteError);
      return new Response(
        JSON.stringify({ error: '程序删除失败' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Program deleted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: '程序删除成功',
        details: {
          deletedCards: cardKeysData?.length || 0,
          refundedCards: refundedCards,
          totalRefunded: totalRefunded
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-program function:', error);
    return new Response(
      JSON.stringify({ error: '系统错误，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});