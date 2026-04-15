import { useState, useMemo, KeyboardEvent, useRef } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recipes } from "@/data/recipes";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onClose?: () => void;
}

export default function HeaderIngredientSearch({ onClose }: Props) {
  const [chips, setChips] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<typeof recipes | null>(null);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed && !chips.includes(trimmed)) {
      setChips((prev) => [...prev, trimmed]);
    }
    setValue("");
  };

  const removeChip = (chip: string) => {
    setChips((prev) => prev.filter((c) => c !== chip));
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

    // Save search history if logged in
    if (user) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        search_terms: chips,
        result_recipes: matched.map((r) => r.title),
      } as any);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-bold text-foreground text-lg">Tìm kiếm theo nguyên liệu</h3>

      {/* Chip input */}
      <div className="flex items-center gap-2 flex-wrap bg-background border border-border rounded-xl p-3">
        {chips.map((chip) => (
          <Badge key={chip} variant="secondary" className="gap-1 text-sm px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
            {chip}
            <button onClick={() => removeChip(chip)}>
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập nguyên liệu (VD: trứng, hành...)"
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent flex-1 min-w-[150px] h-8 text-sm"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={chips.length === 0} className="rounded-full gap-2">
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
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          <p className="text-sm text-muted-foreground font-semibold">
            Kết quả: {results.length} món
          </p>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Không tìm thấy món phù hợp.</p>
          ) : (
            results.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors"
              >
                <img src={recipe.image} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{recipe.title}</p>
                  <p className="text-xs text-muted-foreground">{recipe.time} · {recipe.difficulty}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
