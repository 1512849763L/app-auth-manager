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

  const baseUrl = "https://sqcvacdpdjeooqyrblbu.supabase.co";

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
                  API认证
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  所有API请求都需要在请求头中包含您的API密钥进行认证。
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">获取API密钥</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      1. 登录管理控制台<br/>
                      2. 进入"程序管理"页面<br/>
                      3. 创建或查看程序详情<br/>
                      4. 复制API密钥
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">请求头格式</h3>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API接口列表</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 卡密验证 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>POST</Badge>
                    <code className="text-sm">/rest/v1/rpc/verify_card_key_with_machine</code>
                  </div>
                  <p className="text-sm text-muted-foreground">验证卡密并绑定机器码</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求参数：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_machine_code": "MACHINE-CODE-123",
  "p_program_id": "program-uuid"
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_machine_code": "MACHINE-CODE-123",
  "p_program_id": "program-uuid"
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
  "max_machines": 3
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
  "max_machines": 3
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 机器码绑定 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>POST</Badge>
                    <code className="text-sm">/rest/v1/rpc/bind_machine_code</code>
                  </div>
                  <p className="text-sm text-muted-foreground">为卡密绑定新的机器码</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求参数：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_machine_code": "MACHINE-CODE-456", 
  "p_program_id": "program-uuid"
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "p_card_key": "XXXX-XXXX-XXXX-XXXX",
  "p_machine_code": "MACHINE-CODE-456",
  "p_program_id": "program-uuid"
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 卡密生成 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>POST</Badge>
                    <code className="text-sm">/rest/v1/card_keys</code>
                  </div>
                  <p className="text-sm text-muted-foreground">生成新的卡密</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">请求参数：</h4>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{`{
  "program_id": "program-uuid",
  "duration_days": 30,
  "quantity": 1
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "program_id": "program-uuid",
  "duration_days": 30,
  "quantity": 1
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">验证卡密</h3>
                        <div className="relative">
                           <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                             <code>{`async function verifyCardKeyWithMachine(cardKey, machineCode, programId) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/verify_card_key_with_machine', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
      'apikey': 'YOUR_ANON_KEY'
    },
    body: JSON.stringify({
      p_card_key: cardKey,
      p_machine_code: machineCode,
      p_program_id: programId
    })
  });

  const result = await response.json();
  
  if (result.success && result.valid) {
    console.log('卡密验证成功，机器码已绑定');
    console.log('已使用机器数:', result.used_machines);
    console.log('最大机器数:', result.max_machines);
    return true;
  } else {
    console.log('验证失败:', result.message);
    return false;
  }
}

// 使用示例
verifyCardKeyWithMachine('XXXX-XXXX-XXXX-XXXX', 'MACHINE-CODE-123', 'program-uuid');`}</code>
                           </pre>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="absolute top-2 right-2"
                             onClick={() => copyToClipboard(`async function verifyCardKeyWithMachine(cardKey, machineCode, programId) {
  const response = await fetch('${baseUrl}/rest/v1/rpc/verify_card_key_with_machine', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
      'apikey': 'YOUR_ANON_KEY'
    },
    body: JSON.stringify({
      p_card_key: cardKey,
      p_machine_code: machineCode,
      p_program_id: programId
    })
  });

  const result = await response.json();
  
  if (result.success && result.valid) {
    console.log('卡密验证成功，机器码已绑定');
    console.log('已使用机器数:', result.used_machines);
    console.log('最大机器数:', result.max_machines);
    return true;
  } else {
    console.log('验证失败:', result.message);
    return false;
  }
}

// 使用示例
verifyCardKeyWithMachine('XXXX-XXXX-XXXX-XXXX', 'MACHINE-CODE-123', 'program-uuid');`)}
                           >
                             <Copy className="h-4 w-4" />
                           </Button>
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
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">验证卡密</h3>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import requests
import json

