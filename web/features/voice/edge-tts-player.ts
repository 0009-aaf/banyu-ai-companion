/** Edge TTS 播放器 - 调用后端 /api/tts/synthesize 获取 MP3 音频并播放。 */

import { readTokenFromStorage } from "@/lib/api";

export class EdgeTtsPlayer {
  private audio: HTMLAudioElement | null = null;

  async speak(text: string, voice: string, onDone?: () => void): Promise<void> {
    if (!text) {
      onDone?.();
      return;
    }
    this.stop();

    const token = readTokenFromStorage();
    try {
      const res = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!res.ok) {
        console.error("TTS 请求失败:", res.status);
        onDone?.();
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      this.audio = new Audio(url);
      this.audio.onended = () => {
        URL.revokeObjectURL(url);
        onDone?.();
      };
      this.audio.onerror = () => {
        URL.revokeObjectURL(url);
        onDone?.();
      };
      await this.audio.play();
    } catch (err) {
      console.error("TTS 播放失败:", err);
      onDone?.();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
  }
}
