import { useState, useMemo, KeyboardEvent, useRef } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { recipes } from "@/data/recipes";
import { Link } from "react-router-dom";

interface Props {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
}

export default function IngredientSearch({ chips, onChipsChange }: Props) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return recipes.filter((r) =>
      r.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
      r.title.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [value]);

  const addChip = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed && !chips.includes(trimmed)) {
      onChipsChange([...chips, trimmed]);
    }
    setValue("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(value);
    }
    if (e.key === "Backspace" && !value && chips.length) {
      onChipsChange(chips.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative" ref={wrapperRef}>
      <div className="relative flex items-center bg-card rounded-full shadow-lg border border-border overflow-hidden">
        <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
        <Input
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Nhập nguyên liệu: trứng, cà chua, hành lá..."
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
        />
      </div>

      {/* Dropdown gợi ý món ăn */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <p className="px-4 py-2 text-xs text-muted-foreground font-semibold">Món liên quan</p>
          {suggestions.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipe/${recipe.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
            >
              <img src={recipe.image} alt={recipe.title} className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">{recipe.title}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[300px]">{recipe.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {chips.map((chip) => (
            <Badge key={chip} variant="secondary" className="gap-1 text-sm px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
              {chip}
              <button onClick={() => onChipsChange(chips.filter((c) => c !== chip))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
