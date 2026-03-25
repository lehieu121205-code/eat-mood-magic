import { Link } from "react-router-dom";
import type { Recipe } from "@/data/recipes";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  recipe: Recipe;
  index?: number;
}

export default function RecipeCard({ recipe, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/recipe/${recipe.id}`}>
        <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md">
          <div className="relative overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              {recipe.category}
            </span>
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
              {recipe.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{recipe.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.time}</span>
              <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> {recipe.difficulty}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
