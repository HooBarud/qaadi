import React from "react";
import { Printer, X } from "lucide-react";
import { Invoice, BusinessProfile } from "../types";

interface InvoicePrintModalProps {
  invoice: Invoice;
  business: BusinessProfile;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, business, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const balanceDue = invoice.balanceDueUSD ?? (invoice.totalUSD - (invoice.paidUSD || 0));

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Controls */}
        <div className="print:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase">Daabacaadda Qaansheegta (Invoice Print)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
            >
              <Printer className="h-4 w-4" />
              <span>Daabac Qaansheegta (Print)</span>
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
        <div
          id="printable-invoice"
          className="rounded-xl border border-slate-300 p-8 text-slate-800 bg-white shadow-xs font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#543324] pb-5">
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
                <p className="text-xs text-[#8C6A14] font-bold">
                  Khibrad 23+ Years • Legal & Notary Public Services
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {business.address} • Tel: {business.phone} • {business.email}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-md bg-[#543324] px-3.5 py-1 text-xs font-black text-white uppercase tracking-wider ring-1 ring-[#C59B27]/50 shadow-xs">
                Qaansheeg (Invoice)
              </span>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                {invoice.id}
              </p>
              <p className="text-[11px] text-slate-600">Taariikh: {invoice.date}</p>
              <p className="text-[11px] font-bold text-[#8C6A14]">Xilliga Bixinta: {invoice.dueDate}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mt-6 flex justify-between text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Ku Socota (Billed To):
              </span>
              <h3 className="mt-1 text-base font-black text-slate-900">{invoice.clientName}</h3>
              {invoice.clientPhone && <p className="text-slate-500">{invoice.clientPhone}</p>}
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Xaaladda (Status):
              </span>
              <p className="mt-1 font-black uppercase text-xs text-purple-700">
                {invoice.status}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Faahfaahinta Adeegga (Description)</th>
                  <th className="p-3 text-center w-16">Qty</th>
                  <th className="p-3 text-right w-24">Qiimaha ($)</th>
                  <th className="p-3 text-right w-28">Wadarta ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-medium text-slate-800">{item.description}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">${item.rateUSD.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold">${item.amountUSD.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="mt-4 flex justify-between items-start">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              <p className="font-bold text-slate-700">Faallo / Notes:</p>
              <p>{invoice.notes || "Mahadsanid xiriirkaaga wacan."}</p>
              {invoice.paymentInfo && (
                <p className="text-[11px] text-slate-600">
                  <strong>Shuruudaha & Akoonnada:</strong> {invoice.paymentInfo}
                </p>
              )}
            </div>

            <div className="w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">${invoice.subtotalUSD.toFixed(2)}</span>
              </div>
              {invoice.taxUSD > 0 && (
                <div className="flex justify-between">
                  <span>Canshuur (Tax):</span>
                  <span>+${invoice.taxUSD.toFixed(2)}</span>
                </div>
              )}
              {invoice.discountUSD > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-${invoice.discountUSD.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                <span>Wadarta Guud:</span>
                <span>${invoice.totalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>La Bixiyay:</span>
                <span>${invoice.paidUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-amber-700">
                <span>Haraaga Dhiman:</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="mt-10 pt-4 flex items-end justify-between border-t border-slate-200 text-xs text-slate-600">
            <div className="space-y-1">
              <p className="font-bold text-slate-800">Akoonnada Lacag Bixinta:</p>
              <p className="text-[11px]">Telesom Zaad: 063-4421100 / Dahabshiil Bank: ACC-7782</p>
            </div>

            <div className="text-center">
              <div className="h-10 w-36 border-b border-slate-400"></div>
              <p className="mt-1 text-[11px] font-bold text-slate-800">Saxeexa / Maamulka</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
