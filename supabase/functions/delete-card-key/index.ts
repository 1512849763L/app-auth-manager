import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

interface DeleteCardKeyRequest {
  cardId: string;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { cardId }: DeleteCardKeyRequest = await req.json();

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: '缺少卡密ID' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting card key:', cardId);

    // 获取卡密信息
    const { data: cardData, error: cardError } = await supabase
      .from('card_keys')
      .select(`
        *,
        programs (
          name,
          price,
          cost_price
        )
      `)
      .eq('id', cardId)
      .single();

    if (cardError) {
      console.error('Error fetching card:', cardError);
      return new Response(
        JSON.stringify({ error: '卡密不存在或查询失败' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Card data:', cardData);

    let refundAmount = 0;
    let balanceChange = 0;

    // 如果是未使用的卡密且有用户，需要退回余额
    if (cardData.status === 'unused' && cardData.user_id) {
      // 退回程序的售价（用户购买时支付的金额）
      refundAmount = Number(cardData.programs.price) || 0;
      
      console.log('Processing refund for unused card, amount:', refundAmount);

      // 获取用户当前余额
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', cardData.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return new Response(
          JSON.stringify({ error: '用户信息获取失败' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const currentBalance = parseFloat(profileData.balance.toString());
      const newBalance = currentBalance + refundAmount;
      balanceChange = refundAmount;

      console.log('Current balance:', currentBalance, 'New balance:', newBalance);

      // 更新用户余额
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardData.user_id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
        return new Response(
          JSON.stringify({ error: '余额更新失败' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 记录余额变动
      const { error: recordError } = await supabase
        .from('balance_records')
        .insert({
          user_id: cardData.user_id,
          type: 'refund',
          amount: refundAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `删除未使用卡密退款: ${cardData.card_key}`
        });

      if (recordError) {
        console.error('Error creating balance record:', recordError);
        return new Response(
          JSON.stringify({ error: '余额记录创建失败' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Refund processed successfully');
    }

    // 删除卡密
    const { error: deleteError } = await supabase
      .from('card_keys')
      .delete()
      .eq('id', cardId);

    if (deleteError) {
      console.error('Error deleting card:', deleteError);
      return new Response(
        JSON.stringify({ error: '卡密删除失败' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Card deleted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: '卡密删除成功',
        refunded: refundAmount > 0,
        refundAmount: refundAmount,
        balanceChange: balanceChange
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-card-key function:', error);
    return new Response(
      JSON.stringify({ error: '系统错误，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});