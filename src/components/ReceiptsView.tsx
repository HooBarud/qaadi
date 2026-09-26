import React, { useState, useMemo } from "react";
import {
  Receipt,
  Search,
  Plus,
  Printer,
  Trash2,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  DollarSign,
  User,
  CreditCard,
  X,
  Filter,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Receipt as ReceiptType, PaymentMethod } from "../types";
import { exportToExcel, exportToCsv } from "../utils/excel";

interface ReceiptsViewProps {
  onPrintReceipt: (receipt: ReceiptType) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({ onPrintReceipt }) => {
  const {
    receipts,
    generateReceipt,
    accounts,
    clients,
    activeBusiness,
    currentUser,
    formatCurrency,
    viewCurrency,
    canDelete,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month" | "year">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // New receipt form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [description, setDescription] = useState("");
  const [amountUSD, setAmountUSD] = useState<number>(0);
  const [amountSLSH, setAmountSLSH] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState("");

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Business check
      if (r.businessId !== activeBusiness.id) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesClient = r.clientName.toLowerCase().includes(query);
        const matchesId = r.id.toLowerCase().includes(query);
        const matchesDesc = (r.description || "").toLowerCase().includes(query);
        if (!matchesClient && !matchesId && !matchesDesc) return false;
      }

      // Date filter
      if (dateFilter === "today") {
        const todayStr = new Date().toISOString().substring(0, 10);
        return r.date === todayStr;
      }
      if (dateFilter === "month") {
        const monthStr = new Date().toISOString().substring(0, 7);
        return r.date.startsWith(monthStr);
      }
      if (dateFilter === "year") {
        const yearStr = new Date().getFullYear().toString();
        return r.date.startsWith(yearStr);
      }

      return true;
    });
  }, [receipts, activeBusiness.id, searchTerm, dateFilter]);

  // Aggregate stats
  const totalAmountUSD = filteredReceipts.reduce((acc, r) => acc + (r.amountUSD || 0), 0);
  const totalAmountSLSH = filteredReceipts.reduce((acc, r) => acc + (r.amountSLSH || 0), 0);

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayCount = receipts.filter((r) => r.businessId === activeBusiness.id && r.date === todayStr).length;

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || amountUSD <= 0) {
      alert("Fadlan geli magaca macmiilka iyo cadadka lacagta.");
      return;
    }

    const created = generateReceipt({
      date,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      description: description.trim() || "Bixinta Adeegga Notary",
      amountUSD: Number(amountUSD),
      amountSLSH: Number(amountSLSH || amountUSD * (activeBusiness.exchangeRate || 10000)),
      currency: "USD",
      paymentMethod,
      accountId: accountId || accounts[0]?.id || "acc-1",
      receivedBy: currentUser.name,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setClientName("");
    setClientPhone("");
    setDescription("");
    setAmountUSD(0);
    setAmountSLSH(0);
    setNotes("");
    setShowAddModal(false);

    // Offer to immediately print
    onPrintReceipt(created);
  };

  const handleExportExcel = () => {
    const data = filteredReceipts.map((r) => ({
      "Receipt No": r.id,
      "Taariikhda": r.date,
      "Macmiilka": r.clientName,
      "Ujeeddada": r.description,
      "Cadadka (USD)": r.amountUSD,
      "Cadadka (SLSH)": r.amountSLSH,
      "Habka Bixinta": r.paymentMethod,
      "Waxaa Qabtay": r.receivedBy,
      "Notes": r.notes || "",
    }));
    exportToExcel(data, `Rasiidhada_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  const handleExportCsv = () => {
    const data = filteredReceipts.map((r) => ({
      "Receipt No": r.id,
      "Date": r.date,
      "Client": r.clientName,
      "Description": r.description,
      "Amount USD": r.amountUSD,
      "Amount SLSH": r.amountSLSH,
      "Payment Method": r.paymentMethod,
      "Received By": r.receivedBy,
      "Notes": r.notes || "",
    }));
    exportToCsv(data, `Rasiidhada_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Receipt className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Rasiidhada (Receipts & Payment Slips)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maamulka, daabacaadda, iyo diiwaanka rasiidhada lacag-bixinta macaamiisha notary-ga.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            id="create-receipt-btn"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Abuur Rasiidh Cusub</span>
          </button>

          <button
            onClick={handleExportCsv}
            id="receipts-export-csv-btn"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition shadow-xs cursor-pointer"
            title="Download receipts as CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Wadarta Rasiidhada
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {filteredReceipts.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Rasiidh la bixiyay</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lacagta Rasiidhada Lagu Helay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalAmountUSD, totalAmountSLSH)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Wadarta lacagaha rasiidhada</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rasiidhada Maanta
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {todayCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">La jaray maanta</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Raadi rasiidh, macmiil, ama lambar..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setDateFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              dateFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Dhammaan
          </button>
          <button
            onClick={() => setDateFilter("today")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              dateFilter === "today"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Maanta
          </button>
          <button
            onClick={() => setDateFilter("month")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              dateFilter === "month"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Bishan
          </button>
          <button
            onClick={() => setDateFilter("year")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              dateFilter === "year"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Sannadkan
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3">Lambar (Receipt #)</th>
                <th className="px-4 py-3">Taariikhda</th>
                <th className="px-4 py-3">Macmiilka</th>
                <th className="px-4 py-3">Ujeeddada / Adeegga</th>
                <th className="px-4 py-3">Habka Bixinta</th>
                <th className="px-4 py-3 text-right">Cadadka (USD)</th>
                <th className="px-4 py-3 text-right">Cadadka (SLSH)</th>
                <th className="px-4 py-3 text-center">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold">Wax rasiidh ah lama helin.</p>
                    <p className="text-[11px] mt-1">Guji "+ Abuur Rasiidh Cusub" si aad rasiidh cusub u jarto.</p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {r.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {r.clientName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {r.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ${r.amountUSD.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-500">
                      {Math.round(r.amountSLSH).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onPrintReceipt(r)}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
                        title="Daabac Rasiidhka"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Daabac</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Receipt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jaridda Rasiidh Cusub (Issue Receipt)
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Magaca Macmiilka *
                </label>
                <input
                  type="text"
                  list="clients-list"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Geli magaca macmiilka ama xafiiska..."
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                />
                <datalist id="clients-list">
                  {clients.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Telefoonka Macmiilka
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+252..."
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Taariikhda *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Ujeeddada / Adeegga *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tusaale: Heshiis Qoraal Sharci, Wakaalad, Kala Wareejin..."
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Cadadka (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amountUSD || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setAmountUSD(val);
                      setAmountSLSH(val * (activeBusiness.exchangeRate || 10000));
                    }}
                    placeholder="0.00"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    U Dhiganta (SLSH)
                  </label>
                  <input
                    type="number"
                    value={amountSLSH || ""}
                    onChange={(e) => setAmountSLSH(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Habka Bixinta *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Cash">Kaash (Cash)</option>
                    <option value="Zaad">Zaad Service</option>
                    <option value="Sahal">Sahal</option>
                    <option value="E-Dahab">E-Dahab</option>
                    <option value="Bank">Banka (Bank Transfer)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Akoonka Lagu Shubo *
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Xusuusin / Faahfaahin Dheeraad ah
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Xusuusin ku qoran rasiidhka..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Jir & Daabac Rasiidhka</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
