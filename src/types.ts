/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SummaryRequest {
  provider: "gemini" | "nvidia";
  transcript: string;
  language: string;
  style: string;
  tone: string;
  additionalPrompt?: string;
}

export interface SummaryResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  transcript: string;
  result: string;
  language: string;
  style: string;
  tone: string;
  provider?: "gemini" | "nvidia";
}
