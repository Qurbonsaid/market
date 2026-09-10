import React, { useMemo, useState } from "react";
import { ArrowLeft, Clock3, ReceiptText, UserRound } from "lucide-react";
import type { DebtRecord, PaynetTransaction, StaffUser } from "../types";
import { formatDate, formatPrice, roundMoney } from "../utils/formatters";

interface PaynetHistoryViewProps {
  currentUser: StaffUser;
  transactions: PaynetTransaction[];
  debts: DebtRecord[];
  onBack: () => void;
  onPayDebt: (
    debtId: string,
    amount: number,
    staffName: string,
  ) => Promise<void>;
  initialTab?: HistoryTab;
}

type HistoryTab = "transactions" | "debtors";

export const PaynetHistoryView: React.FC<PaynetHistoryViewProps> = ({
  currentUser,
  transactions,
  debts,
  onBack,
  onPayDebt,
  initialTab = "transactions",
}) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);
  const [paymentDebt, setPaymentDebt] = useState<DebtRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const paynetDebts = useMemo(
    () => debts.filter((debt) => debt.origin === "paynet"),
    [debts],
  );

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentDebt) return;
    const amount = Number(paymentAmount);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > paymentDebt.remainingAmount
    )
      return;
    setProcessing(true);
    try {
      await onPayDebt(paymentDebt.id, amount, currentUser.name);
      setPaymentDebt(null);
      setPaymentAmount("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Paynet {currentUser.role === "admin" ? "admin" : "kassir"} paneli
          </p>
          <h1 className="text-2xl font-black text-slate-900">
            Tarix va qarzdorlar
          </h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 self-start text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Operatsiyaga qaytish
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${activeTab === "transactions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          <ReceiptText className="w-4 h-4" /> Tranzaksiyalar (
          {transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("debtors")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${activeTab === "debtors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          <UserRound className="w-4 h-4" /> Qarzdorlar ({paynetDebts.length})
        </button>
      </div>

      {activeTab === "transactions" ? (
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <article
              key={transaction.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                    <ReceiptText className="w-3.5 h-3.5" />
                  </span>
                  <p className="truncate text-sm font-black text-slate-900">
                    {transaction.category}
                  </p>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {transaction.paymentType}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {transaction.target} · {transaction.staffName}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-black text-slate-900">
                  Summa: {formatPrice(transaction.amount)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Jami: {formatPrice(transaction.totalAmount)} · Foiz:{" "}
                  {transaction.serviceFeePercentage ??
                    roundMoney(
                      transaction.amount
                        ? (transaction.fee / transaction.amount) * 100
                        : 0,
                    )}
                  %
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatDate(transaction.createdAt)}
                </p>
              </div>
            </article>
          ))}
          {transactions.length === 0 && (
            <EmptyState text="Paynet tranzaksiyalari topilmadi." />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {paynetDebts.map((debt) => (
            <article
              key={debt.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                    <UserRound className="w-3.5 h-3.5" />
                  </span>
                  <p className="truncate text-sm font-black text-slate-900">
                    {debt.customerName}
                  </p>
                  <span
                    className={`text-[10px] font-bold ${debt.status === "yopildi" ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {debt.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {debt.customerPhone || "Telefon kiritilmagan"} ·{" "}
                  {debt.staffName}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-black text-amber-900">
                  Qoldiq: {formatPrice(debt.remainingAmount)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Jami: {formatPrice(debt.totalAmount)} ·{" "}
                  {formatDate(debt.createdAt)}
                </p>
                {debt.status === "kutilmoqda" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDebt(debt);
                      setPaymentAmount(String(debt.remainingAmount));
                    }}
                    className="mt-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white"
                  >
                    Qarz to'lovi
                  </button>
                )}
              </div>
            </article>
          ))}
          {paynetDebts.length === 0 && (
            <EmptyState text="Paynet qarzdorlari topilmadi." />
          )}
        </div>
      )}
      {paymentDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={handlePayment}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3"
          >
            <h2 className="font-black text-slate-900">Paynet qarz to'lovi</h2>
            <p className="text-xs text-slate-500">
              {paymentDebt.customerName} · Qoldiq:{" "}
              {formatPrice(paymentDebt.remainingAmount)}
            </p>
            <input
              required
              type="number"
              min="0.01"
              max={paymentDebt.remainingAmount}
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentDebt(null)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500"
              >
                Bekor qilish
              </button>
              <button
                disabled={processing}
                type="submit"
                className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {processing ? "Saqlanmoqda..." : "To'lovni saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      <Clock3 className="mx-auto mb-2 h-5 w-5 text-slate-300" />
      {text}
    </div>
  );
}
