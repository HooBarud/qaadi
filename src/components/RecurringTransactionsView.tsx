import React, { useState, useMemo } from "react";
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Search,
  Filter,
  Check,
  Zap,
  Building,
  ArrowRight,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { RecurringTransaction, RecurringFrequency, Currency, PaymentMethod } from "../types";

export const RecurringTransactionsView: React.FC = () => {
  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringStatus,
    processDueRecurringTransactions,
    accounts,
    categories,
    services,
    clients,
    formatCurrency,
    viewCurrency,
    exchangeRate,
    canEdit,
    canDelete,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterFrequency, setFilterFrequency] = useState<"all" | RecurringFrequency>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>("monthly");
  const [formCategory, setFormCategory] = useState("Notarization");
  const [formServiceName, setFormServiceName] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formSupplierName, setFormSupplierName] = useState("");
  const [formAmountUSD, setFormAmountUSD] = useState("100");
  const [formAmountSLSH, setFormAmountSLSH] = useState("1000000");
  const [formCurrency, setFormCurrency] = useState<Currency>("USD");
  const [formAccountId, setFormAccountId] = useState(accounts[0]?.id || "acc-1");
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>("Cash");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [formNextDueDate, setFormNextDueDate] = useState(new Date().toISOString().substring(0, 10));
  const [formAutoProcess, setFormAutoProcess] = useState(true);
  const [formNotes, setFormNotes] = useState("");

  const today = new Date().toISOString().substring(0, 10);

  // Due items count
  const dueItems = useMemo(() => {
    return recurringTransactions.filter(
      (r) => r.status === "active" && r.nextDueDate <= today
    );
  }, [recurringTransactions, today]);

  // Projected Monthly Metrics
  const projectedMetrics = useMemo(() => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    recurringTransactions
      .filter((r) => r.status === "active")
      .forEach((r) => {
        let multiplier = 1;
        if (r.frequency === "weekly") multiplier = 4.33;
        else if (r.frequency === "quarterly") multiplier = 1 / 3;
        else if (r.frequency === "yearly") multiplier = 1 / 12;

        if (r.type === "income") {
          monthlyIncome += r.amountUSD * multiplier;
        } else {
          monthlyExpense += r.amountUSD * multiplier;
        }
      });

    return {
      monthlyIncome,
      monthlyExpense,
      net: monthlyIncome - monthlyExpense,
    };
  }, [recurringTransactions]);

  // Filtered List
  const filteredList = useMemo(() => {
    return recurringTransactions.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterFrequency !== "all" && item.frequency !== filterFrequency) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchClient = item.clientName?.toLowerCase().includes(q);
        const matchSupplier = item.supplierName?.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchSupplier && !matchCat) return false;
      }

      return true;
    });
  }, [recurringTransactions, filterType, filterFrequency, filterStatus, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormType("income");
    setFormFrequency("monthly");
    setFormCategory("Notarization");
    setFormServiceName("");
    setFormClientName("");
    setFormSupplierName("");
    setFormAmountUSD("100");
    setFormAmountSLSH(String(100 * exchangeRate));
    setFormCurrency("USD");
    setFormAccountId(accounts[0]?.id || "acc-1");
    setFormPaymentMethod("Cash");
    setFormStartDate(new Date().toISOString().substring(0, 10));
    setFormNextDueDate(new Date().toISOString().substring(0, 10));
    setFormAutoProcess(true);
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.type);
    setFormFrequency(item.frequency);
    setFormCategory(item.category);
    setFormServiceName(item.serviceName || "");
    setFormClientName(item.clientName || "");
    setFormSupplierName(item.supplierName || "");
    setFormAmountUSD(item.amountUSD.toString());
    setFormAmountSLSH(item.amountSLSH.toString());
    setFormCurrency(item.currency);
    setFormAccountId(item.accountId);
    setFormPaymentMethod(item.paymentMethod);
    setFormStartDate(item.startDate);
    setFormNextDueDate(item.nextDueDate);
    setFormAutoProcess(item.autoProcess);
    setFormNotes(item.notes || "");
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: {
    title: string;
    type: "income" | "expense";
    frequency: RecurringFrequency;
    category: string;
    amountUSD: number;
    clientOrSupplier: string;
    accountType?: string;
  }) => {
    setFormTitle(preset.title);
    setFormType(preset.type);
    setFormFrequency(preset.frequency);
    setFormCategory(preset.category);
    setFormAmountUSD(preset.amountUSD.toString());
    setFormAmountSLSH((preset.amountUSD * exchangeRate).toString());
    if (preset.type === "income") {
      setFormClientName(preset.clientOrSupplier);
      setFormServiceName(preset.title);
      setFormSupplierName("");
    } else {
      setFormSupplierName(preset.clientOrSupplier);
      setFormClientName("");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Fadlan qor cinwaanka jadwalka!");
      return;
    }

    const amtUSD = parseFloat(formAmountUSD) || 0;
    const amtSLSH = parseFloat(formAmountSLSH) || amtUSD * exchangeRate;

    if (editingItem) {
      updateRecurringTransaction(editingItem.id, {
        title: formTitle.trim(),
        type: formType,
        frequency: formFrequency,
        category: formCategory,
        serviceName: formType === "income" ? formServiceName || formTitle : undefined,
        clientName: formType === "income" ? formClientName : undefined,
        supplierName: formType === "expense" ? formSupplierName : undefined,
        amountUSD: amtUSD,
        amountSLSH: amtSLSH,
        currency: formCurrency,
        accountId: formAccountId,
        paymentMethod: formPaymentMethod,
        startDate: formStartDate,
        nextDueDate: formNextDueDate,
        autoProcess: formAutoProcess,
        notes: formNotes,
      });
      setSuccessBanner(`Jadwalka "${formTitle}" si guul leh ayaa loo cusboonaysiiyay!`);
    } else {
      addRecurringTransaction({
        title: formTitle.trim(),
        type: formType,
        frequency: formFrequency,
        category: formCategory,
        serviceName: formType === "income" ? formServiceName || formTitle : undefined,
        clientName: formType === "income" ? formClientName : undefined,
        supplierName: formType === "expense" ? formSupplierName : undefined,
        amountUSD: amtUSD,
        amountSLSH: amtSLSH,
        currency: formCurrency,
        accountId: formAccountId,
        paymentMethod: formPaymentMethod,
        startDate: formStartDate,
        nextDueDate: formNextDueDate,
        autoProcess: formAutoProcess,
        status: "active",
        notes: formNotes,
      });
      setSuccessBanner(`Jadwal cusub "${formTitle}" si guul leh ayaa loo abuuray!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleProcessDueNow = () => {
    const res = processDueRecurringTransactions();
    if (res.count > 0) {
      setSuccessBanner(`Waxaa si toos ah loo maareeyay ${res.count} xisaabaad oo waqtigoodu gaadhay!`);
    } else {
      setSuccessBanner("Ma jiraan xisaabaad joogto ah oo waqtigoodu gaadhay xilligan.");
    }
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#543324] text-amber-200">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Jadwalka Dhaqdhaqaaqa Joogtada ah (Recurring Transactions)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jadwalay dakhliga iyo kharashka bishiiba ama toddobaadkiiba si toos ah loo diiwaangeliyo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dueItems.length > 0 && (
            <button
              onClick={handleProcessDueNow}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition cursor-pointer active:scale-95 animate-pulse"
              title="Qor dhammaan xisaabaadka waqtigoodu soo gaadhay"
            >
              <Zap className="h-4 w-4" />
              <span>Fuli Kuwa Gaadhay ({dueItems.length})</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              id="btn-add-recurring"
              className="flex items-center gap-1.5 rounded-xl bg-[#543324] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3D2216] transition cursor-pointer ring-1 ring-[#c59b27]/40"
            >
              <Plus className="h-4 w-4" />
              <span>+ Jadwal Cusub (Add Schedule)</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Due Alert Notice */}
      {dueItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {dueItems.length} Dhaqdhaqaaq oo Joogto ah ayaa soo gaadhay waqtigoodii!
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Waxaa jira kirad, heshiisyo, ama mushaharooyin maanta loo baahan yahay in lagu daro xisaabaadka.
              </p>
            </div>
          </div>
          <button
            onClick={handleProcessDueNow}
            className="flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 transition cursor-pointer shrink-0"
          >
            <span>Ku Diiwaangeli Hadda</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jadwallada Firfircoon
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Repeat className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {recurringTransactions.filter((r) => r.status === "active").length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Wadarta guud: {recurringTransactions.length} jadwal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Dakhliga Joogtada / Bishii
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(projectedMetrics.monthlyIncome)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Heshiisyada & Retainers-ka
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Kharashka Joogtada / Bishii
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(projectedMetrics.monthlyExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Kirada, Mushaharka, Korontada
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6A14] dark:text-[#C59B27] uppercase tracking-wider">
              Dheelitirka Saafiga ah
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-[#8C6A14] dark:bg-amber-950/60 dark:text-amber-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-black ${projectedMetrics.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrency(projectedMetrics.net)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Faaiidada joogtada ah
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi jadwalka joogtada ah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Noocyada</option>
            <option value="income">Dakhli (Income)</option>
            <option value="expense">Kharash (Expense)</option>
          </select>

          {/* Frequency Filter */}
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Xilliyada</option>
            <option value="weekly">Toddobaadle (Weekly)</option>
            <option value="monthly">Bishii (Monthly)</option>
            <option value="quarterly">3-dii Bilood (Quarterly)</option>
            <option value="yearly">Sanadle (Yearly)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Xaaladaha</option>
            <option value="active">Firfircoon (Active)</option>
            <option value="paused">Hakad Ku Jira (Paused)</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-[#FAF7F2] dark:border-slate-800 dark:bg-[#1E110A] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Cinwaanka & Nooca</th>
                <th className="px-4 py-3">Xilliga (Frequency)</th>
                <th className="px-4 py-3">Cadadka</th>
                <th className="px-4 py-3">Macmiil / Bixiye</th>
                <th className="px-4 py-3">Taariikhda Xigta</th>
                <th className="px-4 py-3">Xaaladda</th>
                <th className="px-4 py-3 text-right">Hawlaha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Wax jadwal dhaqdhaqaaq joogto ah lama helin. Riix badhanka "+ Jadwal Cusub" si aad u bilowdo.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isDue = item.status === "active" && item.nextDueDate <= today;
                  const isIncome = item.type === "income";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                        isDue ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      {/* Title & Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isIncome
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.category} • ID: {item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Frequency */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Repeat className="h-3 w-3 text-slate-400" />
                          <span>
                            {item.frequency === "weekly"
                              ? "Toddobaadle"
                              : item.frequency === "monthly"
                              ? "Bishii Mar"
                              : item.frequency === "quarterly"
                              ? "3-dii Biloodba"
                              : "Sanadle"}
                          </span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <p className={`font-black ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {formatCurrency(item.amountUSD, item.amountSLSH)}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {item.paymentMethod}
                        </span>
                      </td>

                      {/* Client / Supplier */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {isIncome ? item.clientName || "Macmiil Joogto" : item.supplierName || "Adeeg Bixiye"}
                        </p>
                      </td>

                      {/* Next Due Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`h-3.5 w-3.5 ${isDue ? "text-amber-600 animate-bounce" : "text-slate-400"}`} />
                          <span className={`font-medium ${isDue ? "font-bold text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {item.nextDueDate}
                          </span>
                        </div>
                        {isDue && (
                          <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300 mt-0.5">
                            Waqtigii waa gaadhay!
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleRecurringStatus(item.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer transition ${
                            item.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${item.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <span>{item.status === "active" ? "Active" : "Paused"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Wax ka beddel"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Ma hubtaa inaad tirtirto jadwalka "${item.title}"?`)) {
                                  deleteRecurringTransaction(item.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Tirtir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {editingItem ? "Wax ka beddel Jadwalka Joogtada ah" : "Abuur Jadwal Dhaqdhaqaaq Joogto ah"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dooro nooca, cadadka, xilliga lagu celinayo, iyo faahfaahinta.
            </p>

            {/* Quick Templates Buttons */}
            {!editingItem && (
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Xulashooyin Diyaar ah (Quick Presets)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset({
                        title: "Kirada Xafiiska Qaaddi Notary",
                        type: "expense",
                        frequency: "monthly",
                        category: "Rent",
                        amountUSD: 500,
                        clientOrSupplier: "Guriyeeye Properties",
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 cursor-pointer"
                  >
                    🏢 Kirada Xafiiska ($500)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset({
                        title: "Dahabshiil Group Notary Retainer",
                        type: "income",
                        frequency: "monthly",
                        category: "Corporate Retainer",
                        amountUSD: 800,
                        clientOrSupplier: "Dahabshiil Group",
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 cursor-pointer"
                  >
                    💼 Notary Retainer ($800)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset({
                        title: "Internet Fiber & Wifi (Somcable)",
                        type: "expense",
                        frequency: "monthly",
                        category: "Internet & Telecom",
                        amountUSD: 55,
                        clientOrSupplier: "Somcable",
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 cursor-pointer"
                  >
                    🌐 Internet-ka ($55)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset({
                        title: "Adeegga Nootaayada Toddobaadlaha ah",
                        type: "income",
                        frequency: "weekly",
                        category: "Notarization",
                        amountUSD: 150,
                        clientOrSupplier: "Telesom",
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 cursor-pointer"
                  >
                    📅 Toddobaadle ($150)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Type Switcher: Income vs Expense */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType("income")}
                  className={`rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    formType === "income"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Dakhli (Income)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("expense")}
                  className={`rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    formType === "expense"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  <span>Kharash (Expense)</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cinwaanka Jadwalka (Schedule Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="tusaale: Kirada Xafiiska, Retainer Dahabshiil..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Frequency & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Xilliga Soo Noqnoqoshada (Frequency) *
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="weekly">Toddobaadle (Weekly - 7 maalmood kasta)</option>
                    <option value="monthly">Bishiiba Mar (Monthly - bil kasta)</option>
                    <option value="quarterly">3-dii Biloodba Mar (Quarterly)</option>
                    <option value="yearly">Sanadkiiba Mar (Yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qeybta (Category)
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Rent, Retainer, Salaries, Notarization..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Amount USD & SLSH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cadadka USD ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formAmountUSD}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormAmountUSD(v);
                      const num = parseFloat(v);
                      if (!isNaN(num)) {
                        setFormAmountSLSH((num * exchangeRate).toString());
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cadadka SLSH (Shilin)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formAmountSLSH}
                    onChange={(e) => setFormAmountSLSH(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Client or Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formType === "income" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Magaca Macmiilka (Client)
                    </label>
                    <input
                      type="text"
                      placeholder="tusaale: Dahabshiil Group..."
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bixiyaha / Shirkadda (Supplier)
                    </label>
                    <input
                      type="text"
                      placeholder="tusaale: Guriyeeye Properties..."
                      value={formSupplierName}
                      onChange={(e) => setFormSupplierName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Akoonka Loo Adeegsanayo (Account)
                  </label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Method & Next Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Habka Lacag Bixinta (Payment Method)
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cash">Cash (Kaash)</option>
                    <option value="Zaad">Zaad Service</option>
                    <option value="Sahal">Sahal</option>
                    <option value="E-Dahab">E-Dahab</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taariikhda Xigta ee Bixinta (Next Due Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formNextDueDate}
                    onChange={(e) => setFormNextDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Auto Process Toggle */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAutoProcess}
                    onChange={(e) => setFormAutoProcess(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Si toos ah u qor marka waqtigu gaadho (Auto-process entries)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  Marka la gaadho taariikhda la ballamay, nidaamku wuxuu si toos ah u abuuri doonaa dakhliga ama kharashka isagoo aan gacanta ku gelin u baahnayn.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qoraal Dheeri ah (Notes)
                </label>
                <input
                  type="text"
                  placeholder="Xusuusin ku saabsan jadwalkan..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#543324] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3D2216] transition cursor-pointer ring-1 ring-[#c59b27]/40"
                >
                  {editingItem ? "Keydi Isbeddelka" : "Abuur Jadwalka"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
