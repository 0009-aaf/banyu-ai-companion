/** 登录/注册页布局 - 居中卡片，暗色渐变背景。 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a1a] to-[#1a1a3a] px-4">
      {children}
    </div>
  );
}
