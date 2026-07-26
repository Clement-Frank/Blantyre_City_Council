"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { marketPerformance } from "@/lib/mock-data";

export default function CollectionStats() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-[#0E0E0B]">Collection Stats</h3>
          <p className="text-xs text-gray-500 mt-0.5">Revenue by market section</p>
        </div>
        <select className="px-3 py-1.5 bg-[#F5F5F0] border border-[#E5E5E0] rounded-lg text-xs text-[#0E0E0B] focus:outline-none focus:ring-2 focus:ring-[#AFE607]/30">
          <option>1 month</option>
          <option>3 months</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1 flex flex-col items-center">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: 67 }, { value: 33 }]} cx="50%" cy="50%" innerRadius={42} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#AFE607" />
                  <Cell fill="#F5F5F0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#0E0E0B]">67%</span>
              <span className="text-[10px] text-gray-500">Collected</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#0E0E0B] mt-2">MWK 546K</p>
          <p className="text-[10px] text-gray-400">21% of target</p>
        </div>

        <div className="col-span-2 sm:col-span-1 flex flex-col items-center">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: 34 }, { value: 66 }]} cx="50%" cy="50%" innerRadius={42} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#0E0E0B" />
                  <Cell fill="#F5F5F0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#0E0E0B]">34%</span>
              <span className="text-[10px] text-gray-500">Compliance</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#0E0E0B] mt-2">MWK 245K</p>
          <p className="text-[10px] text-gray-400">11% of target</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F5F5F0] space-y-2">
        {marketPerformance.slice(0, 3).map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color === "#3d5a45" ? "#0E0E0B" : item.color === "#5a9e8f" ? "#AFE607" : item.color }} />
              <span className="text-xs text-gray-600">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-[#0E0E0B]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}