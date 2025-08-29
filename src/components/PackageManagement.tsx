import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPackage {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price_multiplier: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const PackageManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_days: "",
    price_multiplier: "",
    is_active: true,
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    duration_days: "",
    price_multiplier: "",
    is_active: true,
  });

  const { data: packages, isLoading } = useQuery({
    queryKey: ['subscription-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionPackage[];
    }
  });

  const createPackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      const maxSortOrder = packages?.reduce((max, pkg) => Math.max(max, pkg.sort_order), 0) || 0;
      
      const { error } = await supabase
        .from('subscription_packages')
        .insert({
          ...packageData,
          duration_days: parseInt(packageData.duration_days),
          price_multiplier: parseFloat(packageData.price_multiplier),
          sort_order: maxSortOrder + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast({
        title: "创建成功",
        description: "套餐包已创建",
      });
      setShowCreateDialog(false);
      setFormData({
        name: "",
        description: "",
        duration_days: "",
        price_multiplier: "",
        is_active: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('subscription_packages')
        .update({
          ...data,
          duration_days: parseInt(data.duration_days),
          price_multiplier: parseFloat(data.price_multiplier),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast({
        title: "更新成功",
        description: "套餐包已更新",
      });
      setShowEditDialog(false);
      setEditingPackage(null);
    },
    onError: (error: any) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast({
        title: "删除成功",
        description: "套餐包已删除",
      });
    },
    onError: (error: any) => {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    createPackageMutation.mutate(formData);
  };

  const handleEditPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    updatePackageMutation.mutate({ id: editingPackage.id, data: editFormData });
  };

  const openEditDialog = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    setEditFormData({
      name: pkg.name,
      description: pkg.description || "",
      duration_days: pkg.duration_days.toString(),
      price_multiplier: pkg.price_multiplier.toString(),
      is_active: pkg.is_active,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`确定要删除套餐"${name}"吗？此操作不可撤销。`)) {
      deletePackageMutation.mutate(id);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_packages')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      toast({
        title: "状态更新成功",
        description: `套餐已${!currentStatus ? '激活' : '停用'}`,
      });
    } catch (error: any) {
      toast({
        title: "状态更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">套餐配置</h3>
          <p className="text-muted-foreground">管理卡密生成的时长套餐和价格倍数</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加套餐
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建套餐包</DialogTitle>
              <DialogDescription>
                添加新的套餐配置，用于卡密生成时的价格计算
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">套餐名称</Label>
                <Input
                  id="name"
                  placeholder="例：30天标准版"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  placeholder="套餐描述（可选）"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">时长（天）</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="multiplier">价格倍数</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={formData.price_multiplier}
                    onChange={(e) => setFormData({ ...formData, price_multiplier: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">启用套餐</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button type="submit">创建套餐</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>套餐名称</TableHead>
            <TableHead>时长</TableHead>
            <TableHead>价格倍数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>描述</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages?.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="font-medium">{pkg.name}</TableCell>
              <TableCell>{pkg.duration_days}天</TableCell>
              <TableCell>{pkg.price_multiplier}x</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={pkg.is_active}
                    onCheckedChange={() => toggleStatus(pkg.id, pkg.is_active)}
                  />
                  <Badge variant={pkg.is_active ? "default" : "secondary"}>
                    {pkg.is_active ? "启用" : "停用"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {pkg.description || "无描述"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(pkg)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pkg.id, pkg.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 编辑对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑套餐包</DialogTitle>
            <DialogDescription>
              修改套餐配置信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPackage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">套餐名称</Label>
              <Input
                id="edit_name"
                placeholder="例：30天标准版"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">描述</Label>
              <Textarea
                id="edit_description"
                placeholder="套餐描述（可选）"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_duration">时长（天）</Label>
                <Input
                  id="edit_duration"
                  type="number"
                  placeholder="30"
                  value={editFormData.duration_days}
                  onChange={(e) => setEditFormData({ ...editFormData, duration_days: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_multiplier">价格倍数</Label>
                <Input
                  id="edit_multiplier"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={editFormData.price_multiplier}
                  onChange={(e) => setEditFormData({ ...editFormData, price_multiplier: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active">启用套餐</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button type="submit">保存更改</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackageManagement;