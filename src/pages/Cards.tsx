import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Key, Search, Download, Upload, Ban, CheckCircle, Clock, XCircle, Copy, Edit, Trash2 } from "lucide-react";
import { Layout } from "../components/Layout";

interface CardKey {
  id: string;
  card_key: string;
  program_id: string;
  user_id?: string;
  status: string;
  expire_at: string | null;
  duration_days: number;
  created_at: string;
  used_at: string | null;
  programs: {
    name: string;
    price: number;
  };
}

const Cards = () => {
  const [cardKeys, setCardKeys] = useState<CardKey[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<CardKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    program_id: "",
    duration_days: "30",
    quantity: "1",
  });

  const [editFormData, setEditFormData] = useState({
    program_id: "",
    duration_days: "",
    status: "",
  });

  const [batchData, setBatchData] = useState({
    program_id: "",
    duration_days: "30",
    quantity: "10",
    prefix: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取程序列表
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (programsError) {
        toast({
          title: "获取程序列表失败",
          description: programsError.message,
          variant: "destructive",
        });
        return;
      }

      // 获取卡密列表
      const { data: cardsData, error: cardsError } = await supabase
        .from('card_keys')
        .select(`
          *,
          programs (
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (cardsError) {
        toast({
          title: "获取卡密列表失败",
          description: cardsError.message,
          variant: "destructive",
        });
        return;
      }

      setPrograms(programsData || []);
      setCardKeys(cardsData || []);
    } catch (error) {
      toast({
        title: "数据加载错误",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCardKey = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_card_key');
      if (error) throw error;
      return data;
    } catch (error) {
      // 备用生成方法
      return Array.from({ length: 19 }, (_, i) => {
        if (i === 4 || i === 9 || i === 14) return '-';
        return Math.random().toString(36).toUpperCase()[2] || '0';
      }).join('');
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cardKey = await generateCardKey();
      const quantity = parseInt(formData.quantity);
      const cardsToInsert = [];

      for (let i = 0; i < quantity; i++) {
        const key = quantity === 1 ? cardKey : await generateCardKey();
        cardsToInsert.push({
          card_key: key,
          program_id: formData.program_id,
          duration_days: parseInt(formData.duration_days),
          created_by: user.id,
        });
      }

      const { error } = await supabase
        .from('card_keys')
        .insert(cardsToInsert);

      if (error) {
        toast({
          title: "创建卡密失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "卡密创建成功",
        description: `成功生成 ${quantity} 个卡密`,
      });

      setFormData({
        program_id: "",
        duration_days: "30",
        quantity: "1",
      });
      setShowCreateDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "创建卡密失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const quantity = parseInt(batchData.quantity);
      const cardsToInsert = [];

      for (let i = 0; i < quantity; i++) {
        let cardKey = await generateCardKey();
        if (batchData.prefix) {
          cardKey = `${batchData.prefix}-${cardKey}`;
        }
        
        cardsToInsert.push({
          card_key: cardKey,
          program_id: batchData.program_id,
          duration_days: parseInt(batchData.duration_days),
          created_by: user.id,
        });
      }

      const { error } = await supabase
        .from('card_keys')
        .insert(cardsToInsert);

      if (error) {
        toast({
          title: "批量生成失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "批量生成成功",
        description: `成功生成 ${quantity} 个卡密`,
      });

      setBatchData({
        program_id: "",
        duration_days: "30",
        quantity: "10",
        prefix: "",
      });
      setShowBatchDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "批量生成失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const updateCardStatus = async (cardId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('card_keys')
        .update({ status: newStatus })
        .eq('id', cardId);

      if (error) {
        toast({
          title: "状态更新失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "状态更新成功",
        description: `卡密状态已更新为${getStatusText(newStatus)}`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "状态更新失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCard) return;

    try {
      const { data, error } = await supabase.functions.invoke('edit-card-key', {
        body: {
          cardId: editingCard.id,
          newDurationDays: parseInt(editFormData.duration_days),
          newStatus: editFormData.status !== editingCard.status ? editFormData.status : undefined
        }
      });

      if (error) {
        toast({
          title: "编辑失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "编辑失败",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      let successMessage = "卡密信息已更新";
      if (data.balanceChange !== 0) {
        const changeText = data.balanceChange > 0 ? `退款¥${data.balanceChange.toFixed(2)}` : `扣费¥${Math.abs(data.balanceChange).toFixed(2)}`;
        successMessage += `，${changeText}`;
      }

      toast({
        title: "编辑成功",
        description: successMessage,
      });

      setShowEditDialog(false);
      setEditingCard(null);
      setEditFormData({
        program_id: "",
        duration_days: "",
        status: "",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "编辑失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (card: CardKey) => {
    setEditingCard(card);
    setEditFormData({
      program_id: card.program_id,
      duration_days: card.duration_days.toString(),
      status: card.status,
    });
    setShowEditDialog(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "卡密已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unused: { variant: "default" as const, text: "未使用", icon: Clock },
      used: { variant: "secondary" as const, text: "已使用", icon: CheckCircle },
      expired: { variant: "outline" as const, text: "已过期", icon: XCircle },
      banned: { variant: "destructive" as const, text: "已封禁", icon: Ban },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      unused: "未使用",
      used: "已使用", 
      expired: "已过期",
      banned: "已封禁",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const filteredCards = cardKeys.filter(card => {
    const matchesSearch = !searchQuery || 
      card.card_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.programs.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || card.status === statusFilter;
    const matchesProgram = programFilter === "all" || card.program_id === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

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
            <h1 className="text-3xl font-bold text-foreground">卡密管理</h1>
            <p className="text-muted-foreground mt-2">
              生成、管理和监控您的授权卡密
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  生成卡密
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>生成新卡密</DialogTitle>
                  <DialogDescription>
                    为指定程序生成授权卡密
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCard} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">选择程序</Label>
                    <Select value={formData.program_id} onValueChange={(value) => setFormData({ ...formData, program_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择程序" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} (¥{program.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">有效期 (天)</Label>
                      <Select value={formData.duration_days} onValueChange={(value) => setFormData({ ...formData, duration_days: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1天</SelectItem>
                          <SelectItem value="7">7天</SelectItem>
                          <SelectItem value="30">30天</SelectItem>
                          <SelectItem value="90">90天</SelectItem>
                          <SelectItem value="365">365天</SelectItem>
                          <SelectItem value="-1">永久</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">生成数量</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      取消
                    </Button>
                    <Button type="submit">
                      生成卡密
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  批量生成
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>批量生成卡密</DialogTitle>
                  <DialogDescription>
                    批量生成多个授权卡密
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBatchCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch_program">选择程序</Label>
                    <Select value={batchData.program_id} onValueChange={(value) => setBatchData({ ...batchData, program_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择程序" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} (¥{program.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prefix">卡密前缀 (可选)</Label>
                    <Input
                      id="prefix"
                      placeholder="例如: VIP"
                      value={batchData.prefix}
                      onChange={(e) => setBatchData({ ...batchData, prefix: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batch_duration">有效期 (天)</Label>
                      <Select value={batchData.duration_days} onValueChange={(value) => setBatchData({ ...batchData, duration_days: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1天</SelectItem>
                          <SelectItem value="7">7天</SelectItem>
                          <SelectItem value="30">30天</SelectItem>
                          <SelectItem value="90">90天</SelectItem>
                          <SelectItem value="365">365天</SelectItem>
                          <SelectItem value="-1">永久</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batch_quantity">生成数量</Label>
                      <Input
                        id="batch_quantity"
                        type="number"
                        min="1"
                        max="1000"
                        value={batchData.quantity}
                        onChange={(e) => setBatchData({ ...batchData, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowBatchDialog(false)}>
                      取消
                    </Button>
                    <Button type="submit">
                      批量生成
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* 编辑卡密对话框 */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>编辑卡密</DialogTitle>
                  <DialogDescription>
                    修改卡密的基本信息
                  </DialogDescription>
                </DialogHeader>
                {editingCard && (
                  <form onSubmit={handleEditCard} className="space-y-4">
                    <div className="space-y-2">
                      <Label>卡密</Label>
                      <Input 
                        value={editingCard.card_key} 
                        disabled 
                        className="font-mono bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>所属程序</Label>
                      <Input 
                        value={editingCard.programs.name} 
                        disabled 
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">程序不可修改</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_duration">有效期 (天)</Label>
                      <Select 
                        value={editFormData.duration_days} 
                        onValueChange={(value) => setEditFormData({ ...editFormData, duration_days: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1天</SelectItem>
                          <SelectItem value="7">7天</SelectItem>
                          <SelectItem value="30">30天</SelectItem>
                          <SelectItem value="90">90天</SelectItem>
                          <SelectItem value="365">365天</SelectItem>
                          <SelectItem value="-1">永久</SelectItem>
                        </SelectContent>
                      </Select>
                      {editingCard.user_id && (
                        <p className="text-xs text-muted-foreground">
                          修改时长将自动计算余额变化：延长需要扣费，缩短会自动退款
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_status">状态</Label>
                      <Select 
                        value={editFormData.status} 
                        onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unused">未使用</SelectItem>
                          {editingCard.status !== 'used' && (
                            <SelectItem value="used">已使用</SelectItem>
                          )}
                          <SelectItem value="expired">已过期</SelectItem>
                          <SelectItem value="banned">已封禁</SelectItem>
                        </SelectContent>
                      </Select>
                      {editingCard.status === 'used' && (
                        <p className="text-xs text-muted-foreground text-amber-600">
                          已使用的卡密不能改回未使用状态
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                        取消
                      </Button>
                      <Button type="submit">
                        保存修改
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 筛选区域 */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索卡密或程序名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="unused">未使用</SelectItem>
                <SelectItem value="used">已使用</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
                <SelectItem value="banned">已封禁</SelectItem>
              </SelectContent>
            </Select>

            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部程序</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 卡密列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">
                    {card.card_key}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(card.card_key)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <CardDescription>
                  程序: {card.programs.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">状态</span>
                  {getStatusBadge(card.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">有效期</span>
                  <span className="text-sm font-medium">
                    {card.duration_days === -1 ? "永久" : `${card.duration_days}天`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">创建时间</span>
                  <span className="text-sm">
                    {new Date(card.created_at).toLocaleDateString()}
                  </span>
                </div>

                {card.used_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">使用时间</span>
                    <span className="text-sm">
                      {new Date(card.used_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  {card.status === 'unused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCardStatus(card.id, 'banned')}
                    >
                      <Ban className="w-3 h-3 mr-1" />
                      封禁
                    </Button>
                  )}
                  
                  {card.status === 'banned' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCardStatus(card.id, 'unused')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      解封
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(card)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {cardKeys.length === 0 ? "暂无卡密" : "未找到匹配的卡密"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {cardKeys.length === 0 ? "开始生成您的第一个卡密" : "尝试调整筛选条件"}
            </p>
            {cardKeys.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                生成卡密
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cards;