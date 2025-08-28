import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, User, Mail, Send, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // 登录表单状态
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // 注册表单状态
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });

  // 邮箱验证状态
  const [emailVerification, setEmailVerification] = useState({
    codeSent: false,
    verifying: false,
    verified: false,
    countdown: 0,
  });

  useEffect(() => {
    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // 检查现有会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 倒计时效果
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailVerification.countdown > 0) {
      interval = setInterval(() => {
        setEmailVerification(prev => ({
          ...prev,
          countdown: prev.countdown - 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailVerification.countdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        toast({
          title: "登录失败",
          description: error.message === "Invalid login credentials" 
            ? "邮箱或密码错误" 
            : error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });
    } catch (error) {
      toast({
        title: "登录失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!registerData.email) {
      toast({
        title: "发送失败",
        description: "请先输入邮箱地址",
        variant: "destructive",
      });
      return;
    }

    setEmailVerification(prev => ({ ...prev, verifying: true }));

    try {
      const { data, error } = await supabase.functions.invoke('send-verification', {
        body: {
          email: registerData.email,
          username: registerData.username || '用户'
        }
      });

      if (error) {
        toast({
          title: "发送失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "发送失败",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "验证码已发送",
        description: "请查看您的邮箱，验证码10分钟内有效",
      });

      setEmailVerification(prev => ({
        ...prev,
        codeSent: true,
        countdown: 60, // 60秒后可重新发送
      }));

    } catch (error) {
      toast({
        title: "发送失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setEmailVerification(prev => ({ ...prev, verifying: false }));
    }
  };

  const verifyEmailCode = async () => {
    if (!registerData.verificationCode) {
      toast({
        title: "验证失败",
        description: "请输入验证码",
        variant: "destructive",
      });
      return;
    }

    setEmailVerification(prev => ({ ...prev, verifying: true }));

    try {
      const { data, error } = await supabase.functions.invoke('verify-email', {
        body: {
          email: registerData.email,
          verificationCode: registerData.verificationCode
        }
      });

      if (error) {
        toast({
          title: "验证失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "验证失败",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "邮箱验证成功",
        description: "现在可以完成注册",
      });

      setEmailVerification(prev => ({
        ...prev,
        verified: true,
      }));

    } catch (error) {
      toast({
        title: "验证失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setEmailVerification(prev => ({ ...prev, verifying: false }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailVerification.verified) {
      toast({
        title: "注册失败",
        description: "请先验证邮箱地址",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "注册失败",
        description: "密码确认不匹配",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "注册失败",
        description: "密码长度至少6位",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: registerData.username,
          }
        }
      });

      if (error) {
        toast({
          title: "注册失败",
          description: error.message === "User already registered" 
            ? "该邮箱已被注册" 
            : error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "注册成功",
        description: "请检查您的邮箱以确认账户",
      });
      
      // 清空表单
      setRegisterData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        verificationCode: "",
      });
      setEmailVerification({
        codeSent: false,
        verifying: false,
        verified: false,
        countdown: 0,
      });
    } catch (error) {
      toast({
        title: "注册失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">卡密授权系统</h1>
          <p className="text-muted-foreground mt-2">安全可靠的授权管理平台</p>
        </div>

        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">欢迎使用</CardTitle>
            <CardDescription>
              请登录或创建新账户来管理您的授权系统
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  登录
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  注册
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">邮箱地址</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "登录中..." : "登录"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">用户名</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="请输入用户名"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">邮箱地址</Label>
                    <div className="flex gap-2">
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="请输入邮箱地址"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        className="h-11 flex-1"
                        disabled={emailVerification.verified}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={sendVerificationCode}
                        disabled={
                          !registerData.email || 
                          emailVerification.verifying || 
                          emailVerification.countdown > 0 ||
                          emailVerification.verified
                        }
                        className="h-11 shrink-0"
                      >
                        {emailVerification.verifying ? (
                          "发送中..."
                        ) : emailVerification.countdown > 0 ? (
                          `${emailVerification.countdown}秒`
                        ) : emailVerification.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            发送验证码
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {emailVerification.codeSent && !emailVerification.verified && (
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">邮箱验证码</Label>
                      <div className="flex gap-2">
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="请输入6位验证码"
                          value={registerData.verificationCode}
                          onChange={(e) => setRegisterData({ ...registerData, verificationCode: e.target.value })}
                          maxLength={6}
                          className="h-11 flex-1"
                        />
                        <Button
                          type="button"
                          variant="default"
                          onClick={verifyEmailCode}
                          disabled={!registerData.verificationCode || emailVerification.verifying}
                          className="h-11 shrink-0"
                        >
                          {emailVerification.verifying ? "验证中..." : "验证"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        验证码已发送到您的邮箱，请查收（10分钟内有效）
                      </p>
                    </div>
                  )}

                  {emailVerification.verified && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      邮箱验证成功
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">密码</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码（至少6位）"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">确认密码</Label>
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请再次输入密码"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading || !emailVerification.verified}
                  >
                    {isLoading ? "注册中..." : "创建账户"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2024 卡密授权系统. 保留所有权利.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;