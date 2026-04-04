import { useState, useMemo } from "react";
import { recipes, type Recipe } from "@/data/recipes";
import RecipeCard from "@/components/RecipeCard";
import MoodFilter from "@/components/MoodFilter";
import IngredientSearch from "@/components/IngredientSearch";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

const moodLabels: Record<string, string> = {
  vui: "vui vẻ",
  buon: "buồn",
  met: "mệt mỏi",
  haohung: "hào hứng",
  thugian: "thư giãn",
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getTopRecipeSuggestions = (allRecipes: Recipe[], chips: string[], mood: string | null) => {
  const normalizedChips = chips.map(normalizeText);

  const scoredRecipes = allRecipes
    .map((recipe) => {
      const title = normalizeText(recipe.title);
      const ingredients = recipe.ingredients.map(normalizeText);
      const ingredientMatches = normalizedChips.filter(
        (chip) => title.includes(chip) || ingredients.some((ingredient) => ingredient.includes(chip))
      ).length;

      let score = ingredientMatches * 2;
      if (mood && recipe.mood.includes(mood)) score += 3;
      if (normalizedChips.length > 0 && ingredientMatches === normalizedChips.length) score += 2;

      return { recipe, score };
    })
    .sort((a, b) => b.score - a.score);

  const prioritized = scoredRecipes
    .filter(({ score }) => score > 0)
    .map(({ recipe }) => recipe);

  const fallback = allRecipes.filter((recipe) => !prioritized.some((item) => item.id === recipe.id));

  return [...prioritized, ...fallback].slice(0, 3);
};

export default function Index() {
  const [chips, setChips] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
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

  const selectedRecipe = useMemo(
    () => aiSuggestions.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [aiSuggestions, selectedRecipeId]
  );

  const clearAiSuggestionState = () => {
    setAiResult(null);
    setAiSuggestions([]);
    setSelectedRecipeId(null);
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    clearAiSuggestionState();

    const suggestions = getTopRecipeSuggestions(recipes, chips, mood);
    try {
      const moodLabel = mood ? moodLabels[mood] : null;

      const recipeOptions = suggestions.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
      }));

      const prompt = [
        chips.length > 0 ? `Nguyên liệu có sẵn: ${chips.join(", ")}` : "",
        moodLabel ? `Tâm trạng hiện tại: ${moodLabel}` : "",
        "Hãy chọn đúng 3 món phù hợp nhất từ danh sách có sẵn và giải thích ngắn gọn vì sao phù hợp.",
      ]
        .filter(Boolean)
        .join(". ");

      const resp = await supabase.functions.invoke("ai-chat", {
        body: {
          mode: "recipe_suggestions",
          recipeOptions,
          messages: [{ role: "user", content: prompt }],
        },
      });

      if (resp.error) throw resp.error;
      setAiSuggestions(suggestions);
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
            Cooking Instructions
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
          <MoodFilter selected={mood} onSelect={(m) => {
            setMood(m);
            if (!m) clearAiSuggestionState();
          }} />
        </div>

        {/* AI Suggest */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-3xl p-8 mb-12 text-center shadow-sm border border-primary/10">
          <h2 className="text-2xl font-black text-primary mb-2">Gợi ý của AI</h2>
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
              className="mt-6 bg-card rounded-2xl p-6 text-left shadow-md max-w-3xl mx-auto space-y-5"
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{aiResult}</ReactMarkdown>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="space-y-4 border-t border-border pt-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Chọn 1 món để xem chi tiết</h3>
                    <p className="text-sm text-muted-foreground">
                      Bấm vào 1 trong 3 món AI vừa đề xuất để xem nguyên liệu và công thức nấu.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {aiSuggestions.map((recipe, index) => (
                      <Button
                        key={recipe.id}
                        type="button"
                        variant={selectedRecipeId === recipe.id ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setSelectedRecipeId(recipe.id)}
                      >
                        {index + 1}. {recipe.title}
                      </Button>
                    ))}
                  </div>

                  {selectedRecipe && (
                    <div className="rounded-2xl border border-border bg-background/70 p-5 space-y-5">
                      <div className="flex flex-col gap-4 md:flex-row">
                        <img
                          src={selectedRecipe.image}
                          alt={selectedRecipe.title}
                          className="h-40 w-full rounded-2xl object-cover md:w-56"
                          loading="lazy"
                        />
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-foreground">{selectedRecipe.title}</h4>
                          <p className="text-muted-foreground">{selectedRecipe.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedRecipe.time} · {selectedRecipe.difficulty}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-base font-bold text-foreground mb-3">Nguyên liệu</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecipe.ingredients.map((ingredient) => (
                            <span
                              key={ingredient}
                              className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-base font-bold text-foreground mb-3">Cách nấu</h5>
                        <ol className="space-y-3">
                          {selectedRecipe.steps.map((step, index) => (
                            <li key={`${selectedRecipe.id}-${index}`} className="flex gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                {index + 1}
                              </span>
                              <p className="pt-0.5 text-foreground">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
