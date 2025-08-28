import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Settings, LogOut, UserPlus } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  // 如果加载中显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未登录，显示欢迎页面
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">卡密授权系统</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              专业的卡密管理平台，支持多程序管理、代理系统、远程更新等强大功能
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8">
                <Link to="/auth">立即开始</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                了解更多
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-0 shadow-lg bg-card/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>安全管理</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  高级加密算法保护您的卡密数据，支持封禁、启用、时长管理等功能
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-card/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>多程序支持</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  同时管理多个程序，支持API授权、远程更新、实时监控等功能
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-card/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>代理系统</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  灵活的代理权限管理，支持余额支付、价格设置、收益分成等功能
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 已登录用户的主页
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">欢迎回来</h1>
            <p className="text-muted-foreground mt-2">管理您的卡密授权系统</p>
          </div>
          <Button 
            variant="outline" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                卡密管理
              </CardTitle>
              <CardDescription>管理卡密的生成、查询、状态控制</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">进入管理</Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                程序管理
              </CardTitle>
              <CardDescription>管理多个程序的授权和更新</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">进入管理</Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                代理系统
              </CardTitle>
              <CardDescription>管理代理账户和权限设置</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">进入管理</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
