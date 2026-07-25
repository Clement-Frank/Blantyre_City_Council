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
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md ml-12 lg:ml-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search vendors, payments, transactions..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 focus:border-[#5a9e8f] transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <Calendar size={16} className="text-[#3d5a45]" />
            <span className="text-sm text-gray-600 font-medium">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>

          <button className="relative p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5a45] to-[#5a9e8f] flex items-center justify-center text-white text-sm font-bold">
              {user ? getInitials(user.fullName) : "??"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.fullName || "Loading..."}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || ""}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}