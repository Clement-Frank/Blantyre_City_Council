import { FileText, TrendingUp, Users, ShieldCheck, BarChart3 } from "lucide-react";
import Link from "next/link";

const reportCards = [
  {
    title: "Daily Revenue",
    description: "Total fees collected per market for today with breakdown by fee type and channel.",
    icon: FileText,
    href: "/dashboard/reports/daily",
    color: "bg-[#3d5a45]",
  },
  {
    title: "Monthly Revenue",
    description: "Rolled-up monthly totals with trend comparison against previous month.",
    icon: TrendingUp,
    href: "/dashboard/reports/monthly",
    color: "bg-[#5a9e8f]",
  },
  {
    title: "Vendor Compliance",
    description: "Lists vendors by payment frequency to identify chronic non-payers.",
    icon: ShieldCheck,
    href: "/dashboard/reports/compliance",
    color: "bg-[#7bc4b5]",
  },
  {
    title: "Collector Performance",
    description: "Number of vendors registered and payments verified per collector.",
    icon: Users,
    href: "/dashboard/reports/collectors",
    color: "bg-[#2d4a3e]",
  },
  {
    title: "Revenue Trends",
    description: "Time-series visualization of revenue over weeks/months for forecasting.",
    icon: BarChart3,
    href: "/dashboard/reports/revenue",
    color: "bg-[#3d5a45]",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate and export management reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#5a9e8f]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${report.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-medium text-gray-400 group-hover:text-[#5a9e8f] transition-colors">
                  View →
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {report.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}