def verify_card_key(card_key, program_id):
    url = "${baseUrl}/rest/v1/rpc/verify_card_key"
    headers = {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
        'apikey': 'YOUR_ANON_KEY'
    }
    data = {
        'card_key': card_key,
        'program_id': program_id
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get('success') and result.get('data', {}).get('valid'):
        print("卡密验证成功")
        return True
    else:
        print("卡密验证失败")
        return False

# 使用示例
verify_card_key("XXXX-XXXX-XXXX-XXXX", "program-uuid")`}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(`import requests
import json

def verify_card_key(card_key, program_id):
    url = "${baseUrl}/rest/v1/rpc/verify_card_key"
    headers = {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
        'apikey': 'YOUR_ANON_KEY'
    }
    data = {
        'card_key': card_key,
        'program_id': program_id
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result.get('success') and result.get('data', {}).get('valid'):
        print("卡密验证成功")
        return True
    else:
        print("卡密验证失败")
        return False

# 使用示例
verify_card_key("XXXX-XXXX-XXXX-XXXX", "program-uuid")`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">验证卡密</h3>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`<?php
function verifyCardKey($cardKey, $programId) {
    $url = "${baseUrl}/rest/v1/rpc/verify_card_key";
    $headers = array(
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json',
        'apikey: YOUR_ANON_KEY'
    );
    $data = json_encode(array(
        'card_key' => $cardKey,
        'program_id' => $programId
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
    
    if ($result['success'] && $result['data']['valid']) {
        echo "卡密验证成功";
        return true;
    } else {
        echo "卡密验证失败";
        return false;
    }
}

// 使用示例
verifyCardKey("XXXX-XXXX-XXXX-XXXX", "program-uuid");
?>`}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(`<?php
function verifyCardKey($cardKey, $programId) {
    $url = "${baseUrl}/rest/v1/rpc/verify_card_key";
    $headers = array(
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json',
        'apikey: YOUR_ANON_KEY'
    );
    $data = json_encode(array(
        'card_key' => $cardKey,
        'program_id' => $programId
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
    
    if ($result['success'] && $result['data']['valid']) {
        echo "卡密验证成功";
        return true;
    } else {
        echo "卡密验证失败";
        return false;
    }
}

// 使用示例
verifyCardKey("XXXX-XXXX-XXXX-XXXX", "program-uuid");
?>`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">验证卡密</h3>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class CardKeyVerifier
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _anonKey;
    private readonly string _baseUrl = "${baseUrl}";

    public CardKeyVerifier(string apiKey, string anonKey)
    {
        _httpClient = new HttpClient();
        _apiKey = apiKey;
        _anonKey = anonKey;
    }

    public async Task<bool> VerifyCardKeyAsync(string cardKey, string programId)
    {
        var url = $"{_baseUrl}/rest/v1/rpc/verify_card_key";
        
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        _httpClient.DefaultRequestHeaders.Add("apikey", _anonKey);
        
        var data = new
        {
            card_key = cardKey,
            program_id = programId
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        dynamic result = JsonConvert.DeserializeObject(responseContent);
        
        if (result.success == true && result.data.valid == true)
        {
            Console.WriteLine("卡密验证成功");
            return true;
        }
        else
        {
            Console.WriteLine("卡密验证失败");
            return false;
        }
    }
}

// 使用示例
var verifier = new CardKeyVerifier("YOUR_API_KEY", "YOUR_ANON_KEY");
await verifier.VerifyCardKeyAsync("XXXX-XXXX-XXXX-XXXX", "program-uuid");`}</code>
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

public class CardKeyVerifier
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _anonKey;
    private readonly string _baseUrl = "${baseUrl}";

    public CardKeyVerifier(string apiKey, string anonKey)
    {
        _httpClient = new HttpClient();
        _apiKey = apiKey;
        _anonKey = anonKey;
    }

    public async Task<bool> VerifyCardKeyAsync(string cardKey, string programId)
    {
        var url = $"{_baseUrl}/rest/v1/rpc/verify_card_key";
        
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        _httpClient.DefaultRequestHeaders.Add("apikey", _anonKey);
        
        var data = new
        {
            card_key = cardKey,
            program_id = programId
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        dynamic result = JsonConvert.DeserializeObject(responseContent);
        
        if (result.success == true && result.data.valid == true)
        {
            Console.WriteLine("卡密验证成功");
            return true;
        }
        else
        {
            Console.WriteLine("卡密验证失败");
            return false;
        }
    }
}

// 使用示例
var verifier = new CardKeyVerifier("YOUR_API_KEY", "YOUR_ANON_KEY");
await verifier.VerifyCardKeyAsync("XXXX-XXXX-XXXX-XXXX", "program-uuid");`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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