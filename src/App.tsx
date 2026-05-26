/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Languages, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  History, 
  Trash2, 
  Clock, 
  Briefcase, 
  Settings, 
  Layers, 
  RefreshCw, 
  FileCode,
  BookOpen,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import Markdown from "react-markdown";
import { SummaryRequest, SummaryResponse, HistoryItem } from "./types";

// 內建的高體驗逼真會議逐字稿範例
const EXAMPLES = [
  {
    id: "ex-1",
    title: "AGI 智慧相機行銷會議",
    badge: "跨部門商務",
    description: "混合中英口語、涉及時程、KOL預算、跨部門合約審批的經典商務會議",
    transcript: `張總 (總經理)：大家早。今天主要來對一下那個 AI 智慧相機的 AGI 模組，還有第三季的 launch 規劃。
阿明 (產品經理)：好的，那我先 update 一下進度。目前 AGI 臉部辨識演算法已經優化到 99.2% 準確度，在邊緣端 edge compute 速度大概是 30ms，應該是過關了。但是目前跟後端 server synchronization 的部分還有一點 lag，主要是 websocket 斷線重連的機制還在 debug。
Emily (行銷總監)：阿明，那這個 AGI SDK 大約什麼時候可以 stable？因為我們 marketing 需要在 6 月 15 號前上架預熱網頁，裡面要有真實 API 的調用效果展示。還有，Joanne 這次是不是要把北美市場的 PR 材料也一起準備？
Joanne (北美推廣)：是的 Emily。北美這邊的 PR 新聞稿我已經草擬好了，但我需要等阿明把最新測試數據給我。阿明，你能在 6 月 5 號前把 AGI 的 final benchmark report pass 給我嗎？
阿明：可以，6月5號中午前我彙整好寄給妳。
張總：很好。那我提醒一下，行銷預算這一次要控制在 5 萬美元以內，Joanne 北美推廣那邊的 KOL 合作案，要請財務部 Vivian 幫忙審查合約。Vivian，妳下禮拜三 (6月3號) 之前可以完成合約審查嗎？
Vivian (財務)：沒問題，收到合約後我兩天內就會回覆意見，預計下週三前一定能完成。
張總：好，那今天會議就到這。阿明繼續把 AGI 重連機制搞定，Joanne 跟 Emily 對齊預熱網頁時程，大家辛苦了。`
  },
  {
    id: "ex-2",
    title: "微服務與資安討論會",
    badge: "技術架構",
    description: "涵蓋高併發、資料庫複寫、零信任資安認證與備援機制的深水區技術會談",
    transcript: `Leo (架構師)：我們今天來 Review 把舊有的 Monolith 資料庫遷移到 Cloud SQL (ScyllaDB / PostgreSQL) 複合架構的方案。目前最大的 concern 是在於 Zero-downtime 遷移。
Eva (研發主管)：對，我建議在 cutover 階段採用 Double Writing (雙寫機制) 運作兩週，同時用 Kafka 來做數據同步的排程跟衝突校正。
Ken (Security)：Eva 的方案是不錯，但 Kafka 傳輸包含敏感的個人隱私 PII 數據。我們必須啟用 TLS Encrpytion，並且所有 payload 都要進一步做 AES-256 加密。另外，認證授權必須接入 IAM & OAuth 服務，落實零信任 (Zero Trust) 原則。
Leo：沒錯，這是一定要的。Ken，你能協助在 6 月 10 號前審查完並核准加密與 IAM配置證書嗎？
Ken：沒問題，下週五 (6 月 5 號) 我可以先出第一版安全性分析與修正合規草案給你們。
Eva：另外就是大流量併發的問題，預期 618 購物節會有平常 5 到 8 倍的 QPS，我們前端 CDN 必須啟用 Redis 進行邊緣快取，並把 Read Replica (唯讀副本) 加到 4 個節點。
Leo：贊同，阿亮那邊的運維團隊需要配合在 6 月 12 號前做一次完整的模擬壓力測試 (Chaos Performance Test)。我等一下開張 Jira 票指派給阿亮。今天先到這裡，謝謝大家。`
  }
];

// Loading 期間的秘書思維日誌
const LOADING_STEPS = [
  "🔍 正在深入閱讀與解析您貼上的會議內容...",
  "🧠 正在辨識發言代表、對齊專利與技術縮寫...",
  "📊 正在建立核心論項、核心對話脈絡骨架...",
  "🌐 正在套用 Gemini 3.5 AI 翻譯引擎...",
  "📝 精密提煉待辦事項（主責人、任務與時效）...",
  "💡 正在整合專屬速記洞察、評估專案潛在風險...",
  "✨ 正在美化 Markdown 專業商務排版結構..."
];

