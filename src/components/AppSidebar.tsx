import { Heart, LayoutDashboard, MessageSquare, Brain, Users, Tag, TrendingUp, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Vibe Partner", url: "/vibe-partner", icon: Heart },
  { title: "CBT Therapist", url: "/cbt-therapist", icon: Brain },
  { title: "Common Room", url: "/common-room", icon: Users },
  { title: "Mood Tracker", url: "/mood-tracker", icon: MessageSquare },
  { title: "Analytics", url: "/mood-dashboard", icon: TrendingUp },
  { title: "Shop", url: "/shop", icon: Tag },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    navigate('/auth');
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        {!collapsed && (
          <>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">VibeCare</span>
          </>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft mx-auto">
            <Heart className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-soft"
                            : "hover:bg-muted/50 hover:translate-x-0.5"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-all rounded-lg" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
