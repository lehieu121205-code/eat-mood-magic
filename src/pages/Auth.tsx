import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else if (!isLogin) {
      toast({ title: "Thành công!", description: "Kiểm tra email để xác nhận tài khoản." });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🍳</div>
            <CardTitle className="text-2xl font-black">{isLogin ? "Đăng nhập" : "Đăng ký"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full rounded-full font-bold" size="lg" disabled={loading}>
                {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
                {isLogin ? "Đăng ký" : "Đăng nhập"}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
