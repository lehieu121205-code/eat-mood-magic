import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Navigate } from "react-router-dom";

interface RecipeForm {
  id: string;
  title: string;
  description: string;
  image_url: string;
  time_text: string;
  difficulty: string;
  category: string;
  moods: string;
  steps: string;
}

const emptyForm: RecipeForm = { id: "", title: "", description: "", image_url: "", time_text: "", difficulty: "Dễ", category: "", moods: "", steps: "" };

export default function AdminRecipesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RecipeForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["admin-recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: RecipeForm) => {
      const payload = {
        id: f.id || f.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now(),
        title: f.title,
        description: f.description,
        image_url: f.image_url,
        time_text: f.time_text,
        difficulty: f.difficulty,
        category: f.category,
        moods: f.moods.split(",").map(s => s.trim()).filter(Boolean),
        steps: f.steps.split("\n").filter(Boolean),
      };
      if (editing) {
        const { error } = await supabase.from("recipes").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recipes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
      toast({ title: editing ? "Đã cập nhật món!" : "Đã thêm món mới!" });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditing(false);
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
      toast({ title: "Đã xóa món!" });
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  const openEdit = (r: typeof recipes[0]) => {
    setForm({
      id: r.id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      time_text: r.time_text,
      difficulty: r.difficulty,
      category: r.category,
      moods: (r.moods || []).join(", "),
      steps: (r.steps || []).join("\n"),
    });
    setEditing(true);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditing(false);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý món ăn</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Thêm món</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Sửa món ăn" : "Thêm món mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Tên món</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Mô tả</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div><Label>URL ảnh</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Thời gian</Label><Input value={form.time_text} onChange={e => setForm(f => ({ ...f, time_text: e.target.value }))} placeholder="30 phút" /></div>
                <div><Label>Độ khó</Label><Input value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} placeholder="Dễ / Trung bình / Khó" /></div>
              </div>
              <div><Label>Danh mục</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label>Moods (cách nhau bởi dấu phẩy)</Label><Input value={form.moods} onChange={e => setForm(f => ({ ...f, moods: e.target.value }))} placeholder="vui vẻ, thoải mái" /></div>
              <div><Label>Các bước (mỗi bước 1 dòng)</Label><Textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} rows={5} /></div>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <img src={r.image_url} alt={r.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.category} · {r.difficulty} · {r.time_text}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
