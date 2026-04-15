import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface SavedRecipe {
  id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_image: string;
}

export default function SavedRecipes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setSaved((data as any) || []);
          setFetching(false);
        });
    }
  }, [user, loading, navigate]);

  const handleDelete = async (id: string) => {
    await supabase.from("saved_recipes").delete().eq("id", id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Đã xóa khỏi danh sách yêu thích" });
  };

  if (loading || fetching) return <div className="text-center py-20 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-foreground mb-8">Món đã lưu</h1>
      {saved.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-4">Chưa có món nào được lưu.</p>
          <Link to="/">
            <Button>Khám phá món ăn</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {saved.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden border-0 shadow-md">
                <Link to={`/recipe/${item.recipe_id}`}>
                  <img src={item.recipe_image} alt={item.recipe_title} className="w-full h-48 object-cover" />
                </Link>
                <CardContent className="p-4 flex items-center justify-between">
                  <Link to={`/recipe/${item.recipe_id}`} className="font-bold text-foreground hover:text-primary transition-colors">
                    {item.recipe_title}
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
