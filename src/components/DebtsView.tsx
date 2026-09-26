import React, { useState, useMemo } from "react";
import {
  Scale,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageCircle,
  DollarSign,
  Calendar,
  Phone,
  FileSpreadsheet,
  X,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Currency, PaymentMethod } from "../types";
import { exportToExcel } from "../utils/excel";

export interface DebtItem {
  id: string;
  sourceType: "income" | "invoice";
  type: "receivable" | "payable";
  entityName: string;
  phone?: string;
  date: string;
  dueDate?: string;
  totalAmountUSD: number;
  paidAmountUSD: number;
  remainingAmountUSD: number;
  currency: Currency;
  status: "unpaid" | "partial" | "paid";
  agingBucket: "0-30" | "31-60" | "61-90" | "90+";
  daysOverdue: number;
  description: string;
}

export const DebtsView: React.FC = () => {
  const {
    incomes,
    invoices,
    clients,
    accounts,
    activeBusiness,
    recordPartialPayment,
    formatCurrency,
    exchangeRate,
    canEdit,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<"receivable" | "payable">("receivable");
  const [searchTerm, setSearchTerm] = useState("");
  const [agingFilter, setAgingFilter] = useState<string>("all");

  // Derive consolidated debts from incomes and invoices
  const allDebts = useMemo<DebtItem[]>(() => {
    const list: DebtItem[] = [];
    const now = new Date().getTime();

    // From Incomes
    incomes.forEach((inc) => {
      if (inc.debtAmountUSD > 0) {
        const debtDueDate = inc.dueDate || inc.date;
        const diffTime = Math.max(0, now - new Date(debtDueDate).getTime());
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let bucket: "0-30" | "31-60" | "61-90" | "90+" = "0-30";
        if (days > 90) bucket = "90+";
        else if (days > 60) bucket = "61-90";
        else if (days > 30) bucket = "31-60";

        list.push({
          id: inc.id,
          sourceType: "income",
          type: "receivable",
          entityName: inc.clientName,
          phone: clients.find((c) => c.id === inc.clientId)?.phone,
          date: inc.date,
          dueDate: inc.dueDate,
          totalAmountUSD: inc.amountUSD,
          paidAmountUSD: inc.paidAmountUSD,
          remainingAmountUSD: inc.debtAmountUSD,
          currency: inc.currency,
          status: inc.paidAmountUSD > 0 ? "partial" : "unpaid",
          agingBucket: bucket,
          daysOverdue: days,
          description: inc.description,
        });
      }
    });

    // From Invoices
    invoices.forEach((inv) => {
      const balance = inv.balanceDueUSD ?? (inv.totalUSD - (inv.paidUSD || 0));
      if (balance > 0) {
        const diffTime = Math.max(0, now - new Date(inv.dueDate).getTime());
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let bucket: "0-30" | "31-60" | "61-90" | "90+" = "0-30";
        if (days > 90) bucket = "90+";
        else if (days > 60) bucket = "61-90";
        else if (days > 30) bucket = "31-60";

        list.push({
          id: inv.id,
          sourceType: "invoice",
          type: "receivable",
          entityName: inv.clientName,
          phone: inv.clientPhone || clients.find((c) => c.id === inv.clientId)?.phone,
          date: inv.date,
          dueDate: inv.dueDate,
          totalAmountUSD: inv.totalUSD,
          paidAmountUSD: inv.paidUSD || 0,
          remainingAmountUSD: balance,
          currency: inv.currency,
          status: (inv.paidUSD || 0) > 0 ? "partial" : "unpaid",
          agingBucket: bucket,
          daysOverdue: days,
          description: `Invoice ${inv.id}`,
        });
      }
    });

    return list;
  }, [incomes, invoices, clients]);

  // Partial Payment Modal State
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().substring(0, 10));
  const [payCurrency, setPayCurrency] = useState<Currency>("USD");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("Cash");
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || "");
  const [payNotes, setPayNotes] = useState("");

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return allDebts.filter((d) => {
      const matchType = d.type === activeTab;
      const matchSearch =
        d.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.phone && d.phone.includes(searchTerm));

      const matchAging = agingFilter === "all" || d.agingBucket === agingFilter;

      return matchType && matchSearch && matchAging;
    });
  }, [allDebts, activeTab, searchTerm, agingFilter]);

  // Aging stats for receivables
  const agingStats = useMemo(() => {
    const list = allDebts.filter((d) => d.type === activeTab && d.status !== "paid");
    const current = list.filter((d) => d.agingBucket === "0-30").reduce((acc, d) => acc + d.remainingAmountUSD, 0);
    const thirty = list.filter((d) => d.agingBucket === "31-60").reduce((acc, d) => acc + d.remainingAmountUSD, 0);
    const sixty = list.filter((d) => d.agingBucket === "61-90").reduce((acc, d) => acc + d.remainingAmountUSD, 0);
    const overdue90 = list.filter((d) => d.agingBucket === "90+").reduce((acc, d) => acc + d.remainingAmountUSD, 0);
    const totalRemaining = list.reduce((acc, d) => acc + d.remainingAmountUSD, 0);

    return { current, thirty, sixty, overdue90, totalRemaining };
  }, [allDebts, activeTab]);

  // Handle open Partial Payment
  const handleOpenPay = (debt: DebtItem) => {
    setPayingDebt(debt);
    setPayAmount(debt.remainingAmountUSD);
    setPayDate(new Date().toISOString().substring(0, 10));
    setPayCurrency(debt.currency);
    setPayMethod("Cash");
    setPayAccountId(accounts[0]?.id || "");
    setPayNotes(`Bixin deyn ah: ${debt.entityName}`);
  };

  // Submit Partial Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || payAmount <= 0) return;

    const amt = Number(payAmount);
    const amtUSD = payCurrency === "USD" ? amt : amt / (exchangeRate || 1);
    const amtSLSH = payCurrency === "USD" ? amt * (exchangeRate || 1) : amt;

    recordPartialPayment({
      invoiceId: payingDebt.sourceType === "invoice" ? payingDebt.id : undefined,
      incomeId: payingDebt.sourceType === "income" ? payingDebt.id : undefined,
      clientName: payingDebt.entityName,
      amountUSD: amtUSD,
      amountSLSH: amtSLSH,
      currency: payCurrency,
      paymentMethod: payMethod,
      accountId: payAccountId,
      date: payDate,
      notes: payNotes,
    });

    setPayingDebt(null);
  };

  // WhatsApp Reminder message
  const handleWhatsAppReminder = (debt: DebtItem) => {
    if (!debt.phone) {
      alert("Macmiilkan ma laha lambar telefoon.");
      return;
    }
    const cleanPhone = debt.phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Asc ${debt.entityName},\nWaxaan kugu xusuusinaynaa lacagta dhiman ee dhan ${formatCurrency(
        debt.remainingAmountUSD
      )} ee xafiiska ${activeBusiness.name}.\nFadlan xidhiidh xafiiska ama ku shub Zaad/Akoonkeena.\nMahadsanid!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  const handleExportExcel = () => {
    const data = filteredDebts.map((d) => ({
      "Ref/ID": d.id,
      "Macmiilka/Hay'adda": d.entityName,
      "Telefoonka": d.phone || "-",
      "Taariikh": d.date,
      "Due Date": d.dueDate || "-",
      "Aging (Maalmood)": `${d.daysOverdue} cisho (${d.agingBucket})`,
      "Wadarta Guud ($)": d.totalAmountUSD,
      "La Bixiyay ($)": d.paidAmountUSD,
      "Haraaga Dhiman ($)": d.remainingAmountUSD,
      "Xaaladda": d.status,
    }));
    exportToExcel(data, `Aging_Report_Deymaha_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Scale className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Maamulka Deymaha & Aging (Debts & Receivables)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kala saarista deynta wakhtiga ay dhiman tahay (0-30, 31-60, 61-90, 90+ maalmood) iyo fariimaha xusuusinta WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Soo Saaro Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("receivable")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "receivable"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Deymo Lagugu Leeyahay (Receivables / Macaamiisha)</span>
          <span className="ml-1 rounded-full bg-amber-800/40 px-1.5 py-0.5 text-[10px]">
            {allDebts.filter((d) => d.type === "receivable").length}
          </span>
        </button>
      </div>

      {/* Aging Analysis Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setAgingFilter("all")}
          className={`cursor-pointer rounded-2xl border p-3 transition ${
            agingFilter === "all"
              ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">Wadarta Guud</span>
          <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(agingStats.totalRemaining)}
          </p>
          <span className="text-[10px] text-slate-500">Dhammaan deynta</span>
        </div>

        <div
          onClick={() => setAgingFilter("0-30")}
          className={`cursor-pointer rounded-2xl border p-3 transition ${
            agingFilter === "0-30"
              ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-emerald-600">0 - 30 Maalmood</span>
          <p className="mt-1 text-lg font-black text-emerald-600">
            {formatCurrency(agingStats.current)}
          </p>
          <span className="text-[10px] text-emerald-600/70">Weli caadi ah</span>
        </div>

        <div
          onClick={() => setAgingFilter("31-60")}
          className={`cursor-pointer rounded-2xl border p-3 transition ${
            agingFilter === "31-60"
              ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-amber-600">31 - 60 Maalmood</span>
          <p className="mt-1 text-lg font-black text-amber-600">
            {formatCurrency(agingStats.thirty)}
          </p>
          <span className="text-[10px] text-amber-600/70">Xusuusin koowaad</span>
        </div>

        <div
          onClick={() => setAgingFilter("61-90")}
          className={`cursor-pointer rounded-2xl border p-3 transition ${
            agingFilter === "61-90"
              ? "border-orange-600 bg-orange-50/60 dark:bg-orange-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-orange-600">61 - 90 Maalmood</span>
          <p className="mt-1 text-lg font-black text-orange-600">
            {formatCurrency(agingStats.sixty)}
          </p>
          <span className="text-[10px] text-orange-600/70">Feejignaan dheeraad ah</span>
        </div>

        <div
          onClick={() => setAgingFilter("90+")}
          className={`col-span-2 sm:col-span-1 cursor-pointer rounded-2xl border p-3 transition ${
            agingFilter === "90+"
              ? "border-rose-600 bg-rose-50/60 dark:bg-rose-950/40"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-rose-600">90+ Maalmood (Khatar)</span>
          <p className="mt-1 text-lg font-black text-rose-600">
            {formatCurrency(agingStats.overdue90)}
          </p>
          <span className="text-[10px] text-rose-600/70">Waqtigu aad buu u dheeraaday</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi macmiil, telefoon, invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Aging:</span>
          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan (All Aging)</option>
            <option value="0-30">0 - 30 Maalmood</option>
            <option value="31-60">31 - 60 Maalmood</option>
            <option value="61-90">61 - 90 Maalmood</option>
            <option value="90+">90+ Maalmood (Overdue)</option>
          </select>
        </div>
      </div>

      {/* Debts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-bold">Ref / No.</th>
                <th className="px-4 py-3 font-bold">Macmiilka</th>
                <th className="px-4 py-3 font-bold">Telefoonka</th>
                <th className="px-4 py-3 font-bold">Taariikhda & Xilliga</th>
                <th className="px-4 py-3 font-bold text-center">Aging</th>
                <th className="px-4 py-3 font-bold text-right">Guud</th>
                <th className="px-4 py-3 font-bold text-right">La Bixiyay</th>
                <th className="px-4 py-3 font-bold text-right">Haraaga Dhiman</th>
                <th className="px-4 py-3 font-bold text-center">Ficil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Wax deyn ah oo buuxisa shuruudahan lama helin.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((d) => (
                  <tr key={`${d.sourceType}-${d.id}`} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {d.id}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                      {d.entityName}
                      <p className="text-[10px] font-normal text-slate-400">{d.description}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {d.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span>{d.date}</span>
                      {d.dueDate && (
                        <p className="text-[10px] text-amber-600 font-semibold">Due: {d.dueDate}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          d.agingBucket === "0-30"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : d.agingBucket === "31-60"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : d.agingBucket === "61-90"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {d.daysOverdue} cisho ({d.agingBucket})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(d.totalAmountUSD)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                      {formatCurrency(d.paidAmountUSD)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-rose-600">
                      {formatCurrency(d.remainingAmountUSD)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {d.phone && (
                          <button
                            onClick={() => handleWhatsAppReminder(d)}
                            title="U dir xusuusin WhatsApp"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenPay(d)}
                            className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition"
                          >
                            + Bixin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partial Payment Modal */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Diiwaangeli Bixinta Deynta ({payingDebt.entityName})
              </h3>
              <button
                onClick={() => setPayingDebt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Deynta Harta: <strong className="text-rose-600">${payingDebt.remainingAmountUSD.toFixed(2)}</strong>
            </p>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cadadka La Bixinayo *
                </label>
                <div className="flex gap-2">
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value as Currency)}
                    className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SLSH">SLSH (Sh)</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0.01}
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Taariikhda
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Habka Bixinta
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Zaad">Zaad</option>
                    <option value="Sahal">Sahal</option>
                    <option value="E-Dahab">E-Dahab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Akoonka Lagu Shubay
                  </label>
                  <select
                    value={payAccountId}
                    onChange={(e) => setPayAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qoraal / Faahfaahin
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                >
                  Xaqiiji Lacagta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
