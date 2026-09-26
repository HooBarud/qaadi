import React, { useState } from "react";
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  X,
  Radio,
  History,
  AlertCircle,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    isCloudSyncActive,
    cloudSyncStatus,
    lastCloudUpdate,
    lastCloudAuthor,
    cloudVersion,
    recentChanges,
    syncToCloud,
    fetchFromCloud,
    toggleCloudSync,
  } = useFinance();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsRefreshing(true);
    setSuccessMsg(null);
    try {
      const ok = await syncToCloud("Xogta ayaa gacanta lagu cusboonaysiiyay", "manual_sync");
      await fetchFromCloud();
      if (ok) {
        setSuccessMsg("Xogta Live Cloud Storage si guul leh ayaa loo cusboonaysiiyay!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "Hadda";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " • " +
        d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 30) return "Hadda";
      if (diff < 60) return `${diff} ilbiriqsi ka hor`;
      if (diff < 3600) return `${Math.floor(diff / 60)} daqiiqo ka hor`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} saacadood ka hor`;
      return `${Math.floor(diff / 86400)} maalmood ka hor`;
    } catch {
      return "Dhowaan";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#FAF7F2] px-6 py-4 dark:border-slate-800 dark:bg-[#1E110A]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Live Cloud Storage & Isbeddeladii U Dambeeyay
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Qaaddi Notary Public • Real-time cloud sync & audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isCloudSyncActive ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                      isCloudSyncActive ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {isCloudSyncActive ? "Live Cloud Sync waa Firfircoon yahay" : "Cloud Sync waa Dansan yahay"}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      v{cloudVersion}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Qof kasta oo soo booqda app-ka wuxuu si toos ah u arkayaa xogtii u dambeysay iyo isbeddellada.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700 active:scale-95 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Syncing..." : "Cusboonaysii Hadda"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCloudSync(!isCloudSyncActive)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                    isCloudSyncActive
                      ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      : "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {isCloudSyncActive ? "Demi Cloud" : "Daar Cloud"}
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-100 p-2.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Sync Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Clock className="h-3.5 w-3.5 text-sky-600" />
                Cusboonaysiintii U Dambeysay
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                {formatTime(lastCloudUpdate)}
              </p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                ● Live & toos ah
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                Cusboonaysiiyaha (Author)
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {lastCloudAuthor || "Qaaddi Notary Team"}
              </p>
              <span className="text-[10px] font-medium text-slate-500">
                Isticmaale xaqiijisan
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Heerka Amniga
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                Server-backed Sync
              </p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Multi-device ready
              </span>
            </div>
          </div>

          {/* Recent Changes Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <History className="h-4 w-4 text-sky-600" />
                <span>Isbeddeladii U Dambeeyay (Live Activity & Updates)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {recentChanges.length} diiwaan
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {recentChanges.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Weli ma jiraan isbeddello la diiwaangeliyay.
                </div>
              ) : (
                recentChanges.map((change) => (
                  <div key={change.id} className="p-3.5 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        <Radio className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 break-words">
                          {change.summary}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            {change.author}
                          </span>
                          <span>•</span>
                          <span>{new Date(change.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {getRelativeTime(change.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-[#FAF7F2] px-6 py-3.5 dark:border-slate-800 dark:bg-[#1E110A] flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Isbeddel kasta oo aad sameyso wuxuu si toos ah u gaarayaa server-ka iyo dhammaan qalabka kale.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition cursor-pointer"
          >
            Waayahay (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
