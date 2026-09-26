import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Copy,
  Trash2,
  Edit2,
  Sparkles,
  Repeat,
  DollarSign,
  ChevronDown,
  X,
  CreditCard,
  Building,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { ExpenseTransaction, Currency, PaymentMethod } from "../types";
import { exportToExcel } from "../utils/excel";

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    categories,
    accounts,
    activeBusiness,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    formatCurrency,
    exchangeRate,
    canEdit,
    canDelete,
  } = useFinance();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseTransaction | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "Office");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [notes, setNotes] = useState("");

  // AI Categorization State
  const [aiSuggesting, setAiSuggesting] = useState(false);

  // New Category Modal
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Filtered List
  const filteredList = useMemo(() => {
    return expenses.filter((item) => {
      const matchSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.referenceNo && item.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchAcc = selectedAccount === "all" || item.accountId === selectedAccount;
      const matchMethod = selectedMethod === "all" || item.paymentMethod === selectedMethod;

      return matchSearch && matchCat && matchAcc && matchMethod;
    });
  }, [expenses, searchTerm, selectedCategory, selectedAccount, selectedMethod]);

  const totalExpensesUSD = filteredList.reduce((acc, e) => acc + e.amountUSD, 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().substring(0, 10));
    setReferenceNo(`REF-EXP-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(categories[0]?.name || "Office");
    setDescription("");
    setSupplier("");
    setCurrency("USD");
    setAmount(0);
    setPaymentMethod("Cash");
    setAccountId(accounts[0]?.id || "");
    setIsRecurring(false);
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExpenseTransaction) => {
    setEditingItem(item);
    setDate(item.date);
    setReferenceNo(item.referenceNo || "");
    setCategory(item.category);
    setDescription(item.description);
    setSupplier(item.supplier || "");
    setCurrency(item.currency);
    setAmount(item.currency === "USD" ? item.amountUSD : item.amountSLSH);
    setPaymentMethod(item.paymentMethod);
    setAccountId(item.accountId);
    setIsRecurring(item.isRecurring || false);
    setRecurringFrequency(item.recurringFrequency || "monthly");
    setNotes(item.notes || "");
    setIsModalOpen(true);
  };

  const handleDuplicate = (item: ExpenseTransaction) => {
    setEditingItem(null);
    setDate(new Date().toISOString().substring(0, 10));
    setReferenceNo(`REF-EXP-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(item.category);
    setDescription(`${item.description} (Nuqul)`);
    setSupplier(item.supplier || "");
    setCurrency(item.currency);
    setAmount(item.currency === "USD" ? item.amountUSD : item.amountSLSH);
    setPaymentMethod(item.paymentMethod);
    setAccountId(item.accountId);
    setIsRecurring(item.isRecurring || false);
    setNotes(item.notes || "");
    setIsModalOpen(true);
  };

  // AI Categorization call
  const handleAiSuggestCategory = async () => {
    if (!description.trim()) {
      alert("Fadlan marka hore geli faahfaahin yar si AI-du u fahanto nooca kharashka.");
      return;
    }
    setAiSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          existingCategories: categories.map((c) => c.name),
        }),
      });
      const data = await res.json();
      if (data.category) {
        setCategory(data.category);
      }
    } catch (e) {
      console.warn("AI categorization error:", e);
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    if (editingItem) {
      updateExpense(editingItem.id, {
        date,
        referenceNo,
        category,
        description,
        supplier,
        currency,
        amountUSD,
        amountSLSH,
        paymentMethod,
        accountId,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        notes,
      });
    } else {
      addExpense({
        date,
        referenceNo,
        category,
        description,
        supplier,
        currency,
        amountUSD,
        amountSLSH,
        paymentMethod,
        accountId,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      type: "expense",
      color: "#6366f1",
    });
    setCategory(newCatName.trim());
    setShowAddCat(false);
    setNewCatName("");
  };

  const handleExportExcel = () => {
    const data = filteredList.map((e) => ({
      "ID": e.id,
      "Date": e.date,
      "Reference": e.referenceNo,
      "Category": e.category,
      "Description": e.description,
      "Supplier": e.supplier || "",
      "Currency": e.currency,
      "Amount (USD)": e.amountUSD,
      "Amount (SLSH)": e.amountSLSH,
      "Method": e.paymentMethod,
      "Recurring": e.isRecurring ? e.recurringFrequency : "No",
      "Notes": e.notes || "",
      "Created By": e.createdBy,
    }));
    exportToExcel(data, `Kharashka_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Diiwaanka Kharashka (Expense Tracker)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Qor dhammaan kharashaadka shirkadda/xafiiska adigoo u kala soocaya qaybo (Categories).
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
            id="btn-add-expense-main"
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Kharash Cusub</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Chip */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase">
            Wadarta Kharashka (Total Expenses)
          </span>
          <p className="mt-1 text-2xl font-black text-rose-900 dark:text-rose-200">
            {formatCurrency(totalExpensesUSD)}
          </p>
          <span className="text-[10px] text-rose-700/80 dark:text-rose-400/80">
            {filteredList.length} kharash oo la diiwaangeliyay
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi faahfaahin, supplier, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Qaybaha (Categories)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

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

          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Dhammaan Hababka Bixinta</option>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Zaad">Zaad Service</option>
            <option value="Sahal">Sahal</option>
            <option value="E-Dahab">E-Dahab</option>
            <option value="Mobile Money">Mobile Money</option>
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-bold">ID / Ref</th>
                <th className="px-4 py-3 font-bold">Taariikhda</th>
                <th className="px-4 py-3 font-bold">Qaybta (Category)</th>
                <th className="px-4 py-3 font-bold">Faahfaahinta</th>
                <th className="px-4 py-3 font-bold">Qofka / Meesha (Supplier)</th>
                <th className="px-4 py-3 font-bold">Akoonka / Habka</th>
                <th className="px-4 py-3 font-bold text-right">Cadadka</th>
                <th className="px-4 py-3 font-bold text-right">Ficilka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Wax kharash ah lagama helin shuruudahan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                      <div>{item.id}</div>
                      {item.referenceNo && (
                        <div className="text-[10px] text-slate-400 font-normal">{item.referenceNo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.category}
                      </span>
                      {item.isRecurring && (
                        <span className="ml-1 inline-flex items-center text-[10px] text-indigo-600" title={`Joogto ah (${item.recurringFrequency})`}>
                          <Repeat className="h-3 w-3" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[220px] truncate">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {item.supplier || "-"}
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
                    <td className="px-4 py-3 text-right font-black text-rose-600 whitespace-nowrap">
                      -{formatCurrency(item.amountUSD, item.amountSLSH)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDuplicate(item)}
                          title="Samee Nuqul"
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
                              if (window.confirm("Ma hubtaa inaad tirtirto kharashkan?")) {
                                deleteExpense(item.id);
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingItem ? `Wax ka beddel Kharashka #${editingItem.id}` : "Diiwaangeli Kharash Cusub"}
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
                    placeholder="Tusaale: REF-EXP-001"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Description + AI Suggestion Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Faahfaahinta Kharashka *
                  </label>
                  <button
                    type="button"
                    onClick={handleAiSuggestCategory}
                    disabled={aiSuggesting}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{aiSuggesting ? "AI baa soo jeedinaysa..." : "🤖 AI Soo Jeedi Category"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Kirada xafiiska, shidaalka gaadhiga, biilka internetka Telesom..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Category input + suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Qaybta Kharashka (Category) *
                  </label>
                  <span className="text-[10px] text-slate-400">Toos u qor ama ka dooro talooyinka</span>
                </div>
                <input
                  type="text"
                  required
                  list="expense-category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Geli nooca kharashka (tusaale: Koronto, Kiro, Mushahar, Qalab Xafiis...)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id="expense-category-suggestions">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              {/* Supplier / Vendor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qofka / Goobta Lacagta La Siiyay (Supplier / Vendor)
                </label>
                <input
                  type="text"
                  placeholder="Tusaale: Sompower, Telesom, Total Station..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Currency & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
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
                      } else if (newCurr === "USD" && currency === "SLSH") {
                        setAmount(amount / exchangeRate);
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
                    Cadadka ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0.01}
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                  />
                </div>
              </div>

              {/* Payment Method & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Habka Bixinta (Payment Method)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cash">Cash (Qasnadda)</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Zaad">Zaad Service</option>
                    <option value="Sahal">Sahal</option>
                    <option value="E-Dahab">E-Dahab</option>
                    <option value="Mobile Money">Mobile Money Kale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Akoonka Laga Bixiyay (Source Account)
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

              {/* Recurring Option */}
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Kharash joogto ah (Recurring Expense - Kirada, Internetka...)</span>
                </label>

                {isRecurring && (
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="text-slate-500">Muddada:</span>
                    <select
                      value={recurringFrequency}
                      onChange={(e) => setRecurringFrequency(e.target.value as any)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="monthly">Bille (Monthly)</option>
                      <option value="weekly">Toddobaadle (Weekly)</option>
                      <option value="yearly">Sannadle (Yearly)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xusuusin / Faallo (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Faallo dheeraad ah..."
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
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 shadow-sm transition"
                >
                  {editingItem ? "Badbaadi Isbeddelka" : "Diiwaangeli Kharashka"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Sub-modal */}
      {showAddCat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Kudar Qayb Cusub (New Category)
            </h4>
            <form onSubmit={handleAddCustomCategory} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Magaca Qaybta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Printing, Software, Qado..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Kudar Qaybta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
