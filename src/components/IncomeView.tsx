import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  ChevronDown,
  X,
  CreditCard,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { IncomeTransaction, Currency, PaymentMethod, PaymentStatus } from "../types";
import { exportToExcel } from "../utils/excel";

interface IncomeViewProps {
  onPrintReceipt?: (income: IncomeTransaction) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({ onPrintReceipt }) => {
  const {
    incomes,
    clients,
    services,
    accounts,
    activeBusiness,
    addIncome,
    updateIncome,
    deleteIncome,
    addClient,
    formatCurrency,
    viewCurrency,
    exchangeRate,
    canEdit,
    canDelete,
    openQuickAction,
  } = useFinance();

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeTransaction | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Inline Quick Add Client modal
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Filtered list
  const filteredList = useMemo(() => {
    return incomes.filter((item) => {
      const matchSearch =
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.referenceNo && item.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchClient = selectedClient === "all" || item.clientId === selectedClient;
      const matchService = selectedService === "all" || item.serviceId === selectedService;
      const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
      const matchAccount = selectedAccount === "all" || item.accountId === selectedAccount;

      return matchSearch && matchClient && matchService && matchStatus && matchAccount;
    });
  }, [incomes, searchTerm, selectedClient, selectedService, selectedStatus, selectedAccount]);

  const totalIncomeUSD = filteredList.reduce((acc, i) => acc + i.amountUSD, 0);
  const totalPaidUSD = filteredList.reduce((acc, i) => acc + i.paidAmountUSD, 0);
  const totalDebtUSD = filteredList.reduce((acc, i) => acc + i.debtAmountUSD, 0);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextRef = `REF-INC-${Math.floor(100 + Math.random() * 900)}`;
    setReferenceNo(nextRef);
    setDate(new Date().toISOString().substring(0, 10));
    setClientId(clients[0]?.id || "");
    setClientName(clients[0]?.name || "");
    setServiceId(services[0]?.id || "");
    setServiceName(services[0]?.name || "");
    setDescription(services[0]?.name || "");
    setCurrency("USD");
    const initialAmt = services[0]?.defaultPriceUSD || 0;
    setAmount(initialAmt);
    setPaidAmount(initialAmt);
    setPaymentMethod("Cash");
    setAccountId(accounts[0]?.id || "");
    setDueDate("");
    setNotes("");
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: IncomeTransaction) => {
    setEditingItem(item);
    setDate(item.date);
    setReferenceNo(item.referenceNo || "");
    setClientId(item.clientId || "");
    setClientName(item.clientName || "");
    setServiceId(item.serviceId || "");
    setServiceName(item.serviceName || "");
    setDescription(item.description);
    setCurrency(item.currency);
    const amt = item.currency === "USD" ? item.amountUSD : item.amountSLSH;
    const paid = item.currency === "USD" ? item.paidAmountUSD : item.paidAmountSLSH;
    setAmount(amt);
    setPaidAmount(paid);
    setPaymentMethod(item.paymentMethod);
    setAccountId(item.accountId);
    setDueDate(item.dueDate || "");
    setNotes(item.notes || "");
    setIsModalOpen(true);
  };

  // Duplicate item
  const handleDuplicate = (item: IncomeTransaction) => {
    setEditingItem(null);
    setDate(new Date().toISOString().substring(0, 10));
    setReferenceNo(`REF-INC-${Math.floor(100 + Math.random() * 900)}`);
    setClientId(item.clientId || "");
    setClientName(item.clientName || "");
    setServiceId(item.serviceId || "");
    setServiceName(item.serviceName || "");
    setDescription(`${item.description} (Nuqul)`);
    setCurrency(item.currency);
    const amt = item.currency === "USD" ? item.amountUSD : item.amountSLSH;
    setAmount(amt);
    setPaidAmount(amt);
    setPaymentMethod(item.paymentMethod);
    setAccountId(item.accountId);
    setDueDate("");
    setNotes(item.notes || "");
    setIsModalOpen(true);
  };

