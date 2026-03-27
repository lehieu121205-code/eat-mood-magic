import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Heart, ChefHat, Search, Clock, Home, Menu, X } from "lucide-react";
import HeaderIngredientSearch from "@/components/HeaderIngredientSearch";
import SearchHistory from "@/components/SearchHistory";

type ActivePanel = "search" | "history" | null;

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    if (activePanel) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activePanel]);

  // Close panel on route change
  useEffect(() => {
    setActivePanel(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left side: Logo + Menu */}
        <div className="flex items-center gap-1 md:gap-2">
          <Link to="/" className="flex items-center gap-2 text-primary font-extrabold text-xl mr-2">
            <ChefHat className="w-6 h-6" />
            <span className="hidden sm:inline">Cooking Instructions</span>
          </Link>

          {/* Desktop menu */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button variant={isActive("/") ? "default" : "ghost"} size="sm" className="gap-1.5">
                <Home className="w-4 h-4" /> Trang chủ
              </Button>
            </Link>

            <div className="relative" ref={activePanel ? panelRef : undefined}>
              <Button
                variant={activePanel === "search" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => togglePanel("search")}
              >
                <Search className="w-4 h-4" /> Tìm nguyên liệu
              </Button>
            </div>

            {user && (
              <>
                <Button
                  variant={activePanel === "history" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => togglePanel("history")}
                >
                  <Clock className="w-4 h-4" /> Lịch sử
                </Button>

                <Link to="/saved">
                  <Button variant={isActive("/saved") ? "default" : "ghost"} size="sm" className="gap-1.5">
                    <Heart className="w-4 h-4" /> Đã lưu
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Right side: Auth */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Dropdown panels */}
      {activePanel && (
        <div ref={panelRef} className="absolute left-0 right-0 top-full bg-card border-b border-border shadow-xl z-50">
          <div className="max-w-3xl mx-auto">
            {activePanel === "search" && <HeaderIngredientSearch onClose={() => setActivePanel(null)} />}
            {activePanel === "history" && <SearchHistory />}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Button variant={isActive("/") ? "default" : "ghost"} size="sm" className="w-full justify-start gap-2">
              <Home className="w-4 h-4" /> Trang chủ
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => { setMobileMenuOpen(false); togglePanel("search"); }}>
            <Search className="w-4 h-4" /> Tìm nguyên liệu
          </Button>
          {user && (
            <>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => { setMobileMenuOpen(false); togglePanel("history"); }}>
                <Clock className="w-4 h-4" /> Lịch sử
              </Button>
              <Link to="/saved" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={isActive("/saved") ? "default" : "ghost"} size="sm" className="w-full justify-start gap-2">
                  <Heart className="w-4 h-4" /> Đã lưu
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
