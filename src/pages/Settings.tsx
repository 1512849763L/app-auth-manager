import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RechargeCardDialog } from "@/components/RechargeCardDialog";
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Shield, 
  Save, 
  TestTube,
  ExternalLink,
  Zap,
  Plus,
  Search,
  Eye,
  Copy,
  CheckCircle,
  History
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  category: string;
}

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as SystemSetting[];
    }
  });

  const { data: rechargeCards, isLoading: loadingCards } = useQuery({
    queryKey: ['recharge-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recharge_cards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: "保存成功",
        description: "设置已更新",
      });
    },
    onError: (error) => {
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getSettingValue = (key: string): string => {
    return settings?.find(s => s.key === key)?.value || '';
  };

  const updateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const getSettingsByCategory = (category: string) => {
    return settings?.filter(s => s.category === category) || [];
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
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
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredRechargeCards = rechargeCards?.filter(card => 
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.amount.toString().includes(searchTerm)
  ) || [];

  const handleZapierTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast({
        title: "错误",
        description: "请输入Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsWebhookLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          event_type: "manual_trigger",
          system: "card_authorization_system",
        }),
      });

      toast({
        title: "请求已发送",
        description: "请检查您的Zap历史记录以确认触发成功",
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "错误",
        description: "触发Zapier webhook失败，请检查URL并重试",
        variant: "destructive",
      });
    } finally {
      setIsWebhookLoading(false);
    }
  };

  if (isLoading) {
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* 头部标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
            <p className="text-muted-foreground">管理系统配置、支付接口和集成设置</p>
          </div>
          <Badge variant="outline" className="gap-2">
            <SettingsIcon className="h-3 w-3" />
            管理员
          </Badge>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">基本设置</TabsTrigger>
            <TabsTrigger value="recharge">充值卡密</TabsTrigger>
            <TabsTrigger value="integration">集成配置</TabsTrigger>
            <TabsTrigger value="security">安全设置</TabsTrigger>
          </TabsList>

          {/* 基本设置 */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  系统基本配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory('general').map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.description}</Label>
                    {setting.key.includes('auto_approve') ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={setting.key}
                          checked={setting.value === 'true'}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.key, checked ? 'true' : 'false')
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {setting.value === 'true' ? '已启用' : '已禁用'}
                        </span>
                      </div>
                    ) : (
                      <Input
                        id={setting.key}
                        value={setting.value || ''}
                        onChange={(e) => updateSetting(setting.key, e.target.value)}
                        placeholder={setting.description || ''}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 充值卡密管理 */}
          <TabsContent value="recharge" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    充值卡密管理
                  </CardTitle>
                  <Button onClick={() => setRechargeDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    生成卡密
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="搜索卡密..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>卡密</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>使用者</TableHead>
                      <TableHead>过期时间</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCards ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : filteredRechargeCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          暂无卡密记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRechargeCards.map((card) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-mono text-sm">
                            {card.code}
                          </TableCell>
                          <TableCell>¥{Number(card.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            {getStatusBadge(card.status)}
                          </TableCell>
                          <TableCell>
                            {card.used_by ? (
                              <span className="text-sm text-muted-foreground">
                                {card.used_by.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {card.expire_at ? (
                              new Date(card.expire_at).toLocaleDateString()
                            ) : (
                              <span className="text-muted-foreground">永不过期</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(card.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(card.code);
                                toast({
                                  title: "复制成功",
                                  description: "卡密已复制到剪贴板",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 集成配置 */}
          <TabsContent value="integration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Zapier 集成
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  配置 Zapier Webhook 以自动化您的工作流程。当系统中发生特定事件时，可以触发您的 Zap。
                </p>

                <form onSubmit={handleZapierTrigger} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button 
                      type="submit" 
                      disabled={isWebhookLoading || !webhookUrl}
                      className="gap-2"
                    >
                      {isWebhookLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      测试 Webhook
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <a 
                        href="https://zapier.com/apps/webhook/help" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Zapier 文档
                      </a>
                    </Button>
                  </div>
                </form>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">设置步骤</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>登录您的 Zapier 账户</li>
                    <li>创建一个新的 Zap</li>
                    <li>选择 "Webhooks by Zapier" 作为触发器</li>
                    <li>选择 "Catch Hook" 触发事件</li>
                    <li>复制提供的 Webhook URL 并粘贴到上方</li>
                    <li>点击测试按钮验证连接</li>
                  </ol>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">可触发的事件</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Badge variant="outline">新用户注册</Badge>
                    <Badge variant="outline">卡密生成</Badge>
                    <Badge variant="outline">卡密使用</Badge>
                    <Badge variant="outline">订单创建</Badge>
                    <Badge variant="outline">支付完成</Badge>
                    <Badge variant="outline">系统警报</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全设置 */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  安全配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">安全提醒</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• 定期更换API密钥和商户密钥</li>
                    <li>• 启用双因素认证保护管理员账户</li>
                    <li>• 监控异常登录和操作记录</li>
                    <li>• 保持系统和依赖项的最新版本</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h3 className="font-semibold">SSL 证书</h3>
                        <p className="text-sm text-muted-foreground">已启用</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h3 className="font-semibold">数据加密</h3>
                        <p className="text-sm text-muted-foreground">AES-256</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">操作日志</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">登录日志记录</span>
                      <Badge variant="default">已启用</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">API调用日志</span>
                      <Badge variant="default">已启用</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">数据修改日志</span>
                      <Badge variant="default">已启用</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <RechargeCardDialog
          open={rechargeDialogOpen}
          onOpenChange={setRechargeDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Settings;