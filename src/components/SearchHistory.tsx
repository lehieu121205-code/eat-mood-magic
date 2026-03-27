import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HistoryItem {
  id: string;
  search_terms: string[];
  result_recipes: string[];
  created_at: string;
}

export default function SearchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("search_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory((data as any) || []);
        setLoading(false);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("search_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  if (!user) return null;

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
        <Clock className="w-5 h-5" /> Lịch sử tìm kiếm
      </h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Chưa có lịch sử tìm kiếm nào.</p>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {history.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-background border border-border">
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap gap-1">
                  {item.search_terms.map((term) => (
                    <Badge key={term} variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {term}
                    </Badge>
                  ))}
                </div>
                {item.result_recipes.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    → {item.result_recipes.slice(0, 3).join(", ")}
                    {item.result_recipes.length > 3 && ` +${item.result_recipes.length - 3} món`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60">
                  {new Date(item.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
