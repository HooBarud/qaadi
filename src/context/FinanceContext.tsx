import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import {
  Currency,
  User,
  UserRole,
  BusinessProfile,
  Account,
  Client,
  ServiceItem,
  Category,
  IncomeTransaction,
  ExpenseTransaction,
  TransferTransaction,
  Invoice,
  PartialPayment,
  Receipt,
  MonthlyClosing,
  AuditLog,
  QuickTemplate,
  AppNotification,
  TimeFilter,
  DateRange,
  ActiveTab,
  RecurringTransaction,
  CloudChangeRecord,
} from "../types";
import {
  INITIAL_USERS,
  INITIAL_BUSINESSES,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_CLIENTS,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
  INITIAL_TRANSFERS,
  INITIAL_INVOICES,
  INITIAL_PARTIAL_PAYMENTS,
  INITIAL_RECEIPTS,
  INITIAL_MONTHLY_CLOSINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TEMPLATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECURRING,
} from "../data/initialData";

const STORAGE_KEY = "so_finance_system_data_v1";

interface FinanceContextType {
  // Current session & auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoaded: boolean;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => { success: boolean; message?: string };
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message?: string };
  findUserForPasswordReset: (usernameOrEmail: string) => { found: boolean; user?: User; message?: string };
  resetPasswordViaEmail: (usernameOrEmail: string, newPassword: string) => { success: boolean; message: string };
  resetPasswordViaSecurityQuestion: (usernameOrEmail: string, answer: string, newPassword: string) => { success: boolean; message: string };
  addUser: (userData: Omit<User, "id">) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => boolean;

  users: User[];
  businesses: BusinessProfile[];
  activeBusiness: BusinessProfile;
  setActiveBusinessId: (id: string) => void;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  createBusiness: (name: string, type: string) => void;
  deleteBusiness: (id: string) => boolean;

  // Global display currency & exchange rate
  viewCurrency: Currency;
  setViewCurrency: (c: Currency) => void;
  exchangeRate: number; // 1 USD in SLSH
  setExchangeRate: (rate: number) => void;
  formatCurrency: (amountUSD: number, amountSLSH?: number, forceCurrency?: Currency) => string;
  convertToUSD: (amount: number, currency: Currency) => number;
  convertToSLSH: (amount: number, currency: Currency) => number;

  // Active navigation tab
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Time filters
  timeFilter: TimeFilter;
  setTimeFilter: (tf: TimeFilter) => void;
  customDateRange: DateRange;
  setCustomDateRange: (range: DateRange) => void;

  // Data lists (filtered to active business)
  accounts: Account[];
  clients: Client[];
  services: ServiceItem[];
  categories: Category[];
  incomes: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  transfers: TransferTransaction[];
  invoices: Invoice[];
  partialPayments: PartialPayment[];
  receipts: Receipt[];
  monthlyClosings: MonthlyClosing[];
  auditLogs: AuditLog[];
  templates: QuickTemplate[];
  notifications: AppNotification[];

  // Monthly lock check
  isMonthLocked: (dateString: string) => boolean;
  toggleMonthLock: (monthKey: string, notes?: string) => void;

  // Income Operations
  addIncome: (data: Omit<IncomeTransaction, "id" | "businessId" | "createdAt" | "createdBy">) => IncomeTransaction;
  updateIncome: (id: string, data: Partial<IncomeTransaction>) => void;
  deleteIncome: (id: string) => boolean;

  // Expense Operations
  addExpense: (data: Omit<ExpenseTransaction, "id" | "businessId" | "createdAt" | "createdBy">) => ExpenseTransaction;
  updateExpense: (id: string, data: Partial<ExpenseTransaction>) => void;
  deleteExpense: (id: string) => boolean;

  // Transfer Operations
  addTransfer: (data: Omit<TransferTransaction, "id" | "businessId" | "createdAt" | "createdBy">) => TransferTransaction;
  deleteTransfer: (id: string) => boolean;

  // Client Operations
  addClient: (data: Omit<Client, "id" | "businessId" | "createdAt">) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Account Operations
  addAccount: (data: Omit<Account, "id" | "businessId" | "currentBalanceUSD" | "currentBalanceSLSH">) => Account;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Service Operations
  addService: (data: Omit<ServiceItem, "id" | "businessId">) => ServiceItem;
  updateService: (id: string, data: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;

  // Category Operations
  addCategory: (data: Omit<Category, "id" | "businessId">) => Category;

  // Invoice & Partial Payments Operations
  addInvoice: (data: Omit<Invoice, "id" | "businessId" | "createdAt" | "createdBy">) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => boolean;
  recordPartialPayment: (payment: {
    invoiceId?: string;
    incomeId?: string;
    clientId?: string;
    clientName?: string;
    amountUSD: number;
    amountSLSH: number;
    currency: Currency;
    paymentMethod: any;
    accountId: string;
    date: string;
    notes?: string;
  }) => PartialPayment;

  // Receipt Operations
  generateReceipt: (data: Omit<Receipt, "id" | "businessId" | "createdAt">) => Receipt;

  // Quick Action Modal control
  openQuickAction: (actionType: "income" | "expense" | "transfer" | "invoice" | "client" | "receipt") => void;
  quickActionModal: "income" | "expense" | "transfer" | "invoice" | "client" | "receipt" | null;
  closeQuickAction: () => void;

  // Permission helpers
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;

  // Notification actions
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Backup & Restore
  exportAllDataJSON: () => void;
  importAllDataJSON: (jsonString: string) => boolean;
  resetToDemoData: () => void;

  // Dark mode
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;

  // Recurring Transactions
  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (data: Omit<RecurringTransaction, "id" | "businessId" | "createdAt" | "createdBy" | "totalRuns">) => RecurringTransaction;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (id: string) => boolean;
  toggleRecurringStatus: (id: string) => void;
  processDueRecurringTransactions: () => { count: number; items: string[] };

  // Live Cloud Storage
  isCloudSyncActive: boolean;
  cloudSyncStatus: "connected" | "syncing" | "offline" | "error";
  lastCloudUpdate: string | null;
  lastCloudAuthor: string | null;
  cloudVersion: number;
  recentChanges: CloudChangeRecord[];
  syncToCloud: (summary?: string, actionType?: string) => Promise<boolean>;
  fetchFromCloud: () => Promise<boolean>;
  toggleCloudSync: (enabled: boolean) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const SESSION_KEY = "so_finance_active_session_v1";

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state or fallback to demo
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUserState] = useState<User>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>(INITIAL_BUSINESSES);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string>("biz-1");

  const [viewCurrency, setViewCurrency] = useState<Currency>("USD");
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  });

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [incomes, setIncomes] = useState<IncomeTransaction[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(INITIAL_EXPENSES);
  const [transfers, setTransfers] = useState<TransferTransaction[]>(INITIAL_TRANSFERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>(INITIAL_PARTIAL_PAYMENTS);
  const [receipts, setReceipts] = useState<Receipt[]>(INITIAL_RECEIPTS);
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>(INITIAL_MONTHLY_CLOSINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [templates, setTemplates] = useState<QuickTemplate[]>(INITIAL_TEMPLATES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(INITIAL_RECURRING);

  // Live Cloud Storage state
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(() => {
    return localStorage.getItem("finance_cloud_sync_active") !== "false";
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"connected" | "syncing" | "offline" | "error">("connected");
  const [lastCloudUpdate, setLastCloudUpdate] = useState<string | null>(new Date().toISOString());
  const [lastCloudAuthor, setLastCloudAuthor] = useState<string | null>("Axmed Qaaddi");
  const [cloudVersion, setCloudVersion] = useState<number>(1);
  const [recentChanges, setRecentChanges] = useState<CloudChangeRecord[]>([
    {
      id: "chg-init",
      timestamp: new Date().toISOString(),
      author: "Axmed Qaaddi",
      actionType: "system_init",
      summary: "Live Cloud Storage waa shaqaynaysaa (Qaaddi Notary Public)",
    },
  ]);

  const [quickActionModal, setQuickActionModal] = useState<"income" | "expense" | "transfer" | "invoice" | "client" | "receipt" | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  // Load from localStorage on mount
  useEffect(() => {
    let resolvedUsers = INITIAL_USERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businesses && Array.isArray(parsed.businesses)) {
          const cleanedBusinesses = parsed.businesses
            .filter(
              (b: BusinessProfile) =>
                b.id !== "biz-2" &&
                !b.name?.toLowerCase().includes("barwaaqo") &&
                !b.name?.toLowerCase().includes("batwaaqo")
            )
            .map((b: BusinessProfile) => {
              if (b.id === "biz-1") {
                return {
                  ...b,
                  name: "Qaaddi Notary Public",
                  logoUrl: "/qaaddi-logo.png",
                  businessType: "Notary Public & Legal Services (Khibrad 23+ Years)",
                };
              }
              return b;
            });
          setBusinesses(cleanedBusinesses.length > 0 ? cleanedBusinesses : INITIAL_BUSINESSES);
        }
        if (parsed.activeBusinessId) {
          const validActiveId = parsed.activeBusinessId === "biz-2" ? "biz-1" : parsed.activeBusinessId;
          setActiveBusinessIdState(validActiveId);
        }
        if (parsed.users && Array.isArray(parsed.users)) {
          // Normalize users ensuring username, password, securityQuestion, and securityAnswer exist
          resolvedUsers = parsed.users.map((u: User) => {
            const initMatch = INITIAL_USERS.find((init) => init.id === u.id);
            return {
              ...u,
              username:
                u.username ||
                (u.id === "usr-1"
                  ? "admin"
                  : u.email
                  ? u.email.split("@")[0].toLowerCase()
                  : `user_${u.id}`),
              password: u.password || (u.id === "usr-1" ? "admin" : "123"),
              securityQuestion:
                u.securityQuestion ||
                initMatch?.securityQuestion ||
                "Waa kuwee magaalada aad ku dhalatay?",
              securityAnswer:
                u.securityAnswer || initMatch?.securityAnswer || "Hargeysa",
            };
          });
          setUsers(resolvedUsers);
        }
        if (parsed.accounts && Array.isArray(parsed.accounts)) {
          const cleanedAccounts = parsed.accounts.filter(
            (a: Account) => a.id !== "acc-5" && a.businessId !== "biz-2"
          );
          setAccounts(cleanedAccounts);
        }
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.services) setServices(parsed.services);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.incomes) setIncomes(parsed.incomes);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.transfers) setTransfers(parsed.transfers);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.partialPayments) setPartialPayments(parsed.partialPayments);
        if (parsed.receipts) setReceipts(parsed.receipts);
        if (parsed.monthlyClosings) setMonthlyClosings(parsed.monthlyClosings);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.templates) setTemplates(parsed.templates);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.recurringTransactions && Array.isArray(parsed.recurringTransactions)) {
          setRecurringTransactions(parsed.recurringTransactions);
        }
        if (parsed.viewCurrency) setViewCurrency(parsed.viewCurrency);
        if (parsed.theme) setThemeState(parsed.theme);
      }
    } catch (e) {
      console.warn("Could not load stored finance data:", e);
    }

    // Check active login session in localStorage or sessionStorage
    try {
      const savedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        if (sessionData && sessionData.userId) {
          const matchedUser = resolvedUsers.find((u) => u.id === sessionData.userId);
          if (matchedUser) {
            setCurrentUserState(matchedUser);
            setIsAuthenticated(true);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load auth session:", e);
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        businesses,
        activeBusinessId,
        users,
        accounts,
        clients,
        services,
        categories,
        incomes,
        expenses,
        transfers,
        invoices,
        partialPayments,
        receipts,
        monthlyClosings,
        recurringTransactions,
        auditLogs,
        templates,
        notifications,
        viewCurrency,
        theme,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }, [
    isLoaded,
    businesses,
    activeBusinessId,
    users,
    accounts,
    clients,
    services,
    categories,
    incomes,
    expenses,
    transfers,
    invoices,
    partialPayments,
    receipts,
    monthlyClosings,
    recurringTransactions,
    auditLogs,
    templates,
    notifications,
    viewCurrency,
    theme,
  ]);

  // Handle HTML dark mode class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
  };

  const activeBusiness = useMemo(() => {
    return businesses.find((b) => b.id === activeBusinessId) || businesses[0] || INITIAL_BUSINESSES[0];
  }, [businesses, activeBusinessId]);

  const exchangeRate = activeBusiness.exchangeRate || 10000;

  const setExchangeRate = (rate: number) => {
    if (rate <= 0) return;
    updateBusinessProfile({ exchangeRate: rate });
    logAudit("update", "settings", activeBusiness.id, `Exchange rate updated to 1 USD = ${rate.toLocaleString()} SLSH`);
  };

  const updateBusinessProfile = (profile: Partial<BusinessProfile>) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === activeBusiness.id ? { ...b, ...profile } : b))
    );
  };

  const createBusiness = (name: string, businessType: string) => {
    const newId = `biz-${Date.now()}`;
    const newBiz: BusinessProfile = {
      id: newId,
      name,
      businessType,
      phone: "+252 63 ",
      email: "",
      address: "",
      city: "Hargeysa",
      defaultCurrency: "USD",
      exchangeRate: 10000,
      invoicePrefix: "INV-",
      receiptPrefix: "REC-",
      incomePrefix: "INC-",
      expensePrefix: "EXP-",
      transferPrefix: "TRF-",
      taxRatePercent: 0,
    };
    setBusinesses((prev) => [...prev, newBiz]);
    setActiveBusinessIdState(newId);
    logAudit("create", "settings", newId, `Ganacsi cusub ayaa la furay: ${name}`);
  };

  const deleteBusiness = (id: string): boolean => {
    if (businesses.length <= 1) return false;
    const toDelete = businesses.find((b) => b.id === id);
    const updated = businesses.filter((b) => b.id !== id);
    setBusinesses(updated);
    if (activeBusinessId === id) {
      setActiveBusinessIdState(updated[0]?.id || "biz-1");
    }
    logAudit("delete", "settings", id, `Ganacsi waa la tirtiray: ${toDelete?.name || id}`);
    return true;
  };

  const setActiveBusinessId = (id: string) => {
    setActiveBusinessIdState(id);
    logAudit("login", "settings", id, `Waxaa loo wareegay ganacsiga: ${businesses.find((b) => b.id === id)?.name || id}`);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    logAudit("login", "settings", user.id, `User signed in as: ${user.name} (${user.role})`);
  };

  // Currency helpers
  const convertToUSD = (amount: number, currency: Currency): number => {
    if (currency === "USD") return amount;
    return exchangeRate > 0 ? amount / exchangeRate : amount;
  };

  const convertToSLSH = (amount: number, currency: Currency): number => {
    if (currency === "SLSH") return amount;
    return amount * exchangeRate;
  };

  const formatCurrency = (amountUSD: number, amountSLSH?: number, forceCurrency?: Currency): string => {
    const target = forceCurrency || viewCurrency;
    if (target === "SLSH") {
      const slshVal = amountSLSH !== undefined ? amountSLSH : amountUSD * exchangeRate;
      return `${Math.round(slshVal).toLocaleString()} SLSH`;
    }
    return `$${amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Audit Logging
  const logAudit = (
    action: AuditLog["action"],
    entityType: AuditLog["entityType"],
    entityId: string,
    summary: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const logItem: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      businessId: activeBusiness.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      summary,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [logItem, ...prev]);
  };

  // Permissions
  const canEdit = currentUser.role !== "viewer";
  const canDelete = currentUser.role === "owner" || currentUser.role === "admin";
  const canManageUsers = currentUser.role === "owner" || currentUser.role === "admin";

  // Authentication & Session
  const login = (
    usernameOrEmail: string,
    password: string,
    rememberMe = true
  ): { success: boolean; message?: string } => {
    const input = usernameOrEmail.trim().toLowerCase();
    const pass = password.trim();

    const matched = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === input) ||
        (u.email && u.email.toLowerCase() === input)
    );

    if (!matched) {
      return {
        success: false,
        message: "Magaca isticmaalaha ama email-ka lama helin. Fadlan hubi macluumaadkaaga!",
      };
    }

    const expectedPass = matched.password || (matched.id === "usr-1" ? "admin" : "123");
    if (expectedPass !== pass) {
      return {
        success: false,
        message: "Furaha sirta ah (password) waa khalad! Fadlan dib u hubi furahaaga.",
      };
    }

    setCurrentUserState(matched);
    setIsAuthenticated(true);

    const sessionPayload = JSON.stringify({ userId: matched.id, loggedAt: new Date().toISOString() });
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, sessionPayload);
    } else {
      sessionStorage.setItem(SESSION_KEY, sessionPayload);
    }

    logAudit("login", "settings", matched.id, `Isticmaalaha ${matched.name} (${matched.role}) ayaa si guul leh u galay nidaamka.`);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    logAudit("login", "settings", currentUser.id, `Isticmaalaha ${currentUser.name} ayaa ka baxay nidaamka.`);
  };

  const changePassword = (
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    const currentPass = currentUser.password || (currentUser.id === "usr-1" ? "admin" : "123");
    if (currentPass !== oldPassword.trim()) {
      return {
        success: false,
        message: "Furahaagii hore waa khalad! Fadlan hubi furahaagii hore.",
      };
    }

    if (!newPassword || newPassword.trim().length < 3) {
      return {
        success: false,
        message: "Furaha cusub waa inuu ka koobnaadaa ugu yaraan 3 xaraf ama lambar.",
      };
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPassword.trim(),
    };

    setCurrentUserState(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    logAudit("update", "settings", currentUser.id, `Isticmaalaha ${currentUser.name} ayaa beddelay furahiisa sirta ah.`);
    return { success: true, message: "Furaha sirta ah si guul leh ayaa loo beddelay!" };
  };

  const findUserForPasswordReset = (
    usernameOrEmail: string
  ): { found: boolean; user?: User; message?: string } => {
    const clean = usernameOrEmail.trim().toLowerCase();
    if (!clean) {
      return { found: false, message: "Fadlan geli username ama email sax ah." };
    }
    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean)
    );
    if (!user) {
      return {
        found: false,
        message: `Lama helin akoon wata username ama email: "${usernameOrEmail}". Fadlan dib u hubi.`,
      };
    }
    return { found: true, user };
  };

  const resetPasswordViaEmail = (
    usernameOrEmail: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const res = findUserForPasswordReset(usernameOrEmail);
    if (!res.found || !res.user) {
      return { success: false, message: res.message || "Lama helin isticmaalahan." };
    }
    if (!newPassword || newPassword.trim().length < 3) {
      return {
        success: false,
        message: "Furaha cusub waa inuu ka koobnaadaa ugu yaraan 3 xaraf ama lambar.",
      };
    }

    const trimmedPassword = newPassword.trim();
    setUsers((prev) =>
      prev.map((u) => (u.id === res.user!.id ? { ...u, password: trimmedPassword } : u))
    );
    logAudit(
      "update",
      "settings",
      res.user.id,
      `Furaha sirta ah ee ${res.user.name} (@${res.user.username}) waxaa dib looga dejiyay xaqiijinta Email-ka.`
    );
    return {
      success: true,
      message: `Furaha sirta ah ee ${res.user.name} si guul leh ayaa loo beddelay!`,
    };
  };

  const resetPasswordViaSecurityQuestion = (
    usernameOrEmail: string,
    answer: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const res = findUserForPasswordReset(usernameOrEmail);
    if (!res.found || !res.user) {
      return { success: false, message: res.message || "Lama helin isticmaalahan." };
    }
    const user = res.user;
    const cleanAnswer = answer.trim().toLowerCase();
    const expectedAnswer = (user.securityAnswer || "Hargeysa").trim().toLowerCase();

    if (cleanAnswer !== expectedAnswer) {
      return {
        success: false,
        message: "Jawaabta su'aasha amnigu ma saxna. Fadlan dib u hubi qoraalkaaga.",
      };
    }

    if (!newPassword || newPassword.trim().length < 3) {
      return {
        success: false,
        message: "Furaha cusub waa inuu ka koobnaadaa ugu yaraan 3 xaraf ama lambar.",
      };
    }

    const trimmedPassword = newPassword.trim();
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: trimmedPassword } : u))
    );
    logAudit(
      "update",
      "settings",
      user.id,
      `Furaha sirta ah ee ${user.name} (@${user.username}) waxaa dib looga dejiyay Su'aasha Amniga.`
    );
    return {
      success: true,
      message: `Furaha sirta ah ee ${user.name} si guul leh ayaa loo beddelay!`,
    };
  };

  const addUser = (userData: Omit<User, "id">): User => {
    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      ...userData,
      username: (userData.username || userData.email.split("@")[0] || `user_${Date.now()}`).trim().toLowerCase(),
      password: userData.password?.trim() || "123",
      securityQuestion: userData.securityQuestion || "Waa kuwee magaalada aad ku dhalatay?",
      securityAnswer: userData.securityAnswer || "Hargeysa",
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit("create", "settings", newId, `Isticmaale cusub ayaa lagu daray: ${newUser.name} (@${newUser.username}) - Doorka: ${newUser.role}`);
    return newUser;
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          if (data.name) updated.name = data.name.trim();
          if (data.username) updated.username = data.username.trim().toLowerCase();
          if (data.password && data.password.trim()) updated.password = data.password.trim();
          if (data.email) updated.email = data.email.trim();
          if (data.phone) updated.phone = data.phone.trim();
          if (data.securityQuestion) updated.securityQuestion = data.securityQuestion.trim();
          if (data.securityAnswer) updated.securityAnswer = data.securityAnswer.trim();
          if (currentUser.id === id) {
            setCurrentUserState(updated);
          }
          return updated;
        }
        return u;
      })
    );
    const target = users.find((u) => u.id === id);
    logAudit(
      "update",
      "settings",
      id,
      `Isticmaalaha ${data.name || target?.name || id} (@${data.username || target?.username}) ayaa xogtiisa/furahiisa wax laga beddelay.`
    );
  };

  const deleteUser = (id: string): boolean => {
    if (id === currentUser.id) {
      alert("Ma tirtiri kartid akoonka aad hadda ku jirto!");
      return false;
    }
    if (id === "usr-1") {
      alert("Akoonka asalka ah ee Maamulaha (Owner) lama tirtiri karo!");
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAudit("delete", "settings", id, `Isticmaale ayaa la tirtiray id:${id}`);
    return true;
  };

  // Check Month Lock
  const isMonthLocked = (dateString: string): boolean => {
    if (!dateString) return false;
    const monthKey = dateString.substring(0, 7); // "YYYY-MM"
    const lock = monthlyClosings.find((m) => m.businessId === activeBusiness.id && m.monthKey === monthKey && m.isLocked);
    return !!lock;
  };

  const toggleMonthLock = (monthKey: string, notes?: string) => {
    const existing = monthlyClosings.find((m) => m.businessId === activeBusiness.id && m.monthKey === monthKey);
    if (existing && existing.isLocked) {
      // Unlock
      setMonthlyClosings((prev) =>
        prev.map((m) => (m.id === existing.id ? { ...m, isLocked: false, notes: notes || "Unlocked" } : m))
      );
      logAudit("unlock", "monthly_closing", monthKey, `Bisha ${monthKey} ayaa laga qaaday qufulka (Unlocked).`);
    } else {
      // Lock
      const newLock: MonthlyClosing = {
        id: `mc-${monthKey}`,
        businessId: activeBusiness.id,
        monthKey,
        isLocked: true,
        lockedBy: `${currentUser.name} (${currentUser.role})`,
        lockedAt: new Date().toISOString(),
        closingBalanceUSD: 0,
        closingBalanceSLSH: 0,
        notes: notes || "Bisha si rasmi ah ayaa loo xidhay.",
      };
      setMonthlyClosings((prev) => [newLock, ...prev.filter((m) => !(m.businessId === activeBusiness.id && m.monthKey === monthKey))]);
      logAudit("lock", "monthly_closing", monthKey, `Bisha ${monthKey} ayaa la xidhay (Locked) si aan records-ka wax looga beddelin.`);
    }
  };

  // Dynamic Account Balances recalculation
  const recalculateAccountBalances = (
    accs: Account[],
    inList: IncomeTransaction[],
    expList: ExpenseTransaction[],
    trfList: TransferTransaction[],
    payList: PartialPayment[]
  ): Account[] => {
    return accs.map((acc) => {
      let balUSD = acc.openingBalanceUSD;
      let balSLSH = acc.openingBalanceSLSH;

      // Incomes directly deposited to this account (paid amount)
      inList
        .filter((i) => i.accountId === acc.id)
        .forEach((i) => {
          balUSD += i.paidAmountUSD || 0;
          balSLSH += i.paidAmountSLSH || 0;
        });

      // Partial payments deposited into this account
      payList
        .filter((p) => p.accountId === acc.id)
        .forEach((p) => {
          balUSD += p.amountUSD || 0;
          balSLSH += p.amountSLSH || 0;
        });

      // Expenses paid out of this account
      expList
        .filter((e) => e.accountId === acc.id)
        .forEach((e) => {
          balUSD -= e.amountUSD || 0;
          balSLSH -= e.amountSLSH || 0;
        });

      // Transfers FROM this account
      trfList
        .filter((t) => t.fromAccountId === acc.id)
        .forEach((t) => {
          balUSD -= t.amountUSD || 0;
          balSLSH -= t.amountSLSH || 0;
        });

      // Transfers TO this account
      trfList
        .filter((t) => t.toAccountId === acc.id)
        .forEach((t) => {
          balUSD += t.amountUSD || 0;
          balSLSH += t.amountSLSH || 0;
        });

      return {
        ...acc,
        currentBalanceUSD: balUSD,
        currentBalanceSLSH: balSLSH,
      };
    });
  };

  // Income Methods
  const addIncome = (data: Omit<IncomeTransaction, "id" | "businessId" | "createdAt" | "createdBy">) => {
    const nextNum = (incomes.filter((i) => i.businessId === activeBusiness.id).length + 1).toString().padStart(6, "0");
    const id = `${activeBusiness.incomePrefix || "INC-"}${nextNum}`;

    const newIncome: IncomeTransaction = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    const nextIncomes = [newIncome, ...incomes];
    setIncomes(nextIncomes);

    // Update account balances
    setAccounts((prev) => recalculateAccountBalances(prev, nextIncomes, expenses, transfers, partialPayments));

    logAudit("create", "income", id, `Waxaa la diiwaangeliyay Dakhli ${formatCurrency(newIncome.amountUSD, newIncome.amountSLSH)}: ${newIncome.description}`);

    // If there is debt remaining, trigger a notification
    if (newIncome.debtAmountUSD > 0) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        businessId: activeBusiness.id,
        title: "⚠️ Deyn Cusub (New Receivable)",
        message: `${newIncome.clientName} waxaa ka harsan deyn ${formatCurrency(newIncome.debtAmountUSD, newIncome.debtAmountSLSH)} oo ku eg ${newIncome.dueDate || "aan la cayimin"}.`,
        type: "warning",
        date: newIncome.date,
        isRead: false,
        linkTab: "debts",
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    return newIncome;
  };

  const updateIncome = (id: string, data: Partial<IncomeTransaction>) => {
    const existing = incomes.find((i) => i.id === id);
    if (!existing) return;
    if (isMonthLocked(existing.date)) {
      alert("Bishan waa la xidhay (Locked). Wax ka beddelid lama oggola.");
      return;
    }

    const nextIncomes = incomes.map((i) => (i.id === id ? { ...i, ...data } : i));
    setIncomes(nextIncomes);
    setAccounts((prev) => recalculateAccountBalances(prev, nextIncomes, expenses, transfers, partialPayments));
    logAudit("update", "income", id, `Waxaa wax laga beddelay Dakhli #${id}`, JSON.stringify(existing), JSON.stringify(data));
  };

  const deleteIncome = (id: string): boolean => {
    const existing = incomes.find((i) => i.id === id);
    if (!existing) return false;
    if (isMonthLocked(existing.date)) {
      alert("Bishan waa la xidhay (Locked). Wax tirtirid ah lama oggola.");
      return false;
    }
    if (!canDelete) {
      alert("Ma lihid awood aad ku tirtirto dakhligan.");
      return false;
    }

    const nextIncomes = incomes.filter((i) => i.id !== id);
    setIncomes(nextIncomes);
    setAccounts((prev) => recalculateAccountBalances(prev, nextIncomes, expenses, transfers, partialPayments));
    logAudit("delete", "income", id, `Waxaa la tirtiray Dakhli #${id} (${existing.clientName})`);
    return true;
  };

  // Expense Methods
  const addExpense = (data: Omit<ExpenseTransaction, "id" | "businessId" | "createdAt" | "createdBy">) => {
    const nextNum = (expenses.filter((e) => e.businessId === activeBusiness.id).length + 1).toString().padStart(6, "0");
    const id = `${activeBusiness.expensePrefix || "EXP-"}${nextNum}`;

    const newExpense: ExpenseTransaction = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    const nextExpenses = [newExpense, ...expenses];
    setExpenses(nextExpenses);
    setAccounts((prev) => recalculateAccountBalances(prev, incomes, nextExpenses, transfers, partialPayments));

    logAudit("create", "expense", id, `Waxaa la qoray Kharash ${formatCurrency(newExpense.amountUSD, newExpense.amountSLSH)}: ${newExpense.category} - ${newExpense.description}`);
    return newExpense;
  };

  const updateExpense = (id: string, data: Partial<ExpenseTransaction>) => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return;
    if (isMonthLocked(existing.date)) {
      alert("Bishan waa la xidhay (Locked). Wax ka beddelid lama oggola.");
      return;
    }

    const nextExpenses = expenses.map((e) => (e.id === id ? { ...e, ...data } : e));
    setExpenses(nextExpenses);
    setAccounts((prev) => recalculateAccountBalances(prev, incomes, nextExpenses, transfers, partialPayments));
    logAudit("update", "expense", id, `Waxaa wax laga beddelay Kharash #${id}`, JSON.stringify(existing), JSON.stringify(data));
  };

  const deleteExpense = (id: string): boolean => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return false;
    if (isMonthLocked(existing.date)) {
      alert("Bishan waa la xidhay (Locked). Wax tirtirid ah lama oggola.");
      return false;
    }
    if (!canDelete) {
      alert("Ma lihid awood aad ku tirtirto kharashkan.");
      return false;
    }

    const nextExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    setAccounts((prev) => recalculateAccountBalances(prev, incomes, nextExpenses, transfers, partialPayments));
    logAudit("delete", "expense", id, `Waxaa la tirtiray Kharash #${id} (${existing.description})`);
    return true;
  };

  // Transfer Methods
  const addTransfer = (data: Omit<TransferTransaction, "id" | "businessId" | "createdAt" | "createdBy">) => {
    const nextNum = (transfers.filter((t) => t.businessId === activeBusiness.id).length + 1).toString().padStart(6, "0");
    const id = `${activeBusiness.transferPrefix || "TRF-"}${nextNum}`;

    const newTransfer: TransferTransaction = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    const nextTransfers = [newTransfer, ...transfers];
    setTransfers(nextTransfers);
    setAccounts((prev) => recalculateAccountBalances(prev, incomes, expenses, nextTransfers, partialPayments));

    const fromAcc = accounts.find((a) => a.id === data.fromAccountId)?.name || "Account";
    const toAcc = accounts.find((a) => a.id === data.toAccountId)?.name || "Account";
    logAudit("transfer", "transfer", id, `Wareejin lacageed ${formatCurrency(newTransfer.amountUSD, newTransfer.amountSLSH)}: Ka: ${fromAcc} → Ku: ${toAcc}`);
    return newTransfer;
  };

  const deleteTransfer = (id: string): boolean => {
    const existing = transfers.find((t) => t.id === id);
    if (!existing) return false;
    if (isMonthLocked(existing.date)) {
      alert("Bishan waa la xidhay (Locked). Lama tirtiri karo.");
      return false;
    }
    const nextTransfers = transfers.filter((t) => t.id !== id);
    setTransfers(nextTransfers);
    setAccounts((prev) => recalculateAccountBalances(prev, incomes, expenses, nextTransfers, partialPayments));
    logAudit("delete", "transfer", id, `Waxaa la tirtiray wareejintii #${id}`);
    return true;
  };

  // Client Methods
  const addClient = (data: Omit<Client, "id" | "businessId" | "createdAt">) => {
    const newClient: Client = {
      ...data,
      id: `cli-${Date.now()}`,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setClients((prev) => [newClient, ...prev]);
    logAudit("create", "client", newClient.id, `Macmiil cusub: ${newClient.name} (${newClient.company || ""})`);
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    logAudit("update", "client", id, `Macmiilka #${id} ayaa la cusboonaysiiyay`);
  };

  const deleteClient = (id: string) => {
    if (!canDelete) {
      alert("Ma lihid awood aad macmiil ku tirtirto.");
      return;
    }
    const cli = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    logAudit("delete", "client", id, `Waxaa la tirtiray macmiilka: ${cli?.name}`);
  };

  // Account Methods
  const addAccount = (data: Omit<Account, "id" | "businessId" | "currentBalanceUSD" | "currentBalanceSLSH">) => {
    const newAccount: Account = {
      ...data,
      id: `acc-${Date.now()}`,
      businessId: activeBusiness.id,
      currentBalanceUSD: data.openingBalanceUSD,
      currentBalanceSLSH: data.openingBalanceSLSH,
    };
    const nextAccs = [...accounts, newAccount];
    setAccounts(recalculateAccountBalances(nextAccs, incomes, expenses, transfers, partialPayments));
    logAudit("create", "account", newAccount.id, `Account cusub: ${newAccount.name} (${newAccount.type})`);
    return newAccount;
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts((prev) =>
      recalculateAccountBalances(
        prev.map((a) => (a.id === id ? { ...a, ...data } : a)),
        incomes,
        expenses,
        transfers,
        partialPayments
      )
    );
    logAudit("update", "account", id, `Account #${id} ayaa wax laga beddelay`);
  };

  const deleteAccount = (id: string) => {
    if (!canDelete) {
      alert("Ma lihid awood aad account ku tirtirto.");
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    logAudit("delete", "account", id, `Account #${id} ayaa la tirtiray`);
  };

  // Service Methods
  const addService = (data: Omit<ServiceItem, "id" | "businessId">) => {
    const newService: ServiceItem = {
      ...data,
      id: `srv-${Date.now()}`,
      businessId: activeBusiness.id,
    };
    setServices((prev) => [...prev, newService]);
    logAudit("create", "settings", newService.id, `Adeeg cusub: ${newService.name}`);
    return newService;
  };

  const updateService = (id: string, data: Partial<ServiceItem>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Category Methods
  const addCategory = (data: Omit<Category, "id" | "businessId">) => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      businessId: activeBusiness.id,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  // Invoice & Partial Payment Methods
  const addInvoice = (data: Omit<Invoice, "id" | "businessId" | "createdAt" | "createdBy">) => {
    const nextNum = (invoices.filter((inv) => inv.businessId === activeBusiness.id).length + 1).toString().padStart(6, "0");
    const id = `${activeBusiness.invoicePrefix || "INV-"}${nextNum}`;

    const newInvoice: Invoice = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    logAudit("create", "invoice", id, `Invoice cusub ${id} ee ${newInvoice.clientName} (${formatCurrency(newInvoice.totalUSD, newInvoice.totalSLSH)})`);
    return newInvoice;
  };

  const updateInvoice = (id: string, data: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)));
  };

  const deleteInvoice = (id: string): boolean => {
    if (!canDelete) {
      alert("Ma lihid awood aad ku tirtirto invoice-kan.");
      return false;
    }
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    logAudit("delete", "invoice", id, `Invoice #${id} ayaa la tirtiray`);
    return true;
  };

  const recordPartialPayment = (paymentData: {
    invoiceId?: string;
    incomeId?: string;
    clientId?: string;
    clientName?: string;
    amountUSD: number;
    amountSLSH: number;
    currency: Currency;
    paymentMethod: any;
    accountId: string;
    date: string;
    notes?: string;
  }) => {
    const payId = `PAY-${Date.now().toString().slice(-6)}`;
    const newPay: PartialPayment = {
      id: payId,
      businessId: activeBusiness.id,
      invoiceId: paymentData.invoiceId,
      incomeId: paymentData.incomeId,
      clientId: paymentData.clientId,
      clientName: paymentData.clientName,
      date: paymentData.date,
      amountUSD: paymentData.amountUSD,
      amountSLSH: paymentData.amountSLSH,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      accountId: paymentData.accountId,
      referenceNo: `REF-${payId}`,
      notes: paymentData.notes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    const nextPayments = [newPay, ...partialPayments];
    setPartialPayments(nextPayments);

    // If attached to an invoice, update invoice paid and balance due
    if (paymentData.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === paymentData.invoiceId) {
            const newPaidUSD = inv.paidUSD + paymentData.amountUSD;
            const newPaidSLSH = inv.paidSLSH + paymentData.amountSLSH;
            const newBalUSD = Math.max(0, inv.totalUSD - newPaidUSD);
            const newBalSLSH = Math.max(0, inv.totalSLSH - newPaidSLSH);
            const newStatus = newBalUSD <= 0 ? "paid" : "partial";
            return {
              ...inv,
              paidUSD: newPaidUSD,
              paidSLSH: newPaidSLSH,
              balanceDueUSD: newBalUSD,
              balanceDueSLSH: newBalSLSH,
              status: newStatus,
            };
          }
          return inv;
        })
      );
    }

    // Also update Income record if attached
    if (paymentData.incomeId) {
      setIncomes((prev) =>
        prev.map((inc) => {
          if (inc.id === paymentData.incomeId) {
            const newPaidUSD = inc.paidAmountUSD + paymentData.amountUSD;
            const newPaidSLSH = inc.paidAmountSLSH + paymentData.amountSLSH;
            const newDebtUSD = Math.max(0, inc.amountUSD - newPaidUSD);
            const newDebtSLSH = Math.max(0, inc.amountSLSH - newPaidSLSH);
            const newStatus = newDebtUSD <= 0 ? "paid" : "partial";
            return {
              ...inc,
              paidAmountUSD: newPaidUSD,
              paidAmountSLSH: newPaidSLSH,
              debtAmountUSD: newDebtUSD,
              debtAmountSLSH: newDebtSLSH,
              status: newStatus,
            };
          }
          return inc;
        })
      );
    }

    // Also automatically generate a Receipt for this payment!
    const recNum = (receipts.filter((r) => r.businessId === activeBusiness.id).length + 1).toString().padStart(6, "0");
    const recId = `${activeBusiness.receiptPrefix || "REC-"}${recNum}`;
    const newReceipt: Receipt = {
      id: recId,
      businessId: activeBusiness.id,
      invoiceId: paymentData.invoiceId,
      incomeId: paymentData.incomeId,
      date: paymentData.date,
      clientName: paymentData.clientName || "Macmiil",
      description: `Bixinta qayb ka mid ah ${paymentData.invoiceId ? `Invoice ${paymentData.invoiceId}` : "Dakhli"}`,
      amountUSD: paymentData.amountUSD,
      amountSLSH: paymentData.amountSLSH,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      accountId: paymentData.accountId,
      receivedBy: currentUser.name,
      signature: currentUser.name,
      notes: paymentData.notes,
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [newReceipt, ...prev]);

    // Update account balances
    setAccounts((prev) => recalculateAccountBalances(prev, incomes, expenses, transfers, nextPayments));

    logAudit("create", "receipt", recId, `Qayb lacag bixin ah la helay (${formatCurrency(newPay.amountUSD, newPay.amountSLSH)}) Rasiidh #${recId}`);
    return newPay;
  };

  const generateReceipt = (data: Omit<Receipt, "id" | "businessId" | "createdAt">) => {
    const nextNum = (receipts.filter((r) => r.businessId === activeBusiness.id).length + 1).toString().padStart(6, "0");
    const id = `${activeBusiness.receiptPrefix || "REC-"}${nextNum}`;

    const newReceipt: Receipt = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    logAudit("create", "receipt", id, `Rasiidh cusub #${id} oo loogu talagalay ${newReceipt.clientName}`);
    return newReceipt;
  };

  // Quick Action Modal helpers
  const openQuickAction = (actionType: "income" | "expense" | "transfer" | "invoice" | "client" | "receipt") => {
    setQuickActionModal(actionType);
  };

  const closeQuickAction = () => {
    setQuickActionModal(null);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Backup & Restore
  const exportAllDataJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      businesses,
      users,
      accounts,
      clients,
      services,
      categories,
      incomes,
      expenses,
      transfers,
      invoices,
      partialPayments,
      receipts,
      monthlyClosings,
      auditLogs,
      templates,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_backup_${activeBusiness.name.replace(/\s+/g, "_")}_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit("create", "settings", "backup", "Xogta oo dhan ayaa loo soosaaray faylka JSON (Backup).");
  };

  const importAllDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.businesses) setBusinesses(data.businesses);
      if (data.accounts) setAccounts(data.accounts);
      if (data.clients) setClients(data.clients);
      if (data.services) setServices(data.services);
      if (data.categories) setCategories(data.categories);
      if (data.incomes) setIncomes(data.incomes);
      if (data.expenses) setExpenses(data.expenses);
      if (data.transfers) setTransfers(data.transfers);
      if (data.invoices) setInvoices(data.invoices);
      if (data.partialPayments) setPartialPayments(data.partialPayments);
      if (data.receipts) setReceipts(data.receipts);
      if (data.monthlyClosings) setMonthlyClosings(data.monthlyClosings);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      logAudit("restore", "settings", "restore", "Xogta xisaabaadka ayaa laga soo celiyay faylka backup-ka (Restore).");
      return true;
    } catch (e) {
      console.error("Failed to import JSON:", e);
      return false;
    }
  };

  const resetToDemoData = () => {
    if (window.confirm("Ma hubtaa inaad rabto inaad dib ugu celiso xogtii asalka ahayd ee tusaalaha ahayd?")) {
      setBusinesses(INITIAL_BUSINESSES);
      setActiveBusinessIdState("biz-1");
      setUsers(INITIAL_USERS);
      setCurrentUserState(INITIAL_USERS[0]);
      setAccounts(INITIAL_ACCOUNTS);
      setClients(INITIAL_CLIENTS);
      setServices(INITIAL_SERVICES);
      setCategories(INITIAL_CATEGORIES);
      setIncomes(INITIAL_INCOMES);
      setExpenses(INITIAL_EXPENSES);
      setTransfers(INITIAL_TRANSFERS);
      setInvoices(INITIAL_INVOICES);
      setPartialPayments(INITIAL_PARTIAL_PAYMENTS);
      setReceipts(INITIAL_RECEIPTS);
      setMonthlyClosings(INITIAL_MONTHLY_CLOSINGS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setTemplates(INITIAL_TEMPLATES);
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEY);
      logAudit("restore", "settings", "reset", "Nidaamka waxaa dib loogu celiyay demo data-dii hore.");
    }
  };

  // Cloud Sync Functions
  const fetchFromCloud = async (): Promise<boolean> => {
    try {
      setCloudSyncStatus("syncing");
      const res = await fetch("/api/cloud/data");
      if (!res.ok) throw new Error("Cloud fetch failed");
      const json = await res.json();
      if (json && json.data) {
        const d = json.data;
        if (d.businesses && Array.isArray(d.businesses)) setBusinesses(d.businesses);
        if (d.users && Array.isArray(d.users)) setUsers(d.users);
        if (d.accounts && Array.isArray(d.accounts)) setAccounts(d.accounts);
        if (d.clients && Array.isArray(d.clients)) setClients(d.clients);
        if (d.services && Array.isArray(d.services)) setServices(d.services);
        if (d.categories && Array.isArray(d.categories)) setCategories(d.categories);
        if (d.incomes && Array.isArray(d.incomes)) setIncomes(d.incomes);
        if (d.expenses && Array.isArray(d.expenses)) setExpenses(d.expenses);
        if (d.transfers && Array.isArray(d.transfers)) setTransfers(d.transfers);
        if (d.invoices && Array.isArray(d.invoices)) setInvoices(d.invoices);
        if (d.partialPayments && Array.isArray(d.partialPayments)) setPartialPayments(d.partialPayments);
        if (d.receipts && Array.isArray(d.receipts)) setReceipts(d.receipts);
        if (d.monthlyClosings && Array.isArray(d.monthlyClosings)) setMonthlyClosings(d.monthlyClosings);
        if (d.recurringTransactions && Array.isArray(d.recurringTransactions)) setRecurringTransactions(d.recurringTransactions);
        if (d.auditLogs && Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
      }
      if (json.version) setCloudVersion(json.version);
      if (json.lastUpdate) setLastCloudUpdate(json.lastUpdate);
      if (json.lastUpdatedBy) setLastCloudAuthor(json.lastUpdatedBy);
      if (json.recentChanges) setRecentChanges(json.recentChanges);
      setCloudSyncStatus("connected");
      return true;
    } catch (err) {
      console.warn("Could not fetch cloud data:", err);
      setCloudSyncStatus("offline");
      return false;
    }
  };

  const syncToCloud = async (summary?: string, actionType?: string): Promise<boolean> => {
    if (!isCloudSyncActive) return false;
    try {
      setCloudSyncStatus("syncing");
      const payload = {
        data: {
          businesses,
          activeBusinessId,
          users,
          accounts,
          clients,
          services,
          categories,
          incomes,
          expenses,
          transfers,
          invoices,
          partialPayments,
          receipts,
          monthlyClosings,
          recurringTransactions,
          auditLogs,
          templates,
        },
        summary: summary || "Isbeddel cusub ayaa lagu sameeyay nidaamka",
        author: `${currentUser.name} (${currentUser.role})`,
        actionType: actionType || "update",
      };

      const res = await fetch("/api/cloud/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Sync failed");
      const json = await res.json();
      if (json.version) setCloudVersion(json.version);
      if (json.lastUpdate) setLastCloudUpdate(json.lastUpdate);
      if (json.lastUpdatedBy) setLastCloudAuthor(json.lastUpdatedBy);
      if (json.recentChanges) setRecentChanges(json.recentChanges);
      setCloudSyncStatus("connected");
      return true;
    } catch (e) {
      console.warn("Cloud sync error:", e);
      setCloudSyncStatus("offline");
      return false;
    }
  };

  const toggleCloudSync = async (enabled: boolean): Promise<void> => {
    setIsCloudSyncActive(enabled);
    localStorage.setItem("finance_cloud_sync_active", String(enabled));
    try {
      await fetch("/api/cloud/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (enabled) {
        await syncToCloud("Live Cloud Storage ayaa dib loo hawlgeliyay", "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Periodic Cloud Sync Polling so all visitors see live updates
  useEffect(() => {
    if (!isLoaded) return;
    fetchFromCloud();

    const interval = setInterval(async () => {
      if (!isCloudSyncActive) return;
      try {
        const res = await fetch("/api/cloud/status");
        if (res.ok) {
          const status = await res.json();
          if (status.lastUpdate) setLastCloudUpdate(status.lastUpdate);
          if (status.lastUpdatedBy) setLastCloudAuthor(status.lastUpdatedBy);
          if (status.recentChanges) setRecentChanges(status.recentChanges);
          if (status.version && status.version > cloudVersion) {
            fetchFromCloud();
          }
        }
      } catch (err) {
        // silent
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoaded, isCloudSyncActive, cloudVersion]);

  // Recurring Transactions Methods
  const addRecurringTransaction = (
    data: Omit<RecurringTransaction, "id" | "businessId" | "createdAt" | "createdBy" | "totalRuns">
  ): RecurringTransaction => {
    const nextNum = (recurringTransactions.filter((r) => r.businessId === activeBusiness.id).length + 1)
      .toString()
      .padStart(6, "0");
    const id = `REC-TX-${nextNum}`;

    const newRec: RecurringTransaction = {
      ...data,
      id,
      businessId: activeBusiness.id,
      totalRuns: 0,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    const nextList = [newRec, ...recurringTransactions];
    setRecurringTransactions(nextList);
    logAudit(
      "create",
      "settings",
      id,
      `Jadwal cusub oo joogto ah: ${newRec.title} (${newRec.frequency} - ${formatCurrency(newRec.amountUSD, newRec.amountSLSH)})`
    );
    syncToCloud(`Jadwal cusub oo joogto ah: ${newRec.title}`, "recurring_create");
    return newRec;
  };

  const updateRecurringTransaction = (id: string, data: Partial<RecurringTransaction>) => {
    const nextList = recurringTransactions.map((r) => (r.id === id ? { ...r, ...data } : r));
    setRecurringTransactions(nextList);
    logAudit("update", "settings", id, `Waxaa wax laga beddelay jadwalka joogtada ah #${id}`);
    syncToCloud(`Jadwalka joogtada ah #${id} ayaa wax laga beddelay`, "recurring_update");
  };

  const deleteRecurringTransaction = (id: string): boolean => {
    const target = recurringTransactions.find((r) => r.id === id);
    if (!target) return false;
    const nextList = recurringTransactions.filter((r) => r.id !== id);
    setRecurringTransactions(nextList);
    logAudit("delete", "settings", id, `Jadwalka joogtada ah waa la tirtiray: ${target.title}`);
    syncToCloud(`Jadwalka joogtada ah waa la tirtiray: ${target.title}`, "recurring_delete");
    return true;
  };

  const toggleRecurringStatus = (id: string) => {
    const target = recurringTransactions.find((r) => r.id === id);
    if (!target) return;
    const newStatus = target.status === "active" ? "paused" : "active";
    updateRecurringTransaction(id, { status: newStatus });
  };

  const advanceDateByFrequency = (dateStr: string, frequency: RecurringTransaction["frequency"]): string => {
    const d = new Date(dateStr);
    if (frequency === "weekly") {
      d.setDate(d.getDate() + 7);
    } else if (frequency === "quarterly") {
      d.setMonth(d.getMonth() + 3);
    } else if (frequency === "yearly") {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      // monthly
      d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().substring(0, 10);
  };

  const processDueRecurringTransactions = (): { count: number; items: string[] } => {
    const today = new Date().toISOString().substring(0, 10);
    const due = recurringTransactions.filter(
      (r) => r.businessId === activeBusiness.id && r.status === "active" && r.nextDueDate <= today
    );

    if (due.length === 0) {
      return { count: 0, items: [] };
    }

    const processedTitles: string[] = [];
    const updatedRecurring = [...recurringTransactions];

    due.forEach((rec) => {
      if (rec.type === "income") {
        addIncome({
          date: rec.nextDueDate,
          referenceNo: `AUTO-REC-${Date.now().toString().slice(-4)}`,
          clientName: rec.clientName || "Macmiil Joogto ah",
          serviceName: rec.serviceName || rec.title,
          description: `[Toos ah / Recurring] ${rec.title}`,
          currency: rec.currency,
          amountUSD: rec.amountUSD,
          amountSLSH: rec.amountSLSH,
          paymentMethod: rec.paymentMethod,
          accountId: rec.accountId || accounts[0]?.id || "acc-1",
          paidAmountUSD: rec.amountUSD,
          debtAmountUSD: 0,
          paidAmountSLSH: rec.amountSLSH,
          debtAmountSLSH: 0,
          status: "paid",
          isRecurring: true,
          recurringFrequency: rec.frequency,
        });
      } else {
        addExpense({
          date: rec.nextDueDate,
          referenceNo: `AUTO-EXP-${Date.now().toString().slice(-4)}`,
          category: rec.category,
          description: `[Toos ah / Recurring] ${rec.title}`,
          supplier: rec.supplierName || "Adeeg Bixiye",
          currency: rec.currency,
          amountUSD: rec.amountUSD,
          amountSLSH: rec.amountSLSH,
          paymentMethod: rec.paymentMethod,
          accountId: rec.accountId || accounts[0]?.id || "acc-1",
          isRecurring: true,
          recurringFrequency: rec.frequency,
        });
      }

      const recIdx = updatedRecurring.findIndex((item) => item.id === rec.id);
      if (recIdx !== -1) {
        const nextDue = advanceDateByFrequency(rec.nextDueDate, rec.frequency);
        const runs = rec.totalRuns + 1;
        const isCompleted = rec.maxRuns ? runs >= rec.maxRuns : false;

        updatedRecurring[recIdx] = {
          ...rec,
          totalRuns: runs,
          lastRunDate: today,
          nextDueDate: nextDue,
          status: isCompleted ? "completed" : "active",
        };
      }
      processedTitles.push(rec.title);
    });

    setRecurringTransactions(updatedRecurring);
    logAudit("create", "settings", "batch", `Waxaa si toos ah loo maareeyay ${due.length} dhaqdhaqaaq oo joogto ah.`);
    syncToCloud(`Waxaa si toos ah loo maareeyay ${due.length} dhaqdhaqaaq oo joogto ah: ${processedTitles.join(", ")}`, "recurring_process");

    return { count: due.length, items: processedTitles };
  };

  // Auto-check recurring transactions on load
  useEffect(() => {
    if (!isLoaded) return;
    const today = new Date().toISOString().substring(0, 10);
    const autoDue = recurringTransactions.filter(
      (r) => r.businessId === activeBusiness.id && r.status === "active" && r.autoProcess && r.nextDueDate <= today
    );
    if (autoDue.length > 0) {
      processDueRecurringTransactions();
    }
  }, [isLoaded, activeBusiness.id]);

  // Filtered lists for the active business
  const businessAccounts = useMemo(() => accounts.filter((a) => a.businessId === activeBusiness.id), [accounts, activeBusiness.id]);
  const businessClients = useMemo(() => clients.filter((c) => c.businessId === activeBusiness.id), [clients, activeBusiness.id]);
  const businessServices = useMemo(() => services.filter((s) => s.businessId === activeBusiness.id), [services, activeBusiness.id]);
  const businessCategories = useMemo(() => categories.filter((c) => c.businessId === activeBusiness.id), [categories, activeBusiness.id]);
  const businessIncomes = useMemo(() => incomes.filter((i) => i.businessId === activeBusiness.id), [incomes, activeBusiness.id]);
  const businessExpenses = useMemo(() => expenses.filter((e) => e.businessId === activeBusiness.id), [expenses, activeBusiness.id]);
  const businessTransfers = useMemo(() => transfers.filter((t) => t.businessId === activeBusiness.id), [transfers, activeBusiness.id]);
  const businessInvoices = useMemo(() => invoices.filter((inv) => inv.businessId === activeBusiness.id), [invoices, activeBusiness.id]);
  const businessPartialPayments = useMemo(() => partialPayments.filter((p) => p.businessId === activeBusiness.id), [partialPayments, activeBusiness.id]);
  const businessReceipts = useMemo(() => receipts.filter((r) => r.businessId === activeBusiness.id), [receipts, activeBusiness.id]);
  const businessMonthlyClosings = useMemo(() => monthlyClosings.filter((m) => m.businessId === activeBusiness.id), [monthlyClosings, activeBusiness.id]);
  const businessRecurringTransactions = useMemo(() => recurringTransactions.filter((r) => r.businessId === activeBusiness.id), [recurringTransactions, activeBusiness.id]);
  const businessAuditLogs = useMemo(() => auditLogs.filter((a) => a.businessId === activeBusiness.id), [auditLogs, activeBusiness.id]);
  const businessTemplates = useMemo(() => templates.filter((t) => t.businessId === activeBusiness.id), [templates, activeBusiness.id]);
  const businessNotifications = useMemo(() => notifications.filter((n) => n.businessId === activeBusiness.id), [notifications, activeBusiness.id]);

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        isLoaded,
        login,
        logout,
        changePassword,
        findUserForPasswordReset,
        resetPasswordViaEmail,
        resetPasswordViaSecurityQuestion,
        addUser,
        updateUser,
        deleteUser,
        users,
        businesses,
        activeBusiness,
        setActiveBusinessId,
        updateBusinessProfile,
        createBusiness,
        deleteBusiness,
        viewCurrency,
        setViewCurrency,
        exchangeRate,
        setExchangeRate,
        formatCurrency,
        convertToUSD,
        convertToSLSH,
        activeTab,
        setActiveTab,
        timeFilter,
        setTimeFilter,
        customDateRange,
        setCustomDateRange,
        accounts: businessAccounts,
        clients: businessClients,
        services: businessServices,
        categories: businessCategories,
        incomes: businessIncomes,
        expenses: businessExpenses,
        transfers: businessTransfers,
        invoices: businessInvoices,
        partialPayments: businessPartialPayments,
        receipts: businessReceipts,
        monthlyClosings: businessMonthlyClosings,
        auditLogs: businessAuditLogs,
        templates: businessTemplates,
        notifications: businessNotifications,
        isMonthLocked,
        toggleMonthLock,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addTransfer,
        deleteTransfer,
        addClient,
        updateClient,
        deleteClient,
        addAccount,
        updateAccount,
        deleteAccount,
        addService,
        updateService,
        deleteService,
        addCategory,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordPartialPayment,
        generateReceipt,
        openQuickAction,
        quickActionModal,
        closeQuickAction,
        canEdit,
        canDelete,
        canManageUsers,
        markNotificationRead,
        clearNotifications,
        exportAllDataJSON,
        importAllDataJSON,
        resetToDemoData,
        theme,
        setTheme,
        recurringTransactions: businessRecurringTransactions,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringStatus,
        processDueRecurringTransactions,
        isCloudSyncActive,
        cloudSyncStatus,
        lastCloudUpdate,
        lastCloudAuthor,
        cloudVersion,
        recentChanges,
        syncToCloud,
        fetchFromCloud,
        toggleCloudSync,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
