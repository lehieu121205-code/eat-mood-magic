import { useParams, useNavigate } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Clock, BarChart3, ChefHat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import RecipeReviews from "@/components/RecipeReviews";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy món ăn</h1>
        <Button className="mt-4" onClick={() => navigate("/")}>Về trang chủ</Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", description: "Bạn cần đăng nhập để lưu món ăn.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    try {
      const { error } = await supabase.from("saved_recipes").insert({
        user_id: user.id,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        recipe_image: recipe.image,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Đã lưu rồi", description: "Món này đã có trong danh sách yêu thích!" });
        } else throw error;
      } else {
        toast({ title: "Đã lưu!", description: `${recipe.title} đã được thêm vào danh sách yêu thích.` });
      }
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <img src={recipe.image} alt={recipe.title} className="w-full rounded-2xl shadow-lg object-cover aspect-square" />
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-foreground">{recipe.title}</h1>
          <p className="text-muted-foreground">{recipe.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.time}</span>
            <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> {recipe.difficulty}</span>
          </div>
          <Button onClick={handleSave} className="rounded-full gap-2 shadow-lg" size="lg">
            <Heart className="w-5 h-5" /> Lưu món
          </Button>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-primary" /> Nguyên liệu
        </h2>
        <div className="flex flex-wrap gap-2">
          {recipe.ingredients.map((ing) => (
            <span key={ing} className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">📋 Hướng dẫn nấu</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </span>
              <p className="text-foreground pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}
