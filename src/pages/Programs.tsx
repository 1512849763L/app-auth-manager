import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Eye, EyeOff, Copy, Trash2, Edit } from "lucide-react";
import { Layout } from "../components/Layout";

const Programs = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost_price: "",
    status: "active",
    max_machines: "",
    machine_limit_note: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost_price: "",
    status: "active",
    max_machines: "",
    machine_limit_note: "",
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const openEditDialog = (program: any) => {
    setEditingProgram(program);
    setEditFormData({
      name: program.name,
      description: program.description || "",
      price: program.price.toString(),
      cost_price: program.cost_price.toString(),
      status: program.status,
      max_machines: program.max_machines?.toString() || "",
      machine_limit_note: program.machine_limit_note || "",
    });
    setShowEditDialog(true);
  };

  const fetchPrograms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "未登录",
          description: "请先登录后再访问",
          variant: "destructive",
        });
        return;
      }

      // Get user role to determine which function to use
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setUserRole(profile?.role || null);

      let data, error;

      // Use secure functions based on user permissions
      if (profile?.role === 'admin' || profile?.role === 'agent') {
        // Admins and agents can see programs with API keys
        const result = await supabase.rpc('get_programs_with_api_keys');
        data = result.data;
        error = result.error;
      } else {
        // Regular users can only see public program info (no API keys)
        const result = await supabase.rpc('get_public_programs');
        data = result.data;
        error = result.error;
      }

      if (error) {
        toast({
          title: "获取程序列表失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPrograms(data || []);
    } catch (error) {
      toast({
        title: "获取程序列表错误",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36)[2] || '0'
    ).join('').toUpperCase();
  };

  const handleEditProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProgram) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "未登录",
          description: "请先登录后再操作",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('programs')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          price: parseFloat(editFormData.price),
          cost_price: parseFloat(editFormData.cost_price),
          status: editFormData.status,
          max_machines: editFormData.max_machines ? parseInt(editFormData.max_machines) : null,
          machine_limit_note: editFormData.machine_limit_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProgram.id);

      if (error) {
        toast({
          title: "更新程序失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "更新成功",
        description: "程序信息已更新",
      });

      setEditFormData({
        name: "",
        description: "",
        price: "",
        cost_price: "",
        status: "active",
        max_machines: "",
        machine_limit_note: "",
      });
      setShowEditDialog(false);
      setEditingProgram(null);
      fetchPrograms();
    } catch (error) {
      toast({
        title: "更新程序错误",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('programs')
        .insert({
          name: formData.name,
          description: formData.description,
          api_key: generateApiKey(),
          price: parseFloat(formData.price),
          cost_price: parseFloat(formData.cost_price),
          status: formData.status,
          max_machines: formData.max_machines ? parseInt(formData.max_machines) : null,
          machine_limit_note: formData.machine_limit_note || null,
          created_by: user.id,
        });

      if (error) {
        toast({
          title: "创建程序失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "程序创建成功",
        description: "新程序已添加到系统中",
      });

      setFormData({
        name: "",
        description: "",
        price: "",
        cost_price: "",
        status: "active",
        max_machines: "",
        machine_limit_note: "",
      });
      setShowCreateDialog(false);
      fetchPrograms();
    } catch (error) {
      toast({
        title: "创建程序失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "API密钥已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  const toggleApiKeyVisibility = (programId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  const deleteProgram = async (programId: string, programName: string) => {
    if (!window.confirm(`确定要删除程序 "${programName}" 吗？\n\n⚠️ 删除后会：\n• 自动删除所有关联卡密\n• 未使用的卡密全额退款\n• 已使用但未到期的卡密按剩余时间比例退款\n• 此操作不可撤销`)) {
      return;
    }

    try {
      console.log('Attempting to delete program:', programId);
      
      const { data, error } = await supabase.functions.invoke('delete-program', {
        body: { programId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        toast({
          title: "删除失败", 
          description: error.message || "调用删除函数失败",
          variant: "destructive",
        });
        return;
      }

      if (data && data.error) {
        console.error('Function returned error:', data);
        toast({
          title: "删除失败",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data && data.details) {
        const { deletedCards, refundedCards, totalRefunded } = data.details;
        let message = "程序已成功删除";
        if (deletedCards > 0) {
          message += `\n• 删除了 ${deletedCards} 个关联卡密`;
          if (refundedCards > 0) {
            message += `\n• 退款 ${refundedCards} 个卡密，共计 ¥${totalRefunded.toFixed(2)}`;
          }
        }
        
        toast({
          title: "删除成功",
          description: message,
        });
      } else {
        toast({
          title: "删除成功",
          description: "程序已成功删除",
        });
      }

      fetchPrograms();
    } catch (error: any) {
      console.error('Catch block error:', error);
      toast({
        title: "删除失败",
        description: error.message || "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">程序管理</h1>
            <p className="text-muted-foreground mt-2">
              管理您的授权程序，配置API密钥和价格策略
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                添加程序
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>创建新程序</DialogTitle>
                <DialogDescription>
                  填写程序信息来创建一个新的授权程序
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">程序名称</Label>
                  <Input
                    id="name"
                    placeholder="请输入程序名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">程序描述</Label>
                  <Textarea
                    id="description"
                    placeholder="请输入程序描述"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">售价 (元)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_price">成本价 (元)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_machines">最大机器数</Label>
                  <Input
                    id="max_machines"
                    type="number"
                    min="1"
                    placeholder="留空为不限制"
                    value={formData.max_machines}
                    onChange={(e) => setFormData({ ...formData, max_machines: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machine_limit_note">机器数量说明</Label>
                  <Textarea
                    id="machine_limit_note"
                    placeholder="例如：单机版、三机版、不限机器"
                    value={formData.machine_limit_note}
                    onChange={(e) => setFormData({ ...formData, machine_limit_note: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button type="submit">
                    创建程序
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                    {program.status === 'active' ? '启用' : '禁用'}
                  </Badge>
                </div>
                <CardDescription>
                  {program.description || '暂无描述'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">售价</p>
                    <p className="font-medium text-green-600">¥{program.price}</p>
                  </div>
                  {/* Only show cost price if program has cost_price (for admins/agents) */}
                  {program.cost_price !== undefined && (
                    <div>
                      <p className="text-muted-foreground">成本价</p>
                      <p className="font-medium text-orange-600">¥{program.cost_price}</p>
                    </div>
                  )}
                </div>

                {/* 显示机器数量限制信息 */}
                {(program.max_machines || program.machine_limit_note) && (
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-sm">机器限制</Label>
                    <div className="text-sm space-y-1">
                      {program.max_machines && (
                        <p className="text-muted-foreground">最大机器数: {program.max_machines}</p>
                      )}
                      {program.machine_limit_note && (
                        <p className="text-muted-foreground">{program.machine_limit_note}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Only show API key section if program has api_key (for admins/agents) */}
                {program.api_key && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">API密钥</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(program.id)}
                        >
                          {showApiKey[program.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(program.api_key)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded text-xs font-mono">
                      {showApiKey[program.id] 
                        ? program.api_key 
                        : '•'.repeat(program.api_key.length)
                      }
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(program)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(program)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    设置
                  </Button>
                  {userRole === 'admin' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteProgram(program.id, program.name)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      删除
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {programs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">暂无程序</h3>
            <p className="text-muted-foreground mb-4">开始创建您的第一个授权程序</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加程序
            </Button>
          </div>
        )}

        {/* 编辑程序对话框 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>编辑程序</DialogTitle>
              <DialogDescription>
                修改程序信息和配置
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProgram} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">程序名称</Label>
                <Input
                  id="edit_name"
                  placeholder="请输入程序名称"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">程序描述</Label>
                <Textarea
                  id="edit_description"
                  placeholder="请输入程序描述"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_price">售价 (元)</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_cost_price">成本价 (元)</Label>
                  <Input
                    id="edit_cost_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editFormData.cost_price}
                    onChange={(e) => setEditFormData({ ...editFormData, cost_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_status">状态</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">激活</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_max_machines">最大机器数</Label>
                <Input
                  id="edit_max_machines"
                  type="number"
                  placeholder="留空表示无限制"
                  value={editFormData.max_machines}
                  onChange={(e) => setEditFormData({ ...editFormData, max_machines: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_machine_limit_note">机器限制说明</Label>
                <Textarea
                  id="edit_machine_limit_note"
                  placeholder="可选的机器限制说明"
                  value={editFormData.machine_limit_note}
                  onChange={(e) => setEditFormData({ ...editFormData, machine_limit_note: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  取消
                </Button>
                <Button type="submit">
                  保存更改
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Programs;