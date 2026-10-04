"use client";

import { Search, Bell, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#E5E5E0] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search vendors, payments, transactions..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F0] border border-[#E5E5E0] rounded-xl text-sm text-[#0E0E0B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AFE607]/30 focus:border-[#AFE607] transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#F5F5F0] rounded-xl border border-[#E5E5E0]">
            <Calendar size={16} className="text-[#0E0E0B]" />
            <span className="text-sm text-[#0E0E0B] font-medium">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>

          <button className="relative p-2.5 bg-[#F5F5F0] rounded-xl border border-[#E5E5E0] hover:bg-[#E5E5E0] transition-colors">
            <Bell size={18} className="text-[#0E0E0B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#AFE607] rounded-full border-2 border-white" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-[#E5E5E0]">
            <div className="w-9 h-9 rounded-full bg-[#0E0E0B] flex items-center justify-center text-[#AFE607] text-sm font-bold">
              {user ? getInitials(user.fullName) : "??"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#0E0E0B]">{user?.fullName || "Loading..."}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || ""}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}