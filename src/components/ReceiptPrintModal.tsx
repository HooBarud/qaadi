import React from "react";
import { Printer, X } from "lucide-react";
import { IncomeTransaction, BusinessProfile, Receipt } from "../types";

export interface ReceiptPrintModalProps {
  income?: IncomeTransaction | null;
  receipt?: Receipt | null;
  business: BusinessProfile;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ income, receipt, business, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const receiptNo = receipt?.id || (income ? income.id.replace("INC", "RCP") : "RCP-000001");
  const date = receipt?.date || income?.date || new Date().toISOString().substring(0, 10);
  const clientName = receipt?.clientName || income?.clientName || "Macmiil";
  const serviceOrDescription =
    receipt?.description ||
    (income
      ? income.serviceName
        ? `${income.serviceName}${income.description ? ` (${income.description})` : ""}`
        : income.description
      : "Adeeg Sharci & Notary");
  const paymentMethod = receipt?.paymentMethod || income?.paymentMethod || "Cash";
  const referenceNo = (receipt as any)?.referenceNo || income?.referenceNo || "";
  const paidUSD = receipt ? receipt.amountUSD : income ? income.paidAmountUSD : 0;
  const paidSLSH = receipt ? receipt.amountSLSH : income ? income.paidAmountSLSH : 0;
  const debtUSD = income ? income.debtAmountUSD : 0;
  const dueDate = income?.dueDate;
  const receivedBy = receipt?.receivedBy || (income as any)?.createdBy || "Xafiiska Qaadi Notary";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Modal Controls (Hidden in print) */}
        <div className="print:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase">Daabacaadda Rasiidha (Receipt Preview)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-[#543324] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#3D2216] shadow-xs transition cursor-pointer ring-1 ring-[#C59B27]/40"
            >
              <Printer className="h-4 w-4" />
              <span>Daabac Rasiidhka (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt"
          className="rounded-xl border border-[#E2D7C7] p-8 text-slate-800 bg-[#FAF7F2] shadow-xs font-sans print:border-none print:shadow-none print:p-0 print:bg-white"
        >
          {/* Header */}
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
                <p className="text-[10px] text-slate-600">
                  {business.address} • Tel: {business.phone} • {business.email}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-md bg-[#543324] px-3.5 py-1 text-xs font-black text-white uppercase tracking-wider ring-1 ring-[#C59B27]/50 shadow-xs">
                Rasiidh (Receipt)
              </span>
              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                No: {receiptNo}
              </p>
              <p className="text-[10px] text-slate-500">Taariikh: {date}</p>
            </div>
          </div>

          {/* Body Info */}
          <div className="mt-6 space-y-4 text-xs">
            <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="font-bold text-slate-600">Waxaa laga helay (Received From):</span>
              <span className="font-black text-sm text-slate-900">{clientName}</span>
            </div>

            <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="font-bold text-slate-600">Adeegga / Ujeeddada (Service / Purpose):</span>
              <span className="font-semibold text-slate-900">{serviceOrDescription}</span>
            </div>

            <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="font-bold text-slate-600">Habka Bixinta (Payment Method):</span>
              <span className="font-semibold text-slate-900">{paymentMethod}</span>
            </div>

            {referenceNo && (
              <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="font-bold text-slate-600">Reference No:</span>
                <span className="font-mono font-medium text-slate-700">{referenceNo}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="font-bold text-slate-600">Waxaa Qabtay (Received By):</span>
              <span className="font-medium text-slate-800">{receivedBy}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Cadadka La Bixiyay (Amount Paid)</span>
              <p className="text-2xl font-black text-emerald-700">
                ${paidUSD.toFixed(2)}
              </p>
              <p className="text-xs font-bold text-slate-600">
                ({Math.round(paidSLSH).toLocaleString()} SLSH)
              </p>
            </div>

            {debtUSD > 0 && (
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[10px] uppercase font-bold text-amber-600">Deynta Harta (Balance Due)</span>
                <p className="text-lg font-black text-amber-700">
                  ${debtUSD.toFixed(2)}
                </p>
                {dueDate && (
                  <p className="text-[10px] text-slate-500">Waqtiga: {dueDate}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer & Signatures */}
          <div className="mt-10 pt-4 flex items-end justify-between border-t border-slate-200 text-xs text-slate-600">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400">Mahadsanid xiriirkaaga wacan.</p>
              <p className="text-[10px] text-slate-400">Rasiidhan waxaa si toos ah u soo saaray nidaamka xisaabaadka.</p>
            </div>

            <div className="text-center">
              <div className="h-10 w-36 border-b border-slate-400"></div>
              <p className="mt-1 text-[11px] font-bold text-slate-800">Saxeexa / Shaambadda Notary</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
