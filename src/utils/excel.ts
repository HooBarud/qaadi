import * as XLSX from "xlsx";
import { IncomeTransaction, ExpenseTransaction, Client, Invoice, Receipt } from "../types";

export interface DebtAgingItem {
  id: string;
  clientName: string;
  referenceNo: string;
  dueDate: string;
  daysRemainingOrOverdue: number;
  remainingAmountUSD: number;
  remainingAmountSLSH: number;
  agingBucket: "0-30" | "31-60" | "61-90" | "90+";
  status: "Due Today" | "Overdue" | "Upcoming";
}

/**
 * Export JSON array to Excel (.xlsx) file
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = "Data") {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Export JSON array directly to CSV (.csv) file
 */
export function exportToCsv(data: any[], fileName: string) {
  if (!data || data.length === 0) {
    alert("Ma jirto xog la soo saaro.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export complete multi-sheet Financial Report in Excel
 */
export function exportFullFinancialReportExcel(
  businessName: string,
  period: string,
  incomes: IncomeTransaction[],
  expenses: ExpenseTransaction[],
  clients: Client[],
  invoices: Invoice[],
  receipts: Receipt[] = []
) {
  const wb = XLSX.utils.book_new();

  // Income sheet
  const incomeRows = incomes.map((i) => ({
    "ID": i.id,
    "Date": i.date,
    "Reference": i.referenceNo,
    "Client": i.clientName,
    "Service": i.serviceName,
    "Description": i.description,
    "Amount USD": i.amountUSD,
    "Amount SLSH": i.amountSLSH,
    "Payment Method": i.paymentMethod,
    "Paid USD": i.paidAmountUSD,
    "Debt USD": i.debtAmountUSD,
    "Status": i.status,
    "Due Date": i.dueDate || "",
  }));
  const wsIncome = XLSX.utils.json_to_sheet(incomeRows);
  XLSX.utils.book_append_sheet(wb, wsIncome, "Dakhliga (Income)");

  // Expense sheet
  const expenseRows = expenses.map((e) => ({
    "ID": e.id,
    "Date": e.date,
    "Reference": e.referenceNo,
    "Category": e.category,
    "Description": e.description,
    "Supplier": e.supplier,
    "Amount USD": e.amountUSD,
    "Amount SLSH": e.amountSLSH,
    "Payment Method": e.paymentMethod,
    "Notes": e.notes || "",
  }));
  const wsExpense = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpense, "Kharashka (Expenses)");

  // Clients sheet
  const clientRows = clients.map((c) => ({
    "ID": c.id,
    "Name": c.name,
    "Phone": c.phone,
    "Email": c.email || "",
    "Company": c.company || "",
    "Address": c.address || "",
  }));
  const wsClients = XLSX.utils.json_to_sheet(clientRows);
  XLSX.utils.book_append_sheet(wb, wsClients, "Macaamiisha (Clients)");

  // Invoices sheet
  const invoiceRows = invoices.map((inv) => ({
    "Invoice No": inv.id,
    "Date": inv.date,
    "Due Date": inv.dueDate,
    "Client": inv.clientName,
    "Total USD": inv.totalUSD,
    "Paid USD": inv.paidUSD,
    "Balance Due USD": inv.balanceDueUSD,
    "Status": inv.status,
  }));
  const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
  XLSX.utils.book_append_sheet(wb, wsInvoices, "Invoices");

  // Receipts sheet
  if (receipts.length > 0) {
    const receiptRows = receipts.map((r) => ({
      "Receipt No": r.id,
      "Date": r.date,
      "Client": r.clientName,
      "Description": r.description,
      "Amount USD": r.amountUSD,
      "Amount SLSH": r.amountSLSH,
      "Payment Method": r.paymentMethod,
      "Received By": r.receivedBy,
    }));
    const wsReceipts = XLSX.utils.json_to_sheet(receiptRows);
    XLSX.utils.book_append_sheet(wb, wsReceipts, "Rasiidhada (Receipts)");
  }

  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, "_");
  XLSX.writeFile(wb, `${cleanName}_Warbixin_Maaliyadeed_${period}.xlsx`);
}

/**
 * Parse uploaded Excel or CSV file
 */
export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
