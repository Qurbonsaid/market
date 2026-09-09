import React, { useState } from "react";
import {
  Phone,
  Search,
  CheckCircle2,
  Clock,
  Coins,
  History,
  X,
  Loader2,
  Wallet,
} from "lucide-react";
import type { DebtRecord, StaffUser } from "../types";
import { formatPrice, formatDate, cleanPhoneNumber } from "../utils/formatters";

interface DebtsViewProps {
  debts: DebtRecord[];
  currentUser: StaffUser;
  onPayDebt: (
    debtId: string,
    amount: number,
    staffName: string,
  ) => Promise<void>;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  currentUser,
  onPayDebt,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "kutilmoqda" | "yopildi" | "barchasi"
  >("kutilmoqda");

  // Payment modal state
  const [activePaymentDebt, setActivePaymentDebt] = useState<DebtRecord | null>(
    null,
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  // History modal state
  const [activeHistoryDebt, setActiveHistoryDebt] = useState<DebtRecord | null>(
    null,
  );

  // Calculations
  const totalUnpaid = debts
    .filter((d) => d.status === "kutilmoqda")
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const totalPaid = debts.reduce((acc, d) => acc + d.paidAmount, 0);
  const pendingCount = debts.filter((d) => d.status === "kutilmoqda").length;

  const filtered = debts.filter((d) => {
    const matchSearch =
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.customerPhone.includes(search);
    const matchStatus =
      statusFilter === "barchasi" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenPayment = (debt: DebtRecord) => {
    setActivePaymentDebt(debt);
    setPaymentAmount(debt.remainingAmount.toString());
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentDebt) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Iltimos, to'g'ri to'lov summasini kiriting");
      return;
    }

    if (amount > activePaymentDebt.remainingAmount) {
      alert("To'lov summasi qarz qoldig'idan oshmasligi kerak!");
      return;
    }

    setProcessing(true);
    try {
      await onPayDebt(activePaymentDebt.id, amount, currentUser.name);
      setActivePaymentDebt(null);
      setPaymentAmount("");
    } catch (err) {
      console.error(err);
      alert("To'lovni saqlashda xatolik yuz berdi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">
              Qaytarilmagan nasiyalar
            </span>
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {formatPrice(totalUnpaid)}
          </div>
          <p className="text-[11px] text-slate-400">
            {pendingCount} nafar mijoz qarzda
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">
              Qaytarilgan qarzlar
            </span>
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatPrice(totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400">Kassaga tushgan</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">
              Jami yozilgan nasiyalar
            </span>
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {debts.length} ta yozuv
          </div>
          <p className="text-[11px] text-slate-400">Nasiya daftari tarixi</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mijoz ismi yoki telefon raqami..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-rose-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          {[
            { id: "kutilmoqda", label: "Kutilmoqda" },
            { id: "yopildi", label: "To'langan" },
            { id: "barchasi", label: "Barchasi" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setStatusFilter(tab.id as "kutilmoqda" | "yopildi" | "barchasi")
              }
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition text-center ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. MOBILE DEBTS CARDS (md:hidden) */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((debt) => {
          const isPaid = debt.status === "yopildi";
          const isOverdue =
            debt.dueDate &&
            debt.dueDate < Date.now() &&
            debt.status === "kutilmoqda";

          return (
            <div
              key={debt.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2.5"
            >
              {/* Customer header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {debt.customerName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{debt.customerPhone}</span>
                    <a
                      href={`tel:${cleanPhoneNumber(debt.customerPhone)}`}
                      className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold text-[11px]"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Qo'ng'iroq</span>
                    </a>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {isPaid ? "Yopilgan" : "Kutilmoqda"}
                </span>
              </div>

              {/* Debt numbers grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Jami qarz:</div>
                  <div className="font-semibold text-slate-700">
                    {formatPrice(debt.totalAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">To'landi:</div>
                  <div className="font-bold text-emerald-600">
                    {formatPrice(debt.paidAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Qoldi:</div>
                  <div
                    className={`font-black ${
                      isPaid ? "text-slate-400 line-through" : "text-rose-600"
                    }`}
                  >
                    {formatPrice(debt.remainingAmount)}
                  </div>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-500">
                  {debt.dueDate ? (
                    <span
                      className={isOverdue ? "text-rose-600 font-bold" : ""}
                    >
                      Muddat: {formatDate(debt.dueDate)}
                    </span>
                  ) : (
                    <span>Muddat ko'rsatilmagan</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {debt.paymentHistory?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveHistoryDebt(debt)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
                      title="To'lovlar tarixi"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  )}

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(debt)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>To'lov olish</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Nasiya daftari bo'yicha ma'lumot topilmadi.
          </div>
        )}
      </div>

      {/* 2. DESKTOP DEBTS TABLE (Hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Mijoz</th>
                <th className="py-3.5 px-4">Qarz Summasi</th>
                <th className="py-3.5 px-4">To'langan</th>
                <th className="py-3.5 px-4">Qolgan Qarz</th>
                <th className="py-3.5 px-4">Qaytarish Sanasi</th>
                <th className="py-3.5 px-4">Sotuvchi</th>
                <th className="py-3.5 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
              {filtered.map((debt) => {
                const isPaid = debt.status === "yopildi";
                const isOverdue =
                  debt.dueDate &&
                  debt.dueDate < Date.now() &&
                  debt.status === "kutilmoqda";

                return (
                  <tr key={debt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-900">
                          {debt.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>{debt.customerPhone}</span>
                          <a
                            href={`tel:${cleanPhoneNumber(debt.customerPhone)}`}
                            className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Qo'ng'iroq qilish"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {formatPrice(debt.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {formatPrice(debt.paidAmount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-black ${
                          isPaid
                            ? "text-slate-400 line-through"
                            : "text-rose-600 text-sm"
                        }`}
                      >
                        {formatPrice(debt.remainingAmount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {debt.dueDate ? (
                        <span
                          className={`text-xs font-semibold ${
                            isOverdue
                              ? "text-rose-600 font-bold"
                              : "text-slate-600"
                          }`}
                        >
                          {formatDate(debt.dueDate)}
                          {isOverdue && " (Muddati o'tdi!)"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                      {debt.staffName}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {debt.paymentHistory?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveHistoryDebt(debt)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                            title="To'lovlar tarixi"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}

                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(debt)}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>To'lov olish</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Yopilgan</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: To'lov qabul qilish */}
      {activePaymentDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  Nasiya to'lovini qabul qilish
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentDebt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleExecutePayment}
              className="p-4 sm:p-5 space-y-4"
            >
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                <div className="font-bold text-slate-900">
                  {activePaymentDebt.customerName}
                </div>
                <div className="text-slate-500">
                  Qolgan qarz:{" "}
                  <span className="font-black text-rose-600">
                    {formatPrice(activePaymentDebt.remainingAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qabul qilinayotgan summa (so'm) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activePaymentDebt.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmount(
                      activePaymentDebt.remainingAmount.toString(),
                    )
                  }
                  className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100"
                >
                  To'liq to'lash
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentDebt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {processing && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>To'lovni tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: To'lovlar tarixi */}
      {activeHistoryDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">
                  To'lovlar tarixi: {activeHistoryDebt.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveHistoryDebt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2.5 max-h-80 overflow-y-auto">
              {activeHistoryDebt.paymentHistory?.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-emerald-600 text-sm">
                      +{formatPrice(h.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Qabul qildi: {h.staffName}
                    </div>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(h.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
