import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { AuthProvider } from "@/hook/useAuth";
import AuthGuard from "@/components/dashboard/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen bg-[#f6f8f7] flex">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}