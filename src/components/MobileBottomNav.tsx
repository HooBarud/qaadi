import React from "react";
import { LayoutDashboard, TrendingUp, TrendingDown, Scale, Menu } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { ActiveTab } from "../types";

interface MobileBottomNavProps {
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMobileMenu }) => {
  const { activeTab, setActiveTab } = useFinance();

  const items: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "income", label: "Dakhli", icon: TrendingUp },
    { id: "expense", label: "Kharash", icon: TrendingDown },
    { id: "debts", label: "Deymo", icon: Scale },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            id={`mobile-nav-${item.id}`}
            className={`flex flex-col items-center justify-center py-1 transition ${
              isActive ? "text-indigo-600 font-bold dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMobileMenu}
        id="mobile-nav-more"
        className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px] mt-0.5">Liiska</span>
      </button>
    </nav>
  );
};
