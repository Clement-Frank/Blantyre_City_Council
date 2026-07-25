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
  MapPin,
  Key,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hook/useAuth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Businesses", href: "/dashboard/businesses", icon: Store }, // NEW
  { label: "Vendors", href: "/dashboard/vendors", icon: Users },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Collectors", href: "/dashboard/collectors", icon: UserCheck },
  { label: "Supervisors", href: "/dashboard/supervisors", icon: Shield },
  { label: "Markets", href: "/dashboard/markets", icon: MapPin },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    subItems: [
      { label: "Daily", href: "/dashboard/reports/daily" },
      { label: "Monthly", href: "/dashboard/reports/monthly" },
      { label: "Compliance", href: "/dashboard/reports/compliance" },
      { label: "Collectors", href: "/dashboard/reports/collectors" },
      { label: "Revenue", href: "/dashboard/reports/revenue" },
    ],
  },
  { label: "API Management", href: "/dashboard/api-management", icon: Key }, // NEW
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: Shield }, // NEW
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedReport, setExpandedReport] = useState(true);
  const { user, logout } = useAuth();

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#3d5a45] text-white rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px] bg-gradient-to-b from-[#3d5a45] to-[#2d4335] text-white flex flex-col shadow-xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider leading-tight">BLANTYRE</h1>
              <p className="text-[10px] text-white/70 tracking-wider">CITY COUNCIL</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/50 font-medium">Market Fee System</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const isReports = item.label === "Reports";

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isReports) setExpandedReport(!expandedReport);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#5a9e8f] text-white shadow-lg shadow-[#5a9e8f]/20"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {isReports && (
                    <ChevronRight size={14} className={cn("transition-transform", expandedReport && "rotate-90")} />
                  )}
                </Link>

                {isReports && expandedReport && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                    {item.subItems?.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block px-4 py-2 rounded-lg text-xs transition-all",
                          pathname === sub.href
                            ? "bg-[#5a9e8f]/30 text-white font-medium"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          {user && (
            <div className="px-4 py-3 bg-white/5 rounded-xl">
              <p className="text-xs font-semibold text-white/90">{user.fullName}</p>
              <p className="text-[10px] text-white/50 capitalize">{user.role}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-[#5a9e8f]/20 to-transparent rounded-xl p-4 border border-[#5a9e8f]/20">
            <p className="text-xs font-semibold text-white/90 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-white/60">All systems operational</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}