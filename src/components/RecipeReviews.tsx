import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  recipeId: string;
}

export default function RecipeReviews({ recipeId }: Props) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["recipe-reviews", recipeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipe_reviews")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recipe_reviews").insert({
        recipe_id: recipeId,
        user_id: user!.id,
        rating,
        content: content.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-reviews", recipeId] });
      toast({ title: "Đã gửi đánh giá!" });
      setContent("");
      setRating(5);
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipe_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe-reviews", recipeId] });
      toast({ title: "Đã xóa đánh giá!" });
    },
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 cursor-${interactive ? "pointer" : "default"} transition-colors ${
            star <= (interactive ? (hoverRating || value) : value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Đánh giá</h2>
        {avgRating && (
          <span className="text-sm text-muted-foreground">
            ⭐ {avgRating} ({reviews.length} đánh giá)
          </span>
        )}
      </div>

      {/* Submit form */}
      {user ? (
        <div className="bg-muted/50 rounded-xl p-5 space-y-3">
          <p className="font-semibold text-sm">Đánh giá của bạn</p>
          <StarRating value={rating} interactive />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về món ăn này..."
            rows={3}
          />
          <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-xl p-5 text-center">
          <p className="text-muted-foreground">
            Vui lòng <Link to="/auth" className="text-primary underline font-medium">đăng nhập</Link> để đánh giá món ăn này.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <StarRating value={review.rating} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("vi-VN")}
                  </span>
                  {(user?.id === review.user_id || isAdmin) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(review.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {review.content && <p className="text-sm text-foreground">{review.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
