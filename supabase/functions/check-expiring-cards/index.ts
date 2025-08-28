import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Starting expiring cards check...');

    // 查找即将到期的卡密（7天、3天、1天）
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // 查找即将到期的卡密
    const { data: expiringCards, error: cardsError } = await supabase
      .from('card_keys')
      .select(`
        *,
        programs (name),
        profiles!card_keys_user_id_fkey (username)
      `)
      .eq('status', 'used')
      .not('expire_at', 'is', null)
      .lte('expire_at', sevenDaysLater.toISOString())
      .gte('expire_at', now.toISOString());

    if (cardsError) {
      console.error('Error fetching expiring cards:', cardsError);
      throw cardsError;
    }

    console.log(`Found ${expiringCards?.length || 0} expiring cards`);

    if (!expiringCards || expiringCards.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '没有即将到期的卡密',
          processed: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    // 为每个即将到期的卡密发送提醒邮件
    for (const card of expiringCards) {
      try {
        if (!card.profiles) {
          console.log(`Skipping card ${card.card_key} - no user profile found`);
          continue;
        }

        // 获取用户邮箱
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(card.user_id);
        
        if (userError || !userData.user?.email) {
          console.log(`Skipping card ${card.card_key} - no email found`);
          continue;
        }

        const expireDate = new Date(card.expire_at);
        const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        // 检查是否已经在最近24小时内发送过邮件（避免重复发送）
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // 这里可以添加一个邮件发送记录表来追踪，现在先简单处理
        // 只在特定天数发送：7天、3天、1天
        if (![7, 3, 1].includes(daysLeft)) {
          continue;
        }

        // 发送到期提醒邮件
        const emailResponse = await supabase.functions.invoke('send-email', {
          body: {
            type: 'card-expiry',
            to: userData.user.email,
            data: {
              username: card.profiles.username,
              cardKey: card.card_key,
              programName: card.programs?.name || '未知程序',
              expiryDate: expireDate.toLocaleDateString('zh-CN'),
              daysLeft: daysLeft,
            }
          }
        });

        if (emailResponse.error) {
          console.error(`Failed to send email for card ${card.card_key}:`, emailResponse.error);
          errors.push(`卡密 ${card.card_key}: ${emailResponse.error.message}`);
        } else {
          console.log(`Email sent successfully for card ${card.card_key}`);
          emailsSent++;
        }

      } catch (error: any) {
        console.error(`Error processing card ${card.card_key}:`, error);
        errors.push(`卡密 ${card.card_key}: ${error.message}`);
      }
    }

    console.log(`Processed ${expiringCards.length} cards, sent ${emailsSent} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功处理 ${expiringCards.length} 个即将到期的卡密，发送了 ${emailsSent} 封邮件`,
        processed: expiringCards.length,
        emailsSent: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in check-expiring-cards function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '检查到期卡密失败',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});