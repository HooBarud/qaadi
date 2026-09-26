import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  FileText,
  X,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Currency, PaymentMethod } from "../types";

export const QuickActionModal: React.FC = () => {
  const {
    quickActionModal,
    closeQuickAction,
  } = useFinance();

  if (!quickActionModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {quickActionModal === "income" && (
              <>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Diiwaangeli Dakhli Degdeg ah (+ Income)
                </h3>
              </>
            )}
            {quickActionModal === "expense" && (
              <>
                <TrendingDown className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Diiwaangeli Kharash Degdeg ah (+ Expense)
                </h3>
              </>
            )}
            {quickActionModal === "transfer" && (
              <>
                <ArrowLeftRight className="h-5 w-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Wareeji Lacag Degdeg ah (Transfer)
                </h3>
              </>
            )}
          </div>
          <button
            onClick={closeQuickAction}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {quickActionModal === "income" && <QuickIncomeForm onSuccess={closeQuickAction} />}
        {quickActionModal === "expense" && <QuickExpenseForm onSuccess={closeQuickAction} />}
        {quickActionModal === "transfer" && <QuickTransferForm onSuccess={closeQuickAction} />}
      </div>
    </div>
  );
};

// Sub-component: Quick Income Form
const QuickIncomeForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { clients, services, accounts, addIncome, exchangeRate } = useFinance();
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [clientName, setClientName] = useState(clients[0]?.name || "");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [serviceName, setServiceName] = useState(services[0]?.name || "");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<number>(services[0]?.defaultPriceUSD || 0);
  const [paidAmount, setPaidAmount] = useState<number>(services[0]?.defaultPriceUSD || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [description, setDescription] = useState(services[0]?.name || "");

  const handleServiceNameChange = (val: string) => {
    setServiceName(val);
    const s = services.find((srv) => srv.name.trim().toLowerCase() === val.trim().toLowerCase());
    if (s) {
      setServiceId(s.id);
      setDescription(s.name);
      setAmount(currency === "USD" ? s.defaultPriceUSD : s.defaultPriceSLSH);
      setPaidAmount(currency === "USD" ? s.defaultPriceUSD : s.defaultPriceSLSH);
    } else {
      setServiceId("");
      if (!description || description === "") setDescription(val);
    }
  };

  const handleClientNameChange = (val: string) => {
    setClientName(val);
    const c = clients.find((cl) => cl.name.trim().toLowerCase() === val.trim().toLowerCase());
    if (c) setClientId(c.id);
    else setClientId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const matchedClient = clients.find((c) => c.id === clientId || c.name.toLowerCase() === clientName.toLowerCase());
    const matchedService = services.find((s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase());

    const finalClientName = clientName.trim() || matchedClient?.name || "Macmiil";
    const finalServiceName = serviceName.trim() || matchedService?.name || "Adeeg Sharciga";

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

    addIncome({
      date,
      referenceNo: `REF-${Date.now().toString().slice(-6)}`,
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
      status: cleanPaid === 0 ? "debt" : cleanDebt > 0 ? "partial" : "paid",
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Macmiilka / Dhinacyada *
          </label>
          <input
            type="text"
            required
            list="quick-client-list"
            value={clientName}
            onChange={(e) => handleClientNameChange(e.target.value)}
            placeholder="Geli magaca macmiilka..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <datalist id="quick-client-list">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Adeegga (Service / Item) *
          </label>
          <input
            type="text"
            required
            list="quick-service-list"
            value={serviceName}
            onChange={(e) => handleServiceNameChange(e.target.value)}
            placeholder="Geli magaca adeegga..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <datalist id="quick-service-list">
            {services.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="USD">USD ($)</option>
            <option value="SLSH">SLSH (Sh)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Cadadka Guud *
          </label>
          <input
            type="number"
            step="any"
            required
            value={amount || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0;
              setAmount(v);
              setPaidAmount(v);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            La Bixiyay
          </label>
          <input
            type="number"
            step="any"
            value={paidAmount}
            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Habka Bixinta
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Zaad">Zaad Service</option>
            <option value="Sahal">Sahal</option>
            <option value="E-Dahab">E-Dahab</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Akoonka Lagu Shubay
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
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

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition"
        >
          Diiwaangeli Dakhliga
        </button>
      </div>
    </form>
  );
};

// Sub-component: Quick Expense Form
const QuickExpenseForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { categories, accounts, addExpense, exchangeRate } = useFinance();
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState(categories[0]?.name || "Office");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const cleanAmt = Number(amount);
    addExpense({
      date,
      referenceNo: `REF-${Date.now().toString().slice(-6)}`,
      category,
      description,
      supplier: "Direct Vendor",
      currency,
      amountUSD: currency === "USD" ? cleanAmt : cleanAmt / (exchangeRate || 1),
      amountSLSH: currency === "USD" ? cleanAmt * exchangeRate : cleanAmt,
      paymentMethod,
      accountId,
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Faahfaahinta Kharashka *
        </label>
        <input
          type="text"
          required
          placeholder="Tusaale: Shidaalka gaadhiga, qado, internet..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Qaybta (Category)
          </label>
          <input
            type="text"
            required
            list="quick-expense-cat-list"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Geli qaybta kharashka..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <datalist id="quick-expense-cat-list">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Cadadka ({currency}) *
          </label>
          <div className="flex gap-1">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="USD">USD</option>
              <option value="SLSH">SLSH</option>
            </select>
            <input
              type="number"
              step="any"
              required
              min={0.01}
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Habka Bixinta
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Zaad">Zaad Service</option>
            <option value="Sahal">Sahal</option>
            <option value="E-Dahab">E-Dahab</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Akoonka Laga Bixiyay
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
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

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 transition"
        >
          Diiwaangeli Kharashka
        </button>
      </div>
    </form>
  );
};

// Sub-component: Quick Transfer Form
const QuickTransferForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { accounts, addTransfer, exchangeRate } = useFinance();
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId || amount <= 0) return;

    const cleanAmt = Number(amount);
    addTransfer({
      date: new Date().toISOString().substring(0, 10),
      referenceNo: `REF-${Date.now().toString().slice(-6)}`,
      fromAccountId,
      toAccountId,
      currency,
      amountUSD: currency === "USD" ? cleanAmt : cleanAmt / (exchangeRate || 1),
      amountSLSH: currency === "USD" ? cleanAmt * exchangeRate : cleanAmt,
      notes,
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label className="block text-xs font-semibold text-rose-600 mb-1">
          Akoonka Laga Jarayo (From) *
        </label>
        <select
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (${a.currentBalanceUSD.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-emerald-600 mb-1">
          Akoonka Lagu Shubayo (To) *
        </label>
        <select
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (${a.currentBalanceUSD.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Cadadka ({currency}) *
          </label>
          <input
            type="number"
            step="any"
            required
            min={0.01}
            value={amount || ""}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-700 active:scale-95 transition"
        >
          Xaqiiji Wareejinta
        </button>
      </div>
    </form>
  );
};
