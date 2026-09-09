import React from "react";
import {
  ShoppingCart,
  Boxes,
  Wallet,
  BarChart3,
  Users,
  Settings,
  Download,
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { StaffUser, BeforeInstallPromptEvent } from "../types";

export type ActiveNavTab = "pos" | "warehouse" | "debts" | "dashboard";

interface HeaderProps {
  currentUser: StaffUser;
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenStaffModal: () => void;
  onOpenSettingsModal: () => void;
  onLogout: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallApp: () => void;
  lowStockCount: number;
  unpaidDebtCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenStaffModal,
  onOpenSettingsModal,
  onLogout,
  installPrompt,
  onInstallApp,
  lowStockCount,
  unpaidDebtCount,
}) => {
  const isAdmin = currentUser.role === "admin";

  const navItems = [
    {
      id: "pos" as ActiveNavTab,
      label: "Kassa",
      fullLabel: "Kassa (Savdo)",
      icon: <ShoppingCart className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      id: "warehouse" as ActiveNavTab,
      label: "Ombor",
      fullLabel: "Omborxona",
      icon: <Boxes className="w-5 h-5 sm:w-4 sm:h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: "bg-rose-500",
    },
    {
      id: "debts" as ActiveNavTab,
      label: "Nasiya",
      fullLabel: "Nasiya daftari",
      icon: <Wallet className="w-5 h-5 sm:w-4 sm:h-4" />,
      badge: unpaidDebtCount > 0 ? unpaidDebtCount : undefined,
      badgeColor: "bg-amber-500",
    },
    {
      id: "dashboard" as ActiveNavTab,
      label: "Statistika",
      fullLabel: "Statistika",
      icon: <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-slate-950 to-slate-800 p-1 ring-1 ring-white/10 shadow-md shrink-0">
                <img
                  src="/favicon.svg"
                  alt="Market Logosi"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black tracking-tight leading-none bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                  Market ERP
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  {isAdmin ? "Admin Paneli" : "Sotuvchi Paneli"}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs shadow-rose-500/25"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                    }`}
                  >
                    {item.icon}
                    <span>{item.fullLabel}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] text-white font-black px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Admin only: Xodimlar boshqaruvi */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenStaffModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Xodimlar</span>
                </button>
              )}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Install PWA button */}
              {installPrompt && (
                <button
                  onClick={onInstallApp}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
                  title="Ilovani o'rnatish"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">O'rnatish</span>
                </button>
              )}

              {/* Settings (Firebase & ImgCDN) */}
              <button
                onClick={onOpenSettingsModal}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                title="Sozlamalar"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User Profile Badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 border border-slate-700/80 rounded-2xl py-1 px-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isAdmin
                      ? "bg-rose-500 text-white"
                      : "bg-slate-700 text-slate-200"
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="text-left max-w-[85px] sm:max-w-[120px] truncate">
                  <div className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] text-slate-400 leading-none">
                    {isAdmin ? "Admin" : "Sotuvchi"}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                  title="Tizimdan chiqish / PIN almashtirish"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* NATIVE MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly for Mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-1 py-1.5 shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] ${
                  isActive
                    ? "text-rose-400 font-bold"
                    : "text-slate-400 hover:text-slate-200 font-medium"
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[9px] text-white font-black px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Admin only: Xodimlar button in Mobile bottom bar */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenStaffModal}
              className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-rose-300 font-medium transition cursor-pointer min-w-[56px]"
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-1 tracking-tight">Xodimlar</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
