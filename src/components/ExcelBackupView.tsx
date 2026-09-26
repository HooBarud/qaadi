import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Cloud,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { exportToExcel, exportToCsv, exportFullFinancialReportExcel, parseExcelFile } from "../utils/excel";

export const ExcelBackupView: React.FC = () => {
  const {
    activeBusiness,
    incomes,
    expenses,
    clients,
    invoices,
    receipts,
    addIncome,
    addExpense,
    exportAllDataJSON,
    importAllDataJSON,
    resetToDemoData,
    setActiveTab,
    formatCurrency,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [importType, setImportType] = useState<"income" | "expense">("income");
  const [isProcessing, setIsProcessing] = useState(false);

  // Full Excel Export
  const handleFullExcelExport = () => {
    const period = new Date().toISOString().substring(0, 10);
    exportFullFinancialReportExcel(
      activeBusiness.name,
      period,
      incomes,
      expenses,
      clients,
      invoices,
      receipts
    );
  };

  // CSV Exports
  const handleExportIncomesCsv = () => {
    const data = incomes.map((i) => ({
      "ID": i.id,
      "Date": i.date,
      "Reference": i.referenceNo,
      "Client": i.clientName,
      "Service": i.serviceName,
      "Description": i.description,
      "Amount USD": i.amountUSD,
      "Amount SLSH": i.amountSLSH,
      "Paid USD": i.paidAmountUSD,
      "Debt USD": i.debtAmountUSD,
      "Payment Method": i.paymentMethod,
      "Status": i.status,
    }));
    exportToCsv(data, `Dakhliga_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  const handleExportExpensesCsv = () => {
    const data = expenses.map((e) => ({
      "ID": e.id,
      "Date": e.date,
      "Reference": e.referenceNo,
      "Category": e.category,
      "Description": e.description,
      "Supplier": e.supplier,
      "Amount USD": e.amountUSD,
      "Amount SLSH": e.amountSLSH,
      "Payment Method": e.paymentMethod,
    }));
    exportToCsv(data, `Kharashka_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  const handleExportInvoicesCsv = () => {
    const data = invoices.map((inv) => ({
      "Invoice ID": inv.id,
      "Date": inv.date,
      "Due Date": inv.dueDate,
      "Client": inv.clientName,
      "Total USD": inv.totalUSD,
      "Paid USD": inv.paidUSD,
      "Balance Due USD": inv.balanceDueUSD,
      "Status": inv.status,
    }));
    exportToCsv(data, `Invoices_${activeBusiness.name.replace(/\s+/g, "_")}`);
  };

  // Download Sample Template
  const handleDownloadSampleCsv = (type: "income" | "expense") => {
    if (type === "income") {
      const sample = [
        {
          "Date": "2026-09-26",
          "Client": "Axmed Cali",
          "Service": "Heshiis Qoraal Sharci",
          "Amount USD": 50,
          "Paid USD": 50,
          "Payment Method": "Cash",
          "Notes": "Heshiis gaari",
        },
      ];
      exportToCsv(sample, "Tusaale_Dakhli_Template");
    } else {
      const sample = [
        {
          "Date": "2026-09-26",
          "Category": "Kirada Xafiiska",
          "Supplier": "Guriyeeye",
          "Amount USD": 150,
          "Payment Method": "Zaad",
          "Description": "Kirada bisha",
        },
      ];
      exportToCsv(sample, "Tusaale_Kharash_Template");
    }
  };

  // Excel/CSV file upload handler
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setImportStatus(null);

    try {
      const parsedData = await parseExcelFile(file);
      if (!parsedData || parsedData.length === 0) {
        setImportStatus({ type: "error", message: "Faylku ma laha xog sax ah ama waa maran yahay." });
        setIsProcessing(false);
        return;
      }

      let count = 0;
      if (importType === "income") {
        for (const row of parsedData) {
          const client = row["Client"] || row["Macmiilka"] || row["client"] || "Macmiil";
          const amount = parseFloat(row["Amount USD"] || row["Amount"] || row["amount"] || 0);
          if (amount > 0) {
            addIncome({
              date: row["Date"] || row["Taariikhda"] || new Date().toISOString().substring(0, 10),
              referenceNo: `IMP-${Date.now().toString().slice(-4)}`,
              clientName: client,
              serviceName: row["Service"] || row["Adeegga"] || "Adeeg Sharci",
              description: row["Notes"] || row["Description"] || "Imported record",
              currency: "USD",
              amountUSD: amount,
              amountSLSH: amount * (activeBusiness.exchangeRate || 10000),
              paidAmountUSD: parseFloat(row["Paid USD"] || amount),
              debtAmountUSD: Math.max(0, amount - parseFloat(row["Paid USD"] || amount)),
              paidAmountSLSH: amount * (activeBusiness.exchangeRate || 10000),
              debtAmountSLSH: 0,
              paymentMethod: "Cash",
              accountId: "acc-1",
              status: amount <= parseFloat(row["Paid USD"] || amount) ? "paid" : "partial",
            });
            count++;
          }
        }
      } else {
        for (const row of parsedData) {
          const cat = row["Category"] || row["Qaybta"] || "Kharash Guud";
          const amount = parseFloat(row["Amount USD"] || row["Amount"] || 0);
          if (amount > 0) {
            addExpense({
              date: row["Date"] || new Date().toISOString().substring(0, 10),
              referenceNo: `IMP-${Date.now().toString().slice(-4)}`,
              category: cat,
              description: row["Description"] || "Imported expense",
              supplier: row["Supplier"] || "Supplier",
              currency: "USD",
              amountUSD: amount,
              amountSLSH: amount * (activeBusiness.exchangeRate || 10000),
              paymentMethod: "Cash",
              accountId: "acc-1",
            });
            count++;
          }
        }
      }

      setImportStatus({
        type: "success",
        message: `Si guul leh ayaa loo geliyay ${count} diiwaan oo cusub!`,
      });
    } catch (err: any) {
      setImportStatus({
        type: "error",
        message: `Khalad ayaa dhacay xilliga faylka la aqrinayay: ${err?.message || "Format khaldan"}`,
      });
    } finally {
      setIsProcessing(false);
      if (excelImportRef.current) excelImportRef.current.value = "";
    }
  };

  // JSON Restore
  const handleJsonRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const ok = importAllDataJSON(content);
        if (ok) {
          setImportStatus({
            type: "success",
            message: "Dhammaan xogtii nidaamka si guul leh ayaa dib loogu soo celiyay!",
          });
        } else {
          setImportStatus({
            type: "error",
            message: "Faylka JSON ma ahayn qaabka saxda ah ee nidaamka.",
          });
        }
      } catch (err) {
        setImportStatus({ type: "error", message: "Khalad ayaa dhacay xilliga soo celinta JSON." });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Excel & Backup Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Soo saarida, soo gelinta Excel/CSV iyo keydinta ama dib-u-soo celinta xogta nidaamka.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("settings")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
        >
          <Cloud className="h-4 w-4 text-indigo-600" />
          <span>Habaynta Keydka (Cloud & Local) →</span>
        </button>
      </div>

      {/* Notifications banner */}
      {importStatus && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-semibold ${
            importStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {importStatus.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Section 1: Full Financial Excel & CSV Exports */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Dhoofinta Xogta (Export to Excel & CSV)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Offline Analysis
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Kala soo deg dhammaan xogta maaliyadeed fayl Excel ah oo buuxa ama CSV gaar ah si aad ugu falanqayso kombiyuutarkaaga adigoo offline ah.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Complete Workbook */}
          <button
            onClick={handleFullExcelExport}
            className="flex flex-col items-start p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 dark:border-emerald-900/50 dark:bg-emerald-950/30 transition text-left cursor-pointer group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white mb-2 shadow-xs group-hover:scale-105 transition">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Buug Buuxa oo Excel ah (.xlsx)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Dakhli, Kharash, Macaamiil, Invoices & Rasiidho oo hal buug ku wada jira.
            </span>
          </button>

          {/* Income CSV */}
          <button
            onClick={handleExportIncomesCsv}
            className="flex flex-col items-start p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 dark:border-indigo-900/50 dark:bg-indigo-950/30 transition text-left cursor-pointer group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white mb-2 shadow-xs group-hover:scale-105 transition">
              <Download className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Dakhliga oo CSV ah (.csv)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {incomes.length} diiwaan oo dakhli ah, qadarrada iyo xogta macaamiisha.
            </span>
          </button>

          {/* Expense CSV */}
          <button
            onClick={handleExportExpensesCsv}
            className="flex flex-col items-start p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 dark:border-rose-900/50 dark:bg-rose-950/30 transition text-left cursor-pointer group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white mb-2 shadow-xs group-hover:scale-105 transition">
              <Download className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Kharashka oo CSV ah (.csv)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {expenses.length} diiwaan oo kharash ah iyo qaybahooda.
            </span>
          </button>

          {/* Invoices CSV */}
          <button
            onClick={handleExportInvoicesCsv}
            className="flex flex-col items-start p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 dark:border-purple-900/50 dark:bg-purple-950/30 transition text-left cursor-pointer group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white mb-2 shadow-xs group-hover:scale-105 transition">
              <Download className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Invoices oo CSV ah (.csv)
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {invoices.length} qaansheegadood oo la jaray iyo haraagooda.
            </span>
          </button>
        </div>
      </div>

      {/* Section 2: Import from Excel/CSV */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Soo Gelinta Xogta (Import from Excel or CSV)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Bulk Upload
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Miyaad haysataa liis dakhli ama kharash hore ugu qornaa Excel? Halkan waxaad kaga soo gelin kartaa hal mar.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nooca Xogta:
            </label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as "income" | "expense")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="income">Dakhli (Income Records)</option>
              <option value="expense">Kharash (Expense Records)</option>
            </select>
          </div>

          <button
            onClick={() => handleDownloadSampleCsv(importType)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Soo Deg Template-ka Tusaalaha</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{isProcessing ? "Waa la gelinayaa..." : "Dooro Fayl (Excel / CSV)"}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={excelImportRef}
              onChange={handleExcelImport}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Section 3: Full Backup & Restore */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Keydka Buuxa ee Nidaamka (Full JSON Backup & Restore)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Security
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Kani waa keydka 100% buuxa ee dhammaan xogta nidaamka: xisaabaadka, macaamiisha, adeegyada, dakhliga, kharashka, invoice-yada, rasiidhada, iyo habaynta shirkadda.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={exportAllDataJSON}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Kala Soo Deg Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer">
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Dib u Soo Celi Xog (Restore JSON)</span>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleJsonRestore}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm("Ma hubtaa inaad dib ugu celiso xogtii demo-ga ahayd? Xogtii hadda way bixi doontaa.")) {
                resetToDemoData();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400 transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Dib u Bilaab (Reset Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
