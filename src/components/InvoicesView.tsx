import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  Calendar,
  DollarSign,
  Send,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Invoice, InvoiceItem, Currency, PaymentMethod } from "../types";
import { exportToExcel } from "../utils/excel";

interface InvoicesViewProps {
  onPrintInvoice?: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onPrintInvoice }) => {
  const {
    invoices,
    clients,
    services,
    accounts,
    exchangeRate,
    formatCurrency,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    recordPartialPayment,
    canDelete,
    canEdit,
    activeBusiness,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  // Form State for Invoice Creation
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [discountUSD, setDiscountUSD] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(activeBusiness.taxRatePercent || 0);
  const [paymentTerms, setPaymentTerms] = useState(
    activeBusiness.invoiceTerms || "Bixi 14 maalmood gudahood. Akoonka Zaad: 063-4421100"
  );
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<
    Array<{
      id: string;
      serviceId?: string;
      description: string;
      quantity: number;
      rateUSD: number;
      rateSLSH: number;
      amountUSD: number;
      amountSLSH: number;
    }>
  >([
    {
      id: "item-1",
      description: services[0]?.name || "Adeeg Sharci / Xisaabaad",
      quantity: 1,
      rateUSD: services[0]?.defaultPriceUSD || 100,
      rateSLSH: (services[0]?.defaultPriceUSD || 100) * exchangeRate,
      amountUSD: services[0]?.defaultPriceUSD || 100,
      amountSLSH: (services[0]?.defaultPriceUSD || 100) * exchangeRate,
    },
  ]);

  // Calculations for new invoice
  const subtotalUSD = items.reduce((acc, item) => acc + item.amountUSD, 0);
  const taxAmountUSD = (subtotalUSD * taxPercent) / 100;
  const totalUSD = Math.max(0, subtotalUSD + taxAmountUSD - discountUSD);

  const subtotalSLSH = subtotalUSD * exchangeRate;
  const taxAmountSLSH = taxAmountUSD * exchangeRate;
  const discountSLSH = discountUSD * exchangeRate;
  const totalSLSH = totalUSD * exchangeRate;

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        rateUSD: 0,
        rateSLSH: 0,
        amountUSD: 0,
        amountSLSH: 0,
      },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };

      if (field === "serviceId") {
        target.serviceId = value;
        const s = services.find((srv) => srv.id === value);
        if (s) {
          target.description = s.name;
          target.rateUSD = s.defaultPriceUSD;
          target.rateSLSH = s.defaultPriceSLSH;
        }
      } else if (field === "description") {
        target.description = value;
      } else if (field === "quantity") {
        target.quantity = Math.max(1, parseInt(value) || 1);
      } else if (field === "rateUSD") {
        target.rateUSD = Math.max(0, parseFloat(value) || 0);
        target.rateSLSH = target.rateUSD * exchangeRate;
      }

      target.amountUSD = target.quantity * target.rateUSD;
      target.amountSLSH = target.amountUSD * exchangeRate;
      copy[index] = target;
      return copy;
    });
  };

  // Submit create invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find((c) => c.id === clientId);
    if (!selectedClient || items.length === 0) return;

    addInvoice({
      date,
      dueDate,
      clientId,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      clientAddress: selectedClient.address,
      items: items.map((i) => ({
        id: i.id,
        serviceId: i.serviceId,
        description: i.description,
        quantity: i.quantity,
        rateUSD: i.rateUSD,
        rateSLSH: i.rateSLSH,
        amountUSD: i.amountUSD,
        amountSLSH: i.amountSLSH,
      })),
      subtotalUSD,
      subtotalSLSH,
      taxUSD: taxAmountUSD,
      taxSLSH: taxAmountSLSH,
      discountUSD,
      discountSLSH,
      totalUSD,
      totalSLSH,
      paidUSD: 0,
      paidSLSH: 0,
      balanceDueUSD: totalUSD,
      balanceDueSLSH: totalSLSH,
      currency,
      paymentInfo: paymentTerms,
      notes,
      status: "sent",
    });

    setIsCreateModalOpen(false);
  };

  // Payment Recording Modal State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payCurrency, setPayCurrency] = useState<Currency>("USD");
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || "");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("Cash");

  const openPaymentModal = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    const balance = invoice.balanceDueUSD ?? (invoice.totalUSD - (invoice.paidUSD || 0));
    setPayAmount(balance);
    setPayCurrency(invoice.currency);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || payAmount <= 0) return;

    const amt = Number(payAmount);
    recordPartialPayment({
      invoiceId: payingInvoice.id,
      clientId: payingInvoice.clientId,
      clientName: payingInvoice.clientName,
      amountUSD: payCurrency === "USD" ? amt : amt / exchangeRate,
      amountSLSH: payCurrency === "USD" ? amt * exchangeRate : amt,
      currency: payCurrency,
      paymentMethod: payMethod,
      accountId: payAccountId,
      date: new Date().toISOString().substring(0, 10),
      notes: `Lacag bixin qaansheeg ${payingInvoice.id}`,
    });

    setPayingInvoice(null);
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Summary Metrics
  const totalBilledUSD = filteredInvoices.reduce((acc, i) => acc + i.totalUSD, 0);
  const totalPaidUSD = filteredInvoices.reduce((acc, i) => acc + (i.paidUSD || 0), 0);
  const totalPendingUSD = filteredInvoices.reduce(
    (acc, i) => acc + (i.balanceDueUSD ?? (i.totalUSD - (i.paidUSD || 0))),
    0
  );

  const handleExportExcel = () => {
    const data = filteredInvoices.map((inv) => ({
      "Invoice No": inv.id,
      "Client": inv.clientName,
      "Date": inv.date,
      "Due Date": inv.dueDate,
      "Total USD": inv.totalUSD,
      "Paid USD": inv.paidUSD || 0,
      "Balance Due USD": inv.balanceDueUSD ?? (inv.totalUSD - (inv.paidUSD || 0)),
      "Status": inv.status,
    }));
    exportToExcel(data, `Invoices_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Qaansheegyada (Invoices & Billing)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Samee qaansheegyo xirfadaysan, la soco lacag bixinta qayb-qaybta ah (partial payments), iyo daabacaadda PDF.
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
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Qaansheeg Cusub</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Wadarta Qaansheegyada</span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalBilledUSD)}
          </p>
          <span className="text-[10px] text-slate-400">{filteredInvoices.length} qaansheeg</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Lacagta La Bixiyay</span>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {formatCurrency(totalPaidUSD)}
          </p>
          <span className="text-[10px] text-emerald-600">Qasnadda soo gashay</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Haraaga La Sugayo</span>
          <p className="mt-1 text-2xl font-black text-amber-600">
            {formatCurrency(totalPendingUSD)}
          </p>
          <span className="text-[10px] text-amber-600">Pending / Unpaid</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi invoice no, macmiil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Xaaladda:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan (All)</option>
            <option value="paid">Baxay (Paid)</option>
            <option value="partial">Qayb Bixis (Partial)</option>
            <option value="sent">Dhiman (Sent / Unpaid)</option>
            <option value="overdue">Wakhtigii Dhaafay (Overdue)</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-bold">No.</th>
                <th className="px-4 py-3 font-bold">Macmiilka</th>
                <th className="px-4 py-3 font-bold">Taariikh / Xilliga</th>
                <th className="px-4 py-3 font-bold text-right">Wadarta</th>
                <th className="px-4 py-3 font-bold text-right">La Bixiyay</th>
                <th className="px-4 py-3 font-bold text-right">Dhiman</th>
                <th className="px-4 py-3 font-bold text-center">Xaaladda</th>
                <th className="px-4 py-3 font-bold text-center">Ficil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Wax qaansheeg ah lagama helin.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const balance = inv.balanceDueUSD ?? (inv.totalUSD - (inv.paidUSD || 0));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {inv.id}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {inv.clientName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <span>{inv.date}</span>
                        <p className="text-[10px] text-rose-500">Due: {inv.dueDate}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(inv.totalUSD, inv.totalSLSH)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {formatCurrency(inv.paidUSD || 0, inv.paidSLSH || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">
                        {formatCurrency(balance, balance * exchangeRate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : inv.status === "partial"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : inv.status === "overdue"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onPrintInvoice && (
                            <button
                              onClick={() => onPrintInvoice(inv)}
                              title="Daabac Qaansheegta"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Printer className="h-4 w-4 text-purple-600" />
                            </button>
                          )}
                          {balance > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              title="Diiwaangeli Lacag Bixin"
                              className="rounded-lg px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold"
                            >
                              + Bixin
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Ma tirtirtaa qaansheegta ${inv.id}?`)) {
                                  deleteInvoice(inv.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Samee Qaansheeg Cusub (New Invoice)
            </h3>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Macmiilka *
                  </label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Taariikhda
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Xilliga Bixinta (Due Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Adeegyada / Alaabta (Items)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700"
                  >
                    + Ku dar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Faahfaahinta..."
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-center dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Qiimaha ($)"
                        value={item.rateUSD}
                        onChange={(e) => handleItemChange(idx, "rateUSD", e.target.value)}
                        className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-right font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <span className="w-20 text-right text-xs font-bold">
                        ${item.amountUSD.toFixed(2)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount and Tax */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Canshuur (%)
                  </label>
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qiimo Dhimis ($ Discount)
                  </label>
                  <input
                    type="number"
                    value={discountUSD}
                    onChange={(e) => setDiscountUSD(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold">Wadarta Guud:</span>
                  <p className="text-xl font-black text-purple-600">${totalUSD.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Ka Noqo
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
                  >
                    Diiwaangeli Qaansheegta
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Diiwaangeli Lacag Bixin ({payingInvoice.id})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Macmiilka: <strong>{payingInvoice.clientName}</strong> • Wadarta: ${payingInvoice.totalUSD}
            </p>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3">
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
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                  />
                </div>
              </div>

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
                  Akoonka Lagu Shubay *
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

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                >
                  Xaqiiji Lacag Bixinta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
