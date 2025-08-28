import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings, Shield, Users, Key, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    // 检查现有会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('获取用户资料失败:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('获取用户资料错误:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "退出失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "已退出登录",
        description: "感谢您的使用！",
      });
      
      navigate('/auth');
    } catch (error) {
      toast({
        title: "退出失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* 顶部导航栏 */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-full">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">卡密授权系统</h1>
                <p className="text-sm text-muted-foreground">管理控制台</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            欢迎回来，{profile.username}
          </h2>
          <p className="text-muted-foreground">
            使用下方功能模块管理您的授权系统
          </p>
        </div>

        {/* 功能模块网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 程序管理 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full">
                <Settings className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">程序管理</h3>
                <p className="text-sm text-muted-foreground">管理授权程序</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              添加、编辑和删除授权程序，配置程序参数和远程更新功能。
            </p>
            <Button className="w-full" variant="outline">
              进入管理
            </Button>
          </div>

          {/* 卡密管理 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full">
                <Key className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">卡密管理</h3>
                <p className="text-sm text-muted-foreground">管理所有卡密</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              生成、查询、修改卡密状态，设置有效期和权限控制。
            </p>
            <Button className="w-full" variant="outline">
              进入管理
            </Button>
          </div>

          {/* 用户管理 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-full">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">用户管理</h3>
                <p className="text-sm text-muted-foreground">管理系统用户</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              管理管理员和代理账户，设置权限和余额。
            </p>
            <Button className="w-full" variant="outline">
              进入管理
            </Button>
          </div>

          {/* 财务管理 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-full">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">财务管理</h3>
                <p className="text-sm text-muted-foreground">余额和订单</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              查看余额记录、订单统计和收益分析。
            </p>
            <Button className="w-full" variant="outline">
              进入管理
            </Button>
          </div>

          {/* 系统设置 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">系统设置</h3>
                <p className="text-sm text-muted-foreground">安全与配置</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              修改管理员密码、设置验证码参数和系统安全配置。
            </p>
            <Button className="w-full" variant="outline">
              进入设置
            </Button>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-border/50">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">活跃程序</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-border/50">
            <p className="text-2xl font-bold text-green-500">0</p>
            <p className="text-sm text-muted-foreground mt-1">有效卡密</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-border/50">
            <p className="text-2xl font-bold text-purple-500">0</p>
            <p className="text-sm text-muted-foreground mt-1">注册用户</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-border/50">
            <p className="text-2xl font-bold text-orange-500">¥{profile.balance || '0.00'}</p>
            <p className="text-sm text-muted-foreground mt-1">账户余额</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;