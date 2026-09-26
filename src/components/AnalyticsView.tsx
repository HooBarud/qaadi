import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  CreditCard,
  Building,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { filterByDateRange, DateRangePreset } from "../utils/dateFilters";
import { exportToExcel, exportToCsv } from "../utils/excel";

export const AnalyticsView: React.FC = () => {
  const {
    incomes,
    expenses,
    invoices,
    accounts,
    services,
    categories,
    recurringTransactions,
    formatCurrency,
    viewCurrency,
    exchangeRate,
    activeBusiness,
  } = useFinance();

  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_year");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    insights: { title: string; description: string; type: "success" | "warning" | "info" | "danger"; recommendation?: string }[];
    summaryText?: string;
  } | null>(null);

  // Filter transactions
  const filteredIncomes = useMemo(() => filterByDateRange(incomes, datePreset), [incomes, datePreset]);
  const filteredExpenses = useMemo(() => filterByDateRange(expenses, datePreset), [expenses, datePreset]);

  // Overall Financial KPIs
  const totalRevenueUSD = filteredIncomes.reduce((acc, i) => acc + i.amountUSD, 0);
  const totalCashCollectedUSD = filteredIncomes.reduce((acc, i) => acc + i.paidAmountUSD, 0);
  const totalReceivablesUSD = filteredIncomes.reduce((acc, i) => acc + (i.debtAmountUSD || 0), 0);
  const totalExpensesUSD = filteredExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
  const netProfitUSD = totalRevenueUSD - totalExpensesUSD;
  const netCashFlowUSD = totalCashCollectedUSD - totalExpensesUSD;

  const profitMargin = totalRevenueUSD > 0 ? ((netProfitUSD / totalRevenueUSD) * 100).toFixed(1) : "0";
  const expenseRatio = totalRevenueUSD > 0 ? ((totalExpensesUSD / totalRevenueUSD) * 100).toFixed(1) : "0";
  const collectionRate = totalRevenueUSD > 0 ? Math.round((totalCashCollectedUSD / totalRevenueUSD) * 100) : 100;
  const avgTicketUSD = filteredIncomes.length > 0 ? Math.round(totalRevenueUSD / filteredIncomes.length) : 0;

  // Monthly Recurring Run Rate
  const recurringMonthlyRunRateUSD = useMemo(() => {
    return recurringTransactions
      .filter((r) => r.status === "active")
      .reduce((sum, r) => {
        let mult = 1;
        if (r.frequency === "weekly") mult = 4.33;
        else if (r.frequency === "quarterly") mult = 1 / 3;
        else if (r.frequency === "yearly") mult = 1 / 12;
        return r.type === "income" ? sum + r.amountUSD * mult : sum;
      }, 0);
  }, [recurringTransactions]);

  // Service breakdown
  const serviceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalUSD: number }> = {};
    filteredIncomes.forEach((i) => {
      const name = i.serviceName || i.description || "General Notarization";
      if (!map[name]) map[name] = { count: 0, totalUSD: 0 };
      map[name].count += 1;
      map[name].totalUSD += i.amountUSD;
    });

    return Object.entries(map)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.totalUSD - a.totalUSD);
  }, [filteredIncomes]);

  // Expense Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalUSD: number }> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || "General";
      if (!map[cat]) map[cat] = { count: 0, totalUSD: 0 };
      map[cat].count += 1;
      map[cat].totalUSD += e.amountUSD;
    });

    return Object.entries(map)
      .map(([cat, val]) => ({ cat, ...val }))
      .sort((a, b) => b.totalUSD - a.totalUSD);
  }, [filteredExpenses]);

  // Payment Method Breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      const m = i.paymentMethod || "Cash";
      map[m] = (map[m] || 0) + i.paidAmountUSD;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredIncomes]);

  // Monthly trends (Last 6 months)
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { income: number; expense: number; net: number }> = {};
    // Seed last 6 months
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = target.toISOString().substring(0, 7);
      months[key] = { income: 0, expense: 0, net: 0 };
    }

    incomes.forEach((i) => {
      const k = i.date?.substring(0, 7);
      if (months[k]) {
        months[k].income += i.amountUSD;
      }
    });

    expenses.forEach((e) => {
      const k = e.date?.substring(0, 7);
      if (months[k]) {
        months[k].expense += e.amountUSD;
      }
    });

    return Object.entries(months).map(([monthKey, val]) => ({
      monthKey,
      income: val.income,
      expense: val.expense,
      net: val.income - val.expense,
      margin: val.income > 0 ? Math.round(((val.income - val.expense) / val.income) * 100) : 0,
    }));
  }, [incomes, expenses]);

  const maxMonthValue = useMemo(() => {
    let max = 1000;
    monthlyTrends.forEach((m) => {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    });
    return max;
  }, [monthlyTrends]);

  // Handle AI Insights Request
  const handleFetchAiInsights = async () => {
    setIsGeneratingAI(true);
    try {
      const payload = {
        summary: {
          totalIncome: totalRevenueUSD,
          totalExpense: totalExpensesUSD,
          totalCollected: totalCashCollectedUSD,
          totalInvoiced: totalRevenueUSD,
          totalReceivables: totalReceivablesUSD,
          totalPayables: 0,
          cashBalance: accounts.find((a) => a.type === "cash")?.currentBalanceUSD || 0,
          bankBalance: accounts.filter((a) => a.type === "bank").reduce((s, a) => s + a.currentBalanceUSD, 0),
          walletBalance: accounts.filter((a) => a.type === "mobile_money").reduce((s, a) => s + a.currentBalanceUSD, 0),
        },
        currency: "USD",
      };

      const res = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      } else {
        // Fallback insights
        setAiInsights({
          insights: [
            {
              title: "Heerka Ururinta Lacagaha (Collection Rate: " + collectionRate + "%)",
              description: `Qaaddi Notary waxay ku guulaysatay inay soo xareyso ${collectionRate}% dakhliga xilligan. Deymaha harsan ee $${totalReceivablesUSD.toLocaleString()} waxaa habboon in xusuusin loo diro macaamiisha.`,
              type: collectionRate >= 80 ? "success" : "warning",
              recommendation: "Dir fariimo xusuusin ah macaamiisha deyntu ku dhowdahay inay soo daahdo.",
            },
            {
              title: "Dakhliga Joogtada ah & Qandaraasyada (Recurring Revenue)",
              description: `Dakhliga joogtada ah ee bil kasta soo gala xafiiska waa $${recurringMonthlyRunRateUSD.toLocaleString()}. Tani waxay dabooshaa ${totalExpensesUSD > 0 ? Math.round((recurringMonthlyRunRateUSD / (totalExpensesUSD / (monthlyTrends.length || 1))) * 100) : 100}% kharashka joogtada ah.`,
              type: "info",
              recommendation: "Kordhi heshiisyada nootaayada ee shirkadaha waaweyn sida Dahabshiil iyo Telesom.",
            },
          ],
          summaryText: `Falanqaynta maaliyadeed ee Qaaddi Notary Public waxay muujinaysaa faa'iido saafi ah oo dhan $${netProfitUSD.toLocaleString()} (${profitMargin}% margin). Xisaabaadka iyo dakhliga sharcigu waa kuwo deggan.`,
        });
      }
    } catch {
      // Default fallback
      setAiInsights({
        insights: [
          {
            title: "Heerka Ururinta Lacagaha (Collection Rate)",
            description: `Heerkaaga ururinta lacagaha hadda waa ${collectionRate}%. Deymaha harsan ee soo daahay waxaa habboon in lagu kormeero xisaab-xidhka bisha.`,
            type: "success",
            recommendation: "Xaqiiji invoice-yada furan ka hor inta aan bisha la xidhin.",
          },
        ],
        summaryText: "Falanqaynta nidaamka maaliyadda Qaaddi Notary waxay muujinaysaa koboc joogto ah.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportExcel = () => {
    const data = [
      { Metric: "Wadarta Dakhliga (Gross Revenue)", ValueUSD: totalRevenueUSD },
      { Metric: "Dakhliga Kaashka ah (Collected)", ValueUSD: totalCashCollectedUSD },
      { Metric: "Deymaha Harsan (Receivables)", ValueUSD: totalReceivablesUSD },
      { Metric: "Wadarta Kharashka (Total Expenses)", ValueUSD: totalExpensesUSD },
      { Metric: "Faa'iidada Saafiga ah (Net Profit)", ValueUSD: netProfitUSD },
      { Metric: "Margin (%)", ValueUSD: `${profitMargin}%` },
      { Metric: "Celceliska Shaqo (Avg Ticket)", ValueUSD: avgTicketUSD },
    ];
    exportToExcel(data, `Falanqaynta_Maaliyadda_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  const handleExportCsv = () => {
    const data = serviceBreakdown.map((s) => ({
      Adeegga: s.name,
      Tirada: s.count,
      Wadarta_USD: s.totalUSD,
    }));
    exportToCsv(data, `Falanqaynta_Adeegyada_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Falanqaynta Maaliyadeed (Financial Analytics)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Falanqayn qoto dheer oo ku saabsan dakhliga nootaayada, kharashka, faa'iidada, iyo dakhliga joogtada ah.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Preset */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              className="bg-transparent font-semibold text-slate-800 outline-none dark:text-slate-200 cursor-pointer"
            >
              <option value="today">Maanta (Today)</option>
              <option value="this_week">Toddobaadkan (This Week)</option>
              <option value="this_month">Bishan (This Month)</option>
              <option value="last_3_months">3-dii Bilood ee u dambaysay</option>
              <option value="last_6_months">6-dii Bilood ee u dambaysay</option>
              <option value="this_year">Sanadkan (This Year)</option>
              <option value="all">Dhammaan (All Time)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Daabac</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dakhliga Guud (Revenue)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalRevenueUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Kaash la helay: {formatCurrency(totalCashCollectedUSD)}</span>
            <span className="font-semibold text-emerald-600">{collectionRate}%</span>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Wadarta Kharashka
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpensesUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Expense Ratio:</span>
            <span className="font-semibold text-rose-600">{expenseRatio}%</span>
          </div>
        </div>

        {/* Card 3: Net Profit & Margin */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Faa'iidada Saafiga ah
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-black ${netProfitUSD >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrency(netProfitUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Profit Margin:</span>
            <span className="font-semibold text-indigo-600">{profitMargin}%</span>
          </div>
        </div>

        {/* Card 4: Average Ticket & Recurring Run Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dakhliga Joogtada ah (MRR)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-[#8C6A14] dark:bg-amber-950 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[#8C6A14] dark:text-[#C59B27]">
            {formatCurrency(recurringMonthlyRunRateUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Celceliska Shaqo Kasta:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(avgTicketUSD)}</span>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart (Pure Interactive SVG & Bars) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Socodka Dakhliga & Kharashka 6-dii Bilood (Monthly Financial Trend)
            </h3>
            <p className="text-xs text-slate-400">
              Isbarbardhigga dakhliga soo xarooday iyo kharashka bishiiba
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />
              <span>Dakhli (Income)</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="h-3 w-3 rounded-sm bg-rose-500" />
              <span>Kharash (Expense)</span>
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-2 sm:gap-6 items-end h-64 pt-6">
          {monthlyTrends.map((m) => {
            const incomeHeight = maxMonthValue > 0 ? Math.round((m.income / maxMonthValue) * 100) : 0;
            const expenseHeight = maxMonthValue > 0 ? Math.round((m.expense / maxMonthValue) * 100) : 0;

            return (
              <div key={m.monthKey} className="flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                  <span>Dakhli: ${m.income.toLocaleString()}</span>
                  <span>Kharash: ${m.expense.toLocaleString()}</span>
                  <span>Faaiido: ${m.net.toLocaleString()} ({m.margin}%)</span>
                </div>

                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                  {/* Income bar */}
                  <div
                    style={{ height: `${Math.max(4, incomeHeight)}%` }}
                    className="w-1/2 max-w-[28px] rounded-t-lg bg-emerald-500 hover:bg-emerald-600 transition"
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${Math.max(4, expenseHeight)}%` }}
                    className="w-1/2 max-w-[28px] rounded-t-lg bg-rose-500 hover:bg-rose-600 transition"
                  />
                </div>

                <span className="mt-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {m.monthKey}
                </span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  +${m.net > 0 ? m.net.toLocaleString() : 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Top Legal Services & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Legal Services Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Adeegyada Nootaayada ugu Dakhliga Badan (Revenue by Service)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{serviceBreakdown.length} adeeg</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {serviceBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Xog dakhli ah laguma helin xilligan.</p>
            ) : (
              serviceBreakdown.slice(0, 5).map((srv) => {
                const percent = totalRevenueUSD > 0 ? Math.round((srv.totalUSD / totalRevenueUSD) * 100) : 0;
                return (
                  <div key={srv.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {srv.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">({srv.count} shaqo)</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(srv.totalUSD)}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 min-w-[32px] text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Qaybaha Kharashka (Expense Breakdown by Category)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{categoryBreakdown.length} qaybood</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Wax kharash ah laguma helin xilligan.</p>
            ) : (
              categoryBreakdown.slice(0, 5).map((cat) => {
                const percent = totalExpensesUSD > 0 ? Math.round((cat.totalUSD / totalExpensesUSD) * 100) : 0;
                return (
                  <div key={cat.cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {cat.cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">({cat.count} jeer)</span>
                        <span className="font-black text-rose-600">
                          {formatCurrency(cat.totalUSD)}
                        </span>
                        <span className="text-xs font-bold text-rose-600 min-w-[32px] text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-rose-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* AI Financial Insights & Business Health Assessment */}
      <div className="rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50/70 via-white to-amber-50/40 p-6 shadow-xs dark:border-indigo-900/50 dark:from-slate-900 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-indigo-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Falanqaynta Caqliga Macmalka ah (AI Insights) ee Qaaddi Notary
              </h3>
              <p className="text-xs text-slate-500">
                Falanqeyn toos ah oo ku saabsan dakhliga, socodka kaashka, iyo talooyinka kobaca.
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchAiInsights}
            disabled={isGeneratingAI}
            className="flex items-center gap-2 rounded-xl bg-[#543324] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3D2216] transition cursor-pointer disabled:opacity-50 ring-1 ring-[#c59b27]/40"
          >
            <Sparkles className={`h-4 w-4 text-amber-300 ${isGeneratingAI ? "animate-spin" : ""}`} />
            <span>{isGeneratingAI ? "Waa la falanqeynayaa..." : "Soo Saaro Falanqayn Cusub"}</span>
          </button>
        </div>

        {/* AI Results */}
        <div className="mt-5 space-y-3">
          {aiInsights?.summaryText && (
            <div className="rounded-xl bg-white/80 p-3.5 border border-indigo-100 dark:bg-slate-800/80 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200">
              <p className="leading-relaxed">💡 {aiInsights.summaryText}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(aiInsights?.insights || [
              {
                title: "Heerka Ururinta Lacagaha (Collection Rate: " + collectionRate + "%)",
                description: `Heerkaaga ururinta lacagaha hadda waa ${collectionRate}%. Wadarta dakhliga kaashka ah waa $${totalCashCollectedUSD.toLocaleString()}. Deymaha soo daahay ee $${totalReceivablesUSD.toLocaleString()} waxaa habboon in lagu kormeero xisaab-xidhka bisha.`,
                type: "success" as const,
                recommendation: "Dir fariimo xusuusin ah macaamiisha deyntu ku dhowdahay inay soo daahdo.",
              },
              {
                title: "Dhaqdhaqaaqa Joogtada ah ee Bishiiba (MRR: $" + recurringMonthlyRunRateUSD.toLocaleString() + ")",
                description: `Heshiisyada joogtada ah (Retainers) waxay siiyaan xafiiska dakhli la saadaalin karo oo dhan $${recurringMonthlyRunRateUSD.toLocaleString()} bishiiba.`,
                type: "info" as const,
                recommendation: "Kordhi heshiisyada nootaayada ee shirkadaha ganacsiga iyo bangiyada.",
              },
            ]).map((insight, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {insight.title}
                  </h4>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {insight.description}
                </p>
                {insight.recommendation && (
                  <div className="mt-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 p-2 rounded-lg">
                    Talo: {insight.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
