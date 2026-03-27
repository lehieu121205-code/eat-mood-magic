import { useState, useMemo, KeyboardEvent } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recipes } from "@/data/recipes";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function SearchPage() {
  const [chips, setChips] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<typeof recipes | null>(null);
  const { user } = useAuth();

  const addChip = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed && !chips.includes(trimmed)) {
      setChips((prev) => [...prev, trimmed]);
    }
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && value.trim()) {
      e.preventDefault();
      addChip(value);
    }
    if (e.key === "Backspace" && !value && chips.length) {
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const handleSearch = async () => {
    if (chips.length === 0) return;
    const matched = recipes.filter((r) =>
      chips.some((chip) =>
        r.ingredients.some((ing) => ing.toLowerCase().includes(chip))
      )
    );
    setResults(matched);

    if (user) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        search_terms: chips,
        result_recipes: matched.map((r) => r.title),
      } as any);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-black text-foreground">🔍 Tìm kiếm theo nguyên liệu</h1>
      <p className="text-muted-foreground">Nhập các nguyên liệu bạn có, hệ thống sẽ đề xuất món ăn phù hợp.</p>

      {/* Chip input */}
      <div className="flex items-center gap-2 flex-wrap bg-card border border-border rounded-2xl p-4 shadow-sm">
        {chips.map((chip) => (
          <Badge key={chip} variant="secondary" className="gap-1 text-sm px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
            {chip}
            <button onClick={() => setChips((prev) => prev.filter((c) => c !== chip))}>
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập nguyên liệu (VD: trứng, hành, cà chua...)"
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent flex-1 min-w-[200px] h-9 text-base"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSearch} disabled={chips.length === 0} className="rounded-full gap-2 px-6">
          <Search className="w-4 h-4" /> Tìm kiếm
        </Button>
        {chips.length > 0 && (
          <Button variant="outline" onClick={() => { setChips([]); setResults(null); }} className="rounded-full">
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Results */}
      {results !== null && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Kết quả: {results.length} món</h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Không tìm thấy món phù hợp. Thử nguyên liệu khác!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <img src={recipe.image} alt={recipe.title} className="w-20 h-20 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-foreground">{recipe.title}</p>
                    <p className="text-sm text-muted-foreground">{recipe.time} · {recipe.difficulty}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
