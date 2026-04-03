import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Link2 } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminIngredientsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Assign ingredient to recipe state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignIngredientId, setAssignIngredientId] = useState("");
  const [assignRecipeId, setAssignRecipeId] = useState("");
  const [assignNote, setAssignNote] = useState("");

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["admin-ingredients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ingredients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["admin-recipes-for-assign"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("ingredients").update({ name, description: desc }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ingredients").insert({ name, description: desc });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ingredients"] });
      toast({ title: editId ? "Đã cập nhật!" : "Đã thêm nguyên liệu!" });
      setDialogOpen(false);
      setName("");
      setDesc("");
      setEditId(null);
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ingredients"] });
      toast({ title: "Đã xóa nguyên liệu!" });
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recipe_ingredients").insert({
        recipe_id: assignRecipeId,
        ingredient_id: assignIngredientId,
        note: assignNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Đã gán nguyên liệu vào món!" });
      setAssignDialogOpen(false);
      setAssignNote("");
    },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  const openEdit = (i: typeof ingredients[0]) => {
    setEditId(i.id);
    setName(i.name);
    setDesc(i.description || "");
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditId(null);
    setName("");
    setDesc("");
    setDialogOpen(true);
  };

  const openAssign = (ingredientId: string) => {
    setAssignIngredientId(ingredientId);
    setAssignRecipeId("");
    setAssignNote("");
    setAssignDialogOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý nguyên liệu</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Thêm</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Sửa nguyên liệu" : "Thêm nguyên liệu"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tên</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Mô tả</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assign dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gán nguyên liệu vào món</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Chọn món</Label>
              <Select value={assignRecipeId} onValueChange={setAssignRecipeId}>
                <SelectTrigger><SelectValue placeholder="Chọn món..." /></SelectTrigger>
                <SelectContent>
                  {recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ghi chú (lượng dùng...)</Label><Input value={assignNote} onChange={e => setAssignNote(e.target.value)} placeholder="VD: 200g" /></div>
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending} className="w-full">
              {assignMutation.isPending ? "Đang gán..." : "Gán"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="space-y-2">
          {ingredients.map(i => (
            <Card key={i.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex-1">
                  <p className="font-semibold">{i.name}</p>
                  {i.description && <p className="text-sm text-muted-foreground">{i.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openAssign(i.id)} title="Gán vào món"><Link2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
