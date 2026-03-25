import { useState, KeyboardEvent } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Props {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
}

export default function IngredientSearch({ chips, onChipsChange }: Props) {
  const [value, setValue] = useState("");

  const addChip = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed && !chips.includes(trimmed)) {
      onChipsChange([...chips, trimmed]);
    }
    setValue("");
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-card rounded-full shadow-lg border border-border overflow-hidden">
        <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập nguyên liệu: trứng, cà chua, hành lá..."
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
        />
      </div>
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
