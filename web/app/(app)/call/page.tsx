"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CallView } from "@/features/call/call-view";

function CallPageContent() {
  const searchParams = useSearchParams();
  const convId = searchParams.get("convId");
  if (!convId) return <div className="p-4 text-white/50">缺少会话 ID</div>;
  return <CallView convId={convId} />;
}

export default function CallPage() {
  return (
    <Suspense>
      <CallPageContent />
    </Suspense>
  );
}
