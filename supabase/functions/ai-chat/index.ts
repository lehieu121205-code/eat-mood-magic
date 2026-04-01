import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, recipeOptions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Bạn là trợ lý nấu ăn AI thông minh, chuyên về ẩm thực Việt Nam. Bạn có thể:
- Gợi ý món ăn dựa trên nguyên liệu có sẵn
- Gợi ý món phù hợp với tâm trạng/cảm xúc
- Chia sẻ công thức nấu ăn chi tiết
- Nhận diện nguyên liệu từ ảnh và gợi ý món
- Đưa ra mẹo nấu ăn hữu ích

Trả lời bằng tiếng Việt, thân thiện và chi tiết. Sử dụng emoji phù hợp.`;

    const recipeSuggestionPrompt =
      mode === "recipe_suggestions" && Array.isArray(recipeOptions) && recipeOptions.length > 0
        ? `\n\nBạn đang ở chế độ gợi ý món từ danh sách có sẵn. Chỉ được chọn đúng 3 món từ danh sách sau, tuyệt đối không tự tạo món mới:\n${recipeOptions
            .map(
              (recipe: { title: string; description: string }, index: number) =>
                `${index + 1}. ${recipe.title}: ${recipe.description}`
            )
            .join("\n")}\n\nHãy trả lời theo dạng markdown đánh số 1, 2, 3. Mỗi món gồm: tên món in đậm, mô tả ngắn, lý do phù hợp. Không đưa nguyên liệu hay cách nấu vì giao diện sẽ hiển thị sau khi người dùng chọn món.`
        : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `${systemPrompt}${recipeSuggestionPrompt}`,
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Hết credit AI, vui lòng nạp thêm." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Không có phản hồi từ AI.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
