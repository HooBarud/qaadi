export type Currency = "USD" | "SLSH";

export type UserRole = "owner" | "admin" | "accountant" | "staff" | "viewer";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  businessType: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoUrl?: string;
  taxNumber?: string;
  defaultCurrency: Currency;
  exchangeRate: number; // e.g. 1 USD = 10,000 SLSH
  invoicePrefix: string;
  receiptPrefix: string;
  incomePrefix: string;
  expensePrefix: string;
  transferPrefix: string;
  invoiceTerms?: string;
  receiptFooter?: string;
  taxRatePercent?: number;
}

export type AccountType = "cash" | "bank" | "mobile_money" | "office_cash" | "personal_cash" | "other";

export interface Account {
  id: string;
  businessId: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  openingBalanceUSD: number;
  openingBalanceSLSH: number;
  currentBalanceUSD: number;
  currentBalanceSLSH: number;
  color?: string;
  isDefault?: boolean;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  businessId: string;
  name: string;
  defaultPriceUSD: number;
  defaultPriceSLSH: number;
  category: string;
  description?: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  type: "income" | "expense" | "both";
  color?: string;
}

export type PaymentMethod = "Cash" | "Bank" | "Mobile Money" | "Zaad" | "Sahal" | "E-Dahab" | "Cheque";

export type PaymentStatus = "paid" | "partial" | "debt" | "overdue";

export interface IncomeTransaction {
  id: string; // INC-000001
  businessId: string;
  date: string; // YYYY-MM-DD
  referenceNo: string;
  clientId?: string;
  clientName: string;
  serviceId?: string;
  serviceName: string;
  description: string;
  currency: Currency;
  amountUSD: number;
  amountSLSH: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  paidAmountUSD: number;
  debtAmountUSD: number;
  paidAmountSLSH: number;
  debtAmountSLSH: number;
  dueDate?: string;
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: PaymentStatus;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: string;
  createdBy: string;
}

export interface ExpenseTransaction {
  id: string; // EXP-000001
  businessId: string;
  date: string; // YYYY-MM-DD
  referenceNo: string;
  category: string;
  description: string;
  supplier: string;
  currency: Currency;
  amountUSD: number;
  amountSLSH: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  receiptName?: string;
  receiptUrl?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: string;
  createdBy: string;
}

export interface TransferTransaction {
  id: string; // TRF-000001
  businessId: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amountUSD: number;
  amountSLSH: number;
  currency: Currency;
  referenceNo: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface InvoiceItem {
  id: string;
  serviceId?: string;
  description: string;
  quantity: number;
  rateUSD: number;
  rateSLSH: number;
  amountUSD: number;
  amountSLSH: number;
}

export interface Invoice {
  id: string; // INV-000001
  businessId: string;
  date: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotalUSD: number;
  subtotalSLSH: number;
  discountUSD: number;
  discountSLSH: number;
  taxUSD: number;
  taxSLSH: number;
  totalUSD: number;
  totalSLSH: number;
  paidUSD: number;
  paidSLSH: number;
  balanceDueUSD: number;
  balanceDueSLSH: number;
  currency: Currency;
  paymentInfo?: string;
  notes?: string;
  signature?: string;
  status: "draft" | "sent" | "paid" | "partial" | "overdue";
  createdAt: string;
  createdBy: string;
}

export interface PartialPayment {
  id: string; // PAY-000001
  businessId: string;
  invoiceId?: string;
  incomeId?: string;
  clientId?: string;
  clientName?: string;
  date: string;
  amountUSD: number;
  amountSLSH: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  accountId: string;
  referenceNo: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Receipt {
  id: string; // REC-000001
  businessId: string;
  invoiceId?: string;
  incomeId?: string;
  date: string;
  clientName: string;
  clientPhone?: string;
  description: string;
  amountUSD: number;
  amountSLSH: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  accountId: string;
  receivedBy: string;
  signature?: string;
  notes?: string;
  createdAt: string;
}

export interface MonthlyClosing {
  id: string;
  businessId: string;
  monthKey: string; // "YYYY-MM"
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
  closingBalanceUSD: number;
  closingBalanceSLSH: number;
  totalRevenueUSD?: number;
  totalExpensesUSD?: number;
  netProfitUSD?: number;
  reconciled?: boolean;
  notes?: string;
}

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringTransaction {
  id: string; // REC-TX-000001
  businessId: string;
  title: string;
  type: "income" | "expense";
  frequency: RecurringFrequency;
  category: string;
  serviceName?: string;
  clientName?: string;
  supplierName?: string;
  amountUSD: number;
  amountSLSH: number;
  currency: Currency;
  accountId: string;
  paymentMethod: PaymentMethod;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  lastRunDate?: string;
  autoProcess: boolean; // auto generate entry when due
  status: "active" | "paused" | "completed";
  totalRuns: number;
  maxRuns?: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface CloudChangeRecord {
  id: string;
  timestamp: string;
  author: string;
  actionType: string;
  summary: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: "create" | "update" | "delete" | "lock" | "unlock" | "transfer" | "login" | "restore";
  entityType: "income" | "expense" | "client" | "invoice" | "receipt" | "transfer" | "monthly_closing" | "settings" | "account";
  entityId: string;
  summary: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface QuickTemplate {
  id: string;
  businessId: string;
  title: string;
  type: "income" | "expense";
  category: string;
  serviceName?: string;
  description: string;
  defaultAmountUSD: number;
  defaultAmountSLSH: number;
  currency: Currency;
  accountId: string;
  paymentMethod: PaymentMethod;
}

export interface AppNotification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: "warning" | "danger" | "success" | "info";
  date: string;
  isRead: boolean;
  linkTab?: string;
}

export type TimeFilter = "today" | "week" | "month" | "3months" | "6months" | "year" | "all" | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type ActiveTab =
  | "dashboard"
  | "income"
  | "expense"
  | "recurring"
  | "clients"
  | "services"
  | "accounts"
  | "transfers"
  | "debts"
  | "invoices"
  | "receipts"
  | "reports"
  | "profit_loss"
  | "cash_flow"
  | "monthly_closing"
  | "analytics"
  | "audit_log"
  | "settings"
  | "excel_tools";
