/** SSE 流式处理 - 解析 /chat/conversations/{id}/stream 的 SSE 响应。
 *
 * Protected Region: 前端流式核心。
 */

import { readTokenFromStorage } from "@/lib/api";

interface StreamCallbacks {
  onToken: (token: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export async function streamChat(
  convId: string,
  content: string,
  provider: string,
  model: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const token = readTokenFromStorage();
  let res: Response;
  try {
    res = await fetch(`/api/chat/conversations/${convId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content, provider, model }),
    });
  } catch {
    callbacks.onError("网络请求失败，请检查网络");
    return;
  }

  if (!res.ok) {
    const text = await res.text();
    let msg = `请求失败 (${res.status})`;
    try {
      const data = JSON.parse(text) as { detail?: unknown };
      if (typeof data.detail === "string") msg = data.detail;
    } catch {
      // 忽略解析错误，用默认 msg
    }
    callbacks.onError(msg);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("无法读取响应流");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") {
        callbacks.onDone();
        return;
      }
      try {
        const obj = JSON.parse(data) as { token?: string; error?: string };
        if (obj.error) {
          callbacks.onError(obj.error);
          return;
        }
        if (obj.token) callbacks.onToken(obj.token);
      } catch {
        // 忽略单行解析错误，继续
      }
    }
  }
  callbacks.onDone();
}
