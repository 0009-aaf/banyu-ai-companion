/** TTS 封装 - Web Speech API SpeechSynthesis（语音输出）。
 *
 * Protected Region: 语音合成控制，易错。
 */

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export class VoiceOutput {
  private supported: boolean;

  constructor() {
    this.supported = isTTSSupported();
  }

  isSupported(): boolean {
    return this.supported;
  }

  hasVoices(): boolean {
    return this.supported && window.speechSynthesis.getVoices().length > 0;
  }

  speak(text: string, onDone?: () => void): void {
    if (!this.supported || !text) {
      onDone?.();
      return;
    }
    this.stop();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onend = () => onDone?.();
    utter.onerror = () => onDone?.();
    // Chrome 需要先确保声音已加载
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        () => window.speechSynthesis.speak(utter),
        { once: true }
      );
      return;
    }
    window.speechSynthesis.speak(utter);
  }

  stop(): void {
    if (!this.supported) return;
    window.speechSynthesis.cancel();
  }
}
