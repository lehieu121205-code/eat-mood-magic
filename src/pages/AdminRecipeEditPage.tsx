import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

export default function AdminRecipeEditPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: recipes = [] } = useQuery({
    queryKey: ["admin-recipes-edit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });

  const selected = recipes.find(r => r.id === selectedId);

  const [description, setDescription] = useState("");
  const [timeText, setTimeText] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [steps, setSteps] = useState("");

  const loadRecipe = (id: string) => {
    setSelectedId(id);
    const r = recipes.find(x => x.id === id);
    if (r) {
      setDescription(r.description);
      setTimeText(r.time_text);
      setDifficulty(r.difficulty);
      setCategory(r.category);
      setImageUrl(r.image_url);
      setSteps((r.steps || []).join("\n"));
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recipes").update({
        description,
        time_text: timeText,
        difficulty,
        category,
        image_url: imageUrl,
        steps: steps.split("\n").filter(Boolean),
      }).eq("id", selectedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recipes-edit"] });
      toast({ title: "Đã cập nhật món!" });
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cập nhật món</h1>

      <div>
        <Label>Chọn món để cập nhật</Label>
        <Select value={selectedId} onValueChange={loadRecipe}>
          <SelectTrigger><SelectValue placeholder="Chọn món..." /></SelectTrigger>
          <SelectContent>
            {recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div><Label>Mô tả</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Thời gian</Label><Input value={timeText} onChange={e => setTimeText(e.target.value)} /></div>
              <div><Label>Độ khó</Label><Input value={difficulty} onChange={e => setDifficulty(e.target.value)} /></div>
            </div>
            <div><Label>Danh mục</Label><Input value={category} onChange={e => setCategory(e.target.value)} /></div>
            <div><Label>URL ảnh</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></div>
            {imageUrl && <img src={imageUrl} alt="Preview" className="w-40 h-40 rounded-lg object-cover" />}
            <div><Label>Các bước nấu (mỗi bước 1 dòng)</Label><Textarea value={steps} onChange={e => setSteps(e.target.value)} rows={6} /></div>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
