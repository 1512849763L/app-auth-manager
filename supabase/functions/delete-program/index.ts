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

    // 检查是否有关联的卡密
    const { data: cardKeysData, error: cardKeysError } = await supabase
      .from('card_keys')
      .select('id, status')
      .eq('program_id', programId);

    console.log('Card keys check:', { cardKeysData, cardKeysError });

    if (cardKeysError) {
      console.error('Error checking card keys:', cardKeysError);
      return new Response(
        JSON.stringify({ error: '检查关联卡密失败' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 如果有关联的卡密，不允许删除
    if (cardKeysData && cardKeysData.length > 0) {
      const activeCards = cardKeysData.filter(card => card.status === 'unused' || card.status === 'used');
      console.log('Active cards found:', activeCards.length, 'out of', cardKeysData.length);
      
      if (activeCards.length > 0) {
        console.log('Cannot delete program due to active cards');
        return new Response(
          JSON.stringify({ 
            error: `无法删除程序，还有 ${activeCards.length} 个关联的有效卡密。请先删除或处理相关卡密。` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
        message: '程序删除成功'
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