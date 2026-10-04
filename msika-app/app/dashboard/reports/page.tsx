import { FileText, Target, Users, ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

// Reports hub — only links to real, working report surfaces.
// Daily Revenue is a real report; compliance and collector analysis live
// in the Market Center (single source of truth, MRI-powered).
const reportCards = [
  {
    title: "Daily Revenue",
    description: "Today's collections by fee type and payment channel, with collector breakdown and export.",
    icon: FileText,
    href: "/dashboard/reports/daily",
    accent: "bg-[#3d5a45]",
    tag: "Report",
  },
  {
    title: "Vendor Compliance",
    description: "Reliability Index tiers, enforcement watchlist, and revenue-at-risk per submarket.",
    icon: Target,
    href: "/dashboard/markets",
    accent: "bg-[#5a9e8f]",
    tag: "Market Center",
  },
  {
    title: "Collector Performance",
    description: "Payments recorded and revenue attributed per collector, scoped to your role.",
    icon: Users,
    href: "/dashboard/markets",
    accent: "bg-[#2d4a3e]",
    tag: "Market Center",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Management reporting — every number comes from live collection data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.title}
              href={report.href}
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#5a9e8f]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${report.accent} flex items-center justify-center text-white`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  {report.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                {report.title}
                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#3d5a45] transition-colors" />
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{report.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
        <ShieldCheck size={13} className="text-[#3d5a45]" />
        Audit trail for every report-generating action is in Audit Logs (admin only).
      </div>
    </div>
  );
}
