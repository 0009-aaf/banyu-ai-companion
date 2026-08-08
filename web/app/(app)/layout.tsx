"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

const tabs = [
  { href: "/chat", label: "对话" },
  { href: "/characters", label: "角色" },
  { href: "/diary", label: "日记" },
  { href: "/settings", label: "我的" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.replace("/login");
    }
  }, [mounted, token, router]);

  if (!mounted || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        加载中...
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* 桌面端侧边栏 */}
      <aside
        className="hidden md:flex md:w-60 md:flex-col md:border-r border-white/10"
        style={{ background: "rgba(10,10,26,0.6)", backdropFilter: "blur(12px)" }}
      >
        <div className="p-6">
          <span className="text-xl font-bold text-[#f0c958]">伴语</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                pathname.startsWith(t.href)
                  ? "bg-[#f0c958]/10 font-medium text-[#f0c958]"
                  : "text-white/50 hover:bg-white/5"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-white/5"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* 内容区 + 移动端底部导航 */}
      <div className="flex flex-1 flex-col">
        <main className="relative z-10 flex-1">{children}</main>
        <nav
          className="flex border-t border-white/10 pb-[env(safe-area-inset-bottom)] md:hidden"
          style={{ background: "rgba(10, 10, 26, 0.8)", backdropFilter: "blur(12px)" }}
        >
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 py-3 text-center text-sm transition ${
                pathname.startsWith(t.href) ? "font-medium text-[#f0c958]" : "text-white/50"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
