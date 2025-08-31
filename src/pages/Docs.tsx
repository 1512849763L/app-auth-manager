import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Code, Key, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Docs = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "代码已复制到剪贴板",
    });
  };

  // 动态获取当前域名并生成API基础URL
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin.includes('lovable.dev') 
        ? "https://sqcvacdpdjeooqyrblbu.supabase.co"
        : "https://sqcvacdpdjeooqyrblbu.supabase.co"; // 可以根据需要修改生产环境URL
    }
    return "https://sqcvacdpdjeooqyrblbu.supabase.co";
  };

  const baseUrl = getCurrentDomain();

  return (
    <Layout>
      <div className="space-y-6">
        {/* 头部标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">开发者文档</h1>
            <p className="text-muted-foreground">API接入指南和代码示例</p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Shield className="h-3 w-3" />
            API v1.0
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="auth">认证</TabsTrigger>
            <TabsTrigger value="api">API接口</TabsTrigger>
            <TabsTrigger value="examples">代码示例</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  快速开始
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  欢迎使用卡密授权系统API！本文档将帮助您快速集成我们的服务到您的应用中。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">基础信息</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• API Base URL: <code className="bg-background px-1 rounded">{baseUrl}</code></li>
                      <li>• 协议: HTTPS</li>
                      <li>• 数据格式: JSON</li>
                      <li>• 认证方式: API Key</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">支持的功能</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 卡密验证</li>
                      <li>• 卡密生成</li>
                      <li>• 用户管理</li>
                      <li>• 使用统计</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>HTTP状态码</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-mono text-sm">200 OK</span>
                    <span className="text-sm text-muted-foreground">请求成功</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="font-mono text-sm">400 Bad Request</span>
                    <span className="text-sm text-muted-foreground">请求参数错误</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-mono text-sm">401 Unauthorized</span>
                    <span className="text-sm text-muted-foreground">认证失败</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-mono text-sm">404 Not Found</span>
                    <span className="text-sm text-muted-foreground">资源不存在</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  独立API认证系统
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔐 全新独立认证</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    本系统使用独立的公私钥认证，完全脱离传统API Key方式。本地软件只需填写卡密即可直接验证，无需程序UUID或其他复杂认证流程。
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">认证流程</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                        <span>本地软件调用验证API，只需提供：<strong>卡密 + 公钥</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                        <span>系统验证公钥有效性，自动识别对应程序</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                        <span>验证卡密是否属于该程序且未过期</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">4</span>
                        <span>返回验证结果和程序信息</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">获取API密钥对</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      1. 登录管理控制台<br/>
                      2. 进入"程序管理"页面<br/>
                      3. 查看程序详情，获取公钥用于API调用<br/>
                      4. 私钥请妥善保管，仅用于内部验证
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">API调用格式</h3>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{`POST ${baseUrl}/rest/v1/rpc/verify_card_simple
Content-Type: application/json

{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_public_key": "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`POST ${baseUrl}/rest/v1/rpc/verify_card_simple
Content-Type: application/json

{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_public_key": "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ 安全优势</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• 无需存储敏感API Key在客户端</li>
                      <li>• 公钥可安全分发，私钥仅服务端持有</li>
                      <li>• 卡密绑定特定程序，防止跨程序滥用</li>
                      <li>• 独立认证系统，不依赖外部服务</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API接口列表</CardTitle>
                <p className="text-sm text-muted-foreground">
                  API基础URL: <code className="bg-muted px-1 rounded">{baseUrl}</code>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 新的独立认证API */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🚀 新版独立API（推荐）</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    基于公私钥认证，只需卡密即可验证，无需程序UUID。更安全、更简单。
                  </p>
                </div>

                {/* 卡密验证 - 新版 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">POST</Badge>
                    <code className="text-sm font-semibold">verify_card_simple</code>
                    <Badge variant="outline" className="text-xs">新版</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">卡密验证（独立认证，仅需卡密+公钥）</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求URL：</h4>
                    <code className="text-xs bg-muted p-2 rounded block">{baseUrl}/rest/v1/rpc/verify_card_simple</code>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求参数：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_public_key": "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_public_key": "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">响应示例：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "success": true,
  "message": "验证成功",
  "valid": true,
  "expire_at": "2024-12-31T23:59:59Z",
  "used_machines": 1,
  "max_machines": 3,
  "program_id": "program-uuid",
  "program_name": "程序名称",
  "duration_days": 30
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "success": true,
  "message": "验证成功",
  "valid": true,
  "expire_at": "2024-12-31T23:59:59Z",
  "used_machines": 1,
  "max_machines": 3,
  "program_id": "program-uuid",
  "program_name": "程序名称",
  "duration_days": 30
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 机器码绑定 - 新版 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">POST</Badge>
                    <code className="text-sm font-semibold">bind_machine_simple</code>
                    <Badge variant="outline" className="text-xs">新版</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">机器码绑定（独立认证，仅需卡密+机器码+公钥）</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求URL：</h4>
                    <code className="text-xs bg-muted p-2 rounded block">{baseUrl}/rest/v1/rpc/bind_machine_simple</code>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求参数：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_machine_code": "MACHINE-CODE-123",
  "p_public_key": "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_machine_code": "MACHINE-CODE-123",
  "p_public_key": "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">响应示例：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "success": true,
  "message": "机器码绑定成功",
  "used_machines": 1,
  "max_machines": 3
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "success": true,
  "message": "机器码绑定成功",
  "used_machines": 1,
  "max_machines": 3
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 废弃的旧版API */}
                <div className="space-y-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">已废弃</Badge>
                    <h3 className="font-semibold text-base">旧版API（不推荐使用）</h3>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      ⚠️ 以下API已废弃，建议迁移至新版独立认证API。旧版API仍可使用但不再维护更新。
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm line-through">verify_card_key_simple</code>
                      <Badge variant="destructive" className="text-xs">废弃</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">旧版简化验证（缺少安全认证）</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm line-through">bind_machine_simple</code>
                      <Badge variant="destructive" className="text-xs">废弃</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">旧版简化绑定（缺少安全认证）</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm line-through">verify_card_key_with_machine</code>
                      <Badge variant="destructive" className="text-xs">废弃</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">验证卡密并绑定机器码（需要程序ID）</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm line-through">bind_machine_code</code>
                      <Badge variant="destructive" className="text-xs">废弃</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">绑定机器码（需要程序ID）</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <Tabs defaultValue="javascript" className="space-y-4">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="php">PHP</TabsTrigger>
                <TabsTrigger value="csharp">C#</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript">
                <Card>
                  <CardHeader>
                    <CardTitle>JavaScript 示例</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">🚀 新版独立认证（推荐）</h3>
                        <div className="relative">
                           <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                             <code>{`// verifyCardSimple - 独立认证，仅需卡密+公钥
async function verifyCardSimple(cardKey, publicKey) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/verify_card_simple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_card_key: cardKey,
      p_public_key: publicKey
    })
  });

  const result = await response.json();
  
  if (result.success && result.valid) {
    console.log('卡密验证成功');
    console.log('程序名称:', result.program_name);
    console.log('已使用机器数:', result.used_machines);
    console.log('最大机器数:', result.max_machines);
    console.log('到期时间:', result.expire_at);
    return result;
  } else {
    console.log('验证失败:', result.message);
    return false;
  }
}

// bindMachineSimple - 独立认证，仅需卡密+机器码+公钥
async function bindMachineSimple(cardKey, machineCode, publicKey) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/bind_machine_simple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_card_key: cardKey,
      p_machine_code: machineCode,
      p_public_key: publicKey
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('机器码绑定成功');
    console.log('已使用机器数:', result.used_machines);
    console.log('最大机器数:', result.max_machines);
    return result;
  } else {
    console.log('绑定失败:', result.message);
    return false;
  }
}

// 使用示例
const publicKey = 'PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // 从程序管理页面获取
verifyCardSimple('XXXX-XXXX-XXXX-XXXX', publicKey);
bindMachineSimple('XXXX-XXXX-XXXX-XXXX', 'MACHINE-CODE-123', publicKey);`}</code>
                           </pre>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="absolute top-2 right-2"
                             onClick={() => copyToClipboard(`// verifyCardSimple - 独立认证，仅需卡密+公钥
async function verifyCardSimple(cardKey, publicKey) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/verify_card_simple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_card_key: cardKey,
      p_public_key: publicKey
    })
  });

  const result = await response.json();
  
  if (result.success && result.valid) {
    console.log('卡密验证成功');
    console.log('程序名称:', result.program_name);
    console.log('已使用机器数:', result.used_machines);
    console.log('最大机器数:', result.max_machines);
    console.log('到期时间:', result.expire_at);
    return result;
  } else {
    console.log('验证失败:', result.message);
    return false;
  }
}

// bindMachineSimple - 独立认证，仅需卡密+机器码+公钥
async function bindMachineSimple(cardKey, machineCode, publicKey) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/bind_machine_simple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_card_key: cardKey,
      p_machine_code: machineCode,
      p_public_key: publicKey
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('机器码绑定成功');
    console.log('已使用机器数:', result.used_machines);
    console.log('最大机器数:', result.max_machines);
    return result;
  } else {
    console.log('绑定失败:', result.message);
    return false;
  }
}

// 使用示例
const publicKey = 'PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // 从程序管理页面获取
verifyCardSimple('XXXX-XXXX-XXXX-XXXX', publicKey);
bindMachineSimple('XXXX-XXXX-XXXX-XXXX', 'MACHINE-CODE-123', publicKey);`)}
                           >
                             <Copy className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>

                      <div className="space-y-3 opacity-60">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">已废弃</Badge>
                          <h3 className="font-semibold text-base">旧版API示例（不推荐）</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            ⚠️ 以下代码使用已废弃的API，建议迁移至新版独立认证API。
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 line-through">简化验证卡密（已废弃）</h3>
                          <div className="relative">
                             <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto opacity-60">
                               <code>{`// 已废弃 - verifyCardKeySimple
async function verifyCardKeySimple(cardKey) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/verify_card_key_simple', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
      'apikey': 'YOUR_ANON_KEY'
    },
    body: JSON.stringify({
      p_card_key: cardKey
    })
  });
  // ... 其余代码已省略
}`}</code>
                             </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="python">
                <Card>
                  <CardHeader>
                    <CardTitle>Python 示例</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">🚀 新版独立认证（推荐）</h3>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import requests
import json

def verify_card_simple(card_key, public_key):
    """独立认证卡密验证 - 仅需卡密+公钥"""
    url = "${baseUrl}/rest/v1/rpc/verify_card_simple"
    headers = {
        'Content-Type': 'application/json'
    }
    data = {
        'p_card_key': card_key,
        'p_public_key': public_key
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get('success') and result.get('valid'):
        print("卡密验证成功")
        print(f"程序名称: {result.get('program_name')}")
        print(f"已使用机器数: {result.get('used_machines')}")
        print(f"最大机器数: {result.get('max_machines')}")
        print(f"到期时间: {result.get('expire_at')}")
        return result
    else:
        print(f"验证失败: {result.get('message')}")
        return False

def bind_machine_simple(card_key, machine_code, public_key):
    """独立认证机器码绑定 - 仅需卡密+机器码+公钥"""
    url = "${baseUrl}/rest/v1/rpc/bind_machine_simple"
    headers = {
        'Content-Type': 'application/json'
    }
    data = {
        'p_card_key': card_key,
        'p_machine_code': machine_code,
        'p_public_key': public_key
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get('success'):
        print("机器码绑定成功")
        print(f"已使用机器数: {result.get('used_machines')}")
        print(f"最大机器数: {result.get('max_machines')}")
        return result
    else:
        print(f"绑定失败: {result.get('message')}")
        return False

# 使用示例
public_key = "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"  # 从程序管理页面获取
verify_card_simple("XXXX-XXXX-XXXX-XXXX", public_key)
bind_machine_simple("XXXX-XXXX-XXXX-XXXX", "MACHINE-CODE-123", public_key)`}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(`import requests
import json

def verify_card_simple(card_key, public_key):
    """独立认证卡密验证 - 仅需卡密+公钥"""
    url = "${baseUrl}/rest/v1/rpc/verify_card_simple"
    headers = {
        'Content-Type': 'application/json'
    }
    data = {
        'p_card_key': card_key,
        'p_public_key': public_key
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get('success') and result.get('valid'):
        print("卡密验证成功")
        print(f"程序名称: {result.get('program_name')}")
        print(f"已使用机器数: {result.get('used_machines')}")
        print(f"最大机器数: {result.get('max_machines')}")
        print(f"到期时间: {result.get('expire_at')}")
        return result
    else:
        print(f"验证失败: {result.get('message')}")
        return False

def bind_machine_simple(card_key, machine_code, public_key):
    """独立认证机器码绑定 - 仅需卡密+机器码+公钥"""
    url = "${baseUrl}/rest/v1/rpc/bind_machine_simple"
    headers = {
        'Content-Type': 'application/json'
    }
    data = {
        'p_card_key': card_key,
        'p_machine_code': machine_code,
        'p_public_key': public_key
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get('success'):
        print("机器码绑定成功")
        print(f"已使用机器数: {result.get('used_machines')}")
        print(f"最大机器数: {result.get('max_machines')}")
        return result
    else:
        print(f"绑定失败: {result.get('message')}")
        return False

# 使用示例
public_key = "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"  # 从程序管理页面获取
verify_card_simple("XXXX-XXXX-XXXX-XXXX", public_key)
bind_machine_simple("XXXX-XXXX-XXXX-XXXX", "MACHINE-CODE-123", public_key)`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 opacity-60">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">已废弃</Badge>
                          <h3 className="font-semibold text-base">旧版API示例（不推荐）</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            ⚠️ 以下代码使用已废弃的API，建议迁移至新版独立认证API。
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 line-through">简化验证卡密（已废弃）</h3>
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto opacity-60">
                              <code>{`# 已废弃 - verify_card_key_simple
def verify_card_key_simple(card_key):
    url = "${baseUrl}/rest/v1/rpc/verify_card_key_simple"
    headers = {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
        'apikey': 'YOUR_ANON_KEY'
    }
    # ... 其余代码已省略`}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="php">
                <Card>
                  <CardHeader>
                    <CardTitle>PHP 示例</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">🚀 新版独立认证（推荐）</h3>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`<?php
function verifyCardSimple($cardKey, $publicKey) {
    // 独立认证卡密验证 - 仅需卡密+公钥
    $url = "${baseUrl}/rest/v1/rpc/verify_card_simple";
    $headers = array(
        'Content-Type: application/json'
    );
    $data = json_encode(array(
        'p_card_key' => $cardKey,
        'p_public_key' => $publicKey
    ));
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result['success'] && $result['valid']) {
        echo "卡密验证成功\\n";
        echo "程序名称: " . $result['program_name'] . "\\n";
        echo "已使用机器数: " . $result['used_machines'] . "\\n";
        echo "最大机器数: " . $result['max_machines'] . "\\n";
        echo "到期时间: " . $result['expire_at'] . "\\n";
        return $result;
    } else {
        echo "验证失败: " . $result['message'] . "\\n";
        return false;
    }
}

function bindMachineSimple($cardKey, $machineCode, $publicKey) {
    // 独立认证机器码绑定 - 仅需卡密+机器码+公钥
    $url = "${baseUrl}/rest/v1/rpc/bind_machine_simple";
    $headers = array(
        'Content-Type: application/json'
    );
    $data = json_encode(array(
        'p_card_key' => $cardKey,
        'p_machine_code' => $machineCode,
        'p_public_key' => $publicKey
    ));
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result['success']) {
        echo "机器码绑定成功\\n";
        echo "已使用机器数: " . $result['used_machines'] . "\\n";
        echo "最大机器数: " . $result['max_machines'] . "\\n";
        return $result;
    } else {
        echo "绑定失败: " . $result['message'] . "\\n";
        return false;
    }
}

// 使用示例
$publicKey = "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // 从程序管理页面获取
verifyCardSimple("XXXX-XXXX-XXXX-XXXX", $publicKey);
bindMachineSimple("XXXX-XXXX-XXXX-XXXX", "MACHINE-CODE-123", $publicKey);
?>`}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(`<?php
function verifyCardSimple($cardKey, $publicKey) {
    // 独立认证卡密验证 - 仅需卡密+公钥
    $url = "${baseUrl}/rest/v1/rpc/verify_card_simple";
    $headers = array(
        'Content-Type: application/json'
    );
    $data = json_encode(array(
        'p_card_key' => $cardKey,
        'p_public_key' => $publicKey
    ));
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result['success'] && $result['valid']) {
        echo "卡密验证成功\\n";
        echo "程序名称: " . $result['program_name'] . "\\n";
        echo "已使用机器数: " . $result['used_machines'] . "\\n";
        echo "最大机器数: " . $result['max_machines'] . "\\n";
        echo "到期时间: " . $result['expire_at'] . "\\n";
        return $result;
    } else {
        echo "验证失败: " . $result['message'] . "\\n";
        return false;
    }
}

function bindMachineSimple($cardKey, $machineCode, $publicKey) {
    // 独立认证机器码绑定 - 仅需卡密+机器码+公钥
    $url = "${baseUrl}/rest/v1/rpc/bind_machine_simple";
    $headers = array(
        'Content-Type: application/json'
    );
    $data = json_encode(array(
        'p_card_key' => $cardKey,
        'p_machine_code' => $machineCode,
        'p_public_key' => $publicKey
    ));
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result['success']) {
        echo "机器码绑定成功\\n";
        echo "已使用机器数: " . $result['used_machines'] . "\\n";
        echo "最大机器数: " . $result['max_machines'] . "\\n";
        return $result;
    } else {
        echo "绑定失败: " . $result['message'] . "\\n";
        return false;
    }
}

// 使用示例
$publicKey = "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // 从程序管理页面获取
verifyCardSimple("XXXX-XXXX-XXXX-XXXX", $publicKey);
bindMachineSimple("XXXX-XXXX-XXXX-XXXX", "MACHINE-CODE-123", $publicKey);
?>`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 opacity-60">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">已废弃</Badge>
                          <h3 className="font-semibold text-base">旧版API示例（不推荐）</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            ⚠️ 以下代码使用已废弃的API，建议迁移至新版独立认证API。
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 line-through">验证卡密（已废弃）</h3>
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto opacity-60">
                              <code>{`<?php
// 已废弃 - verifyCardKey
function verifyCardKey($cardKey, $programId) {
    $url = "${baseUrl}/rest/v1/rpc/verify_card_key";
    $headers = array(
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json',
        'apikey: YOUR_ANON_KEY'
    );
    // ... 其余代码已省略`}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="csharp">
                <Card>
                  <CardHeader>
                    <CardTitle>C# 示例</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">🚀 新版独立认证（推荐）</h3>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class CardKeyAuthenticator
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl = "${baseUrl}";

    public CardKeyAuthenticator()
    {
        _httpClient = new HttpClient();
    }

    public async Task<bool> VerifyCardSimpleAsync(string cardKey, string publicKey)
    {
        // 独立认证卡密验证 - 仅需卡密+公钥
        var url = $"{_baseUrl}/rest/v1/rpc/verify_card_simple";
        
        _httpClient.DefaultRequestHeaders.Clear();
        
        var data = new
        {
            p_card_key = cardKey,
            p_public_key = publicKey
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        dynamic result = JsonConvert.DeserializeObject(responseContent);
        
        if (result.success == true && result.valid == true)
        {
            Console.WriteLine("卡密验证成功");
            Console.WriteLine($"程序名称: {result.program_name}");
            Console.WriteLine($"已使用机器数: {result.used_machines}");
            Console.WriteLine($"最大机器数: {result.max_machines}");
            Console.WriteLine($"到期时间: {result.expire_at}");
            return true;
        }
        else
        {
            Console.WriteLine($"验证失败: {result.message}");
            return false;
        }
    }

    public async Task<bool> BindMachineSimpleAsync(string cardKey, string machineCode, string publicKey)
    {
        // 独立认证机器码绑定 - 仅需卡密+机器码+公钥
        var url = $"{_baseUrl}/rest/v1/rpc/bind_machine_simple";
        
        _httpClient.DefaultRequestHeaders.Clear();
        
        var data = new
        {
            p_card_key = cardKey,
            p_machine_code = machineCode,
            p_public_key = publicKey
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        dynamic result = JsonConvert.DeserializeObject(responseContent);
        
        if (result.success == true)
        {
            Console.WriteLine("机器码绑定成功");
            Console.WriteLine($"已使用机器数: {result.used_machines}");
            Console.WriteLine($"最大机器数: {result.max_machines}");
            return true;
        }
        else
        {
            Console.WriteLine($"绑定失败: {result.message}");
            return false;
        }
    }
}

// 使用示例
var authenticator = new CardKeyAuthenticator();
string publicKey = "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // 从程序管理页面获取
await authenticator.VerifyCardSimpleAsync("XXXX-XXXX-XXXX-XXXX", publicKey);
await authenticator.BindMachineSimpleAsync("XXXX-XXXX-XXXX-XXXX", "MACHINE-CODE-123", publicKey);`}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class CardKeyAuthenticator
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl = "${baseUrl}";

    public CardKeyAuthenticator()
    {
        _httpClient = new HttpClient();
    }

    public async Task<bool> VerifyCardSimpleAsync(string cardKey, string publicKey)
    {
        // 独立认证卡密验证 - 仅需卡密+公钥
        var url = $"{_baseUrl}/rest/v1/rpc/verify_card_simple";
        
        _httpClient.DefaultRequestHeaders.Clear();
        
        var data = new
        {
            p_card_key = cardKey,
            p_public_key = publicKey
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        dynamic result = JsonConvert.DeserializeObject(responseContent);
        
        if (result.success == true && result.valid == true)
        {
            Console.WriteLine("卡密验证成功");
            Console.WriteLine($"程序名称: {result.program_name}");
            Console.WriteLine($"已使用机器数: {result.used_machines}");
            Console.WriteLine($"最大机器数: {result.max_machines}");
            Console.WriteLine($"到期时间: {result.expire_at}");
            return true;
        }
        else
        {
            Console.WriteLine($"验证失败: {result.message}");
            return false;
        }
    }

    public async Task<bool> BindMachineSimpleAsync(string cardKey, string machineCode, string publicKey)
    {
        // 独立认证机器码绑定 - 仅需卡密+机器码+公钥
        var url = $"{_baseUrl}/rest/v1/rpc/bind_machine_simple";
        
        _httpClient.DefaultRequestHeaders.Clear();
        
        var data = new
        {
            p_card_key = cardKey,
            p_machine_code = machineCode,
            p_public_key = publicKey
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        dynamic result = JsonConvert.DeserializeObject(responseContent);
        
        if (result.success == true)
        {
            Console.WriteLine("机器码绑定成功");
            Console.WriteLine($"已使用机器数: {result.used_machines}");
            Console.WriteLine($"最大机器数: {result.max_machines}");
            return true;
        }
        else
        {
            Console.WriteLine($"绑定失败: {result.message}");
            return false;
        }
    }
}

// 使用示例
var authenticator = new CardKeyAuthenticator();
string publicKey = "PUBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // 从程序管理页面获取
await authenticator.VerifyCardSimpleAsync("XXXX-XXXX-XXXX-XXXX", publicKey);
await authenticator.BindMachineSimpleAsync("XXXX-XXXX-XXXX-XXXX", "MACHINE-CODE-123", publicKey);`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 opacity-60">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">已废弃</Badge>
                          <h3 className="font-semibold text-base">旧版API示例（不推荐）</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            ⚠️ 以下代码使用已废弃的API，建议迁移至新版独立认证API。
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 line-through">验证卡密（已废弃）</h3>
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto opacity-60">
                              <code>{`// 已废弃 - CardKeyVerifier
public class CardKeyVerifier
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _anonKey;
    
    public CardKeyVerifier(string apiKey, string anonKey)
    {
        _httpClient = new HttpClient();
        _apiKey = apiKey;
        _anonKey = anonKey;
    }
    // ... 其余代码已省略`}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Docs;