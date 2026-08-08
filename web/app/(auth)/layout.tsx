/** 登录/注册页布局 - 居中卡片，暖色背景。 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-rose-50 px-4">
      {children}
    </div>
  );
}