export default function App() {
  // 輸入與配置設定狀態
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("台灣繁體中文 🇹🇼");
  const [style, setStyle] = useState("詳細重點逐條 📋");
  const [tone, setTone] = useState("專業商務 💼");
  const [additionalPrompt, setAdditionalPrompt] = useState("");

  // 執行與結果狀態
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // 歷史紀錄狀態
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // UI 輔助狀態
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [showGuide, setShowGuide] = useState(false);

  // 讀取歷史
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_meeting_history");
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
    } catch (e) {
      console.error("無法載入歷史紀錄", e);
    }
  }, []);

  // Loading 輪播
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2400);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // 儲存至本地歷史
  const saveToHistory = (newResult: string, originalTranscript: string, lang: string, sty: string, tn: string) => {
    try {
      let title = "AI 會議整理";
      const match = newResult.match(/^#\s+(.+)$/m);
      if (match && match[1]) {
        title = match[1].trim();
      } else {
        title = `整理記錄 - ${new Date().toLocaleDateString("zh-TW", { month: "short", day: "numeric" })} ${new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`;
      }

      const newItem: HistoryItem = {
        id: `hist-${Date.now()}`,
        title,
        timestamp: new Date().toLocaleString("zh-TW"),
        transcript: originalTranscript,
        result: newResult,
        language: lang,
        style: sty,
        tone: tn
      };

      const updated = [newItem, ...historyList].slice(0, 50);
      setHistoryList(updated);
      localStorage.setItem("ai_meeting_history", JSON.stringify(updated));
    } catch (e) {
      console.error("無法儲存歷史紀錄", e);
    }
  };

  // 刪除特定歷史
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = historyList.filter((item) => item.id !== id);
      setHistoryList(updated);
      localStorage.setItem("ai_meeting_history", JSON.stringify(updated));
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null);
        setResult("");
      }
    } catch (err) {
      console.error("無法刪除歷史紀錄", err);
    }
  };

  // 送出助理生成與翻譯
  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("請先在左側輸入框中貼上會議逐字稿或重點筆記。");
      return;
    }

    setError("");
    setLoading(true);
    setResult("");
    setSelectedHistoryId(null);

    try {
      const reqBody: SummaryRequest = {
        transcript,
        language,
        style,
        tone,
        additionalPrompt: additionalPrompt.trim() || undefined
      };

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });

      const data: SummaryResponse = await response.json();

      if (response.ok && data.success && data.result) {
        setResult(data.result);
        saveToHistory(data.result, transcript, language, style, tone);
      } else {
        setError(data.error || "伺服器分析失敗，請檢查 API 與 System Instructions 功能設定。");
      }
    } catch (err: any) {
      setError("與後端伺服器通訊錯誤，請確認 Server.ts 連線狀態：(" + (err?.message || "網路連線異常") + ")");
    } finally {
      setLoading(false);
    }
  };

  // 拷貝
  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("複製失敗", err);
    }
  };

  // 下載 Markdown 模組
  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    let filename = "AI_會議記錄與翻譯.md";
    const headerMatch = result.match(/^#\s+(.+)$/m);
    if (headerMatch && headerMatch[1]) {
      filename = `${headerMatch[1].trim().replace(/[\\/:*?"<>|]/g, "_")}.md`;
    }
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 快速加載範例
  const loadExample = (exTranscript: string) => {
    setTranscript(exTranscript);
    setError("");
    setActiveTab("edit");
  };

  // 載入歷史
  const selectHistory = (item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setResult(item.result);
    setTranscript(item.transcript);
    setLanguage(item.language);
    setStyle(item.style);
    setTone(item.tone);
    setError("");
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      {/* Sleek Header Section */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              AI 會議記錄生成與翻譯
              <span className="font-mono text-[9px] uppercase tracking-wider font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">SaaS Suite</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-500 font-medium">系統狀態：運行中</span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="h-4 w-4" />
            使用說明
          </button>
          <div className="px-3.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-full hover:bg-slate-800 transition-colors select-none">
            Gemini 3.5 Ready
          </div>
        </div>
      </header>

      {/* Main Workspace (Double Columns - Left Fixed / Right Auto-fit) */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Column: Input Panel & Configuration (Fixed 440px wide) */}
        <div className="w-[440px] flex flex-col gap-5 shrink-0 h-full overflow-hidden">
          
          {/* Tabs Selector for Input Edit vs Local History */}
          <div className="bg-slate-100 p-1 rounded-xl flex shrink-0">
            <button
              id="tab-edit"
              onClick={() => setActiveTab("edit")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "edit"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> 編輯與輸入
            </button>
            <button
              id="tab-history"
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="h-3.5 w-3.5" /> 歷史存檔
              {historyList.length > 0 && (
                <span className="absolute right-3.5 bg-indigo-600 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {historyList.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200/85 shadow-xs flex flex-col overflow-hidden">
            {activeTab === "history" ? (
              /* System History Area */
              <div className="flex-grow flex flex-col overflow-hidden p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-slate-400" /> 本地存檔歷史
                  </span>
                  {historyList.length > 0 && (
                    <button
                      id="clear-all-history"
                      onClick={() => {
                        if (confirm("確認清除所有存檔記錄嗎？此步驟無法復原。")) {
                          setHistoryList([]);
                          localStorage.removeItem("ai_meeting_history");
                          setSelectedHistoryId(null);
                          setResult("");
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      清空全部記錄
                    </button>
                  )}
                </div>

                <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                  {historyList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 text-slate-400">
                      <Clock className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">尚無任何歷史會議記錄</p>
                      <p className="text-[10px] mt-1 text-slate-400">當您完成 AI 生成後將會在這裡自動儲存備份</p>
                    </div>
                  ) : (
                    historyList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => selectHistory(item)}
                        className={`group p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedHistoryId === item.id
                            ? "bg-slate-50 border-slate-300 shadow-2xs"
                            : "bg-white border-slate-150 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 flex-1 group-hover:text-indigo-600">
                            {item.title}
                          </h4>
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                          <span>{item.timestamp}</span>
                          <span>•</span>
                          <span className="text-slate-500">{item.language}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* System Edit Input Area */
              <div className="flex-grow flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    會議逐字稿內容 (貼上區)
                  </span>
                  <div className="flex items-center gap-2">
                    {transcript && (
                      <button 
                        onClick={() => setTranscript("")}
                        className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        清空
                      </button>
                    )}
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold font-mono">
                      {transcript.length} 字
                    </span>
                  </div>
                </div>

                <textarea
                  id="transcript-input"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                  className="flex-grow p-4.5 resize-none text-xs text-slate-600 leading-relaxed focus:outline-hidden placeholder:text-slate-300"
                  placeholder="請在此處貼上您的會議逐字稿、混雜中英文的對談重點或是錄音文字..."
                />

                {/* Quick Examples Badges Strip */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">載入範例:</span>
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => loadExample(ex.transcript)}
                      className="text-[10px] bg-white border border-slate-200/80 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-md cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      {ex.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Settings Parameters Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3.5 shrink-0">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-slate-400" /> 系統指令與變更參數
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Languages className="h-3 w-3" /> 目標翻譯語系</label>
                <select
                  id="select-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-hidden hover:bg-slate-100/50 cursor-pointer"
                >
                  <option>台灣繁體中文 🇹🇼</option>
                  <option>English (US) 🇺🇸</option>
                  <option>日本語 🇯🇵</option>
                  <option>한국어 🇰🇷</option>
                  <option>Español 🇪🇸</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Layers className="h-3 w-3" /> 筆記結構風格</label>
                <select
                  id="select-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-hidden hover:bg-slate-100/50 cursor-pointer"
                >
                  <option>詳細重點逐條 📋</option>
                  <option>精簡高管摘要 🎯</option>
                  <option>具體行動導向 📝</option>
                  <option>QA焦點問答 ❓</option>
                </select>
              </div>
            </div>

            {/* Custom Extra Instruction Prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> 客製化特定要求 (選填)
              </label>
              <input
                id="additional-prompt"
                type="text"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="例：強調財務安全合規、突出待辦事項負責人"
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>
          </div>

          {/* Sleek Action Trigger Button */}
          <div className="shrink-0 flex flex-col gap-2">
            {error && (
              <div className="bg-rose-50 border border-rose-150 p-2.5 rounded-xl text-[11px] text-rose-600 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <button
              id="submit-generate"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  AI 秘書正深度解構重組與翻譯中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  生成會議記錄與翻譯
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: AI Output Output Area (Fits remaining space) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/85 shadow-xs flex flex-col overflow-hidden">
            
            {/* Header Control Panel inside Output */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                AI 重構報告成果
              </span>

              {/* Action Buttons */}
              {result && !loading && (
                <div className="flex items-center gap-2">
                  <button
                    id="copy-result"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-bold">複製成功</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>一鍵複製</span>
                      </>
                    )}
                  </button>
                  <button
                    id="download-result"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100/50 transition-colors cursor-pointer active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-500" />
                    <span>下載 Markdown</span>
                  </button>
                </div>
              )}
            </div>

            {/* Render Area Card Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
              
              {showGuide && (
                /* Interactive Help Banner */
                <div className="mb-6 p-4 bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-xl relative">
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="absolute top-2 right-2.5 text-xs text-indigo-400 hover:text-indigo-600 cursor-pointer"
                  >
                    ✕
                  </button>
                  <h4 className="text-xs font-bold mb-1 flex items-center gap-1">💡 系統使用說明：</h4>
                  <ul className="text-[11px] list-disc list-inside space-y-1 text-slate-600">
                    <li>您可以直接將 Microsoft Teams、Zoom 或者是語音速記生成的凌亂逐字稿貼在左側。</li>
                    <li>設定語系後，軟體將自動調用 API 對齊專利術語與上下文，高效率提煉商業行動方案。</li>
                    <li>支援一鍵複製與匯出標準 Markdown 檔案，隨時發布至 Notion、Jira、Slack 等平台。</li>
                  </ul>
                </div>
              )}

              {loading ? (
                /* Dynamic Loading Screen with Simulated Steps Roller */
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-indigo-50 animate-ping"></div>
                    <div className="relative bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white p-4.5 rounded-full shadow-md">
                      <Sparkles className="h-6.5 w-6.5 animate-pulse" />
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">雲端 AGI 分析引擎運算中</h3>
                  
                  <div className="h-6 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingStepIndex}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[11px] text-indigo-600 font-semibold"
                      >
                        {LOADING_STEPS[loadingStepIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              ) : result ? (
                /* Pretty Markdown Rendered Content */
                <div className="flex-1">
                  
                  {/* Metadata Config Badge Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-5 pb-3.5 border-b border-indigo-50/80">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 shrink-0">
                      <Check className="h-2.5 w-2.5" /> 智能建構完成
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-mono">
                      【{language}】
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-mono">
                      【{style}】
                    </span>
                  </div>

                  <div className="markdown-body text-left">
                    <Markdown>{result}</Markdown>
                  </div>
                </div>
              ) : (
                /* Initial Empty State Card Layout */
                <div className="flex-grow flex flex-col items-center justify-center text-center py-20">
                  <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl mb-4 border border-slate-100/50">
                    <BookOpen className="h-7 w-7 text-indigo-500/80" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1.5">等待啟動 AI 記錄分析</h3>
                  <p className="text-slate-400 text-[11px] max-w-sm leading-relaxed mb-6">
                    請至左側功能板塊貼上會議文檔，或選取預載範例。確認右下方的功能參數後，即可按下按鈕開始。
                  </p>

                  <div className="grid grid-cols-3 gap-3.5 w-full max-w-md text-left mt-2">
                    <div className="p-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Check className="h-3 w-3 text-indigo-500" />
                        自動提煉待辦
                      </span>
                      <p className="text-slate-400 text-[9px] leading-relaxed">辨析主責人、行動方案、時程截止排程。</p>
                    </div>
                    <div className="p-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Check className="h-3 w-3 text-indigo-500" />
                        台灣繁體優化
                      </span>
                      <p className="text-slate-400 text-[9px] leading-relaxed">對齊台灣商務、行銷學術慣用語言用詞習慣。</p>
                    </div>
                    <div className="p-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Check className="h-3 w-3 text-indigo-500" />
                        風險洞察警示
                      </span>
                      <p className="text-slate-400 text-[9px] leading-relaxed">偵測上下文中的潛在技術延遲或溝通斷點。</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* Sleek Analytics Footer Bar */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200/80 px-8 flex items-center justify-between shrink-0 select-none z-10">
        <div className="text-[9px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5">
          <span>Powered by Gemini 3.5 & Tailwind CSS</span>
          <span>•</span>
          <span>Security Encripted SSL Edge</span>
        </div>
        <div className="flex gap-5">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <span className="font-bold text-slate-400">API 延時:</span> 
            <span className="text-emerald-600 font-bold">218ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <span className="font-bold text-slate-400">分析額度:</span> 
            <span className="text-indigo-600 font-bold">100% 剩餘</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
