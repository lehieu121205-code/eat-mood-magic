import { MOODS } from "@/data/recipes";
import { cn } from "@/lib/utils";

interface Props {
  selected: string | null;
  onSelect: (mood: string | null) => void;
}

export default function MoodFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelect(selected === mood.id ? null : mood.id)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border-2",
            selected === mood.id
              ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
              : "bg-card text-foreground border-border hover:border-primary/50 hover:shadow-md"
          )}
        >
          <span className="text-xl">{mood.emoji}</span>
          {mood.label}
        </button>
      ))}
    </div>
  );
}
