import React, { useState } from "react";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { DashboardView } from "./components/DashboardView";
import { IncomeView } from "./components/IncomeView";
import { ExpenseView } from "./components/ExpenseView";
import { ClientsView } from "./components/ClientsView";
import { AccountsView } from "./components/AccountsView";
import { TransfersView } from "./components/TransfersView";
import { DebtsView } from "./components/DebtsView";
import { InvoicesView } from "./components/InvoicesView";
import { ReportsView } from "./components/ReportsView";
import { AuditLogView } from "./components/AuditLogView";
import { SettingsView } from "./components/SettingsView";
import { ServicesView } from "./components/ServicesView";
import { ReceiptsView } from "./components/ReceiptsView";
import { ExcelBackupView } from "./components/ExcelBackupView";
import { RecurringTransactionsView } from "./components/RecurringTransactionsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { MonthlyClosingView } from "./components/MonthlyClosingView";
import { QuickActionModal } from "./components/QuickActionModal";
import { ReceiptPrintModal } from "./components/ReceiptPrintModal";
import { InvoicePrintModal } from "./components/InvoicePrintModal";
import { StatementPrintModal } from "./components/StatementPrintModal";
import { LoginView } from "./components/LoginView";
import { IncomeTransaction, Invoice, Client, Receipt } from "./types";

const MainAppContent: React.FC = () => {
  const { activeTab, activeBusiness, isAuthenticated, isLoaded } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Print modal states
  const [printingReceipt, setPrintingReceipt] = useState<IncomeTransaction | null>(null);
  const [printingCustomReceipt, setPrintingCustomReceipt] = useState<Receipt | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [printingStatement, setPrintingStatement] = useState<{
    client: Client;
    transactions: IncomeTransaction[];
    invoices: Invoice[];
  } | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-medium">Fadlan sug, nidaamka waa la diyaarinayaa...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2] font-sans text-[#2D1C14] antialiased dark:bg-[#1A0E08] dark:text-[#F8F5EE]">
      {/* Sidebar with mobile drawer support */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 pb-24 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "income" && (
              <IncomeView onPrintReceipt={(inc) => setPrintingReceipt(inc)} />
            )}
            {activeTab === "expense" && <ExpenseView />}
            {activeTab === "invoices" && (
              <InvoicesView onPrintInvoice={(inv) => setPrintingInvoice(inv)} />
            )}
            {activeTab === "debts" && <DebtsView />}
            {activeTab === "receipts" && (
              <ReceiptsView onPrintReceipt={(rec) => setPrintingCustomReceipt(rec)} />
            )}
            {activeTab === "clients" && (
              <ClientsView
                onPrintStatement={(client, txs, invs) =>
                  setPrintingStatement({ client, transactions: txs, invoices: invs })
                }
              />
            )}
            {activeTab === "recurring" && <RecurringTransactionsView />}
            {activeTab === "accounts" && <AccountsView />}
            {activeTab === "services" && <ServicesView />}
            {activeTab === "transfers" && <TransfersView />}
            {(activeTab === "reports" ||
              activeTab === "profit_loss" ||
              activeTab === "cash_flow") && <ReportsView />}
            {activeTab === "monthly_closing" && <MonthlyClosingView />}
            {activeTab === "analytics" && <AnalyticsView />}
            {activeTab === "excel_tools" && <ExcelBackupView />}
            {activeTab === "audit_log" && <AuditLogView />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Global Quick Action Floating Modal */}
      <QuickActionModal />

      {/* Printable Receipt Modal */}
      {(printingReceipt || printingCustomReceipt) && (
        <ReceiptPrintModal
          income={printingReceipt}
          receipt={printingCustomReceipt}
          business={activeBusiness}
          onClose={() => {
            setPrintingReceipt(null);
            setPrintingCustomReceipt(null);
          }}
        />
      )}

      {/* Printable Invoice Modal */}
      {printingInvoice && (
        <InvoicePrintModal
          invoice={printingInvoice}
          business={activeBusiness}
          onClose={() => setPrintingInvoice(null)}
        />
      )}

      {/* Printable Statement Modal */}
      {printingStatement && (
        <StatementPrintModal
          client={printingStatement.client}
          transactions={printingStatement.transactions}
          invoices={printingStatement.invoices}
          business={activeBusiness}
          onClose={() => setPrintingStatement(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
