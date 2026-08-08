/** Edge TTS 播放器 - 调用后端 /api/tts/synthesize 获取 MP3 音频并播放。 */

import { readTokenFromStorage } from "@/lib/api";

export class EdgeTtsPlayer {
  private audio: HTMLAudioElement | null = null;
  private blobUrl: string | null = null;

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
      this.blobUrl = URL.createObjectURL(blob);
      this.audio = new Audio(this.blobUrl);
      this.audio.onended = () => {
        this.cleanup();
        onDone?.();
      };
      this.audio.onerror = () => {
        this.cleanup();
        onDone?.();
      };
      await this.audio.play();
    } catch (err) {
      console.error("TTS 播放失败:", err);
      this.cleanup();
      onDone?.();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
