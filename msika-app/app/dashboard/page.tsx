"use client";

import { useAuth } from "@/hooks/useAuth";
import StatsCards from "@/components/dashboard/StatsCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import CollectionStats from "@/components/dashboard/CollectionStats";
import Link from "next/link";
import { UserPlus, Receipt, FileText } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.fullName || "Administrator"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/vendors/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
          >
            <UserPlus size={16} />
            Register Vendor
          </Link>
        </div>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <CollectionStats />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentPayments />
        </div>

        <div className="bg-gradient-to-br from-[#3d5a45] to-[#2d4335] rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-base font-bold mb-1">Quick Actions</h3>
          <p className="text-xs text-white/60 mb-5">Common administrative tasks</p>

          <div className="space-y-3">
            <Link href="/dashboard/vendors/new" className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#5a9e8f] flex items-center justify-center text-xs font-bold">
                <UserPlus size={14} />
              </div>
              <div>
                <p className="text-sm font-medium">Register Vendor</p>
                <p className="text-[10px] text-white/50">Add new vendor to system</p>
              </div>
            </Link>

            <Link href="/dashboard/payments" className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#5a9e8f] flex items-center justify-center text-xs font-bold">
                <Receipt size={14} />
              </div>
              <div>
                <p className="text-sm font-medium">Verify Payment</p>
                <p className="text-[10px] text-white/50">Check vendor payment status</p>
              </div>
            </Link>

            <Link href="/dashboard/reports/daily" className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#5a9e8f] flex items-center justify-center text-xs font-bold">
                <FileText size={14} />
              </div>
              <div>
                <p className="text-sm font-medium">Generate Report</p>
                <p className="text-[10px] text-white/50">Daily revenue summary</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}