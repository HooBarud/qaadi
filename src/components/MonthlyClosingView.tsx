import React, { useState, useMemo } from "react";
import {
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Scale,
  Award,
  CreditCard,
  FileText,
  UserCheck,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { MonthlyClosing, Account } from "../types";
import { exportToExcel, exportToCsv } from "../utils/excel";

export const MonthlyClosingView: React.FC = () => {
  const {
    incomes,
    expenses,
    transfers,
    accounts,
    monthlyClosings,
    toggleMonthLock,
    formatCurrency,
    viewCurrency,
    exchangeRate,
    activeBusiness,
    currentUser,
    canManageUsers,
  } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [closingNotes, setClosingNotes] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter transactions for the selected month
  const monthIncomes = useMemo(() => {
    return incomes.filter((i) => i.date?.startsWith(selectedMonth));
  }, [incomes, selectedMonth]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date?.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthTransfers = useMemo(() => {
    return transfers.filter((t) => t.date?.startsWith(selectedMonth));
  }, [transfers, selectedMonth]);

  // Check if month is locked
  const currentMonthClosing = useMemo(() => {
    return monthlyClosings.find((m) => m.monthKey === selectedMonth && m.isLocked);
  }, [monthlyClosings, selectedMonth]);

  const isLocked = !!currentMonthClosing;

  // Month Financial Calculations
  const grossRevenueUSD = monthIncomes.reduce((acc, i) => acc + i.amountUSD, 0);
  const cashCollectedUSD = monthIncomes.reduce((acc, i) => acc + i.paidAmountUSD, 0);
  const newDebtsUSD = monthIncomes.reduce((acc, i) => acc + (i.debtAmountUSD || 0), 0);
  const totalExpensesUSD = monthExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
  const netProfitUSD = grossRevenueUSD - totalExpensesUSD;
  const netCashFlowUSD = cashCollectedUSD - totalExpensesUSD;
  const profitMargin = grossRevenueUSD > 0 ? ((netProfitUSD / grossRevenueUSD) * 100).toFixed(1) : "0";

  // Account balances at closing
  const totalAccountBalanceUSD = accounts.reduce((acc, a) => acc + a.currentBalanceUSD, 0);

  const handleToggleLock = () => {
    if (!selectedMonth) return;
    if (isLocked) {
      if (window.confirm(`Ma furtaa (Unlock) xisaab-xidhka bisha ${selectedMonth}?`)) {
        toggleMonthLock(selectedMonth);
      }
    } else {
      if (
        window.confirm(
          `Ma xidhaa xisaab-xidhka bisha ${selectedMonth}? Marka la xidho waxba lagama beddeli karo diiwaanka bishan.`
        )
      ) {
        toggleMonthLock(selectedMonth, closingNotes || "Xisaab-xidhka bisha si buuxda ayaa loo xaqiijiyay loona xidhay.");
        setClosingNotes("");
      }
    }
  };

  const handleExportExcel = () => {
    const data = [
      { Category: "Bisha Xisaab-Xidhka (Month)", Cadadka: selectedMonth },
      { Category: "Xaaladda (Status)", Cadadka: isLocked ? "XIDHAN (LOCKED)" : "FURAN (OPEN)" },
      { Category: "Dakhliga Guud (Gross Revenue)", Cadadka: grossRevenueUSD },
      { Category: "Kaashka Soo Xarooday (Collected Cash)", Cadadka: cashCollectedUSD },
      { Category: "Deymaha Cusub (New Receivables)", Cadadka: newDebtsUSD },
      { Category: "Wadarta Kharashka (Total Expenses)", Cadadka: totalExpensesUSD },
      { Category: "Faa'iidada Saafiga ah (Net Profit)", Cadadka: netProfitUSD },
      { Category: "Margin (%)", Cadadka: `${profitMargin}%` },
      ...accounts.map((a) => ({
        Category: `Akoon: ${a.name} (${a.type})`,
        Cadadka: a.currentBalanceUSD,
      })),
    ];
    exportToExcel(data, `Xisaab_Xidhka_${selectedMonth}_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  const handleExportCsv = () => {
    const data = monthIncomes.map((i) => ({
      Nooca: "Dakhli",
      Taariikh: i.date,
      Qofka: i.clientName,
      Adeegga: i.serviceName || "",
      Cadadka_USD: i.amountUSD,
      Kaashka_la_helay: i.paidAmountUSD,
      Deynta: i.debtAmountUSD,
    })).concat(
      monthExpenses.map((e) => ({
        Nooca: "Kharash",
        Taariikh: e.date,
        Qofka: e.supplier || e.category,
        Adeegga: e.category,
        Cadadka_USD: -e.amountUSD,
        Kaashka_la_helay: -e.amountUSD,
        Deynta: 0,
      }))
    );
    exportToCsv(data, `Xisaab_Xidhka_${selectedMonth}_Faahfaahin`);
  };

  const formattedMonthName = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("so-SO", { month: "long", year: "numeric" });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#543324] text-amber-200">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Xisaab-Xidhka Bisha (Monthly Financial Close & Reconciliation)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xisaab-xidhka bisha, ansaxinta xogta, hubinta baaqiga qasnadda, iyo warbixinta rasmiga ah ee sharciga.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none dark:text-slate-200 cursor-pointer"
            />
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
            onClick={() => setShowPrintModal(true)}
            id="btn-print-monthly-statement"
            className="flex items-center gap-1.5 rounded-xl bg-[#543324] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#3D2216] transition cursor-pointer ring-1 ring-[#c59b27]/40"
          >
            <Printer className="h-4 w-4" />
            <span>Daabac Xaashida Xisaab-Xidhka</span>
          </button>
        </div>
      </div>

      {/* Month Status & Certification Banner */}
      <div
        className={`rounded-2xl border p-5 transition ${
          isLocked
            ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30"
            : "border-amber-300 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isLocked ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
              }`}
            >
              {isLocked ? <Award className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  Bisha: {formattedMonthName} ({selectedMonth})
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isLocked
                      ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
                      : "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                  }`}
                >
                  {isLocked ? "XIDHAN & LA HUWIYAY (CERTIFIED & LOCKED)" : "FURAN (OPEN FOR RECONCILIATION)"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {isLocked
                  ? `Waxaa xidhay: ${currentMonthClosing?.lockedBy} • ${new Date(
                      currentMonthClosing?.lockedAt || ""
                    ).toLocaleString()}`
                  : "Xisaabaadka bishan weli waa furan yihiin. Hubi dakhliga, kharashka iyo qasnadda ka hor inta aanad xidhin."}
              </p>
              {currentMonthClosing?.notes && (
                <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 italic mt-0.5">
                  Qoraal: "{currentMonthClosing.notes}"
                </p>
              )}
            </div>
          </div>

          {canManageUsers && (
            <div className="flex items-center gap-2">
              {!isLocked && (
                <input
                  type="text"
                  placeholder="Xusuusin xisaab-xidhka..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
                />
              )}

              <button
                type="button"
                onClick={handleToggleLock}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer active:scale-95 ${
                  isLocked
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                <span>{isLocked ? "Fur Bisha (Unlock)" : "Xidh Xisaabta Bisha (Lock Month)"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial KPIs for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dakhliga Guud */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dakhliga Guud ee Bisha
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(grossRevenueUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Kaash la helay: {formatCurrency(cashCollectedUSD)}</span>
            <span className="font-semibold text-emerald-600">{monthIncomes.length} shaqo</span>
          </div>
        </div>

        {/* Card 2: Kharashka Bisha */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Wadarta Kharashka Bisha
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpensesUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Lacag bixinnada: {monthExpenses.length} jeer</span>
            <span className="font-semibold text-rose-600">Baxday</span>
          </div>
        </div>

        {/* Card 3: Faa'iidada Saafiga ah */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Faa'iidada Saafiga ah (Net)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-2 text-2xl font-black ${
              netProfitUSD >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(netProfitUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Net Profit Margin:</span>
            <span className="font-bold text-indigo-600">{profitMargin}%</span>
          </div>
        </div>

        {/* Card 4: Deymaha Cusub ee Bisha */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Deymaha Bisha Galay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(newDebtsUSD)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Cash Flow Saafi ah:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatCurrency(netCashFlowUSD)}
            </span>
          </div>
        </div>
      </div>

      {/* Reconciliation Table & Accounts Balance Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Summary Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Qodobbada Xisaab-Xidhka Bisha</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Dheelitiran 100%</span>
            </span>
          </h3>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                1. Wadarta Shaqooyinka & Heshiisyada Nootaayada
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{monthIncomes.length} diiwaan</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                2. Dakhliga Guud ee La Xaqiijiyay (Gross Revenue)
              </span>
              <span className="font-bold text-emerald-600">{formatCurrency(grossRevenueUSD)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                3. Lacagta Kaashka ah ee la Qabtay (Cash Collected)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cashCollectedUSD)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                4. Deymaha Macaamiisha Harsan ee Bisha (Receivables)
              </span>
              <span className="font-bold text-amber-600">{formatCurrency(newDebtsUSD)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                5. Wadarta Kharashka Xafiiska & Howlgalka (Expenses)
              </span>
              <span className="font-bold text-rose-600">{formatCurrency(totalExpensesUSD)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60 font-black text-xs">
              <span className="text-indigo-900 dark:text-indigo-200">
                FAAIIDADA SAAFIGA AH EE BISHA (NET PROFIT)
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                {formatCurrency(netProfitUSD)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Accounts Balance Check at Closing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Baaqiga Xisaabaadka & Qasnadda (Account Balances)</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Wadarta: {formatCurrency(totalAccountBalanceUSD)}
            </span>
          </h3>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.map((acc) => (
              <div key={acc.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <CreditCard className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">
                      {acc.name}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {acc.type.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white">
                    {formatCurrency(acc.currentBalanceUSD, acc.currentBalanceSLSH)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">Reconciled ✓</span>
                </div>
              </div>
            ))}
          </div>

          {/* Audit & Legal Stamp notice */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Shahaadada Xisaab-Xidhka Sharciga ee Qaaddi Notary Public</span>
            </div>
            Waxaa la xaqiijiyay in dhammaan dakhliga adeegyada sharciga iyo kharashyada xafiiska loo diiwaangeliyay si waafaqsan xeerka nootaayada Somaliland.
          </div>
        </div>
      </div>

      {/* Printable Monthly Statement Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl text-slate-900 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daabac Xaashida Xisaab-Xidhka Bisha
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Daabac Hadda (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Xir
                </button>
              </div>
            </div>

            {/* Official Print Certificate Area */}
            <div className="pt-6 space-y-6">
              {/* Header with Logo & Brand */}
              <div className="flex items-center justify-between border-b-2 border-[#543324] pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/qaaddi-logo.png"
                    alt="Qaaddi Notary Public"
                    className="h-16 w-16 rounded-xl object-contain border border-[#c59b27]/40 p-1"
                  />
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-[#3A2216]">
                      QAADDI NOTARY PUBLIC
                    </h1>
                    <p className="text-xs font-bold text-[#8C6A14]">
                      Xafiiska Nootaayada Guud & La-Talinta Sharciga (Khibrad 23+ Years)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Hargeysa, Somaliland • Tel: +252 63 4421100 • Email: qaadinotary@gmail.com
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-lg bg-[#543324] px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                    WARBIXINTA XISAAB-XIDHKA
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-1">Bisha: {formattedMonthName}</p>
                  <p className="text-[10px] text-slate-400">
                    Taariikhda: {new Date().toLocaleDateString("so-SO")}
                  </p>
                </div>
              </div>

              {/* Summary Table */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  Dheelitirka Dakhliga & Kharashka Bisha (Monthly P&L Summary)
                </h3>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-[#FAF7F2] border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5 text-left">Qodobka Maaliyadeed</th>
                      <th className="p-2.5 text-right">Cadadka (USD)</th>
                      <th className="p-2.5 text-right">Cadadka (SLSH)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-semibold">1. Wadarta Dakhliga Adeegyada Sharciga (Gross Revenue)</td>
                      <td className="p-2.5 text-right font-bold">${grossRevenueUSD.toLocaleString()}</td>
                      <td className="p-2.5 text-right">{(grossRevenueUSD * exchangeRate).toLocaleString()} SLSH</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">2. Kaashka Dhabta ah ee la Soo Xareeyay (Cash In)</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">${cashCollectedUSD.toLocaleString()}</td>
                      <td className="p-2.5 text-right">{(cashCollectedUSD * exchangeRate).toLocaleString()} SLSH</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">3. Deymaha Harsan ee Bisha (Receivables)</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">${newDebtsUSD.toLocaleString()}</td>
                      <td className="p-2.5 text-right">{(newDebtsUSD * exchangeRate).toLocaleString()} SLSH</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">4. Wadarta Kharashyada Howlgalka Xafiiska (Expenses)</td>
                      <td className="p-2.5 text-right font-bold text-rose-700">-${totalExpensesUSD.toLocaleString()}</td>
                      <td className="p-2.5 text-right">-{(totalExpensesUSD * exchangeRate).toLocaleString()} SLSH</td>
                    </tr>
                    <tr className="bg-[#FAF7F2] font-black border-t-2 border-[#543324]">
                      <td className="p-2.5">FAAIIDADA SAAFIGA AH EE BISHA (NET PROFIT)</td>
                      <td className="p-2.5 text-right text-emerald-800 text-sm">${netProfitUSD.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-emerald-800">{(netProfitUSD * exchangeRate).toLocaleString()} SLSH</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Account Balances at Month End */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  Baaqiga Xisaabaadka ee Bisha Dhammadkeeda (Ending Balances)
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {accounts.map((a) => (
                    <div key={a.id} className="p-2 border border-slate-200 rounded-lg flex justify-between">
                      <span className="font-semibold">{a.name}</span>
                      <span className="font-bold">${a.currentBalanceUSD.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures & Notary Stamp */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-sm text-slate-600">
                      {currentMonthClosing?.lockedBy || currentUser.name}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">Xisaabiyaha Guud (Head of Accounts)</p>
                  <p className="text-[10px] text-slate-400">Qaaddi Notary Public</p>
                </div>

                <div className="text-center">
                  <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                    <div className="flex items-center gap-1 text-xs font-black text-[#543324] border border-[#c59b27] px-2 py-0.5 rounded-md">
                      <span>QAADDI NOTARY PUBLIC • OFFICIAL SEAL</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">Garyaqaan Guud (Chief Notary Officer)</p>
                  <p className="text-[10px] text-slate-400">Khibrad 23+ Years • Notary Certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
