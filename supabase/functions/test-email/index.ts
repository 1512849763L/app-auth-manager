import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestEmailRequest {
  testEmail: string
  emailType: 'welcome' | 'verification-code' | 'card-expiry'
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

    // Verify the user is admin
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: '权限不足' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { testEmail, emailType }: TestEmailRequest = await req.json();

    console.log('Sending test email:', { testEmail, emailType });

    let emailData;
    switch (emailType) {
      case 'welcome':
        emailData = {
          type: 'welcome',
          to: testEmail,
          data: {
            username: '测试用户',
            verificationUrl: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?type=signup&token=test-token`
          }
        };
        break;

      case 'verification-code':
        emailData = {
          type: 'verification-code',
          to: testEmail,
          data: {
            username: '测试用户',
            verificationCode: '123456'
          }
        };
        break;

      case 'card-expiry':
        emailData = {
          type: 'card-expiry',
          to: testEmail,
          data: {
            username: '测试用户',
            cardKey: 'TEST-1234-5678-9ABC-DEF0',
            programName: '测试程序',
            expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
            daysLeft: 3
          }
        };
        break;

      default:
        throw new Error('不支持的邮件类型');
    }

    // Send test email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      console.error('Failed to send test email:', error);
      throw new Error(error.message);
    }

    if (data.error) {
      console.error('Email service error:', data.error);
      throw new Error(data.error);
    }

    // Log the test email
    await supabase
      .from('email_logs')
      .insert({
        email_type: `test-${emailType}`,
        recipient_email: testEmail,
        subject: `测试邮件 - ${emailType}`,
        status: 'sent',
        user_id: user.id
      });

    console.log('Test email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `测试邮件已发送至 ${testEmail}`,
        emailType: emailType
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in test-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '发送测试邮件失败',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});