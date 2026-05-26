import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

// Explicitly load .env.local first, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { provider, transcript, language, style, tone, additionalPrompt } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ success: false, error: "請貼上會議逐字稿或重點筆記後再重新生成。" });
    }

    // Highly optimized system instruction
    const systemInstruction = `你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。
2. **與會者**：列出參與會議的人員。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容（請使用符合「${style || "條列式"}」的格式與「${tone || "專業商務"}」的口吻呈現）。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **英文翻譯版**：將上述 1~4 點的內容完整翻譯成專業的英文。

請以 Markdown 格式輸出，所有繁體中文部分必須使用台灣習慣的**繁體中文**回覆，不要包含任何額外的問候語或結語。

${additionalPrompt ? `\n⚠️ 【使用者額外指定特殊要求】：\n${additionalPrompt}\n請在產出中特別融入並落實這項特殊要求。` : ""}`;

    if (provider === "nvidia") {
      const nvidiaApiKey = process.env.NVIDIA_API_KEY;
      if (!nvidiaApiKey) {
        return res.status(500).json({
          success: false,
          error: "伺服器端尚未配置 NVIDIA_API_KEY API Key 密鑰。請在環境變數中進行配置。"
        });
      }

      // Call NVIDIA API (OpenAI Compatible)
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaApiKey}`
        },
        body: JSON.stringify({
          model: "minimaxai/minimax-m2.7",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: `以下是需要你整理分析並翻譯的會議逐字稿內容：\n\n${transcript}` }
          ],
          temperature: 0.35,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `NVIDIA API responded with status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content;

      if (!resultText) {
        return res.status(500).json({ success: false, error: "AI 生成結果為空，請調整輸入內容後重試。" });
      }

      return res.status(200).json({ success: true, result: resultText });
    } else {
      // Default to Google Gemini (gemini-2.5-flash-lite)
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({
          success: false,
          error: "伺服器端尚未配置 GEMINI_API_KEY API Key 密鑰。請在環境變數中進行配置。"
        });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [
          { text: `以下是需要你整理分析並翻譯的會議逐字稿內容：\n\n${transcript}` }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.35,
        }
      });

      const resultText = response.text;
      if (!resultText) {
        return res.status(500).json({ success: false, error: "AI 生成結果為空，請調整輸入內容後重試。" });
      }

      return res.status(200).json({ success: true, result: resultText });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "呼叫 AI 模組時發生未知錯誤，請稍後再試。"
    });
  }
}
