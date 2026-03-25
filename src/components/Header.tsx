import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Heart, ChefHat } from "lucide-react";

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-primary font-extrabold text-xl">
          <ChefHat className="w-6 h-6" />
          Cooking Instructions
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button variant={isActive("/") ? "default" : "ghost"} size="sm">
              Trang chủ
            </Button>
          </Link>
          {user && (
            <Link to="/saved">
              <Button variant={isActive("/saved") ? "default" : "ghost"} size="sm">
                <Heart className="w-4 h-4 mr-1" /> Đã lưu
              </Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Đăng xuất
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">Đăng nhập</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
