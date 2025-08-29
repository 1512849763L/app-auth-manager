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
import { Plus, Key, Search, Download, Upload, Ban, CheckCircle, Clock, XCircle, Copy, Edit, Trash2, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  max_machines?: number;
  used_machines?: number;
  bound_machine_codes?: string[];
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
  const [userRole, setUserRole] = useState<string>("");
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    program_id: "",
    duration_days: "30",
    quantity: "1",
  });

  const [packages, setPackages] = useState<any[]>([]);

  const [editFormData, setEditFormData] = useState({
    program_id: "",
    duration_days: "",
    status: "",
    max_machines: "",
  });

  const [batchData, setBatchData] = useState({
    program_id: "",
    duration_days: "30",
    quantity: "10",
    prefix: "",
  });

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('获取用户角色失败:', error);
    }
  };

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

      // 获取套餐包列表
      const { data: packagesData, error: packagesError } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (packagesError) {
        console.error('获取套餐包失败:', packagesError);
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
      setPackages(packagesData || []);
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

      // 获取用户资料和角色
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        toast({
          title: "获取用户信息失败",
          description: "请刷新页面重试",
          variant: "destructive",
        });
        return;
      }

      const cardKey = await generateCardKey();
      const quantity = parseInt(formData.quantity);
      const selectedProgram = programs.find(p => p.id === formData.program_id);
      
      if (!selectedProgram) {
        toast({
          title: "程序不存在",
          description: "请选择有效的程序",
          variant: "destructive",
        });
        return;
      }

      // 如果不是管理员，需要检查余额并根据套餐包计算价格
      if (userProfile.role !== 'admin') {
        // 获取选择的套餐包信息
        const { data: packageData, error: packageError } = await supabase
          .from('subscription_packages')
          .select('*')
          .eq('duration_days', parseInt(formData.duration_days))
          .eq('is_active', true)
          .single();

        let priceMultiplier = 1.0;
        if (!packageError && packageData) {
          priceMultiplier = Number(packageData.price_multiplier);
        } else {
          // 如果没有匹配的套餐包，按天数比例计算
          const durationDays = parseInt(formData.duration_days);
          const baseDays = 30; // 基准30天
          priceMultiplier = durationDays / baseDays;
        }

        const totalCost = selectedProgram.price * quantity * priceMultiplier;
        
        if (userProfile.balance < totalCost) {
          toast({
            title: "余额不足",
            description: `需要¥${totalCost.toFixed(2)}，当前余额¥${userProfile.balance.toFixed(2)}`,
            variant: "destructive",
          });
          return;
        }

        // 更新用户余额
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: userProfile.balance - totalCost })
          .eq('id', user.id);

        if (balanceError) {
          toast({
            title: "余额扣减失败",
            description: balanceError.message,
            variant: "destructive",
          });
          return;
        }

        // 记录余额变动
        await supabase
          .from('balance_records')
          .insert({
            user_id: user.id,
            amount: -totalCost,
            type: 'consume',
            description: `生成${selectedProgram.name}卡密 x${quantity} (${formData.duration_days}天套餐，${priceMultiplier}x倍价格)`,
            balance_before: userProfile.balance,
            balance_after: userProfile.balance - totalCost
          });
      }

      const cardsToInsert = [];

      for (let i = 0; i < quantity; i++) {
        const key = quantity === 1 ? cardKey : await generateCardKey();
        cardsToInsert.push({
          card_key: key,
          program_id: formData.program_id,
          duration_days: parseInt(formData.duration_days),
          user_id: user.id,
          created_by: user.id,
          max_machines: selectedProgram.max_machines || 1,
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

      // 如果不是管理员，创建订单记录
      if (userProfile.role !== 'admin') {
        for (let i = 0; i < quantity; i++) {
          await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              program_id: formData.program_id,
              amount: selectedProgram.price,
              cost_amount: selectedProgram.cost_price,
              status: 'paid',
              payment_method: 'balance'
            });
        }
      }

      toast({
        title: "卡密创建成功",
        description: `成功生成 ${quantity} 个卡密${userProfile.role !== 'admin' ? '，已扣除相应余额' : ''}`,
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

      // 获取用户资料和角色
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        toast({
          title: "获取用户信息失败",
          description: "请刷新页面重试",
          variant: "destructive",
        });
        return;
      }

      const quantity = parseInt(batchData.quantity);
      const selectedProgram = programs.find(p => p.id === batchData.program_id);
      
      if (!selectedProgram) {
        toast({
          title: "程序不存在",
          description: "请选择有效的程序",
          variant: "destructive",
        });
        return;
      }

      // 如果不是管理员，需要检查余额并根据套餐包计算价格
      if (userProfile.role !== 'admin') {
        // 获取选择的套餐包信息
        const { data: packageData, error: packageError } = await supabase
          .from('subscription_packages')
          .select('*')
          .eq('duration_days', parseInt(batchData.duration_days))
          .eq('is_active', true)
          .single();

        let priceMultiplier = 1.0;
        if (!packageError && packageData) {
          priceMultiplier = Number(packageData.price_multiplier);
        } else {
          // 如果没有匹配的套餐包，按天数比例计算
          const durationDays = parseInt(batchData.duration_days);
          const baseDays = 30; // 基准30天
          priceMultiplier = durationDays / baseDays;
        }

        const totalCost = selectedProgram.price * quantity * priceMultiplier;
        
        if (userProfile.balance < totalCost) {
          toast({
            title: "余额不足",
            description: `需要¥${totalCost.toFixed(2)}，当前余额¥${userProfile.balance.toFixed(2)}`,
            variant: "destructive",
          });
          return;
        }

        // 更新用户余额
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: userProfile.balance - totalCost })
          .eq('id', user.id);

        if (balanceError) {
          toast({
            title: "余额扣减失败",
            description: balanceError.message,
            variant: "destructive",
          });
          return;
        }

        // 记录余额变动
        await supabase
          .from('balance_records')
          .insert({
            user_id: user.id,
            amount: -totalCost,
            type: 'consume',
            description: `批量生成${selectedProgram.name}卡密 x${quantity} (${batchData.duration_days}天套餐，${priceMultiplier}x倍价格)`,
            balance_before: userProfile.balance,
            balance_after: userProfile.balance - totalCost
          });
      }

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
          user_id: user.id,
          created_by: user.id,
          max_machines: selectedProgram.max_machines || 1,
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

      // 如果不是管理员，创建订单记录
      if (userProfile.role !== 'admin') {
        for (let i = 0; i < quantity; i++) {
          await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              program_id: batchData.program_id,
              amount: selectedProgram.price,
              cost_amount: selectedProgram.cost_price,
              status: 'paid',
              payment_method: 'balance'
            });
        }
      }

      toast({
        title: "批量生成成功",
        description: `成功生成 ${quantity} 个卡密${userProfile.role !== 'admin' ? '，已扣除余额' : ''}`,
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
          newStatus: editFormData.status !== editingCard.status ? editFormData.status : undefined,
          newMaxMachines: userRole === 'admin' && editFormData.max_machines !== (editingCard.max_machines || 1).toString() 
            ? parseInt(editFormData.max_machines) : undefined
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
        max_machines: "",
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
      max_machines: (card.max_machines || 1).toString(),
    });
    setShowEditDialog(true);
  };

  const clearMachineBindings = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('card_keys')
        .update({ 
          bound_machine_codes: [],
          used_machines: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (error) {
        toast({
          title: "清除绑定失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "清除成功",
        description: "已清除该卡密的所有机器绑定",
      });

      fetchData(); // 刷新数据
    } catch (error) {
      toast({
        title: "清除绑定失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCards.size === filteredCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredCards.map(card => card.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedCards.size === 0) return;

    const confirmMessage = `确定要删除选中的 ${selectedCards.size} 个卡密吗？\n\n⚠️ 注意：\n• 未使用的卡密将自动退还余额\n• 此操作不可撤销`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedCards).map(cardId =>
        supabase.functions.invoke('delete-card-key', {
          body: { cardId }
        })
      );

      const results = await Promise.all(deletePromises);
      
      let successCount = 0;
      let totalRefunded = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.error || result.data?.error) {
          errorCount++;
        } else {
          successCount++;
          if (result.data?.refunded && result.data?.refundAmount > 0) {
            totalRefunded += result.data.refundAmount;
          }
        }
      });

      let message = `成功删除 ${successCount} 个卡密`;
      if (totalRefunded > 0) {
        message += `，共退还 ¥${totalRefunded.toFixed(2)}`;
      }
      if (errorCount > 0) {
        message += `，${errorCount} 个删除失败`;
      }

      toast({
        title: errorCount === 0 ? "批量删除成功" : "批量删除部分成功",
        description: message,
        variant: errorCount === 0 ? "default" : "destructive",
      });

      setSelectedCards(new Set());
      setShowBatchDelete(false);
      fetchData();
    } catch (error) {
      toast({
        title: "批量删除失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const deleteCardKey = async (cardId: string, cardKey: string, status: string) => {
    const confirmMessage = status === 'unused' 
      ? `确定要删除卡密 "${cardKey}" 吗？\n\n⚠️ 注意：\n• 如果该卡密已被用户购买，将自动退还余额\n• 此操作不可撤销` 
      : `确定要删除卡密 "${cardKey}" 吗？\n\n⚠️ 注意：\n• 此操作不可撤销`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-card-key', {
        body: { cardId }
      });

      if (error) {
        toast({
          title: "删除失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "删除失败",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      let successMessage = "卡密删除成功";
      if (data.refunded && data.refundAmount > 0) {
        successMessage += `，已退还 ¥${data.refundAmount.toFixed(2)}`;
      }

      toast({
        title: "删除成功",
        description: successMessage,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "删除失败",
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
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              onClick={async () => {
                if (programs.length === 0) {
                  toast({
                    title: "无可用程序",
                    description: "请先创建程序后再生成测试卡密",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  const { data, error } = await supabase.functions.invoke('create-test-card', {
                    body: { 
                      programId: programs[0].id,
                      durationDays: 30,
                      machineCount: 1
                    }
                  });

                  if (error) {
                    toast({
                      title: "创建测试卡密失败",
                      description: error.message,
                      variant: "destructive",
                    });
                    return;
                  }

                  if (data.error) {
                    toast({
                      title: "创建测试卡密失败",
                      description: data.error,
                      variant: "destructive",
                    });
                    return;
                  }

                  toast({
                    title: "测试卡密创建成功",
                    description: data.message,
                  });

                  fetchData();
                } catch (error) {
                  toast({
                    title: "创建测试卡密失败",
                    description: "系统错误，请稍后重试",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Key className="w-4 h-4" />
              生成测试卡密
            </Button>
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

                     {/* 管理员专属：最大机器数设置 */}
                     {userRole === 'admin' && (
                       <div className="space-y-2">
                         <Label htmlFor="edit_max_machines">最大机器绑定数</Label>
                         <Input
                           id="edit_max_machines"
                           type="number"
                           min="1"
                           max="100"
                           value={editFormData.max_machines}
                           onChange={(e) => setEditFormData({ ...editFormData, max_machines: e.target.value })}
                           placeholder="默认为1"
                         />
                         <p className="text-xs text-muted-foreground">
                           管理员可以设置每个卡密最多能绑定的机器数量
                         </p>
                       </div>
                     )}

                      {/* 机器绑定信息 */}
                     {editingCard.status === 'used' && editingCard.bound_machine_codes && editingCard.bound_machine_codes.length > 0 && (
                       <div className="space-y-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                         <div className="flex items-center justify-between">
                           <Label className="text-blue-700 dark:text-blue-300 font-medium">机器绑定情况</Label>
                           <Badge variant="secondary" className="text-xs">
                             {editingCard.used_machines || 0}/{editingCard.max_machines || '∞'}
                           </Badge>
                         </div>
                         
                         <div className="space-y-2">
                           <div className="text-sm text-blue-600 dark:text-blue-400">
                             当前绑定的机器码:
                           </div>
                           <div className="space-y-1 max-h-24 overflow-y-auto">
                             {editingCard.bound_machine_codes.map((code, index) => (
                               <div key={index} className="font-mono text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                                 {code}
                               </div>
                             ))}
                           </div>
                           
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               if (window.confirm('确定要清除该卡密的所有机器绑定吗？\n\n清除后：\n• 卡密可以重新绑定到其他机器\n• 原绑定的机器将无法继续使用\n• 此操作不可撤销')) {
                                 clearMachineBindings(editingCard.id);
                                 setShowEditDialog(false);
                               }
                             }}
                             className="w-full text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                           >
                             <RefreshCw className="w-3 h-3 mr-2" />
                             清除所有机器绑定
                           </Button>
                         </div>
                       </div>
                     )}

                     {editingCard.status === 'used' && (!editingCard.bound_machine_codes || editingCard.bound_machine_codes.length === 0) && (
                       <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/20">
                         <div className="text-sm text-muted-foreground">
                           此卡密已被使用，但暂无机器绑定信息
                         </div>
                       </div>
                     )}

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

        {/* 清除机器绑定确认对话框 - 已移除，功能整合到编辑对话框中 */}

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

        {/* 卡密列表 - 使用表格和折叠形式 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                卡密列表 ({filteredCards.length})
              </span>
              <div className="flex items-center gap-2">
                {selectedCards.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    批量删除 ({selectedCards.size})
                  </Button>
                )}
                <Badge variant="outline" className="text-xs">
                  总计: {cardKeys.length}
                </Badge>
              </div>
            </CardTitle>
            {filteredCards.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCards.size === filteredCards.length && filteredCards.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm text-muted-foreground">
                  全选 ({selectedCards.size}/{filteredCards.length})
                </Label>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredCards.length > 0 ? (
              <div className="space-y-2">
                {filteredCards.map((card) => (
                  <div key={card.id} className="border rounded-lg overflow-hidden card-item">
                    <div className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedCards.has(card.id)}
                          onCheckedChange={() => toggleCardSelection(card.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium">{card.card_key}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {card.programs.name} · 
                            {card.duration_days === -1 ? "永久" : `${card.duration_days}天`}
                            {card.max_machines && ` · 机器限制: ${card.used_machines || 0}/${card.max_machines}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(card.status)}
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(card.card_key);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(card);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCardKey(card.id, card.card_key, card.status);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="删除卡密"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cardItem = (e.target as HTMLElement).closest('.card-item') as HTMLElement;
                              const details = cardItem?.querySelector('.card-details') as HTMLElement;
                              if (details) {
                                const isOpen = details.classList.contains('block');
                                details.classList.toggle('hidden', isOpen);
                                details.classList.toggle('block', !isOpen);
                                const icon = cardItem?.querySelector('.expand-icon') as HTMLElement;
                                if (icon) {
                                  icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                                }
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <svg 
                              className="expand-icon w-4 h-4 transition-transform duration-200" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-details hidden bg-background border-t">
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="text-muted-foreground">创建时间</div>
                            <div className="font-medium">
                              {new Date(card.created_at).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </div>
                          </div>
                          
                          {card.expire_at && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground">过期时间</div>
                              <div className="font-medium">
                                {new Date(card.expire_at).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                })}
                              </div>
                            </div>
                          )}
                          
                          {card.used_at && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground">使用时间</div>
                              <div className="font-medium">
                                {new Date(card.used_at).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                })}
                              </div>
                            </div>
                          )}
                          
                          {card.max_machines && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground">机器使用情况</div>
                              <div className="font-medium">
                                已绑定 {card.used_machines || 0} / {card.max_machines} 台机器
                              </div>
                            </div>
                          )}
                          
                          {card.bound_machine_codes && card.bound_machine_codes.length > 0 && (
                            <div className="space-y-1 md:col-span-2">
                              <div className="text-muted-foreground">绑定的机器码</div>
                              <div className="space-y-1">
                                {card.bound_machine_codes.map((code, index) => (
                                  <div key={index} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                    {code}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2 border-t">
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
                          
                          {card.status === 'used' && card.bound_machine_codes && card.bound_machine_codes.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(card)}
                              title="在编辑中管理机器绑定"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              管理绑定
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCardKey(card.id, card.card_key, card.status)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Cards;