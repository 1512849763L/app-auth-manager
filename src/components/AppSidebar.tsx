import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Settings,
  Shield,
  Users,
  Key,
  CreditCard,  
  ChevronRight,
  Home,
  Package,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "仪表盘", url: "/", icon: Home },
  { title: "程序管理", url: "/programs", icon: Package },
  { title: "卡密管理", url: "/cards", icon: Key },
  { title: "用户管理", url: "/users", icon: Users },
  { title: "财务管理", url: "/finance", icon: CreditCard },
  { title: "系统设置", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  userProfile?: any;
}

export function AppSidebar({ userProfile }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground";

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "退出失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "已退出登录",
        description: "感谢您的使用！",
      });
    } catch (error) {
      toast({
        title: "退出失败",
        description: "系统错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-card/50 backdrop-blur-sm border-r border-border/50">
        {/* 系统标题 */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold text-foreground">卡密授权系统</h1>
                <p className="text-xs text-muted-foreground">管理控制台</p>
              </div>
            )}
          </div>
        </div>

        {/* 用户信息 */}
        {userProfile && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userProfile.username}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userProfile.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-muted-foreground">
            主要功能
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${getNavCls({ isActive })}
                      `}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          <ChevronRight className="w-3 h-3 opacity-50" />
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 退出按钮 */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`w-full justify-${collapsed ? 'center' : 'start'} text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">退出登录</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}