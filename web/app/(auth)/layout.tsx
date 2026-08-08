/** 登录/注册页布局 - 居中卡片，暗色渐变背景 + 萤火星空粒子。 */

import { ParticleBackground } from "@/components/particle-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a1a] to-[#1a1a3a] px-4">
      <ParticleBackground type="firefly" count={25} />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
