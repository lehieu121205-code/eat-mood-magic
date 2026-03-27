import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-end px-6 py-3">
        {user ? (
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm">Đăng nhập</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
