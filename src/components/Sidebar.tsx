import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Heart, ChefHat, Search, Clock, Home, ChevronLeft, ChevronRight, User, UtensilsCrossed, Star, Carrot } from "lucide-react";

export default function Sidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: Home, label: "Trang chủ", path: "/", always: true },
    { icon: Search, label: "Tìm nguyên liệu", path: "/search", always: true },
    { icon: Clock, label: "Lịch sử tìm kiếm", path: "/history", requireAuth: true },
    { icon: Heart, label: "Món đã lưu", path: "/saved", requireAuth: true },
    { icon: User, label: "Trang cá nhân", path: "/profile", requireAuth: true },
  ];

  const adminItems = [
    { icon: UtensilsCrossed, label: "Quản lý món ăn", path: "/admin/recipes" },
    { icon: Star, label: "Quản lý đánh giá", path: "/admin/reviews" },
    { icon: Carrot, label: "Quản lý nguyên liệu", path: "/admin/ingredients" },
  ];

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-border bg-card flex flex-col transition-all duration-300 shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-primary font-extrabold text-lg">
          <ChefHat className="w-6 h-6 shrink-0" />
          {!collapsed && <span>Cooking Instructions</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.requireAuth && !user) return null;
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={active ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${collapsed ? "px-3" : "px-4"}`}
                size="sm"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className={`pt-4 pb-1 ${collapsed ? "px-2" : "px-4"}`}>
              {!collapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quản trị
                </p>
              )}
              {collapsed && <div className="border-t border-border" />}
            </div>
            {adminItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${collapsed ? "px-3" : "px-4"}`}
                    size="sm"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom: user info */}
      <div className="border-t border-border p-3 space-y-2">
        {!user && !collapsed && (
          <p className="text-xs text-muted-foreground px-2">
            Để bắt đầu lưu trữ món ngon của riêng bạn, vui lòng{" "}
            <Link to="/auth" className="text-primary underline font-medium">đăng ký hoặc đăng nhập</Link>.
          </p>
        )}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={`w-full justify-start gap-3 ${collapsed ? "px-3" : "px-4"}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </Button>
        )}
      </div>
    </aside>
  );
}
