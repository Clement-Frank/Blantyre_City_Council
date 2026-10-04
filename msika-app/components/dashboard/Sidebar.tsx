"use client";

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
  LogOut,
  Key,
  MapPinned,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import CouncilLogo from "@/components/CouncilLogo";

// Route visibility per role. Roles not listed for an item cannot see it.
// `short` is the compact label shown in the mobile bottom tab bar.
const navItems: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  short?: string;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, short: "Home" },
  { label: "Live Map", href: "/dashboard/map", icon: MapPinned, short: "Map" },
  { label: "Vendors", href: "/dashboard/vendors", icon: Users },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  {
    label: "Collectors",
    href: "/dashboard/collectors",
    icon: UserCheck,
    roles: ["Administrator"],
  },
  {
    label: "Supervisors",
    href: "/dashboard/supervisors",
    icon: Shield,
    roles: ["Administrator"],
  },
  {
    label: "Market Center",
    href: "/dashboard/markets",
    icon: Store,
    short: "Market",
  },
  {
    label: "API Management",
    href: "/dashboard/api-management",
    icon: Key,
    roles: ["Administrator"],
  },
  {
    label: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: Shield,
    roles: ["Administrator"],
  },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Prune nav items the current role may not use (admins see everything)
  const visibleNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Desktop sidebar — hidden on mobile, which uses the bottom tab bar */}
      <aside
        className={cn(
          "hidden lg:flex lg:sticky top-0 z-40 h-screen w-[280px] bg-[#0E0E0B] text-white flex-col shadow-xl border-r border-[#1A1A16]"
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
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
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

      {/* Mobile navigation tabs — always visible bottom bar, no hamburger.
          Horizontally scrollable so every role-pruned route stays reachable. */}
      <nav
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E0B] border-t border-[#2A2A24]",
          "shadow-[0_-6px_24px_rgba(0,0,0,0.35)] pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[68px] flex-1 flex-col items-center gap-1 px-2 pt-2.5 pb-2 transition-colors",
                  isActive ? "text-[#AFE607]" : "text-white/45 active:text-white/70"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium leading-none tracking-wide">
                  {item.short ?? item.label}
                </span>
                <span
                  className={cn(
                    "h-0.5 w-6 rounded-full transition-all",
                    isActive ? "bg-[#AFE607]" : "bg-transparent"
                  )}
                />
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="flex min-w-[68px] flex-1 flex-col items-center gap-1 px-2 pt-2.5 pb-2 text-white/45 active:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-medium leading-none tracking-wide">Logout</span>
            <span className="h-0.5 w-6 rounded-full bg-transparent" />
          </button>
        </div>
      </nav>
    </>
  );
}
