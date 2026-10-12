"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import CouncilLogo from "@/components/CouncilLogo";

// Route visibility per role. Roles not listed for an item cannot see it.
// - Desktop: sidebar shows every module the role may use.
// - Mobile: bottom tab bar shows the 4 core day-to-day modules, and everything
//   else lives in the slide-up "More" drawer. The drawer never overlays the
//   bottom tab bar, and content padding keeps the map clear of the bar.
const navItems: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  short?: string;
  core?: boolean;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, short: "Home", core: true },
  { label: "Live Map", href: "/dashboard/map", icon: MapPinned, short: "Map", core: true },
  { label: "Vendors", href: "/dashboard/vendors", icon: Users, short: "Vendors", core: true },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt, short: "Pay", core: true },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Collectors", href: "/dashboard/collectors", icon: UserCheck, roles: ["Administrator"] },
  { label: "Supervisors", href: "/dashboard/supervisors", icon: Shield, roles: ["Administrator"] },
  { label: "Markets", href: "/dashboard/markets", icon: Store, short: "Markets", core: true },
  { label: "API Management", href: "/dashboard/api-management", icon: Key, roles: ["Administrator"] },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: Shield, roles: ["Administrator"] },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Prune nav items the current role may not use (admins see everything)
  const visibleNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  // Mobile bottom bar: core modules only (max 4) + More button
  const coreNav = visibleNav.filter((item) => item.core).slice(0, 4);
  const drawerNav = visibleNav;

  // Close the drawer when navigating
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Header's menu button opens this drawer via a window event
  useEffect(() => {
    const open = () => setDrawerOpen(true);
    window.addEventListener("msika:open-nav", open);
    return () => window.removeEventListener("msika:open-nav", open);
  }, []);

  // Prevent background scrolling while the drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden lg:flex lg:sticky top-0 z-40 h-screen w-[280px] bg-[#0E0E0B] text-white flex-col shadow-xl border-r border-[#1A1A16]">
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive(item.href)
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

      {/* ===== Mobile: compact bottom tab bar (core modules + More) ===== */}
      <nav
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[1100] bg-[#0E0E0B] border-t border-[#2A2A24]",
          "shadow-[0_-6px_24px_rgba(0,0,0,0.35)] pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex">
          {coreNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pt-2.5 pb-2 transition-colors",
                  active ? "text-[#AFE607]" : "text-white/45 active:text-white/70"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-medium leading-none tracking-wide truncate max-w-full">
                  {item.short ?? item.label}
                </span>
                <span
                  className={cn(
                    "h-0.5 w-6 rounded-full transition-all",
                    active ? "bg-[#AFE607]" : "bg-transparent"
                  )}
                />
              </Link>
            );
          })}

          <button
            onClick={() => setDrawerOpen(true)}
            data-more-nav-toggle="true"
            aria-label="More navigation"
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pt-2.5 pb-2 transition-colors",
              drawerOpen ? "text-[#AFE607]" : "text-white/45 active:text-white/70"
            )}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium leading-none tracking-wide">More</span>
            <span className="h-0.5 w-6 rounded-full bg-transparent" />
          </button>
        </div>
      </nav>

      {/* ===== Mobile: slide-up drawer with the FULL navigation ===== */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[1200]">
          {/* Backdrop */}
          <button
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer panel — sits ABOVE the tab bar (bottom offset clears it) */}
          <div
            className={cn(
              "absolute left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+64px)]",
              "max-h-[70vh] overflow-y-auto rounded-t-3xl bg-[#0E0E0B] text-white",
              "border-t border-x border-[#2A2A24] shadow-2xl"
            )}
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-[#0E0E0B] border-b border-[#1A1A16]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F5F0E6] flex items-center justify-center overflow-hidden">
                  <CouncilLogo className="w-7 h-auto" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider">BLANTYRE CITY COUNCIL</p>
                  <p className="text-[10px] text-white/40">Market Fee System</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                className="p-2 rounded-xl bg-[#1A1A16] text-white/60 active:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 pb-6 space-y-1">
              {drawerNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-[#AFE607] text-[#0E0E0B] font-semibold"
                        : "text-white/60 hover:bg-[#1A1A16] hover:text-white"
                    )}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 border-t border-[#1A1A16] flex items-center justify-between">
              {user && (
                <div>
                  <p className="text-xs font-semibold text-white/90">{user.fullName}</p>
                  <p className="text-[10px] text-[#AFE607] capitalize">{user.role}</p>
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 bg-red-500/10 active:bg-red-500/20"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
