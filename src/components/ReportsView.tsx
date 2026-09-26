import React, { useState, useMemo } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ShieldAlert,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { exportToExcel, exportToCsv } from "../utils/excel";
import { DateRangePreset, filterByDateRange } from "../utils/dateFilters";

export const ReportsView: React.FC = () => {
  const {
    incomes,
    expenses,
    invoices,
    categories,
    monthlyClosings,
    toggleMonthLock,
    formatCurrency,
    activeBusiness,
    canManageUsers,
  } = useFinance();

  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [activeReportTab, setActiveReportTab] = useState<"pnl" | "cashflow" | "closing">("pnl");

  // Selected month for closing
  const [selectedMonthToClose, setSelectedMonthToClose] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [closingNotes, setClosingNotes] = useState("");

  // Filter transactions by chosen range
  const filteredIncomes = useMemo(() => filterByDateRange(incomes, datePreset), [incomes, datePreset]);
  const filteredExpenses = useMemo(() => filterByDateRange(expenses, datePreset), [expenses, datePreset]);

  // P&L metrics
  const totalRevenueUSD = filteredIncomes.reduce((acc, i) => acc + i.amountUSD, 0);
  const totalPaidRevenueUSD = filteredIncomes.reduce((acc, i) => acc + i.paidAmountUSD, 0);
  const totalExpensesUSD = filteredExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
  const netProfitUSD = totalRevenueUSD - totalExpensesUSD;
  const netCashFlowUSD = totalPaidRevenueUSD - totalExpensesUSD;
  const profitMargin = totalRevenueUSD > 0 ? ((netProfitUSD / totalRevenueUSD) * 100).toFixed(1) : "0";

  // Category breakdown
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amountUSD;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // Handle Month Lock
  const handleLockMonth = () => {
    if (!selectedMonthToClose) return;
    if (window.confirm(`Ma hubtaa inaad xidho bisha ${selectedMonthToClose}? Waxba lagama beddeli karo xogteeda.`)) {
      toggleMonthLock(selectedMonthToClose, closingNotes);
      setClosingNotes("");
    }
  };

  const handleExportExcel = () => {
    if (activeReportTab === "pnl") {
      const data = [
        { "Category": "Wadarta Dakhliga (Total Income)", "Cadadka (USD)": totalRevenueUSD },
        { "Category": "Dakhliga Kaashka ah (Collected)", "Cadadka (USD)": totalPaidRevenueUSD },
        { "Category": "Wadarta Kharashka (Total Expenses)", "Cadadka (USD)": totalExpensesUSD },
        { "Category": "Faa'iidada Saafiga ah (Net Profit)", "Cadadka (USD)": netProfitUSD },
        { "Category": "Margin (%)", "Cadadka (USD)": `${profitMargin}%` },
        ...expenseByCategory.map(([cat, amt]) => ({
          "Category": `Kharash: ${cat}`,
          "Cadadka (USD)": amt,
        })),
      ];
      exportToExcel(data, `Warbixinta_Faa_iidada_${activeBusiness.name.replace(/\s+/g, "_")}`);
    } else {
      const data = filteredIncomes.map((i) => ({
        "Type": "Income In",
        "Date": i.date,
        "Entity": i.clientName,
        "Amount (USD)": i.paidAmountUSD,
      })).concat(
        filteredExpenses.map((e) => ({
          "Type": "Expense Out",
          "Date": e.date,
          "Entity": e.supplier || e.category,
          "Amount (USD)": -e.amountUSD,
        }))
      );
      exportToExcel(data, `Dhaqdhaqaaqa_Kaashka_${activeBusiness.name.replace(/\s+/g, "_")}`);
    }
  };

  const handleExportCsv = () => {
    if (activeReportTab === "pnl") {
      const data = [
        { "Category": "Wadarta Dakhliga (Total Income)", "Cadadka (USD)": totalRevenueUSD },
        { "Category": "Dakhliga Kaashka ah (Collected)", "Cadadka (USD)": totalPaidRevenueUSD },
        { "Category": "Wadarta Kharashka (Total Expenses)", "Cadadka (USD)": totalExpensesUSD },
        { "Category": "Faa'iidada Saafiga ah (Net Profit)", "Cadadka (USD)": netProfitUSD },
        { "Category": "Margin (%)", "Cadadka (USD)": `${profitMargin}%` },
        ...expenseByCategory.map(([cat, amt]) => ({
          "Category": `Kharash: ${cat}`,
          "Cadadka (USD)": amt,
        })),
      ];
      exportToCsv(data, `Warbixinta_Faa_iidada_${activeBusiness.name.replace(/\s+/g, "_")}`);
    } else {
      const data = filteredIncomes.map((i) => ({
        "Type": "Income In",
        "Date": i.date,
        "Entity": i.clientName,
        "Service": i.serviceName || "",
        "Amount (USD)": i.paidAmountUSD,
        "Debt (USD)": i.debtAmountUSD,
        "Status": i.status,
      })).concat(
        filteredExpenses.map((e) => ({
          "Type": "Expense Out",
          "Date": e.date,
          "Entity": e.supplier || e.category,
          "Service": e.category || "",
          "Amount (USD)": -e.amountUSD,
          "Debt (USD)": 0,
          "Status": "paid",
        }))
      );
      exportToCsv(data, `Dhaqdhaqaaqa_Kaashka_${activeBusiness.name.replace(/\s+/g, "_")}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Warbixinaha Maaliyadeed (Financial Reports & P&L)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Faahfaahinta dakhliga, kharashka, faa'iidada saafiga ah, iyo xidhitaanka bisha (Monthly Closing).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to CSV Button requested by user */}
          <button
            onClick={handleExportCsv}
            id="export-to-csv-btn"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition shadow-xs cursor-pointer active:scale-95"
            title="Download financial data as CSV for offline analysis"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Soo Saaro Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <Printer className="h-4 w-4 text-indigo-600" />
            <span>Daabac Warbixinta</span>
          </button>
        </div>
      </div>

      {/* Tabs & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveReportTab("pnl")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeReportTab === "pnl"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Faa'iidada & Khasaaraha (P&L)
          </button>
          <button
            onClick={() => setActiveReportTab("cashflow")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeReportTab === "cashflow"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Dhaqdhaqaaqa Kaashka (Cash Flow)
          </button>
          <button
            onClick={() => setActiveReportTab("closing")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeReportTab === "closing"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Xidhitaanka Bisha (Monthly Closing)
          </button>
        </div>

        {activeReportTab !== "closing" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Xilliga:</span>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="today">Maanta</option>
              <option value="this_week">Toddobaadkan</option>
              <option value="this_month">Bishan</option>
              <option value="last_3_months">3 Bilood</option>
              <option value="last_6_months">6 Bilood</option>
              <option value="this_year">Sannadkan</option>
            </select>
          </div>
        )}
      </div>

      {/* P&L Report Tab */}
      {activeReportTab === "pnl" && (
        <div className="space-y-6">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Wadarta Dakhliga</span>
              <p className="mt-1 text-2xl font-black text-emerald-600">{formatCurrency(totalRevenueUSD)}</p>
              <span className="text-[10px] text-slate-400">Dakhli guud oo la qabtay</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Wadarta Kharashka</span>
              <p className="mt-1 text-2xl font-black text-rose-600">{formatCurrency(totalExpensesUSD)}</p>
              <span className="text-[10px] text-slate-400">Kharashaadkii baxay</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Faa'iidada Saafiga ah</span>
              <p
                className={`mt-1 text-2xl font-black ${
                  netProfitUSD >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600"
                }`}
              >
                {formatCurrency(netProfitUSD)}
              </p>
              <span className="text-[10px] text-slate-400">Net Profit (Income - Expense)</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Profit Margin</span>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{profitMargin}%</p>
              <span className="text-[10px] text-slate-400">Heerka faa'iido celinta</span>
            </div>
          </div>

          {/* Statement Paper Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Bayaanka Faa'iidada & Khasaaraha (Income Statement / P&L)
            </h3>

            <div className="mt-4 space-y-4 text-xs">
              {/* Income Block */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 text-sm py-2 border-b border-slate-200 dark:border-slate-700">
                  <span>Dakhliga Hawlaha (Operating Revenue)</span>
                  <span className="text-emerald-600">{formatCurrency(totalRevenueUSD)}</span>
                </div>
                <div className="pl-4 py-2 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Lacagta Tooska ah ee la Helay (Cash Collected):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(totalPaidRevenueUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deynta Macaamiisha Harta (Receivables):</span>
                    <span className="font-semibold text-amber-600">
                      {formatCurrency(totalRevenueUSD - totalPaidRevenueUSD)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Block */}
              <div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 text-sm py-2 border-b border-slate-200 dark:border-slate-700">
                  <span>Kharashaadka Guud (Operating Expenses)</span>
                  <span className="text-rose-600">-{formatCurrency(totalExpensesUSD)}</span>
                </div>
                <div className="pl-4 py-2 space-y-1.5 text-slate-600 dark:text-slate-400">
                  {expenseByCategory.length === 0 ? (
                    <p className="text-slate-400">Wax kharash ah lama diiwaangelin xilligan.</p>
                  ) : (
                    expenseByCategory.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between">
                        <span>{cat}:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(amt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Net Profit Bottom Line */}
              <div className="pt-4 border-t-2 border-slate-900 dark:border-slate-700 flex justify-between items-baseline font-black text-base">
                <span className="text-slate-900 dark:text-white">Faa'iidada Saafiga ah (Net Profit):</span>
                <span className={netProfitUSD >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {formatCurrency(netProfitUSD)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Report Tab */}
      {activeReportTab === "cashflow" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bayaanka Socodka Kaashka (Cash Flow Statement)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Lacagta dhabta ah ee qasnadda iyo bangiyada soo gashay iyo inta ka baxday xilligan la doortay.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase">
                  Kaashka Soo Galay (Cash In)
                </span>
                <p className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  +{formatCurrency(totalPaidRevenueUSD)}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/30">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase">
                  Kaashka Baxay (Cash Out)
                </span>
                <p className="mt-1 text-2xl font-black text-rose-900 dark:text-rose-200">
                  -{formatCurrency(totalExpensesUSD)}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase">
                  Haraaga Saafiga ah (Net Cash Flow)
                </span>
                <p
                  className={`mt-1 text-2xl font-black ${
                    netCashFlowUSD >= 0 ? "text-indigo-900 dark:text-indigo-200" : "text-rose-700"
                  }`}
                >
                  {formatCurrency(netCashFlowUSD)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Closing Tab */}
      {activeReportTab === "closing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xidhitaanka Bisha & Qufulka (Monthly Closing & Lock)
                </h3>
                <p className="text-xs text-slate-500">
                  Marka xisaab-xidhka bisha la dhammeeyo, xidh bisha si looga hortago in shaqaaluhu khalad wax uga beddelaan taariikhda hore.
                </p>
              </div>
            </div>

            {canManageUsers ? (
              <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Xidh Bil Cusub
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Dooro Bisha *
                    </label>
                    <input
                      type="month"
                      value={selectedMonthToClose}
                      onChange={(e) => setSelectedMonthToClose(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Xusuusin / Qoraal
                    </label>
                    <input
                      type="text"
                      placeholder="Xisaab-xidhka bisha oo la hubiyay..."
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleLockMonth}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-xs transition"
                >
                  <Lock className="h-4 w-4" />
                  <span>Xidh Bisha {selectedMonthToClose}</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                Keliya maamulaha sare (Admin) ayaa xidhi kara bisha.
              </div>
            )}

            {/* List of Closed Months */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Bilaha Horay Loo Xidhay (Locked Months)
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {monthlyClosings.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">Weli bilna lama xidhin.</p>
                ) : (
                  monthlyClosings.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Bisha: {c.monthKey}</p>
                          <p className="text-[10px] text-slate-400">
                            Xidhay: {c.lockedBy} • {new Date(c.lockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {canManageUsers && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Ma furtaa bisha ${c.monthKey}?`)) {
                                toggleMonthLock(c.monthKey);
                              }
                            }}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            <span>Fur (Unlock)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
