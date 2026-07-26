"use client";

import { Wallet, Users, Receipt, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { statsData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  wallet: Wallet,
  users: Users,
  receipt: Receipt,
  shield: ShieldCheck,
};

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {statsData.map((stat, idx) => {
        const Icon = iconMap[stat.icon];
        const isUp = stat.trend === "up";

        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#F5F5F0] rounded-xl">
                <Icon size={20} className="text-[#0E0E0B]" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                  isUp ? "bg-[#AFE607]/15 text-[#0E0E0B]" : "bg-red-50 text-red-600"
                )}
              >
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? "+" : ""}
                {stat.subtext.split(" ")[0].replace(/[+%]/g, "")}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#0E0E0B] mb-1">{stat.value}</h3>
            <p className="text-xs text-gray-500">{stat.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}