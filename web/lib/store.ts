/** Auth store - Zustand + persist，token 存 localStorage。 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  nickname: string;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  currentCharacterId: string | null;
  currentProvider: string | null;
  currentModel: string | null;
  voiceEnabled: boolean;
  ttsVoice: string;
  setAuth: (token: string, user: User) => void;
  setCurrentCharacter: (id: string) => void;
  setCurrentLlm: (provider: string, model: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setTtsVoice: (voice: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentCharacterId: null,
      currentProvider: null,
      currentModel: null,
      voiceEnabled: true,
      ttsVoice: "zh-CN-XiaoxiaoNeural",
      setAuth: (token, user) => set({ token, user }),
      setCurrentCharacter: (id) => set({ currentCharacterId: id }),
      setCurrentLlm: (provider, model) =>
        set({ currentProvider: provider, currentModel: model }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setTtsVoice: (voice) => set({ ttsVoice: voice }),
      logout: () =>
        set({
          token: null,
          user: null,
          currentCharacterId: null,
          currentProvider: null,
          currentModel: null,
        }),
    }),
    { name: "banyu-auth" }
  )
);
