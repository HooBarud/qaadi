import React from "react";
import { Printer, X } from "lucide-react";
import { Client, IncomeTransaction, Invoice, BusinessProfile } from "../types";

interface StatementPrintModalProps {
  client: Client;
  transactions: IncomeTransaction[];
  invoices: Invoice[];
  business: BusinessProfile;
  onClose: () => void;
}

export const StatementPrintModal: React.FC<StatementPrintModalProps> = ({
  client,
  transactions,
  business,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalBilled = transactions.reduce((acc, t) => acc + t.amountUSD, 0);
  const totalPaid = transactions.reduce((acc, t) => acc + t.paidAmountUSD, 0);
  const balanceDue = transactions.reduce((acc, t) => acc + t.debtAmountUSD, 0);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        <div className="print:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Warbixinta Xisaabta Macmiilka (Statement of Account)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition"
            >
              <Printer className="h-4 w-4" />
              <span>Daabac Statement</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper */}
        <div className="rounded-xl border border-[#E2D7C7] p-8 text-slate-800 bg-[#FAF7F2] shadow-xs font-sans print:border-none print:shadow-none print:p-0 print:bg-white">
          <div className="flex items-start justify-between border-b-2 border-[#543324] pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/qaaddi-logo.png"
                alt="Qaaddi Notary Public Logo"
                className="h-16 w-16 object-contain rounded-xl border border-[#C59B27]/40 bg-white p-0.5 shadow-xs shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#3A2216] uppercase">
                  Qaaddi Notary Public
                </h1>
                <p className="text-[11px] text-[#8C6A14] font-bold">
                  Khibrad 23+ Years • Legal & Notary Public Services
                </p>
                <p className="text-[10px] text-slate-600">{business.address} • Tel: {business.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-md bg-[#543324] px-3.5 py-1 text-xs font-black text-white uppercase ring-1 ring-[#C59B27]/50 shadow-xs">
                Statement of Account
              </span>
              <p className="mt-1 text-xs font-bold text-slate-700">Taariikh: {new Date().toISOString().substring(0, 10)}</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase text-[10px]">Macmiilka (Client):</p>
              <p className="text-sm font-black text-slate-900">{client.name}</p>
              <p className="text-slate-600">{client.company || ""} • Tel: {client.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-500 uppercase text-[10px]">Deynta Harta (Balance Due):</p>
              <p className="text-lg font-black text-amber-700">${balanceDue.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Taariikh</th>
                  <th className="p-2.5">Ref / ID</th>
                  <th className="p-2.5">Adeegga</th>
                  <th className="p-2.5 text-right">Cadadka</th>
                  <th className="p-2.5 text-right">La Bixiyay</th>
                  <th className="p-2.5 text-right">Deyn Harta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-2.5 text-slate-600">{tx.date}</td>
                    <td className="p-2.5 font-mono font-bold text-indigo-600">{tx.id}</td>
                    <td className="p-2.5 font-medium text-slate-800">{tx.serviceName}</td>
                    <td className="p-2.5 text-right">${tx.amountUSD.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-bold">${tx.paidAmountUSD.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-amber-600 font-bold">
                      {tx.debtAmountUSD > 0 ? `$${tx.debtAmountUSD.toFixed(2)}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-60 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Wadarta Adeegyada:</span>
                <span className="font-bold">${totalBilled.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Wadarta La Bixiyay:</span>
                <span className="font-bold">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t-2 border-slate-900 font-black text-amber-700 text-sm">
                <span>Deynta Harta:</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
