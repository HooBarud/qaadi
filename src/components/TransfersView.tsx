import React, { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  X,
  Wallet,
  Building,
  Smartphone,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Currency, TransferTransaction } from "../types";
import { exportToExcel } from "../utils/excel";

export const TransfersView: React.FC = () => {
  const {
    transfers,
    accounts,
    activeBusiness,
    addTransfer,
    deleteTransfer,
    formatCurrency,
    exchangeRate,
    canDelete,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const fromAcc = accounts.find((a) => a.id === t.fromAccountId)?.name || "";
      const toAcc = accounts.find((a) => a.id === t.toAccountId)?.name || "";
      const matchSearch =
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        fromAcc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        toAcc.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSearch;
    });
  }, [transfers, searchTerm, accounts]);

  const handleOpenAdd = () => {
    setDate(new Date().toISOString().substring(0, 10));
    setReferenceNo(`TRF-REF-${Math.floor(100 + Math.random() * 900)}`);
    setFromAccountId(accounts[0]?.id || "");
    setToAccountId(accounts[1]?.id || accounts[0]?.id || "");
    setCurrency("USD");
    setAmount(0);
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      alert("Fadlan kala dooro laba akoon oo kala duwan.");
      return;
    }
    if (amount <= 0) {
      alert("Fadlan geli cadad lacageed oo sax ah.");
      return;
    }

    const cleanAmt = Number(amount);
    let amountUSD = 0;
    let amountSLSH = 0;

    if (currency === "USD") {
      amountUSD = cleanAmt;
      amountSLSH = cleanAmt * exchangeRate;
    } else {
      amountSLSH = cleanAmt;
      amountUSD = cleanAmt / (exchangeRate || 1);
    }

    addTransfer({
      date,
      fromAccountId,
      toAccountId,
      amountUSD,
      amountSLSH,
      currency,
      referenceNo,
      notes,
    });

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = filteredTransfers.map((t) => {
      const fromAcc = accounts.find((a) => a.id === t.fromAccountId)?.name || "";
      const toAcc = accounts.find((a) => a.id === t.toAccountId)?.name || "";
      return {
        "ID": t.id,
        "Date": t.date,
        "Reference": t.referenceNo || "",
        "From Account": fromAcc,
        "To Account": toAcc,
        "Amount (USD)": t.amountUSD,
        "Amount (SLSH)": t.amountSLSH,
        "Notes": t.notes || "",
        "Created By": t.createdBy,
      };
    });
    exportToExcel(data, `Wareejinta_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Wareejinta Lacagta (Account Transfers)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            U wareeji lacag qasnadda gacanta iyo bangiga, ama Zaad-ka iyo qasnadda xafiiska adigoon dakhli iyo kharash ku darin.
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

          <button
            onClick={handleOpenAdd}
            id="btn-add-transfer-main"
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Wareeji Lacag</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi wareejin, akoon, faahfaahin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-bold">ID / Ref</th>
                <th className="px-4 py-3 font-bold">Taariikhda</th>
                <th className="px-4 py-3 font-bold">Laga Soo Qaaday (From)</th>
                <th className="px-4 py-3 font-bold">Lagu Shubay (To)</th>
                <th className="px-4 py-3 font-bold">Faahfaahin</th>
                <th className="px-4 py-3 font-bold text-right">Cadadka</th>
                <th className="px-4 py-3 font-bold text-right">Ficilka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Wax wareejin lacageed ah lama diiwaangelin.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((item) => {
                  const fromAcc = accounts.find((a) => a.id === item.fromAccountId);
                  const toAcc = accounts.find((a) => a.id === item.toAccountId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        <div>{item.id}</div>
                        {item.referenceNo && (
                          <div className="text-[10px] text-slate-400 font-normal">{item.referenceNo}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                      <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">
                        {fromAcc?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {toAcc?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {item.notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(item.amountUSD, item.amountSLSH)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm("Ma hubtaa inaad tirtirto wareejintan?")) {
                                deleteTransfer(item.id);
                              }
                            }}
                            title="Tirtir"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Wareejin Lacag (Fund Transfer)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taariikhda *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="TRF-001"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* From Account */}
              <div>
                <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                  Akoonka Laga Jarayo (From Account) *
                </label>
                <select
                  required
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs dark:border-rose-900/60 dark:bg-slate-800 dark:text-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.currentBalanceUSD.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account */}
              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Akoonka Lagu Shubayo (To Account) *
                </label>
                <select
                  required
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs dark:border-emerald-900/60 dark:bg-slate-800 dark:text-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.currentBalanceUSD.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nooca Lacagta
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SLSH">SLSH (Sh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cadadka ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0.01}
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sababta Wareejinta (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tusaale: Zaad laga soo saaray qasnadda lagu shubay..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 active:scale-95 shadow-sm transition"
                >
                  Xaqiiji Wareejinta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
