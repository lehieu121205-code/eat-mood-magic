import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HistoryItem {
  id: string;
  search_terms: string[];
  result_recipes: string[];
  created_at: string;
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      supabase
        .from("search_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setHistory((data as any) || []);
          setFetching(false);
        });
    }
  }, [user, loading, navigate]);

  const handleDelete = async (id: string) => {
    await supabase.from("search_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  if (loading || fetching) return <div className="text-center py-20 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
        <Clock className="w-8 h-8" /> Lịch sử tìm kiếm
      </h1>

      {history.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Chưa có lịch sử tìm kiếm nào.</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {item.search_terms.map((term) => (
                    <Badge key={term} variant="secondary" className="text-sm bg-primary/10 text-primary">
                      {term}
                    </Badge>
                  ))}
                </div>
                {item.result_recipes.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    → {item.result_recipes.slice(0, 4).join(", ")}
                    {item.result_recipes.length > 4 && ` +${item.result_recipes.length - 4} món`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60">
                  {new Date(item.created_at).toLocaleDateString("vi-VN", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
