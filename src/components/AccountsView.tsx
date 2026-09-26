import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  ArrowLeftRight,
  Wallet,
  Building,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  X,
  History,
  CheckCircle2,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Account, AccountType, Currency } from "../types";

export const AccountsView: React.FC = () => {
  const {
    accounts,
    incomes,
    expenses,
    transfers,
    partialPayments,
    addAccount,
    updateAccount,
    deleteAccount,
    openQuickAction,
    formatCurrency,
    exchangeRate,
    canEdit,
    canDelete,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccHistory, setSelectedAccHistory] = useState<Account | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [openingBalanceUSD, setOpeningBalanceUSD] = useState<number>(0);
  const [openingBalanceSLSH, setOpeningBalanceSLSH] = useState<number>(0);
  const [color, setColor] = useState("#6366f1");

  const totalUSD = accounts.reduce((acc, a) => acc + a.currentBalanceUSD, 0);
  const totalSLSH = accounts.reduce((acc, a) => acc + a.currentBalanceSLSH, 0);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setName("");
    setType("cash");
    setAccountNumber("");
    setBankName("");
    setOpeningBalanceUSD(0);
    setOpeningBalanceSLSH(0);
    setColor("#10b981");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setAccountNumber(acc.accountNumber || "");
    setBankName(acc.bankName || "");
    setOpeningBalanceUSD(acc.openingBalanceUSD);
    setOpeningBalanceSLSH(acc.openingBalanceSLSH);
    setColor(acc.color || "#6366f1");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name,
        type,
        accountNumber,
        bankName,
        openingBalanceUSD: Number(openingBalanceUSD),
        openingBalanceSLSH: Number(openingBalanceSLSH),
        color,
      });
    } else {
      addAccount({
        name,
        type,
        accountNumber,
        bankName,
        openingBalanceUSD: Number(openingBalanceUSD),
        openingBalanceSLSH: Number(openingBalanceSLSH),
        color,
      });
    }

    setIsModalOpen(false);
  };

  // Get timeline transactions for the selected account
  const accountTimeline = useMemo(() => {
    if (!selectedAccHistory) return [];
    const accId = selectedAccHistory.id;

    const list: Array<{
      id: string;
      date: string;
      title: string;
      direction: "in" | "out";
      amountUSD: number;
      amountSLSH: number;
      typeLabel: string;
    }> = [];

    // Incomes deposited into this account
    incomes
      .filter((i) => i.accountId === accId && i.paidAmountUSD > 0)
      .forEach((i) => {
        list.push({
          id: i.id,
          date: i.date,
          title: `Dakhli: ${i.clientName} (${i.serviceName})`,
          direction: "in",
          amountUSD: i.paidAmountUSD,
          amountSLSH: i.paidAmountSLSH,
          typeLabel: "Dakhli (Income)",
        });
      });

    // Partial payments deposited into this account
    partialPayments
      .filter((p) => p.accountId === accId)
      .forEach((p) => {
        list.push({
          id: p.id,
          date: p.date,
          title: `Lacag Bixin Qayb ah: ${p.clientName || "Macmiil"}`,
          direction: "in",
          amountUSD: p.amountUSD,
          amountSLSH: p.amountSLSH,
          typeLabel: "Payment",
        });
      });

    // Expenses paid out of this account
    expenses
      .filter((e) => e.accountId === accId)
      .forEach((e) => {
        list.push({
          id: e.id,
          date: e.date,
          title: `Kharash: ${e.category} (${e.description})`,
          direction: "out",
          amountUSD: e.amountUSD,
          amountSLSH: e.amountSLSH,
          typeLabel: "Kharash (Expense)",
        });
      });

    // Transfers OUT
    transfers
      .filter((t) => t.fromAccountId === accId)
      .forEach((t) => {
        const toAccName = accounts.find((a) => a.id === t.toAccountId)?.name || "Akoon kale";
        list.push({
          id: t.id,
          date: t.date,
          title: `Wareejin Laga Jaray → ${toAccName}`,
          direction: "out",
          amountUSD: t.amountUSD,
          amountSLSH: t.amountSLSH,
          typeLabel: "Wareejin (Transfer Out)",
        });
      });

    // Transfers IN
    transfers
      .filter((t) => t.toAccountId === accId)
      .forEach((t) => {
        const fromAccName = accounts.find((a) => a.id === t.fromAccountId)?.name || "Akoon kale";
        list.push({
          id: t.id,
          date: t.date,
          title: `Wareejin Lagu Soo Shubay ← ${fromAccName}`,
          direction: "in",
          amountUSD: t.amountUSD,
          amountSLSH: t.amountSLSH,
          typeLabel: "Wareejin (Transfer In)",
        });
      });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccHistory, incomes, expenses, transfers, partialPayments, accounts]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Xisaabaadka & Qasnadda (Bank & Cash Accounts)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maamul qasnadda xafiiska, koontooyinka bangiyada, iyo adeegyada Telesom Zaad / Sahal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openQuickAction("transfer")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <ArrowLeftRight className="h-4 w-4 text-sky-600" />
            <span>Wareeji Lacag</span>
          </button>

          <button
            onClick={handleOpenAdd}
            id="btn-add-account-main"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Kudar Akoon Cusub</span>
          </button>
        </div>
      </div>

      {/* Summary Total Card */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400">
            Wadarta Dhammaan Xisaabaadka (Total Cash & Bank Assets)
          </span>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalUSD, totalSLSH)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Isku-geynta lacagta kaashka ah, bangiyada, iyo mobile money-ga.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-200">
            {accounts.length} Akoon oo shaqaynaya
          </span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => {
          const isCash = acc.type === "cash";
          const isBank = acc.type === "bank";
          const isMobile = acc.type === "mobile_money";

          return (
            <div
              key={acc.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-xs"
                      style={{ backgroundColor: acc.color || "#6366f1" }}
                    >
                      {isCash && <Wallet className="h-5 w-5" />}
                      {isBank && <Building className="h-5 w-5" />}
                      {isMobile && <Smartphone className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {acc.name}
                      </h4>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        {acc.type === "cash" ? "Cash Drawer" : acc.type === "bank" ? "Bank Account" : "Mobile Money"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        title="Wax ka beddel"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Ma hubtaa inaad tirtirto akoonka ${acc.name}?`)) {
                            deleteAccount(acc.id);
                          }
                        }}
                        title="Tirtir"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {acc.accountNumber && (
                    <p className="flex justify-between">
                      <span>Account No:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {acc.accountNumber}
                      </span>
                    </p>
                  )}
                  {acc.bankName && (
                    <p className="flex justify-between">
                      <span>Bangiga:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{acc.bankName}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span>Furitaankii hore:</span>
                    <span>${acc.openingBalanceUSD.toLocaleString()}</span>
                  </p>
                </div>

                {/* Current Balances */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Haraaga Hadda (Current Balance)</span>
                  <p className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">
                    ${acc.currentBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.round(acc.currentBalanceSLSH).toLocaleString()} SLSH
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAccHistory(acc)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Dhaqdhaqaaqa Akoonka</span>
                </button>
                <button
                  onClick={() => openQuickAction("transfer")}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Wareeji
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Timeline & Statement Modal */}
      {selectedAccHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: selectedAccHistory.color || "#6366f1" }}
                >
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedAccHistory.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Haraaga Hadda: {formatCurrency(selectedAccHistory.currentBalanceUSD, selectedAccHistory.currentBalanceSLSH)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccHistory(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 font-semibold">Taariikh</th>
                    <th className="p-2.5 font-semibold">Faahfaahin</th>
                    <th className="p-2.5 font-semibold">Nooca</th>
                    <th className="p-2.5 font-semibold text-right">Cadadka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {accountTimeline.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Weli wax dhaqdhaqaaq ah kuma jiro akoonkan.
                      </td>
                    </tr>
                  ) : (
                    accountTimeline.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{item.date}</td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{item.title}</td>
                        <td className="p-2.5 text-slate-400">{item.typeLabel}</td>
                        <td
                          className={`p-2.5 text-right font-bold whitespace-nowrap ${
                            item.direction === "in" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {item.direction === "in" ? "+" : "-"}
                          {formatCurrency(item.amountUSD, item.amountSLSH)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedAccHistory(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Xidh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAccount ? "Wax ka beddel Akoonka" : "Kudar Akoon Cusub"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Magaca Akoonka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Zaad Service, Dahabshiil Bank, Qasnadda..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nooca Akoonka (Type)
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="cash">Cash (Qasnadda Xafiiska)</option>
                  <option value="bank">Bank (Koontada Bangiga)</option>
                  <option value="mobile_money">Mobile Money (Zaad / Sahal / E-Dahab)</option>
                </select>
              </div>

              {type !== "cash" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Magaca Bangiga / Shirkadda
                    </label>
                    <input
                      type="text"
                      placeholder="Tusaale: Dahabshiil Bank, Telesom..."
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lambarka Akoonka (Account / Phone No)
                    </label>
                    <input
                      type="text"
                      placeholder="Tusaale: 063-4421100 ama ACC-7782"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Furitaanka USD ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={openingBalanceUSD}
                    onChange={(e) => setOpeningBalanceUSD(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Furitaanka SLSH (Sh)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={openingBalanceSLSH}
                    onChange={(e) => setOpeningBalanceSLSH(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Midabka Astaanta (Color)
                </label>
                <div className="flex items-center gap-2">
                  {["#10b981", "#0284c7", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        color === c ? "border-slate-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 shadow-sm transition"
                >
                  {editingAccount ? "Badbaadi Isbeddelka" : "Kudar Akoonka"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
