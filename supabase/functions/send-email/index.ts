import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { WelcomeEmail } from './_templates/welcome.tsx'
import { CardExpiryEmail } from './_templates/card-expiry.tsx'
import { VerificationCodeEmail } from './_templates/verification-code.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'welcome' | 'card-expiry' | 'verification-code'
  to: string
  data: any
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

    const { type, to, data }: EmailRequest = await req.json();

    console.log('Sending email:', { type, to });

    let html = '';
    let subject = '';

    switch (type) {
      case 'welcome':
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            username: data.username,
            verificationUrl: data.verificationUrl,
          })
        );
        subject = '欢迎注册 - 请验证您的邮箱';
        break;

      case 'card-expiry':
        html = await renderAsync(
          React.createElement(CardExpiryEmail, {
            username: data.username,
            cardKey: data.cardKey,
            programName: data.programName,
            expiryDate: data.expiryDate,
            daysLeft: data.daysLeft,
          })
        );
        subject = `⚠️ 卡密到期提醒 - ${data.daysLeft}天后到期`;
        break;

      case 'verification-code':
        html = await renderAsync(
          React.createElement(VerificationCodeEmail, {
            username: data.username,
            verificationCode: data.verificationCode,
          })
        );
        subject = '邮箱验证码';
        break;

      default:
        throw new Error('不支持的邮件类型');
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: '卡密管理系统 <noreply@yourdomain.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Email sending failed:', error);
      throw error;
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '邮件发送成功',
        emailId: emailResult.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '邮件发送失败',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});