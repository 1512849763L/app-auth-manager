import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendVerificationRequest {
  email: string
  username?: string
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

    const { email, username = '用户' }: SendVerificationRequest = await req.json();

    console.log('Sending verification code to:', email);

    // 生成6位数字验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 设置过期时间（10分钟后）
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 先删除该邮箱的旧验证码
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email);

    // 插入新的验证码记录
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        email: email,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to save verification code:', insertError);
      throw new Error('保存验证码失败');
    }

    // 发送验证码邮件
    const emailResponse = await supabase.functions.invoke('send-email', {
      body: {
        type: 'verification-code',
        to: email,
        data: {
          username: username,
          verificationCode: verificationCode,
        }
      }
    });

    if (emailResponse.error) {
      console.error('Failed to send verification email:', emailResponse.error);
      throw new Error('发送验证邮件失败');
    }

    // 记录邮件发送日志
    await supabase
      .from('email_logs')
      .insert({
        email_type: 'verification-code',
        recipient_email: email,
        subject: '邮箱验证码',
        status: 'sent'
      });

    console.log('Verification code sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '验证码已发送到您的邮箱，请查收',
        expiresAt: expiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-verification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '发送验证码失败',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});