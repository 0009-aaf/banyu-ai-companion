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

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-base)" }}>
      <main className="flex-1 relative z-10">{children}</main>
      <nav className="flex border-t border-white/10 pb-[env(safe-area-inset-bottom)]" style={{ background: "rgba(10, 10, 26, 0.8)", backdropFilter: "blur(12px)" }}>
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
  );
}
