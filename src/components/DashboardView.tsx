import React, { useState } from "react";
import {
  TrendingUp,
  Coins,
  Receipt,
  Users,
  Calendar,
  Layers,
  Award,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { Sale, StaffUser, InventoryProduct, DebtRecord } from "../types";
import { formatPrice, formatDate } from "../utils/formatters";

interface DashboardViewProps {
  currentUser: StaffUser;
  sales: Sale[];
  staffList: StaffUser[];
  inventory: InventoryProduct[];
  debts: DebtRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  sales,
  staffList,
  inventory,
  debts,
}) => {
  const isAdmin = currentUser.role === "admin";
  const [period, setPeriod] = useState<"today" | "month" | "all">("month");

  // Date filtering helper
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filterSalesByPeriod = (sList: Sale[]) => {
    if (period === "today") {
      return sList.filter((s) => s.createdAt >= startOfToday);
    }
    if (period === "month") {
      return sList.filter((s) => s.createdAt >= startOfMonth);
    }
    return sList;
  };

  // Staff specific sales
  const mySales = sales.filter((s) => s.staffId === currentUser.id);

  // Admin global sales
  const periodSales = filterSalesByPeriod(sales);

  // Overall calculations for Admin
  const totalRevenue = periodSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCost = periodSales.reduce((acc, s) => acc + s.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;

  const cashRevenue = periodSales
    .filter((s) => s.paymentType === "naqd")
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const cardRevenue = periodSales
    .filter((s) => s.paymentType === "karta")
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const debtRevenue = periodSales
    .filter((s) => s.paymentType === "nasiya")
    .reduce((acc, s) => acc + s.totalAmount, 0);

  // Warehouse values
  const warehouseCost = inventory.reduce(
    (acc, p) => acc + p.costPrice * p.quantity,
    0,
  );
  const warehouseSelling = inventory.reduce(
    (acc, p) => acc + p.sellingPrice * p.quantity,
    0,
  );

  // Total unpaid debt
  const totalUnpaidDebts = debts
    .filter((d) => d.status === "kutilmoqda")
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  // Staff Performance Stats Calculation (For Admin)
  const staffStats = staffList.map((st) => {
    const stSales = filterSalesByPeriod(
      sales.filter((s) => s.staffId === st.id),
    );
    const stRevenue = stSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const stCost = stSales.reduce((acc, s) => acc + s.totalCost, 0);
    const stProfit = stRevenue - stCost;
    const stDebtGiven = stSales
      .filter((s) => s.paymentType === "nasiya")
      .reduce((acc, s) => acc + s.totalAmount, 0);
    const stCount = stSales.length;
    const avgCheck = stCount > 0 ? Math.round(stRevenue / stCount) : 0;

    return {
      staff: st,
      salesCount: stCount,
      revenue: stRevenue,
      profit: stProfit,
      debtGiven: stDebtGiven,
      avgCheck,
    };
  });

  // Sort staff by revenue descending
  staffStats.sort((a, b) => b.revenue - a.revenue);

  // -------------------------------------------------------------
  // 1. SOTUVCHI (SALESMAN) PERSONAL DASHBOARD
  // -------------------------------------------------------------
  if (!isAdmin) {
    const todaySales = mySales.filter((s) => s.createdAt >= startOfToday);
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const monthSales = mySales.filter((s) => s.createdAt >= startOfMonth);
    const monthRevenue = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);

    const myTodayCash = todaySales
      .filter((s) => s.paymentType === "naqd")
      .reduce((acc, s) => acc + s.totalAmount, 0);
    const myTodayCard = todaySales
      .filter((s) => s.paymentType === "karta")
      .reduce((acc, s) => acc + s.totalAmount, 0);
    const myTodayDebt = todaySales
      .filter((s) => s.paymentType === "nasiya")
      .reduce((acc, s) => acc + s.totalAmount, 0);

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Sotuvchi Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">
              Sotuvchi Paneli
            </div>
            <h2 className="text-lg sm:text-2xl font-black mt-0.5">
              {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bugungi va oylik shaxsiy savdo ko'rsatkichlaringiz
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>{new Date().toLocaleDateString("uz-UZ")}</span>
          </div>
        </div>

        {/* Daily & Monthly KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-semibold">
                Bugungi savdo
              </span>
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
              {formatPrice(todayRevenue)}
            </div>
            <p className="text-[10px] text-slate-400">
              {todaySales.length} ta chek
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-semibold">
                Oylik savdo
              </span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="text-base sm:text-2xl font-black text-blue-600 leading-tight">
              {formatPrice(monthRevenue)}
            </div>
            <p className="text-[10px] text-slate-400">
              {monthSales.length} ta chek (joriy oy)
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-semibold">
                Bugungi naqd
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-base sm:text-2xl font-black text-emerald-600 leading-tight">
              {formatPrice(myTodayCash)}
            </div>
            <p className="text-[10px] text-slate-400">Kassadagi naqd</p>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-semibold">
                Karta & Nasiya
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              Karta: {formatPrice(myTodayCard)}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold truncate">
              Nasiya: {formatPrice(myTodayDebt)}
            </div>
          </div>
        </div>

        {/* My Recent Sales List */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Mening oxirgi savdolarim
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              {mySales.length} ta chek
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {mySales.slice(0, 15).map((sale) => (
              <div
                key={sale.id}
                className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    {formatPrice(sale.totalAmount)}
                  </div>
                  <div className="text-slate-500 text-[10px] sm:text-[11px] mt-0.5 line-clamp-1">
                    {sale.items
                      .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
                      .join(", ")}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase ${
                      sale.paymentType === "naqd"
                        ? "bg-emerald-50 text-emerald-700"
                        : sale.paymentType === "karta"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {sale.paymentType}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(sale.createdAt)}
                  </div>
                </div>
              </div>
            ))}

            {mySales.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Siz hali hech qanday savdo amalga oshirmagansiz.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. ADMIN COMPREHENSIVE DASHBOARD (Entire page with Staff Stats)
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Admin Header & Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] sm:text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Paneli</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black">
            Umumiy Do'kon va Sotuvchilar Statistikasi
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Barcha tushumlar, sof foyda va sotuvchilar ko'rsatkichi
          </p>
        </div>

        {/* Period Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700 self-stretch sm:self-auto justify-center">
          {[
            { id: "today", label: "Bugun" },
            { id: "month", label: "Joriy Oy" },
            { id: "all", label: "Barchasi" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id as "today" | "month" | "all")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                period === item.id
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Financial KPI Cards - 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Jami Tushum
            </span>
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
            {formatPrice(totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
            <Receipt className="w-3 h-3 text-slate-400" />
            <span>{periodSales.length} ta chek</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Sof Foyda
            </span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-600 leading-tight">
            +{formatPrice(totalProfit)}
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-700">
            <ArrowUpRight className="w-3 h-3" />
            <span>Tannarxdan qolgan marja</span>
          </div>
        </div>

        {/* Warehouse Assets */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Ombor Qiymati
            </span>
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div className="text-base sm:text-2xl font-black text-blue-600 leading-tight">
            {formatPrice(warehouseCost)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            Sotuvda: {formatPrice(warehouseSelling)}
          </div>
        </div>

        {/* Unpaid Debts */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Nasiya Qarzlar
            </span>
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          </div>
          <div className="text-base sm:text-2xl font-black text-rose-600 leading-tight">
            {formatPrice(totalUnpaidDebts)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500">
            Kutilayotgan qarzlar
          </div>
        </div>
      </div>

      {/* Payment Distribution Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500">
              Naqd
            </div>
            <div className="text-xs sm:text-base font-black text-slate-900 mt-0.5">
              {formatPrice(cashRevenue)}
            </div>
          </div>
          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center font-bold text-xs">
            {totalRevenue > 0
              ? Math.round((cashRevenue / totalRevenue) * 100)
              : 0}
            %
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500">
              Karta
            </div>
            <div className="text-xs sm:text-base font-black text-slate-900 mt-0.5">
              {formatPrice(cardRevenue)}
            </div>
          </div>
          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-blue-50 text-blue-600 items-center justify-center font-bold text-xs">
            {totalRevenue > 0
              ? Math.round((cardRevenue / totalRevenue) * 100)
              : 0}
            %
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500">
              Nasiya
            </div>
            <div className="text-xs sm:text-base font-black text-slate-900 mt-0.5">
              {formatPrice(debtRevenue)}
            </div>
          </div>
          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-amber-50 text-amber-600 items-center justify-center font-bold text-xs">
            {totalRevenue > 0
              ? Math.round((debtRevenue / totalRevenue) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* SOTUVCHILAR STATISTIKASI (STAFF STATS - FULL MOBILE & DESKTOP SUPPORT) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 text-rose-500">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-base text-slate-900">
                Sotuvchilar Statistikasi
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
                Har bir sotuvchi tomonidan amalga oshirilgan savdolar va sof
                foyda
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-xl">
            {staffList.length} kishi
          </span>
        </div>

        {/* 1. Mobile Sotuvchilar Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {staffStats.map((item, index) => {
            const isTop1 = index === 0 && item.revenue > 0;
            return (
              <div key={item.staff.id} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-5 text-slate-400 font-bold text-xs">
                      {isTop1 ? (
                        <Award className="w-4 h-4 text-amber-500" />
                      ) : (
                        `#${index + 1}`
                      )}
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        item.staff.role === "admin"
                          ? "bg-rose-500 text-white"
                          : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {item.staff.role === "admin" ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{item.staff.name}</span>
                        {item.staff.role === "admin" && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.staff.phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {item.salesCount} ta chek
                    </span>
                  </div>
                </div>

                {/* Performance stats mini grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">
                      Jami tushum:
                    </div>
                    <div className="font-black text-slate-900">
                      {formatPrice(item.revenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Foyda:</div>
                    <div className="font-bold text-emerald-600">
                      +{formatPrice(item.profit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">
                      O'rtacha chek:
                    </div>
                    <div className="font-semibold text-slate-700">
                      {formatPrice(item.avgCheck)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Desktop Sotuvchilar Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Reyting & Ism</th>
                <th className="py-3.5 px-4 text-center">Cheklar soni</th>
                <th className="py-3.5 px-4">Umumiy Tushum</th>
                <th className="py-3.5 px-4">Keltirilgan Foyda</th>
                <th className="py-3.5 px-4">O'rtacha Chek</th>
                <th className="py-3.5 px-4">Nasiyaga Bergan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
              {staffStats.map((item, index) => {
                const isTop1 = index === 0 && item.revenue > 0;
                return (
                  <tr
                    key={item.staff.id}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 text-slate-400 font-bold">
                          {isTop1 ? (
                            <Award className="w-5 h-5 text-amber-500" />
                          ) : (
                            <span>#{index + 1}</span>
                          )}
                        </div>
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            item.staff.role === "admin"
                              ? "bg-rose-500 text-white"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {item.staff.role === "admin" ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.staff.name}</span>
                            {item.staff.role === "admin" && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.staff.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {item.salesCount} ta
                    </td>

                    <td className="py-4 px-4 font-black text-slate-900">
                      {formatPrice(item.revenue)}
                    </td>

                    <td className="py-4 px-4 font-bold text-emerald-600">
                      +{formatPrice(item.profit)}
                    </td>

                    <td className="py-4 px-4 font-medium text-slate-600">
                      {formatPrice(item.avgCheck)}
                    </td>

                    <td className="py-4 px-4 font-medium text-amber-600">
                      {formatPrice(item.debtGiven)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent All Sales Activity Feed */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
              Oxirgi Sotuv Cheklari
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {periodSales.length} ta chek
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {periodSales.slice(0, 30).map((sale) => (
            <div
              key={sale.id}
              className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-slate-50 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    {formatPrice(sale.totalAmount)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase ${
                      sale.paymentType === "naqd"
                        ? "bg-emerald-50 text-emerald-700"
                        : sale.paymentType === "karta"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {sale.paymentType}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Sotuvchi:{" "}
                    <span className="font-bold text-slate-700">
                      {sale.staffName}
                    </span>
                  </span>
                </div>
                <div className="text-slate-500 text-[10px] sm:text-[11px] mt-0.5">
                  {sale.items
                    .map((i) => `${i.name} × ${i.quantity} ${i.unit}`)
                    .join(", ")}
                </div>
              </div>

              <div className="text-slate-400 text-[10px] sm:text-[11px] shrink-0 sm:text-right flex items-center sm:flex-col justify-between sm:justify-start">
                <div>{formatDate(sale.createdAt)}</div>
                <div className="text-emerald-600 font-bold">
                  +{formatPrice(sale.totalProfit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
