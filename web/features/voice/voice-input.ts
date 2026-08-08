/** ASR 封装 - Web Speech API SpeechRecognition（语音输入）。
 *
 * Protected Region: 浏览器兼容性处理，易错。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function isASRSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export interface ASRHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (msg: string) => void;
  onEnd: () => void;
}

export class VoiceInput {
  private rec: any = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private handlers: ASRHandlers | null = null;

  isSupported(): boolean {
    return isASRSupported();
  }

  start(handlers: ASRHandlers, maxSeconds = 60): void {
    if (!this.isSupported()) {
      handlers.onError("浏览器不支持语音识别");
      return;
    }
    this.stop();
    this.handlers = handlers;

    const Ctor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      handlers.onError("语音识别初始化失败");
      return;
    }
    this.rec = new Ctor();
    this.rec.continuous = false;
    this.rec.interimResults = true;
    this.rec.lang = "zh-CN";

    this.rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0]?.transcript ?? "";
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        this.handlers.onFinal(final);
      } else if (interim) {
        this.handlers.onInterim(interim);
      }
    };

    this.rec.onerror = (e: any) => {
      const err = e?.error ?? "unknown";
      this.handlers?.onError(err === "no-speech" ? "没听清，再说一次" : `语音识别错误: ${err}`);
    };

    this.rec.onend = () => {
      this.clearTimer();
      this.handlers?.onEnd();
    };

    try {
      this.rec.start();
      this.timer = setTimeout(() => this.stop(), maxSeconds * 1000);
    } catch {
      handlers.onError("语音识别启动失败");
    }
  }

  stop(): void {
    this.clearTimer();
    if (this.rec) {
      try {
        this.rec.stop();
      } catch {
        // ignore
      }
      this.rec = null;
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
