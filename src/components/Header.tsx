import React, { useState } from "react";
import {
  Menu,
  Bell,
  Plus,
  Moon,
  Sun,
  DollarSign,
  ArrowRightLeft,
  Building2,
  Shield,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  LogOut,
  Trash2,
  Cloud,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Currency, UserRole } from "../types";
import { PWAInstallButton } from "./PWAInstallButton";
import { CloudSyncModal } from "./CloudSyncModal";

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    activeBusiness,
    businesses,
    setActiveBusinessId,
    deleteBusiness,
    currentUser,
    setCurrentUser,
    users,
    logout,
    viewCurrency,
    setViewCurrency,
    exchangeRate,
    setExchangeRate,
    theme,
    setTheme,
    notifications,
    markNotificationRead,
    openQuickAction,
  } = useFinance();

  const [showBizMenu, setShowBizMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const handleSaveRate = () => {
    const num = parseFloat(rateInput);
    if (!isNaN(num) && num > 0) {
      setExchangeRate(num);
    }
    setIsEditingRate(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E8DFD3] bg-[#FAF7F2]/95 px-3 sm:px-6 backdrop-blur dark:border-[#382318] dark:bg-[#1E110A]/95 transition-colors">
      {/* Left side: Hamburger + Business Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onToggleMobileMenu}
          id="btn-mobile-sidebar-toggle"
          aria-label="Fur Liiska"
          className="rounded-lg p-2 text-[#4A3225] hover:bg-[#EFE8DC] lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Business Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBizMenu(!showBizMenu)}
            id="btn-business-dropdown"
            className="flex items-center gap-2.5 rounded-xl border border-[#E8DFD3] bg-white px-2.5 py-1.5 text-left text-xs sm:text-sm font-semibold text-[#3A2216] hover:bg-[#F5EFEB] dark:border-[#382318] dark:bg-[#25150D] dark:text-slate-100 transition cursor-pointer"
          >
            <img
              src="/qaaddi-logo.png"
              alt="Qaaddi Notary Logo"
              className="h-8 w-8 rounded-lg object-contain bg-white shadow-xs border border-[#C59B27]/40 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block">
              <p className="max-w-[200px] truncate leading-tight font-black text-[#3A2216] dark:text-white">
                {activeBusiness.name}
              </p>
              <p className="text-[10px] font-medium text-[#8C6A14] dark:text-[#C59B27]">
                Khibrad 23+ Years • Notary Public
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {showBizMenu && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50 animate-in fade-in">
              <p className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Dooro Ganacsiga / Xafiiska
              </p>
              {businesses.map((b) => (
                <div
                  key={b.id}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                    b.id === activeBusiness.id
                      ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBusinessId(b.id);
                      setShowBizMenu(false);
                    }}
                    className="flex-1 text-left truncate cursor-pointer"
                  >
                    <p className="font-semibold truncate">{b.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{b.businessType}</p>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {b.id === activeBusiness.id && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                    {businesses.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Ma hubtaa inaad tirtirto ganacsiga "${b.name}"?`)) {
                            deleteBusiness(b.id);
                          }
                        }}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 transition cursor-pointer"
                        title="Tirtir ganacsigan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Exchange Rate badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <RefreshCw className="h-3 w-3 text-emerald-600" />
          {isEditingRate ? (
            <div className="flex items-center gap-1">
              <span className="font-medium">1$ =</span>
              <input
                type="number"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                onBlur={handleSaveRate}
                onKeyDown={(e) => e.key === "Enter" && handleSaveRate()}
                autoFocus
                className="w-20 rounded border border-emerald-400 bg-white px-1.5 py-0.5 text-xs text-slate-900 focus:outline-hidden dark:bg-slate-800 dark:text-white"
              />
              <span>SLSH</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setRateInput(exchangeRate.toString());
                setIsEditingRate(true);
              }}
              title="Guji si aad u beddesho sarrifka"
              className="hover:underline font-semibold"
            >
              1 USD = {exchangeRate.toLocaleString()} SLSH
            </button>
          )}
        </div>
      </div>

      {/* Right side: Currency Selector, Quick Action, Notifs, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Cloud Storage Status Button */}
        <button
          type="button"
          onClick={() => setShowCloudModal(true)}
          id="btn-cloud-sync-header"
          title="Live Cloud Storage & Recent Changes"
          className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/80 px-2.5 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300 transition cursor-pointer"
        >
          <Cloud className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          <span className="hidden sm:inline">Cloud Live:</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Sync</span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Currency Switcher Dropdown (USD / SLSH) - Item 10 */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setViewCurrency("USD")}
            id="btn-currency-usd"
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              viewCurrency === "USD"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setViewCurrency("SLSH")}
            id="btn-currency-slsh"
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              viewCurrency === "SLSH"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            SLSH (Sh)
          </button>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => openQuickAction("income")}
          id="btn-quick-action-header"
          className="flex items-center gap-1.5 rounded-xl bg-[#543324] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#3D2216] active:scale-95 transition cursor-pointer ring-1 ring-[#C59B27]/40"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">+ Dakhli Cusub</span>
          <span className="sm:hidden">+ Cusub</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            id="btn-notifications"
            className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            aria-label="Xusuusiyaha"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Xusuusin & Ogeysiisyo
                </h4>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {unreadNotifs.length} cusub
                </span>
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">Ma jiraan wax xusuusin ah.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`cursor-pointer rounded-xl p-2.5 text-xs transition border ${
                        n.isRead
                          ? "bg-slate-50/60 border-slate-100 text-slate-600 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400"
                          : "bg-indigo-50/70 border-indigo-100 text-slate-900 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-slate-100 font-medium"
                      }`}
                    >
                      <p className="font-bold">{n.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                      <span className="mt-1 block text-[10px] text-slate-400">{n.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          id="btn-theme-toggle"
          aria-label="Beddel muuqaalka"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            id="btn-user-profile-menu"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 pr-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 font-bold text-xs text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">{currentUser.name}</p>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 bg-indigo-100 text-[10px] font-bold text-indigo-700 uppercase dark:bg-indigo-900 dark:text-indigo-300">
                {currentUser.role}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50 animate-in fade-in">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                  <Shield className="h-3 w-3" />
                  <span className="font-semibold uppercase">{currentUser.role} role</span>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                  Beddel Isticmaalaha (Switch User / Role):
                </p>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                      u.id === currentUser.id
                        ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{u.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">({u.role})</span>
                  </button>
                ))}
              </div>

              {/* Logout Action */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  id="btn-header-logout"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Ka Bax Nidaamka (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />
    </header>
  );
};
