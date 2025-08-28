import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTestCardRequest {
  programId: string;
  durationDays?: number;
  machineCount?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
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

    const body: CreateTestCardRequest = await req.json();
    const { programId, durationDays = 30, machineCount = 2 } = body;

    if (!programId) {
      return new Response(
        JSON.stringify({ error: '程序ID不能为空' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate a test card key
    const generateCardKey = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i % 4 === 3 && i < 19) {
          result += '-';
        }
      }
      return result;
    };

    // Generate test machine codes
    const generateMachineCode = () => {
      return Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('').toUpperCase();
    };

    const testMachineCodes = Array.from({ length: machineCount }, generateMachineCode);
    const cardKey = generateCardKey();

    console.log(`Creating test card with key: ${cardKey}`);
    console.log(`Machine codes: ${testMachineCodes.join(', ')}`);

    // Create the card key with bound machine codes
    const { data: cardData, error: insertError } = await supabaseClient
      .from('card_keys')
      .insert({
        card_key: cardKey,
        program_id: programId,
        duration_days: durationDays,
        user_id: user.id,
        created_by: user.id,
        status: 'used',
        bound_machine_codes: testMachineCodes,
        used_machines: machineCount,
        max_machines: 5,
        used_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: `创建测试卡密失败: ${insertError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Test card created successfully:', cardData);

    return new Response(
      JSON.stringify({
        success: true,
        cardKey: cardKey,
        machineCount: machineCount,
        machineCodes: testMachineCodes,
        message: `测试卡密创建成功，已绑定 ${machineCount} 个机器码`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});