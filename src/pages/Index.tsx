import { useState, useMemo } from "react";
import { recipes } from "@/data/recipes";
import RecipeCard from "@/components/RecipeCard";
import MoodFilter from "@/components/MoodFilter";
import IngredientSearch from "@/components/IngredientSearch";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function Index() {
  const [chips, setChips] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [prevMood, setPrevMood] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = recipes;
    if (mood) {
      result = result.filter((r) => r.mood.includes(mood));
    }
    if (chips.length > 0) {
      result = result.filter((r) =>
        chips.some((chip) =>
          r.ingredients.some((ing) => ing.toLowerCase().includes(chip))
        )
      );
    }
    return result;
  }, [mood, chips]);

  const handleAiSuggest = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const moodLabel = mood
        ? { vui: "vui vẻ", buon: "buồn", met: "mệt mỏi", haohung: "hào hứng", thugian: "thư giãn" }[mood]
        : null;

      const prompt = [
        chips.length > 0 ? `Nguyên liệu có sẵn: ${chips.join(", ")}` : "",
        moodLabel ? `Tâm trạng hiện tại: ${moodLabel}` : "",
        "Hãy gợi ý 3 món ăn Việt Nam phù hợp với thông tin trên. Mỗi món gồm tên, mô tả ngắn và lý do phù hợp.",
      ]
        .filter(Boolean)
        .join(". ");

      const resp = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
        },
      });

      if (resp.error) throw resp.error;
      setAiResult(resp.data.reply);
    } catch (e) {
      console.error(e);
      setAiResult("Xin lỗi, không thể nhận gợi ý AI lúc này. Vui lòng thử lại!");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-primary"
          >
            🍳 Cooking Instructions
          </motion.h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Nhập nguyên liệu sẵn có, chọn tâm trạng — AI sẽ gợi ý món ngon phù hợp nhất!
          </p>
          <IngredientSearch chips={chips} onChipsChange={setChips} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Mood filter */}
        <div className="mb-10">
          <h2 className="text-center text-xl font-bold text-foreground mb-4">
            Bạn đang cảm thấy thế nào?
          </h2>
          <MoodFilter selected={mood} onSelect={setMood} />
        </div>

        {/* AI Suggest */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-3xl p-8 mb-12 text-center shadow-sm border border-primary/10">
          <h2 className="text-2xl font-black text-primary mb-2">🤖 Gợi ý của AI</h2>
          <p className="text-muted-foreground mb-5">
            AI sẽ đề xuất món ăn phù hợp dựa trên nguyên liệu và tâm trạng của bạn
          </p>
          <Button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="rounded-full px-8 py-3 text-base font-bold shadow-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            size="lg"
          >
            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            Nhận gợi ý ngay
          </Button>

          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-card rounded-2xl p-6 text-left shadow-md max-w-2xl mx-auto"
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{aiResult}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>

        {/* Recipe grid */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {mood || chips.length > 0 ? `Kết quả (${filtered.length} món)` : "Tất cả món ăn"}
        </h2>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Không tìm thấy món ăn phù hợp. Thử thay đổi nguyên liệu hoặc tâm trạng!
          </p>
        )}
      </div>
    </div>
  );
}