  // Handle service text box change (supports typing custom service or selecting from suggestions)
  const handleServiceNameChange = (val: string) => {
    setServiceName(val);
    const matched = services.find(
      (s) => s.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      setServiceId(matched.id);
      if (currency === "USD") {
        setAmount(matched.defaultPriceUSD);
        setPaidAmount(matched.defaultPriceUSD);
      } else {
        setAmount(matched.defaultPriceSLSH);
        setPaidAmount(matched.defaultPriceSLSH);
      }
      if (!description || description === "" || services.some((s) => s.name === description)) {
        setDescription(matched.name);
      }
    } else {
      setServiceId("");
      if (!description || description === "") {
        setDescription(val);
      }
    }
  };

  // Handle client text box change
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    const matched = clients.find(
      (c) => c.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      setClientId(matched.id);
    } else {
      setClientId("");
    }
  };

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert("Fadlan geli lacag sax ah.");
      return;
    }

    const matchedClient = clients.find(
      (c) => c.id === clientId || c.name.trim().toLowerCase() === clientName.trim().toLowerCase()
    );
    const matchedService = services.find(
      (s) => s.id === serviceId || s.name.trim().toLowerCase() === serviceName.trim().toLowerCase()
    );

    const finalClientName = clientName.trim() || matchedClient?.name || "Macmiil";
    const finalServiceName = serviceName.trim() || matchedService?.name || "Adeeg Qoraal Sharci";

    const cleanAmount = Number(amount);
    const cleanPaid = Math.min(cleanAmount, Math.max(0, Number(paidAmount)));
    const cleanDebt = Math.max(0, cleanAmount - cleanPaid);

    let amountUSD = 0;
    let amountSLSH = 0;
    let paidAmountUSD = 0;
    let paidAmountSLSH = 0;
    let debtAmountUSD = 0;
    let debtAmountSLSH = 0;

    if (currency === "USD") {
      amountUSD = cleanAmount;
      amountSLSH = cleanAmount * exchangeRate;
      paidAmountUSD = cleanPaid;
      paidAmountSLSH = cleanPaid * exchangeRate;
      debtAmountUSD = cleanDebt;
      debtAmountSLSH = cleanDebt * exchangeRate;
    } else {
      amountSLSH = cleanAmount;
      amountUSD = cleanAmount / (exchangeRate || 1);
      paidAmountSLSH = cleanPaid;
      paidAmountUSD = cleanPaid / (exchangeRate || 1);
      debtAmountSLSH = cleanDebt;
      debtAmountUSD = cleanDebt / (exchangeRate || 1);
    }

    let status: PaymentStatus = "paid";
    if (cleanPaid === 0) {
      status = "debt";
    } else if (cleanDebt > 0) {
      status = "partial";
    }

    if (editingItem) {
      updateIncome(editingItem.id, {
        date,
        referenceNo,
        clientId: matchedClient?.id || clientId || undefined,
        clientName: finalClientName,
        serviceId: matchedService?.id || serviceId || undefined,
        serviceName: finalServiceName,
        description: description || finalServiceName,
        currency,
        amountUSD,
        amountSLSH,
        paidAmountUSD,
        paidAmountSLSH,
        debtAmountUSD,
        debtAmountSLSH,
        paymentMethod,
        accountId,
        dueDate: cleanDebt > 0 ? dueDate : undefined,
        notes,
        status,
      });
    } else {
      addIncome({
        date,
        referenceNo,
        clientId: matchedClient?.id || clientId || undefined,
        clientName: finalClientName,
        serviceId: matchedService?.id || serviceId || undefined,
        serviceName: finalServiceName,
        description: description || finalServiceName,
        currency,
        amountUSD,
        amountSLSH,
        paidAmountUSD,
        paidAmountSLSH,
        debtAmountUSD,
        debtAmountSLSH,
        paymentMethod,
        accountId,
        dueDate: cleanDebt > 0 ? dueDate : undefined,
        notes,
        status,
      });
    }

    setIsModalOpen(false);
  };

  // Quick Add Client
  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const added = addClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || "+252 ",
      company: "",
      email: "",
      address: "",
    });
    setClientId(added.id);
    setShowQuickAddClient(false);
    setNewClientName("");
    setNewClientPhone("");
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredList.map((i) => ({
      "ID": i.id,
      "Date": i.date,
      "Reference": i.referenceNo,
      "Client": i.clientName,
      "Service": i.serviceName,
      "Description": i.description,
      "Currency": i.currency,
      "Total (USD)": i.amountUSD,
      "Total (SLSH)": i.amountSLSH,
      "Paid (USD)": i.paidAmountUSD,
      "Debt (USD)": i.debtAmountUSD,
      "Method": i.paymentMethod,
      "Status": i.status,
      "Due Date": i.dueDate || "",
      "Created By": i.createdBy,
    }));
    exportToExcel(data, `Dakhliga_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Diiwaanka Dakhliga (Income Tracker)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Diiwaangeli dakhliga ka soo baxa adeegyada, qor deynta dhiman, oo daabac rasiidh.
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
            id="btn-add-income-main"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Dakhli Cusub</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Chips */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">
            Wadarta Dakhliga (Total Income)
          </span>
          <p className="mt-1 text-xl font-black text-emerald-900 dark:text-emerald-200">
            {formatCurrency(totalIncomeUSD)}
          </p>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
            {filteredList.length} hawlood oo la diiwaangeliyay
          </span>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-400 uppercase">
            Lacagta La Helay (Paid Cash In)
          </span>
          <p className="mt-1 text-xl font-black text-indigo-900 dark:text-indigo-200">
            {formatCurrency(totalPaidUSD)}
          </p>
          <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80">
            Qasnadda iyo bangiga toos u galay
          </span>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase">
            Deynta Dhiman (Outstanding Debts)
          </span>
          <p className="mt-1 text-xl font-black text-amber-900 dark:text-amber-200">
            {formatCurrency(totalDebtUSD)}
          </p>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
            Receivables laga sugayo macaamiisha
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi macmiil, sharaxaad, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Macaamiisha</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Service Filter */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Adeegyada</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Xaaladaha</option>
            <option value="paid">Waa La Bixiyay (Paid)</option>
            <option value="partial">Qayb baa dhiman (Partial)</option>
            <option value="debt">Waa Deyn Buuxda (Debt)</option>
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Xisaabaadka</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Income Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-bold">ID / Ref</th>
                <th className="px-4 py-3 font-bold">Taariikhda</th>
                <th className="px-4 py-3 font-bold">Macmiilka (Client)</th>
                <th className="px-4 py-3 font-bold">Adeegga (Service)</th>
                <th className="px-4 py-3 font-bold">Akoonka / Habka</th>
                <th className="px-4 py-3 font-bold text-right">Cadadka Guud</th>
                <th className="px-4 py-3 font-bold text-right">La Helay (Paid)</th>
                <th className="px-4 py-3 font-bold text-right">Deyn Harta</th>
                <th className="px-4 py-3 font-bold text-center">Xaaladda</th>
                <th className="px-4 py-3 font-bold text-right">Ficilka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Wax dakhli ah lagama helin shuruudahan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <div>{item.id}</div>
                      {item.referenceNo && (
                        <div className="text-[10px] text-slate-400 font-normal">{item.referenceNo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {item.clientName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <p className="font-semibold">{item.serviceName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{item.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {item.paymentMethod}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {accounts.find((a) => a.id === item.accountId)?.name || "Akoon"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(item.amountUSD, item.amountSLSH)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(item.paidAmountUSD, item.paidAmountSLSH)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600 whitespace-nowrap">
                      {item.debtAmountUSD > 0 ? formatCurrency(item.debtAmountUSD, item.debtAmountSLSH) : "-"}
                      {item.dueDate && item.debtAmountUSD > 0 && (
                        <span className="block text-[9px] text-slate-400">Eg: {item.dueDate}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle className="h-3 w-3" /> Paid
                        </span>
                      ) : item.status === "partial" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="h-3 w-3" /> Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <AlertCircle className="h-3 w-3" /> Deyn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onPrintReceipt && (
                          <button
                            onClick={() => onPrintReceipt(item)}
                            title="Daabac Rasiidh"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(item)}
                          title="Samee Nuqul (Duplicate)"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Wax ka beddel"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm("Ma hubtaa inaad tirtirto dakhligan?")) {
                                deleteIncome(item.id);
                              }
                            }}
                            title="Tirtir"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingItem ? `Wax ka beddel Dakhliga #${editingItem.id}` : "Diiwaangeli Dakhli Cusub"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
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

                {/* Reference No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="Tusaale: REF-INC-001"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Client Text Box with Suggestions & Multi-party Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Macmiilka / Dhinacyada Sharciga (Client / Parties) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddClient(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    + Macmiil Cusub
                  </button>
                </div>
                <input
                  type="text"
                  required
                  list="income-client-suggestions"
                  value={clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  placeholder="Geli magaca macmiilka ama dhinacyada heshiiska (tusaale: Axmed Cali & Xaawo Nuur)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id="income-client-suggestions">
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.company ? `${c.company} - ` : ""}{c.phone}
                    </option>
                  ))}
                </datalist>
                <p className="mt-1 text-[10px] text-slate-400">
                  Haddii ay laba macmiil ama ka badan heshiis wada galeen, halkan toos ugu wada qor magacyadooda.
                </p>
              </div>

              {/* Service Input as a Text Box with Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Adeegga (Service / Item) *
                  </label>
                  <span className="text-[10px] text-slate-400">Toos u qor ama ka dooro talooyinka</span>
                </div>
                <input
                  type="text"
                  required
                  list="income-service-suggestions"
                  value={serviceName}
                  onChange={(e) => handleServiceNameChange(e.target.value)}
                  placeholder="Geli magaca adeegga (tusaale: Heshiis Qoraal Sharci, Wakaalad, Kala Wareejin...)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id="income-service-suggestions">
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      ${s.defaultPriceUSD} - {s.category || "Adeeg"}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Faahfaahin (Description)
                </label>
                <input
                  type="text"
                  placeholder="Faahfaahinta shaqada ama adeegga la qabtay..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Currency & Amount Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nooca Lacagta (Currency)
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurr = e.target.value as Currency;
                      setCurrency(newCurr);
                      if (newCurr === "SLSH" && currency === "USD") {
                        setAmount(amount * exchangeRate);
                        setPaidAmount(paidAmount * exchangeRate);
                      } else if (newCurr === "USD" && currency === "SLSH") {
                        setAmount(amount / exchangeRate);
                        setPaidAmount(paidAmount / exchangeRate);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="USD">USD ($ - Doolar)</option>
                    <option value="SLSH">SLSH (Sh - Shilin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cadadka Guud ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0.01}
                    value={amount || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setAmount(val);
                      setPaidAmount(val); // default to full pay
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    La Bixiyay ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    max={amount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Debt Warning if Partial / Debt */}
              {amount - paidAmount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      Deynta dhiman: <strong>{currency === "USD" ? `$${amount - paidAmount}` : `${(amount - paidAmount).toLocaleString()} SLSH`}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Xilliga bixinta:</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-lg border border-amber-300 bg-white px-2 py-0.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Payment Method & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Habka Lacag Bixinta (Method)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cash">Cash (Lacag Cadaan)</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Zaad">Zaad Service</option>
                    <option value="Sahal">Sahal</option>
                    <option value="E-Dahab">E-Dahab</option>
                    <option value="Mobile Money">Mobile Money Kale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Akoonka Lagu Shubo (Deposit Account)
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.currentBalanceUSD, acc.currentBalanceSLSH)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xusuusin / Faallo (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Faallo dheeraad ah oo la xiriirta dakhligan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Submit Buttons */}
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
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 shadow-sm transition"
                >
                  {editingItem ? "Badbaadi Isbeddelka" : "Diiwaangeli Dakhliga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Client Sub-modal */}
      {showQuickAddClient && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Kudar Macmiil Cusub
            </h4>
            <form onSubmit={handleQuickAddClient} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Magaca Macmiilka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Axmed Cali"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefoonka
                </label>
                <input
                  type="text"
                  placeholder="+252 63..."
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddClient(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Kudar Macmiilka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
