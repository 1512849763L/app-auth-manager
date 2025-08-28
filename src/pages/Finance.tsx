import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, CreditCard, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UseRechargeCardDialog } from "@/components/UseRechargeCardDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Finance = () => {
  const { toast } = useToast();
  const [useCardDialogOpen, setUseCardDialogOpen] = useState(false);
  
  const { data: balanceRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ['balance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balance_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          programs!inner(name, price)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: userProfile } = useQuery({
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

  const totalBalance = userProfile?.balance || 0;
  const totalIncome = balanceRecords?.filter(r => ['recharge', 'refund', 'commission'].includes(r.type)).reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const totalExpense = balanceRecords?.filter(r => r.type === 'consume').reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      paid: "default", 
      failed: "destructive",
      cancelled: "outline"
    };
    
    const labels: Record<string, string> = {
      pending: "待支付",
      paid: "已支付",
      failed: "支付失败", 
      cancelled: "已取消"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getRecordTypeBadge = (type: string) => {
    const isIncome = ['recharge', 'refund', 'commission'].includes(type);
    const typeLabels: Record<string, string> = {
      recharge: '充值',
      consume: '消费',
      refund: '退款',
      commission: '佣金'
    };
    
    return (
      <Badge variant={isIncome ? 'default' : 'secondary'}>
        {typeLabels[type] || type}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* 头部标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">财务管理</h1>
            <p className="text-muted-foreground">管理账户余额、订单和收入统计</p>
          </div>
          <Button onClick={() => setUseCardDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            充值
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">账户余额</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">当前可用余额</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">累计收入金额</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总支出</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">¥{totalExpense.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">累计支出金额</p>
            </CardContent>
          </Card>
        </div>

        {/* 详细数据 */}
        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">余额记录</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>余额变动记录</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="搜索记录..." className="w-60" />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>变动前</TableHead>
                      <TableHead>变动后</TableHead>
                      <TableHead>描述</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRecords ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : balanceRecords?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          暂无记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      balanceRecords?.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getRecordTypeBadge(record.type)}
                          </TableCell>
                          <TableCell className={['recharge', 'refund', 'commission'].includes(record.type) ? 'text-green-600' : 'text-red-600'}>
                            {['recharge', 'refund', 'commission'].includes(record.type) ? '+' : '-'}¥{Math.abs(Number(record.amount)).toFixed(2)}
                          </TableCell>
                          <TableCell>¥{Number(record.balance_before).toFixed(2)}</TableCell>
                          <TableCell>¥{Number(record.balance_after).toFixed(2)}</TableCell>
                          <TableCell>{record.description || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>订单管理</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="搜索订单..." className="w-60" />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>程序</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>支付方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : orders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          暂无订单
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {(order as any).programs?.name || '未知程序'}
                          </TableCell>
                          <TableCell>¥{Number(order.amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.payment_method === 'balance' ? '余额支付' : '其他'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UseRechargeCardDialog
          open={useCardDialogOpen}
          onOpenChange={setUseCardDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Finance;