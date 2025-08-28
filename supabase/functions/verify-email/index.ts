import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyEmailRequest {
  email: string
  verificationCode: string
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

    const { email, verificationCode }: VerifyEmailRequest = await req.json();

    console.log('Verifying email:', email, 'with code:', verificationCode);

    // 查找未过期的验证码
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (verificationError || !verification) {
      console.log('Verification failed:', verificationError);
      return new Response(
        JSON.stringify({ 
          error: '验证码无效或已过期',
          success: false 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 标记验证码为已使用
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ 
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Failed to update verification status:', updateError);
      throw new Error('更新验证状态失败');
    }

    console.log('Email verification successful');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '邮箱验证成功',
        verifiedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '邮箱验证失败',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});