import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building,
  Smartphone,
  Scale,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Plus,
  ArrowLeftRight,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Cloud,
  Repeat,
  Zap,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { TimeFilter, DateRange, Currency } from "../types";
import { isDateInFilter, formatTimeFilterLabel } from "../utils/dateFilters";
import { CloudSyncModal } from "./CloudSyncModal";

export const DashboardView: React.FC = () => {
  const {
    activeBusiness,
    incomes,
    expenses,
    transfers,
    accounts,
    timeFilter,
    setTimeFilter,
    customDateRange,
    setCustomDateRange,
    formatCurrency,
    viewCurrency,
    openQuickAction,
    setActiveTab,
    exchangeRate,
    isCloudSyncActive,
    lastCloudUpdate,
    lastCloudAuthor,
    cloudVersion,
    recentChanges,
    recurringTransactions,
    processDueRecurringTransactions,
  } = useFinance();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showCloudModal, setShowCloudModal] = useState(false);

  const today = new Date().toISOString().substring(0, 10);
  const dueRecurring = useMemo(() => {
    return recurringTransactions.filter(
      (r) => r.status === "active" && r.nextDueDate <= today
    );
  }, [recurringTransactions, today]);

  // Filtered lists based on selected time filter
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i) => isDateInFilter(i.date, timeFilter, customDateRange));
  }, [incomes, timeFilter, customDateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInFilter(e.date, timeFilter, customDateRange));
  }, [expenses, timeFilter, customDateRange]);

  // KPI Calculations
  const totalIncomeUSD = filteredIncomes.reduce((acc, i) => acc + (i.amountUSD || 0), 0);
  const totalIncomeSLSH = filteredIncomes.reduce((acc, i) => acc + (i.amountSLSH || 0), 0);

  const totalExpenseUSD = filteredExpenses.reduce((acc, e) => acc + (e.amountUSD || 0), 0);
  const totalExpenseSLSH = filteredExpenses.reduce((acc, e) => acc + (e.amountSLSH || 0), 0);

  const netBalanceUSD = totalIncomeUSD - totalExpenseUSD;
  const netBalanceSLSH = totalIncomeSLSH - totalExpenseSLSH;

  // Receivables (Deymo laguugu leeyahay)
  const periodReceivablesUSD = filteredIncomes.reduce((acc, i) => acc + (i.debtAmountUSD || 0), 0);
  const periodReceivablesSLSH = filteredIncomes.reduce((acc, i) => acc + (i.debtAmountSLSH || 0), 0);
  const totalReceivablesUSD = incomes.reduce((acc, i) => acc + (i.debtAmountUSD || 0), 0);
  const totalReceivablesSLSH = incomes.reduce((acc, i) => acc + (i.debtAmountSLSH || 0), 0);

  // Payables (Deymo laguugu leeyahay)
  const totalPayablesUSD = 0; // Default zero unless marked as unpaid supplier debt
  const totalPayablesSLSH = 0;

  // Account balances breakdown
  const totalAccountBalanceUSD = accounts.reduce((acc, a) => acc + (a.currentBalanceUSD || 0), 0);
  const totalAccountBalanceSLSH = accounts.reduce((acc, a) => acc + (a.currentBalanceSLSH || 0), 0);

  const cashAccounts = accounts.filter((a) => a.type === "cash");
  const bankAccounts = accounts.filter((a) => a.type === "bank");
  const mobileAccounts = accounts.filter((a) => a.type === "mobile_money");

  const cashBalanceUSD = cashAccounts.reduce((acc, a) => acc + a.currentBalanceUSD, 0);
  const cashBalanceSLSH = cashAccounts.reduce((acc, a) => acc + a.currentBalanceSLSH, 0);

  const bankBalanceUSD = bankAccounts.reduce((acc, a) => acc + a.currentBalanceUSD, 0);
  const bankBalanceSLSH = bankAccounts.reduce((acc, a) => acc + a.currentBalanceSLSH, 0);

  const mobileBalanceUSD = mobileAccounts.reduce((acc, a) => acc + a.currentBalanceUSD, 0);
  const mobileBalanceSLSH = mobileAccounts.reduce((acc, a) => acc + a.currentBalanceSLSH, 0);

  // Expense by Category Breakdown
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amountUSD;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // Income by Service Breakdown
  const incomeByService = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      const name = i.serviceName || "Other";
      map[name] = (map[name] || 0) + i.amountUSD;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredIncomes]);

  // Combined Recent Transactions (latest 6)
  const recentTransactions = useMemo(() => {
    const incs = filteredIncomes.map((i) => ({
      id: i.id,
      date: i.date,
      type: "income" as const,
      title: i.clientName,
      subtitle: i.serviceName || i.description,
      amountUSD: i.amountUSD,
      amountSLSH: i.amountSLSH,
      status: i.status,
      paymentMethod: i.paymentMethod,
    }));

    const exps = filteredExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      type: "expense" as const,
      title: e.category,
      subtitle: e.description,
      amountUSD: e.amountUSD,
      amountSLSH: e.amountSLSH,
      status: "paid" as const,
      paymentMethod: e.paymentMethod,
    }));

    return [...incs, ...exps]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [filteredIncomes, filteredExpenses]);

  // Request AI Financial Analysis
  const handleRequestAiInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/financial-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: activeBusiness.name,
          currency: viewCurrency,
          incomes: filteredIncomes,
          expenses: filteredExpenses,
          accounts,
        }),
      });
      const data = await response.json();
      if (data.insights) {
        setAiAnalysis(data.insights);
      } else if (data.error) {
        setAiError(data.error);
      }
    } catch (err: any) {
      setAiError(err?.message || "Khalad ayaa dhacay xilliga la xidhiidhayay AI-da.");
    } finally {
      setAiLoading(false);
    }
  };

  const timeFilterOptions: { id: TimeFilter; label: string }[] = [
    { id: "today", label: "Maanta" },
    { id: "week", label: "Toddobaadkan" },
    { id: "month", label: "Bishan" },
    { id: "3months", label: "3 Bilood" },
    { id: "6months", label: "6 Bilood" },
    { id: "year", label: "Sannadkan" },
    { id: "all", label: "Dhammaan" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls: Time Filter Bar & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard-ka Guud
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dulmar dhammaystiran oo ku saabsan dakhliga, kharashka, deynta & haraaga xisaabaadka.
          </p>
        </div>

        {/* Time Filters Chips */}
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-[#E8DFD3] bg-white p-1 shadow-xs dark:border-[#382318] dark:bg-[#1E110A]">
          {timeFilterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTimeFilter(opt.id)}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                timeFilter === opt.id
                  ? "bg-[#543324] text-white shadow-xs ring-1 ring-[#C59B27]/40"
                  : "text-[#4A3225] hover:bg-[#FAF7F2] dark:text-[#E8DFD3] dark:hover:bg-[#2A1810]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker if custom selected */}
      {timeFilter === "custom" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Laga bilaabo:</span>
            <input
              type="date"
              value={customDateRange.startDate}
              onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Ilaa:</span>
            <input
              type="date"
              value={customDateRange.endDate}
              onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {/* Live Cloud Storage Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 dark:border-sky-900/60 dark:bg-sky-950/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 shrink-0">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Live Cloud Storage: {isCloudSyncActive ? "Online & Dhammaan qalabka waa isku xiran yihiin" : "Offline (Qalabkan kaliya)"}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="rounded-full bg-sky-200 px-2 py-0.2 text-[10px] font-bold text-sky-900 dark:bg-sky-900 dark:text-sky-200">
                v{cloudVersion}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cusboonaysiintii ugu dambaysay:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {lastCloudUpdate
                  ? new Date(lastCloudUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
                    " • " +
                    new Date(lastCloudUpdate).toLocaleDateString([], { day: "numeric", month: "short" }) +
                    " (" +
                    (lastCloudAuthor || "Qaaddi") +
                    ")"
                  : "Hadda"}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCloudModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700 shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>Arag Isbeddelada ({recentChanges.length})</span>
        </button>
      </div>

      {/* Due Recurring alert banner */}
      {dueRecurring.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200 text-amber-800 shrink-0">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {dueRecurring.length} Dhaqdhaqaaq oo Joogto ah ayaa waqtigoodu gaadhay maanta!
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Kirada, internet-ka, ama heshiisyada nootaayada ee maanta la ballamay.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const res = processDueRecurringTransactions();
                alert(`Dhammaan ${res.count} xisaabaad ee waqtigoodu gaadhay si toos ah ayaa loo qoray!`);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Fuli Hadda</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("recurring")}
              className="rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 cursor-pointer"
            >
              Arag Jadwalka
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <button
          onClick={() => openQuickAction("income")}
          id="quick-action-income-btn"
          className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-98 transition dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>+ Dakhli Cusub</span>
        </button>

        <button
          onClick={() => openQuickAction("expense")}
          id="quick-action-expense-btn"
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-xs font-bold text-rose-800 hover:bg-rose-100 active:scale-98 transition dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <Plus className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span>+ Kharash Cusub</span>
        </button>

        <button
          onClick={() => openQuickAction("transfer")}
          id="quick-action-transfer-btn"
          className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/70 p-3 text-xs font-bold text-sky-800 hover:bg-sky-100 active:scale-98 transition dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
        >
          <ArrowLeftRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>Wareeji Lacag</span>
        </button>

        <button
          onClick={() => openQuickAction("invoice")}
          id="quick-action-invoice-btn"
          className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100 active:scale-98 transition dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
        >
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Abuur Invoice</span>
        </button>

        <button
          onClick={() => setActiveTab("debts")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-bold text-amber-800 hover:bg-amber-100 active:scale-98 transition dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>Ururi Deyn</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50/70 p-3 text-xs font-bold text-purple-800 hover:bg-purple-100 active:scale-98 transition dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
        >
          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span>Warbixin P&L</span>
        </button>
      </div>

      {/* 8 KPI Cards (Specified in Item 1) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Income */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Income (Dakhli)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalIncomeUSD, totalIncomeSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{filteredIncomes.length} dakhli</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> Soo gashay
            </span>
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expenses (Kharash)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpenseUSD, totalExpenseSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{filteredExpenses.length} kharash</span>
            <span className="text-rose-600 font-semibold flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" /> Baxday
            </span>
          </div>
        </div>

        {/* 3. Net Balance (Faaiido / Khasaare) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Balance (Saafi)
            </span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${netBalanceUSD >= 0 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"}`}>
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-black ${netBalanceUSD >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrency(netBalanceUSD, netBalanceSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dakhli - Kharash</span>
            <span className={`font-semibold ${netBalanceUSD >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {netBalanceUSD >= 0 ? "Faaiido (Profit)" : "Khasaare (Loss)"}
            </span>
          </div>
        </div>

        {/* 4. Total Receivables / Deymo lagugu leeyahay */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receivables (Deymo kugu maqan)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(totalReceivablesUSD, totalReceivablesSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {timeFilter !== "all" && periodReceivablesUSD > 0
                ? `Muddadan: $${periodReceivablesUSD.toFixed(0)}`
                : "Macaamiisha ka harsan"}
            </span>
            <button
              onClick={() => setActiveTab("debts")}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Eeg Deymaha →
            </button>
          </div>
        </div>

        {/* 5. Total Liquid Capital (Wadarta Guud ee Xisaabaadka) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Balances (Haraaga Guud)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(totalAccountBalanceUSD, totalAccountBalanceSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Qasnad + Bangi + Mobile</span>
            <button onClick={() => setActiveTab("accounts")} className="text-indigo-600 hover:underline font-semibold">
              Eeg Xisaabaadka →
            </button>
          </div>
        </div>

        {/* 6. Cash Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cash Balance (Qasnadda)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(cashBalanceUSD, cashBalanceSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Qasnadda gacanta</span>
            <button onClick={() => setActiveTab("accounts")} className="text-indigo-600 hover:underline">
              Eeg akoonka
            </button>
          </div>
        </div>

        {/* 7. Bank Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bank Balance (Bangiyada)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(bankBalanceUSD, bankBalanceSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dahabshiil, Salaam...</span>
            <button onClick={() => setActiveTab("accounts")} className="text-indigo-600 hover:underline">
              Eeg akoonka
            </button>
          </div>
        </div>

        {/* 8. Wallet / Mobile Money Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mobile Money (Zaad / Sahal)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(mobileBalanceUSD, mobileBalanceSLSH)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Zaad, E-Dahab, Sahal</span>
            <button onClick={() => setActiveTab("accounts")} className="text-indigo-600 hover:underline">
              Eeg akoonka
            </button>
          </div>
        </div>
      </div>

      {/* Gemini AI Financial Insights Card */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-4 sm:p-5 dark:border-indigo-900/60 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Falanqaynta Maaliyadeed ee AI (Gemini AI Financial Advisor)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hel falanqayn qoto-dheer oo ku saabsan faa'iidadaada, kharashaadka ugu badan, iyo talooyin maamul.
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestAiInsights}
            disabled={aiLoading}
            id="btn-ai-analyze-financials"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition active:scale-95 shrink-0"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>AI baa falanqaynaysa...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Falanqee Maaliyadda</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {aiError}
          </div>
        )}

        {aiAnalysis && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-white/80 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 shadow-xs whitespace-pre-line">
            {aiAnalysis}
          </div>
        )}
      </div>

      {/* Visual Analytics / Charts Section (Item 1: Charts) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Income vs Expenses Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dakhliga vs Kharashka (Income vs Expenses)
              </h3>
              <p className="text-[11px] text-slate-500">Isku-barbardhigga muddada hadda la doortay</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {formatTimeFilterLabel(timeFilter)}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {/* Income bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Dakhli (Income)
                </span>
                <span className="text-slate-900 dark:text-white">
                  {formatCurrency(totalIncomeUSD, totalIncomeSLSH)}
                </span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(8, (totalIncomeUSD / (Math.max(totalIncomeUSD, totalExpenseUSD) || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Expense bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-600 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Kharash (Expense)
                </span>
                <span className="text-slate-900 dark:text-white">
                  {formatCurrency(totalExpenseUSD, totalExpenseSLSH)}
                </span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(8, (totalExpenseUSD / (Math.max(totalIncomeUSD, totalExpenseUSD) || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Net Ratio indicator */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Heerka Badbaadinta (Savings Ratio):</span>
              <span className={`font-bold ${netBalanceUSD >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {totalIncomeUSD > 0 ? `${Math.round((netBalanceUSD / totalIncomeUSD) * 100)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Expenses by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kharashka Qaybaha (Expense by Category)
              </h3>
              <p className="text-[11px] text-slate-500">Halka ay lacagtu u baxday</p>
            </div>
            <button
              onClick={() => setActiveTab("expense")}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Faahfaahin →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {expensesByCategory.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Ma jiraan kharashyo muddadan la qoray.</p>
            ) : (
              expensesByCategory.slice(0, 5).map(([cat, amount]) => {
                const percent = totalExpenseUSD > 0 ? Math.round((amount / totalExpenseUSD) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">{cat}</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {formatCurrency(amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 3: Income by Service */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dakhliga Adeegyada (Income by Service)
              </h3>
              <p className="text-[11px] text-slate-500">Adeegyada ugu dakhliga badan</p>
            </div>
            <button
              onClick={() => setActiveTab("services")}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Adeegyada →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {incomeByService.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Ma jiraan dakhli adeeg muddadan.</p>
            ) : (
              incomeByService.slice(0, 5).map(([srv, amount]) => {
                const percent = totalIncomeUSD > 0 ? Math.round((amount / totalIncomeUSD) * 100) : 0;
                return (
                  <div key={srv}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{srv}</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {formatCurrency(amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 4: Account Balance Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Isku-dheellitirka Xisaabaadka (Account Balances)
              </h3>
              <p className="text-[11px] text-slate-500">Halka ay lacagtu ku kala jirto hadda</p>
            </div>
            <button
              onClick={() => setActiveTab("accounts")}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Maamul Akoonada →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: acc.color || "#6366f1" }}
                  />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{acc.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{acc.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(acc.currentBalanceUSD, acc.currentBalanceSLSH)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Dhaqdhaqaaqii Ugu Dambeeyay (Recent Transactions)
            </h3>
            <p className="text-[11px] text-slate-500">Dakhligii iyo kharashaadkii u dambeeyay</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("income")}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              Dhammaan Dakhliga
            </button>
            <button
              onClick={() => setActiveTab("expense")}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              Dhammaan Kharashka
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                <th className="pb-2 font-semibold">Nooca (Type)</th>
                <th className="pb-2 font-semibold">Taariikhda</th>
                <th className="pb-2 font-semibold">Magaca / Qaybta</th>
                <th className="pb-2 font-semibold">Faahfaahin</th>
                <th className="pb-2 font-semibold">Habka</th>
                <th className="pb-2 font-semibold text-right">Cadadka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Ma jiro wax dhaqdhaqaaq ah oo la helay.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3">
                      {item.type === "income" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <TrendingUp className="h-3 w-3" /> Dakhli
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          <TrendingDown className="h-3 w-3" /> Kharash
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{item.date}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.title}</td>
                    <td className="py-3 text-slate-500 max-w-[200px] truncate">{item.subtitle}</td>
                    <td className="py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.paymentMethod}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-black ${
                        item.type === "income" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {item.type === "income" ? "+" : "-"}
                      {formatCurrency(item.amountUSD, item.amountSLSH)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />
    </div>
  );
};
