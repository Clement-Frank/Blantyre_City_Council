"use client";

import { useAuth } from "@/hook/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#3d5a45] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}