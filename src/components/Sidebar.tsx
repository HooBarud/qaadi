import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  FileText,
  PieChart,
  Lock,
  BarChart3,
  FileSpreadsheet,
  History,
  Settings,
  Scale,
  X,
  LogOut,
  Repeat,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { ActiveTab } from "../types";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, incomes, expenses, invoices, currentUser, logout } = useFinance();

  // Calculate uncollected debts count
  const pendingDebtsCount = incomes.filter((i) => i.debtAmountUSD > 0).length;
  const unpaidInvoicesCount = invoices.filter((inv) => inv.balanceDueUSD > 0).length;

  const navGroups: { groupTitle: string; items: NavItem[] }[] = [
    {
      groupTitle: "DHIBAATADA UGU WEYN (MAIN)",
      items: [
        { id: "dashboard", label: "Dashboard", sublabel: "Guudmar", icon: LayoutDashboard },
        { id: "income", label: "Dakhliga (Income)", sublabel: "Dakhli & Shaqo", icon: TrendingUp },
        { id: "expense", label: "Kharashka (Expense)", sublabel: "Lacag bixinnada", icon: TrendingDown },
        { id: "recurring", label: "Dhaqdhaqaaqa Joogtada", sublabel: "Schedules & Retainers", icon: Repeat },
        { id: "transfers", label: "Wareejinta (Transfer)", sublabel: "Akoon ilaa Akoon", icon: ArrowLeftRight },
      ],
    },
    {
      groupTitle: "MAAMULKA & MACAAMIISHA (OPERATIONS)",
      items: [
        { id: "debts", label: "Deymaha & Aging", sublabel: "Receivables", icon: Scale, badge: pendingDebtsCount },
        { id: "invoices", label: "Invoices", sublabel: "Qaansheegyada", icon: FileText, badge: unpaidInvoicesCount },
        { id: "receipts", label: "Rasiidhada (Receipts)", sublabel: "Caddayn lacag bixin", icon: Receipt },
        { id: "clients", label: "Macaamiisha (Clients)", sublabel: "Diiwaanka Macmiilka", icon: Users },
        { id: "services", label: "Adeegyada (Services)", sublabel: "Qiimaha Adeegga", icon: Briefcase },
        { id: "accounts", label: "Xisaabaadka (Accounts)", sublabel: "Qasnadda & Bangiyada", icon: CreditCard },
      ],
    },
    {
      groupTitle: "WARBIXINNO & XOG-BAARIS (FINANCIALS)",
      items: [
        { id: "reports", label: "Warbixinno & P&L", sublabel: "Faaiidada & Qasaaraha", icon: PieChart },
        { id: "monthly_closing", label: "Xisaab Xidhka Bishan", sublabel: "Monthly Lock", icon: Lock },
        { id: "analytics", label: "Falanqaynta (Analytics)", sublabel: "Xog-ururin dheeri ah", icon: BarChart3 },
        { id: "excel_tools", label: "Excel & Backup", sublabel: "Soo deji / Daabac", icon: FileSpreadsheet },
        { id: "audit_log", label: "Diiwaanka Isbeddelka", sublabel: "Audit Trail", icon: History },
        { id: "settings", label: "Habaynta (Settings)", sublabel: "Xogta Shirkadda", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#E8DFD3] bg-[#FDFBF7] dark:border-[#382318] dark:bg-[#1E110A] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-[#E8DFD3] px-3.5 bg-[#FAF7F2] dark:border-[#382318] dark:bg-[#1A0E08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/qaaddi-logo.png"
              alt="Qaaddi Notary Public"
              className="h-11 w-11 shrink-0 rounded-xl object-contain bg-white p-0.5 shadow-sm border border-[#C59B27]/40"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-[13px] font-black tracking-tight text-[#3A2216] dark:text-[#F8F5EE] leading-tight truncate">
                QAADDI NOTARY
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6A14] dark:text-[#C59B27]">
                <span>Khibrad 23+ Years</span>
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8B5D40] dark:text-[#C59B27]">
                {group.groupTitle}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onCloseMobile();
                      }}
                      id={`nav-item-${item.id}`}
                      className={`group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-[#543324] text-white shadow-sm ring-1 ring-[#c59b27]/40"
                          : "text-[#4A3225] hover:bg-[#F2ECE1] dark:text-[#E8DFD3] dark:hover:bg-[#2A1810]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition ${
                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200"
                          }`}
                        />
                        <div className="truncate">
                          <p className="truncate leading-tight">{item.label}</p>
                          {item.sublabel && (
                            <p
                              className={`text-[9px] font-normal leading-tight ${
                                isActive ? "text-amber-100/90" : "text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            isActive
                              ? "bg-[#C59B27] text-slate-900"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Active User Card & Logout */}
        <div className="border-t border-[#E8DFD3] p-3 dark:border-[#382318] bg-[#FAF7F2] dark:bg-[#1A0E08]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#543324] text-white font-bold text-xs shrink-0 shadow-xs border border-[#C59B27]/40">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate text-left">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {currentUser.name}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  @{currentUser.username || "user"} • {currentUser.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="btn-sidebar-logout"
              onClick={() => {
                onCloseMobile();
                logout();
              }}
              title="Ka Bax Nidaamka"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition shrink-0"
              aria-label="Ka Bax"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-slate-200 p-2.5 px-3 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span className="font-medium">Nidaam Sugan (Secure)</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </aside>
    </>
  );
};
