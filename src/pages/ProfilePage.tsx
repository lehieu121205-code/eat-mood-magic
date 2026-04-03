import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [basicInfo, setBasicInfo] = useState<Record<string, string>>({ phone: "", birthday: "", address: "" });
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      const info = (profile.basic_info || {}) as Record<string, string>;
      setBasicInfo({ phone: info.phone || "", birthday: info.birthday || "", address: info.address || "" });
    }
  }, [user, profile, navigate]);

  if (!user) return null;

  const avatarUrl = profile?.avatar_url;
  const initials = (profile?.display_name || user.email || "U").slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Lỗi tải ảnh", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    // Ensure profile exists
    if (!profile) {
      await supabase.from("profiles").insert({ user_id: user.id, avatar_url: urlData.publicUrl, email: user.email });
    } else {
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
    }
    await refreshProfile();
    setUploading(false);
    toast({ title: "Đã cập nhật ảnh đại diện!" });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const payload = { display_name: displayName, bio, basic_info: basicInfo };

    if (!profile) {
      const { error } = await supabase.from("profiles").insert({ user_id: user.id, email: user.email, ...payload });
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }
    await refreshProfile();
    setSaving(false);
    toast({ title: "Đã lưu thông tin cá nhân!" });
  };

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã gửi email xác nhận đến địa chỉ mới!" });
      setNewEmail("");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mật khẩu xác nhận không khớp", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã đổi mật khẩu thành công!" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Trang cá nhân</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:opacity-80">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-lg">{profile?.display_name || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tên hiển thị</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nhập tên hiển thị" />
          </div>
          <div>
            <Label>Giới thiệu ngắn</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Viết vài dòng giới thiệu về bạn..." rows={3} />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input value={basicInfo.phone} onChange={(e) => setBasicInfo(p => ({ ...p, phone: e.target.value }))} placeholder="0123 456 789" />
          </div>
          <div>
            <Label>Ngày sinh</Label>
            <Input type="date" value={basicInfo.birthday} onChange={(e) => setBasicInfo(p => ({ ...p, birthday: e.target.value }))} />
          </div>
          <div>
            <Label>Địa chỉ</Label>
            <Input value={basicInfo.address} onChange={(e) => setBasicInfo(p => ({ ...p, address: e.target.value }))} placeholder="Nhập địa chỉ" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Đổi email</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Email hiện tại: {user.email}</p>
          <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email mới" type="email" />
          <Button onClick={handleChangeEmail} variant="outline">Gửi xác nhận</Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Đổi mật khẩu</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" type="password" />
          <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu mới" type="password" />
          <Button onClick={handleChangePassword} variant="outline">Đổi mật khẩu</Button>
        </CardContent>
      </Card>
    </div>
  );
}
