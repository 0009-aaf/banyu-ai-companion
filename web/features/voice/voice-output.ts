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
    window.speechSynthesis.speak(utter);
  }

  stop(): void {
    if (!this.supported) return;
    window.speechSynthesis.cancel();
  }
}
