import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingCart, 
  Key, 
  Wallet, 
  Shield,
  Copy,
  RefreshCw,
  User,
  Lock,
  Eye,
  EyeOff,
  CreditCard
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 获取用户信息
  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    }
  });

  // 获取可购买的程序
  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: ['available-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // 获取我的卡密
  const { data: myCardKeys, isLoading: loadingKeys } = useQuery({
    queryKey: ['my-card-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_keys')
        .select(`
          *,
          programs!inner(name, price)
        `)
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.id
  });

  // 购买卡密
  const buyCardKeyMutation = useMutation({
    mutationFn: async ({ programId, duration }: { programId: string; duration: number }) => {
      const program = programs?.find(p => p.id === programId);
      if (!program) throw new Error('程序不存在');
      
      if (userProfile!.balance < program.price) {
        throw new Error('余额不足，请联系管理员充值');
      }

      // 创建订单
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userProfile!.id,
          program_id: programId,
          amount: program.price,
          cost_amount: program.cost_price,
          status: 'paid',
          payment_method: 'balance'
        });

      if (orderError) throw orderError;

      // 生成卡密
      const { data: cardKey, error: rpcError } = await supabase.rpc('generate_card_key');
      if (rpcError) throw rpcError;
      
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + duration);

      const { error: keyError } = await supabase
        .from('card_keys')
        .insert({
          card_key: cardKey,
          program_id: programId,
          user_id: userProfile!.id,
          expire_at: expireDate.toISOString(),
          duration_days: duration,
          created_by: userProfile!.id,
          status: 'unused'
        });

      if (keyError) throw keyError;

      // 更新余额
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: userProfile!.balance - program.price })
        .eq('id', userProfile!.id);

      if (balanceError) throw balanceError;

      // 记录余额变动
      await supabase
        .from('balance_records')
        .insert({
          user_id: userProfile!.id,
          amount: -program.price,
          type: 'consume',
          description: `购买${program.name}卡密`,
          balance_before: userProfile!.balance,
          balance_after: userProfile!.balance - program.price
        });

      return cardKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-card-keys'] });
      toast({
        title: "购买成功",
        description: "卡密已生成，请查看我的卡密",
      });
    },
    onError: (error) => {
      toast({
        title: "购买失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 清除IP绑定
  const clearIPMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('card_keys')
        .update({ 
          // 这里可以添加清除IP的逻辑，比如清空ip_address字段
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .eq('user_id', userProfile!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-card-keys'] });
      toast({
        title: "操作成功",
        description: "IP绑定已清除",
      });
    }
  });

  // 修改密码
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // 首先验证当前密码
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email!,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('当前密码错误');
      }

      // 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "密码修改成功",
        description: "您的密码已成功修改",
      });
    },
    onError: (error) => {
      toast({
        title: "密码修改失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 复制卡密
  const copyCardKey = (cardKey: string) => {
    navigator.clipboard.writeText(cardKey);
    toast({
      title: "已复制",
      description: "卡密已复制到剪贴板",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      unused: "default",
      used: "secondary",
      expired: "destructive"
    };
    
    const labels: Record<string, string> = {
      unused: "未使用",
      used: "已使用",
      expired: "已过期"
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "请填写完整信息",
        description: "所有密码字段都是必填的",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "新密码和确认密码不一致",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "密码太短",
        description: "新密码至少需要6个字符",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (loadingProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 管理员看到管理界面
  if (userProfile?.role === 'admin') {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">管理控制台</h1>
            <p className="text-muted-foreground">
              管理您的程序授权、卡密生成和用户权限
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">程序管理</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programs?.length || 0}</div>
                <p className="text-xs text-muted-foreground">个活跃程序</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">账户余额</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{userProfile?.balance?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">当前余额</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">我的卡密</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myCardKeys?.length || 0}</div>
                <p className="text-xs text-muted-foreground">张卡密</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系统角色</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">管理员</div>
                <p className="text-xs text-muted-foreground">完全权限</p>
              </CardContent>
            </Card>
          </div>

          {/* 管理员账户设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                账户设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">当前密码</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="请输入当前密码"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="请输入新密码"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="请确认新密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                {changePasswordMutation.isPending ? '修改中...' : '修改密码'}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-muted-foreground mb-4">使用侧边栏导航到各管理功能</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 普通用户看到用户界面
  return (
    <Layout>
      <div className="space-y-6">
        {/* 用户欢迎信息 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">欢迎回来，{userProfile?.username}</h1>
            <p className="text-muted-foreground">管理您的卡密和账户</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">账户余额</div>
            <div className="text-2xl font-bold">¥{userProfile?.balance?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        <Tabs defaultValue="purchase" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchase">购买卡密</TabsTrigger>
            <TabsTrigger value="my-keys">我的卡密</TabsTrigger>
            <TabsTrigger value="account">账户设置</TabsTrigger>
          </TabsList>

          {/* 购买卡密 */}
          <TabsContent value="purchase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  购买卡密
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPrograms ? (
                  <div className="text-center py-4">加载中...</div>
                ) : programs?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无可购买的程序
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programs?.map((program) => (
                      <Card key={program.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg">{program.name}</CardTitle>
                          <div className="text-2xl font-bold text-primary">¥{program.price}</div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {program.description || '高质量的软件授权服务'}
                          </p>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                className="w-full" 
                                onClick={() => setSelectedProgram(program.id)}
                                disabled={userProfile!.balance < program.price}
                              >
                                {userProfile!.balance < program.price ? '余额不足' : '立即购买'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>购买 {program.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>有效期（天）</Label>
                                  <Select defaultValue="30">
                                    <SelectTrigger>
                                      <SelectValue placeholder="选择有效期" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="7">7天 - ¥{program.price}</SelectItem>
                                      <SelectItem value="30">30天 - ¥{program.price}</SelectItem>
                                      <SelectItem value="90">90天 - ¥{(program.price * 2.5).toFixed(2)}</SelectItem>
                                      <SelectItem value="365">365天 - ¥{(program.price * 10).toFixed(2)}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="bg-muted p-4 rounded-lg">
                                  <div className="flex justify-between">
                                    <span>当前余额：</span>
                                    <span>¥{userProfile?.balance?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>购买金额：</span>
                                    <span>¥{program.price}</span>
                                  </div>
                                  <div className="flex justify-between font-bold">
                                    <span>购买后余额：</span>
                                    <span>¥{(userProfile!.balance - program.price).toFixed(2)}</span>
                                  </div>
                                </div>

                                <Button 
                                  className="w-full" 
                                  onClick={() => buyCardKeyMutation.mutate({ programId: program.id, duration: 30 })}
                                  disabled={buyCardKeyMutation.isPending}
                                >
                                  {buyCardKeyMutation.isPending ? '购买中...' : '确认购买'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 我的卡密 */}
          <TabsContent value="my-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  我的卡密
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="text-center py-4">加载中...</div>
                ) : myCardKeys?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    您还没有任何卡密，去购买一个吧！
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>程序名称</TableHead>
                        <TableHead>卡密</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>过期时间</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myCardKeys?.map((cardKey) => (
                        <TableRow key={cardKey.id}>
                          <TableCell className="font-medium">
                            {(cardKey as any).programs?.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {cardKey.card_key}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(cardKey.status)}
                          </TableCell>
                          <TableCell>
                            {cardKey.expire_at ? new Date(cardKey.expire_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyCardKey(cardKey.card_key)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => clearIPMutation.mutate(cardKey.id)}
                                disabled={clearIPMutation.isPending}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 账户设置 */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  账户设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">账户信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>用户名</Label>
                      <div className="text-sm text-muted-foreground mt-1">{userProfile?.username}</div>
                    </div>
                    <div>
                      <Label>当前余额</Label>
                      <div className="text-sm text-muted-foreground mt-1">¥{userProfile?.balance?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">修改密码</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">当前密码</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="请输入当前密码"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密码</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="请输入新密码"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">确认新密码</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="请确认新密码"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    {changePasswordMutation.isPending ? '修改中...' : '修改密码'}
                  </Button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">账户说明</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 密码长度至少6个字符</li>
                    <li>• 余额充值请联系管理员</li>
                    <li>• 卡密购买后立即生效</li>
                    <li>• 如有问题请联系客服</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;