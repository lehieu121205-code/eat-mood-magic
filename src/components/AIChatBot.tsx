import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Xin chào! 🍳 Tôi là trợ lý nấu ăn AI. Bạn có thể hỏi tôi về công thức, mẹo bếp, hoặc upload ảnh nguyên liệu để tôi gợi ý món ăn!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    const userMsg: Message = { role: "user", content: text, image: imageBase64 };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
          if (m.image) {
            return {
              role: m.role,
              content: [
                { type: "text", text: m.content || "Phân tích ảnh nguyên liệu này và gợi ý món ăn." },
                { type: "image_url", image_url: { url: m.image } },
              ],
            };
          }
          return { role: m.role, content: m.content };
        });

      const resp = await supabase.functions.invoke("ai-chat", {
        body: { messages: apiMessages },
      });

      if (resp.error) throw resp.error;
      const data = resp.data;
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      sendMessage("Phân tích ảnh nguyên liệu này và gợi ý món ăn phù hợp.", base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          "bg-primary text-primary-foreground hover:scale-110"
        )}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="font-bold text-sm">Trợ lý Nấu ăn AI</h3>
              <p className="text-xs opacity-80">Hỏi gì về nấu ăn cũng được!</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.image && (
                    <img src={msg.image} alt="uploaded" className="w-full rounded-lg mb-2 max-h-40 object-cover" />
                  )}
                  <div className="prose prose-sm max-w-none [&_p]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage(input)}
              placeholder="Hỏi về nấu ăn..."
              className="flex-1 bg-muted border-0"
              disabled={loading}
            />
            <Button size="icon" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
