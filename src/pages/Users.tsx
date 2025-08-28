import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users as UsersIcon, Search, Shield, UserCheck, UserX, Settings, Edit, Trash2 } from "lucide-react";
import { Layout } from "../components/Layout";

type UserRole = 'admin' | 'agent' | 'user';

interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface AgentPermission {
  id: string;
  agent_id: string;
  program_id: string;
  can_generate_keys: boolean;
  can_view_keys: boolean;
  can_manage_users: boolean;
  programs: {
    name: string;
  };
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [agentPermissions, setAgentPermissions] = useState<AgentPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as UserRole,
    balance: "0",
  });

  const [permissionData, setPermissionData] = useState({
    user_id: "",
    program_id: "",
    can_generate_keys: true,
    can_view_keys: true,
    can_manage_users: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取用户列表
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        toast({
          title: "获取用户列表失败",
          description: usersError.message,
          variant: "destructive",
        });
        return;
      }

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

      // 获取代理权限
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('agent_permissions')
        .select(`
          *,
          programs (
            name
          )
        `);

      if (permissionsError) {
        console.error("获取权限列表失败:", permissionsError);
      }

      setUsers(usersData || []);
      setPrograms(programsData || []);
      setAgentPermissions(permissionsData || []);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 创建新用户账户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            role: formData.role,
          }
        }
      });

      if (authError) {
        toast({
          title: "创建用户失败",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      // 更新用户资料中的余额
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            balance: parseFloat(formData.balance),
            role: formData.role,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error("更新用户资料失败:", profileError);
        }
      }

      toast({
        title: "用户创建成功",
        description: "新用户已添加到系统中",
      });

      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user" as UserRole,
        balance: "0",
      });
      setShowCreateDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "创建用户失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('agent_permissions')
        .insert({
          agent_id: permissionData.user_id,
          program_id: permissionData.program_id,
          can_generate_keys: permissionData.can_generate_keys,
          can_view_keys: permissionData.can_view_keys,
          can_manage_users: permissionData.can_manage_users,
          created_by: user.id,
        });

      if (error) {
        toast({
          title: "权限设置失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "权限设置成功",
        description: "代理权限已配置完成",
      });

      setPermissionData({
        user_id: "",
        program_id: "",
        can_generate_keys: true,
        can_view_keys: true,
        can_manage_users: false,
      });
      setShowPermissionDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "权限设置失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        toast({
          title: "角色更新失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "角色更新成功",
        description: `用户角色已更新为${getRoleText(newRole)}`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "角色更新失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const updateUserBalance = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: amount })
        .eq('id', userId);

      if (error) {
        toast({
          title: "余额更新失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "余额更新成功",
        description: `用户余额已更新为¥${amount}`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "余额更新失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      admin: { variant: "default" as const, text: "管理员", icon: Shield },
      agent: { variant: "secondary" as const, text: "代理", icon: UserCheck },
      user: { variant: "outline" as const, text: "用户", icon: UsersIcon },
    };

    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getRoleText = (role: UserRole) => {
    const roleMap = {
      admin: "管理员",
      agent: "代理",
      user: "用户",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getUserPermissions = (userId: string) => {
    return agentPermissions.filter(p => p.agent_id === userId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
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
            <h1 className="text-3xl font-bold text-foreground">用户管理</h1>
            <p className="text-muted-foreground mt-2">
              管理系统用户、分配角色和设置代理权限
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  添加用户
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>创建新用户</DialogTitle>
                  <DialogDescription>
                    添加新的系统用户账户
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      placeholder="请输入用户名"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">初始密码</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="请输入初始密码"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">用户角色</Label>
                      <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">用户</SelectItem>
                          <SelectItem value="agent">代理</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="balance">初始余额</Label>
                      <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      取消
                    </Button>
                    <Button type="submit">
                      创建用户
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  权限设置
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>设置代理权限</DialogTitle>
                  <DialogDescription>
                    为代理用户分配程序管理权限
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePermission} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="permission_user">选择用户</Label>
                    <Select value={permissionData.user_id} onValueChange={(value) => setPermissionData({ ...permissionData, user_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择用户" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === 'agent').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permission_program">选择程序</Label>
                    <Select value={permissionData.program_id} onValueChange={(value) => setPermissionData({ ...permissionData, program_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择程序" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>权限设置</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_generate_keys"
                          checked={permissionData.can_generate_keys}
                          onCheckedChange={(checked) => setPermissionData({ ...permissionData, can_generate_keys: checked as boolean })}
                        />
                        <Label htmlFor="can_generate_keys" className="text-sm">
                          可以生成卡密
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_view_keys"
                          checked={permissionData.can_view_keys}
                          onCheckedChange={(checked) => setPermissionData({ ...permissionData, can_view_keys: checked as boolean })}
                        />
                        <Label htmlFor="can_view_keys" className="text-sm">
                          可以查看卡密
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_manage_users"
                          checked={permissionData.can_manage_users}
                          onCheckedChange={(checked) => setPermissionData({ ...permissionData, can_manage_users: checked as boolean })}
                        />
                        <Label htmlFor="can_manage_users" className="text-sm">
                          可以管理用户
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowPermissionDialog(false)}>
                      取消
                    </Button>
                    <Button type="submit">
                      设置权限
                    </Button>
                  </div>
                </form>
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
                placeholder="搜索用户名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="agent">代理</SelectItem>
                <SelectItem value="user">用户</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const permissions = getUserPermissions(user.id);
            
            return (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{user.username}</CardTitle>
                    {getRoleBadge(user.role)}
                  </div>
                  <CardDescription>
                    注册时间: {new Date(user.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">账户余额</span>
                    <span className="text-sm font-medium text-green-600">
                      ¥{user.balance || '0.00'}
                    </span>
                  </div>

                  {user.role === 'agent' && permissions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">代理权限</span>
                      <div className="space-y-1">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="text-xs p-2 bg-muted rounded">
                            <div className="font-medium">{permission.programs.name}</div>
                            <div className="text-muted-foreground">
                              {permission.can_generate_keys && "生成卡密 "}
                              {permission.can_view_keys && "查看卡密 "}
                              {permission.can_manage_users && "管理用户"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      编辑
                    </Button>
                    
                    {user.role !== 'admin' && (
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        权限
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {users.length === 0 ? "暂无用户" : "未找到匹配的用户"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {users.length === 0 ? "开始添加您的第一个用户" : "尝试调整筛选条件"}
            </p>
            {users.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加用户
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;