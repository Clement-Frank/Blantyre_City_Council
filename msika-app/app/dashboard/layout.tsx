import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/dashboard/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen bg-[#FAFAF8] flex">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            {/* pb clears the mobile bottom tab bar (hamburger drawer sits above it) */}
            <main className="flex-1 p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+76px)] lg:pb-6 overflow-y-auto">{children}</main>
          </div>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}