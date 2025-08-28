import React, { useState, useEffect } from "react";
import { Mail, Send, TestTube, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";

const Email = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [settings, setSettings] = useState({
    email_enabled: true,
    sender_name: "",
    sender_email: "",
    reply_to: "",
    card_expiry_days: "7",
    welcome_enabled: true,
    expiry_enabled: true,
    daily_report_enabled: false,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'email_enabled',
          'sender_name', 
          'sender_email',
          'reply_to',
          'card_expiry_days',
          'welcome_enabled',
          'expiry_enabled',
          'daily_report_enabled'
        ]);

      if (error) throw error;

      const settingsMap = data?.reduce((acc: any, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {}) || {};

      setSettings(prev => ({
        ...prev,
        ...settingsMap,
        email_enabled: settingsMap.email_enabled === 'true',
        welcome_enabled: settingsMap.welcome_enabled !== 'false',
        expiry_enabled: settingsMap.expiry_enabled !== 'false',
        daily_report_enabled: settingsMap.daily_report_enabled === 'true',
      }));
    } catch (error: any) {
      toast({
        title: "获取设置失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? value.toString() : value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: "保存成功",
        description: "邮箱配置已更新",
      });
    } catch (error: any) {
      toast({
        title: "保存失败", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (type: string) => {
    setTestLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('test-email', {
        body: { type, to: settings.reply_to || settings.sender_email }
      });

      if (fnError) throw fnError;

      toast({
        title: "测试邮件已发送",
        description: `${type} 邮件已发送到 ${settings.reply_to || settings.sender_email}`,
      });
    } catch (error: any) {
      toast({
        title: "发送失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">邮箱配置</h1>
            <p className="text-muted-foreground">管理系统邮件服务设置</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">基础设置</TabsTrigger>
            <TabsTrigger value="templates">邮件类型</TabsTrigger>
            <TabsTrigger value="test">测试发送</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>邮件服务设置</CardTitle>
                <CardDescription>配置系统邮件发送服务的基本参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用邮件服务</Label>
                    <p className="text-sm text-muted-foreground">
                      开启后系统将自动发送各类通知邮件
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sender_name">发件人名称</Label>
                    <Input
                      id="sender_name"
                      value={settings.sender_name}
                      onChange={(e) => updateSetting('sender_name', e.target.value)}
                      placeholder="卡密授权系统"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender_email">发件人邮箱</Label>
                    <Input
                      id="sender_email"
                      type="email"
                      value={settings.sender_email}
                      onChange={(e) => updateSetting('sender_email', e.target.value)}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reply_to">回复邮箱</Label>
                    <Input
                      id="reply_to"
                      type="email"
                      value={settings.reply_to}
                      onChange={(e) => updateSetting('reply_to', e.target.value)}
                      placeholder="support@yourdomain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_days">卡密到期提醒天数</Label>
                    <Input
                      id="expiry_days"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.card_expiry_days}
                      onChange={(e) => updateSetting('card_expiry_days', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>邮件类型管理</CardTitle>
                <CardDescription>控制各类邮件的发送开关</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>欢迎邮件</Label>
                      <p className="text-sm text-muted-foreground">
                        用户注册成功后发送欢迎邮件
                      </p>
                    </div>
                    <Switch
                      checked={settings.welcome_enabled}
                      onCheckedChange={(checked) => updateSetting('welcome_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>到期提醒邮件</Label>
                      <p className="text-sm text-muted-foreground">
                        卡密即将到期时发送提醒邮件
                      </p>
                    </div>
                    <Switch
                      checked={settings.expiry_enabled}
                      onCheckedChange={(checked) => updateSetting('expiry_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>每日报表邮件</Label>
                      <p className="text-sm text-muted-foreground">
                        每日发送系统运营数据报表
                      </p>
                    </div>
                    <Switch
                      checked={settings.daily_report_enabled}
                      onCheckedChange={(checked) => updateSetting('daily_report_enabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>邮件测试</CardTitle>
                <CardDescription>发送测试邮件验证配置是否正确</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => sendTestEmail('welcome')}
                    disabled={testLoading}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    测试欢迎邮件
                  </Button>

                  <Button
                    onClick={() => sendTestEmail('verification')}
                    disabled={testLoading}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    测试验证邮件
                  </Button>

                  <Button
                    onClick={() => sendTestEmail('expiry')}
                    disabled={testLoading}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    测试到期邮件
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>测试邮件将发送到回复邮箱地址：{settings.reply_to || settings.sender_email || '未设置'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存设置
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Email;