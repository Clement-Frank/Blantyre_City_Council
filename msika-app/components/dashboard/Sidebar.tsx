"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  UserCheck,
  Shield,
  Store,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Key,
  MapPinned,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import CouncilLogo from "@/components/CouncilLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Live Map", href: "/dashboard/map", icon: MapPinned },
  { label: "Businesses", href: "/dashboard/businesses", icon: Store },
  { label: "Vendors", href: "/dashboard/vendors", icon: Users },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Reminders", href: "/dashboard/reminders", icon: BellRing },
  { label: "Collectors", href: "/dashboard/collectors", icon: UserCheck },
  { label: "Supervisors", href: "/dashboard/supervisors", icon: Shield },
  { label: "Markets", href: "/dashboard/markets", icon: Store },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  { label: "API Management", href: "/dashboard/api-management", icon: Key },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: Shield },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0E0E0B] text-[#AFE607] rounded-lg shadow-lg border border-[#2A2A24]"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px] bg-[#0E0E0B] text-white flex flex-col shadow-xl transition-transform duration-300 border-r border-[#1A1A16]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-[#1A1A16]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F5F0E6] flex items-center justify-center shadow-lg shadow-black/30 ring-1 ring-[#AFE607]/30 overflow-hidden">
              <CouncilLogo className="w-10 h-auto" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider leading-tight text-white">BLANTYRE</h1>
              <p className="text-[10px] text-white/40 tracking-wider">CITY COUNCIL</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/30 font-medium">Market Fee System</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#AFE607] text-[#0E0E0B] shadow-lg shadow-[#AFE607]/20 font-semibold"
                    : "text-white/50 hover:bg-[#1A1A16] hover:text-white"
                )}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1A1A16] space-y-3">
          {user && (
            <div className="px-4 py-3 bg-[#1A1A16] rounded-xl border border-[#2A2A24]">
              <p className="text-xs font-semibold text-white/90">{user.fullName}</p>
              <p className="text-[10px] text-[#AFE607] capitalize">{user.role}</p>
            </div>
          )}

          <div className="bg-[#1A1A16] rounded-xl p-4 border border-[#2A2A24]">
            <p className="text-xs font-semibold text-white/90 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#AFE607] animate-pulse" />
              <span className="text-[11px] text-white/40">All systems operational</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}