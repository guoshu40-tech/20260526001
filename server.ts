/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // AI 總結與翻譯 API 路由
  app.post("/api/summary", async (req, res) => {
    try {
      const { transcript, language, style, tone, additionalPrompt } = req.body;

      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ success: false, error: "請貼上會議逐字稿或重點筆記後再重新生成。" });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ 
          success: false, 
          error: "伺服器端尚未配置 GEMINI_API_KEY API Key 密鑰。請前往 AI Studio UI 中的 [Settings > Secrets] 配置密鑰。" 
        });
      }

      // 初始化 Google GenAI SDK
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // 設定高度優化的 System Instruction 與 Prompt 架構
      const systemInstruction = `你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。
2. **與會者**：列出參與會議的人員。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容（請使用符合「${style || "條列式"}」的格式與「${tone || "專業商務"}」的口吻呈現）。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **英文翻譯版**：將上述 1~4 點的內容完整翻譯成專業的英文。

請以 Markdown 格式輸出，所有繁體中文部分必須使用台灣習慣的**繁體中文**回覆，不要包含任何額外的問候語或結語。

${additionalPrompt ? `\n⚠️ 【使用者額外指定特殊要求】：\n${additionalPrompt}\n請在產出中特別融入並落實這項特殊要求。` : ""}`;

      // 呼叫 Gemini 3.5 Flash (基本 text Tasks 首選模型)
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: `以下是需要你整理分析並翻譯的會議逐字稿內容：\n\n${transcript}` }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.35, // 較低的溫度可以提供更穩定的結構與邏輯，不易產生不合理的幻覺
        }
      });

      const resultText = response.text;
      if (!resultText) {
        return res.status(500).json({ success: false, error: "AI 生成結果為空，請調整輸入內容後重試。" });
      }

      return res.json({ success: true, result: resultText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error?.message || "呼叫 AI 模組時發生未知錯誤，請稍後再試。" 
      });
    }
  });

  // Vite 開發模式 / 靜態資源生產模式設定
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
