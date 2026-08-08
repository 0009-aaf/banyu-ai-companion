"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore, type User } from "@/lib/store";

interface TokenOut {
  access_token: string;
  token_type: string;
  user: User;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("密码至少 8 位");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<TokenOut>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, nickname: nickname || "伴语用户" }),
      });
      setAuth(data.access_token, data.user);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-1">伴语</h1>
      <p className="text-sm text-white/50 mb-6">创建账号</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">昵称（可选）</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="伴语用户"
            className="w-full rounded-lg border border-white/10 glass px-3 py-2 outline-none focus:ring-2 focus:ring-[#f0c958]/40"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 glass px-3 py-2 outline-none focus:ring-2 focus:ring-[#f0c958]/40"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">密码（至少 8 位）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 glass px-3 py-2 outline-none focus:ring-2 focus:ring-[#f0c958]/40"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#f0c958] py-2 font-medium text-white hover:bg-[#f0c958]/90 disabled:opacity-50"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-white/50">
        已有账号？
        <Link href="/login" className="text-[#f0c958]">
          登录
        </Link>
      </p>
    </div>
  );
}
