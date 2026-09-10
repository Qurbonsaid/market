import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Loader2,
  Phone,
  Plus,
  Save,
  Settings2,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import type {
  DebtRecord,
  PaynetConfig,
  PaynetTransaction,
  StaffUser,
} from "../types";
import { PaynetHistoryView } from "./PaynetHistoryView";
import { formatPrice, roundMoney } from "../utils/formatters";
import type { NewPaynetTransactionPayload } from "../services/firestoreService";

interface PaynetViewProps {
  currentUser: StaffUser;
  config: PaynetConfig;
  transactions: PaynetTransaction[];
  debts: DebtRecord[];
  onSubmit: (payload: NewPaynetTransactionPayload) => Promise<void>;
  onSaveConfig: (config: PaynetConfig) => Promise<void>;
  onPayDebt: (
    debtId: string,
    amount: number,
    staffName: string,
  ) => Promise<void>;
}

export const PaynetView: React.FC<PaynetViewProps> = ({
  currentUser,
  config,
  transactions,
  debts,
  onSubmit,
  onSaveConfig,
  onPayDebt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"naqd" | "nasiya">("naqd");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [debtPaidNow, setDebtPaidNow] = useState("");
  const [debtNotes, setDebtNotes] = useState("");
  const [debtDueDate, setDebtDueDate] = useState(
    new Date(Date.now() + 12096e5).toISOString().split("T")[0],
  );
  const [processing, setProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"transactions" | "debtors">(
    "transactions",
  );
  const [draftConfig, setDraftConfig] = useState(config);
  const [newCategory, setNewCategory] = useState("");
  const [feeDraft, setFeeDraft] = useState(String(config.serviceFeePercentage));

  const todayStartTimestamp = (() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  })();
  const shiftTransactions = useMemo(
    () => transactions.filter((item) => item.createdAt >= todayStartTimestamp),
    [transactions, todayStartTimestamp],
  );
  const monthlyTransactions = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return transactions.filter(
      (item) => item.createdAt >= monthStart.getTime(),
    );
  }, [transactions]);
  const adminStats = useMemo(() => {
    const summarize = (items: PaynetTransaction[]) => ({
      count: items.length,
      total: roundMoney(items.reduce((sum, item) => sum + item.amount, 0)),
      fees: roundMoney(items.reduce((sum, item) => sum + item.fee, 0)),
    });
    return {
      month: summarize(monthlyTransactions),
      allTime: summarize(transactions),
    };
  }, [monthlyTransactions, transactions]);
  const categoryStats = useMemo(
    () =>
      config.categories.map((category) => ({
        category,
        count: shiftTransactions.filter((item) => item.category === category)
          .length,
        total: roundMoney(
          shiftTransactions
            .filter((item) => item.category === category)
            .reduce((sum, item) => sum + item.amount, 0),
        ),
      })),
    [config.categories, shiftTransactions],
  );
  const enteredAmount = roundMoney(Number(amount) || 0);
  const canStaffLowerFee =
    currentUser.role === "staff" &&
    config.priceOffLimit > 0 &&
    enteredAmount > config.priceOffLimit;
  const appliedFeePercentage = canStaffLowerFee
    ? Math.min(config.serviceFeePercentage, roundMoney(Number(feeDraft) || 0))
    : config.serviceFeePercentage;
  const fee = roundMoney((enteredAmount * appliedFeePercentage) / 100);
  const total = roundMoney(enteredAmount + fee);

  if (historyOpen) {
    return (
      <PaynetHistoryView
        currentUser={currentUser}
        transactions={transactions}
        debts={debts}
        onBack={() => setHistoryOpen(false)}
        onPayDebt={onPayDebt}
        initialTab={historyTab}
      />
    );
  }

  const resetForm = () => {
    setSelectedCategory(null);
    setTarget("");
    setAmount("");
    setPaymentType("naqd");
    setCustomerName("");
    setCustomerPhone("");
    setDebtPaidNow("");
    setDebtNotes("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCategory || !target.trim() || enteredAmount <= 0) return;
    if (paymentType === "nasiya" && !customerName.trim()) return;
    const initialDebtPayment = roundMoney(Number(debtPaidNow) || 0);
    if (paymentType === "nasiya" && initialDebtPayment > total) {
      alert("Boshlang'ich to'lov jami summadan oshmasligi kerak.");
      return;
    }
    setProcessing(true);
    try {
      const payload: NewPaynetTransactionPayload = {
        category: selectedCategory,
        target: target.trim(),
        amount: enteredAmount,
        serviceFeePercentage: canStaffLowerFee
          ? appliedFeePercentage
          : undefined,
        staffId: currentUser.id,
        staffName: currentUser.name,
        paymentType,
        customerName: paymentType === "nasiya" ? customerName : undefined,
        customerPhone: paymentType === "nasiya" ? customerPhone : undefined,
        debtPaidNow: paymentType === "nasiya" ? initialDebtPayment : undefined,
        debtNotes: paymentType === "nasiya" ? debtNotes : undefined,
        debtDueDate:
          paymentType === "nasiya"
            ? new Date(debtDueDate).getTime()
            : undefined,
      };
      await onSubmit(payload);
      resetForm();
    } finally {
      setProcessing(false);
    }
  };

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value || draftConfig.categories.includes(value)) return;
    setDraftConfig((current) => ({
      ...current,
      categories: [...current.categories, value],
    }));
    setNewCategory("");
  };

  const saveSettings = async () => {
    await onSaveConfig({
      balance: roundMoney(Number(draftConfig.balance) || 0),
      balanceAlertLimit: roundMoney(Number(draftConfig.balanceAlertLimit) || 0),
      priceOffLimit: roundMoney(Number(draftConfig.priceOffLimit) || 0),
      serviceFeePercentage: roundMoney(
        Number(draftConfig.serviceFeePercentage) || 0,
      ),
      categories: draftConfig.categories,
    });
    setSettingsOpen(false);
  };

  if (settingsOpen && currentUser.role === "admin") {
    return (
      <section className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Paynet boshqaruvi
            </p>
            <h1 className="text-2xl font-black text-slate-900">Sozlamalar</h1>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Ortga
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-bold text-slate-600">
              Paynet balansi
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftConfig.balance}
                onChange={(event) =>
                  setDraftConfig({
                    ...draftConfig,
                    balance: Number(event.target.value) || 0,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Xizmat haqi (%)
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftConfig.serviceFeePercentage}
                onChange={(event) =>
                  setDraftConfig({
                    ...draftConfig,
                    serviceFeePercentage: Number(event.target.value) || 0,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Balans ogohlantirish limiti
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftConfig.balanceAlertLimit}
                onChange={(event) =>
                  setDraftConfig({
                    ...draftConfig,
                    balanceAlertLimit: Number(event.target.value) || 0,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Chegirmali narx limiti
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftConfig.priceOffLimit}
                onChange={(event) =>
                  setDraftConfig({
                    ...draftConfig,
                    priceOffLimit: Number(event.target.value) || 0,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600">
                Kategoriyalar
              </label>
              <span className="text-[11px] text-slate-400">
                {draftConfig.categories.length} ta
              </span>
            </div>
            <div className="space-y-2">
              {draftConfig.categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <span>{category}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftConfig({
                        ...draftConfig,
                        categories: draftConfig.categories.filter(
                          (item) => item !== category,
                        ),
                      })
                    }
                    className="text-slate-400 hover:text-rose-600"
                    title="Kategoriyani o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addCategory()}
                placeholder="Yangi kategoriya"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addCategory}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Qo'shish
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Save className="w-4 h-4" /> Saqlash
          </button>
        </div>
      </section>
    );
  }

  if (selectedCategory) {
    return (
      <section className="max-w-2xl mx-auto space-y-4">
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Kategoriyalarga qaytish
        </button>
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Paynet operatsiyasi
            </p>
            <h1 className="text-2xl font-black text-slate-900">
              {selectedCategory}
            </h1>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-bold text-slate-600">
              Target telefon / ID
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  required
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="998901234567"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Summa
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">
                Xizmat haqi ({appliedFeePercentage}%)
              </span>
              <b>{formatPrice(fee)}</b>
            </div>
            <div className="flex justify-between text-base font-black">
              <span>Jami</span>
              <span className="text-emerald-600">{formatPrice(total)}</span>
            </div>
          </div>
          {currentUser.role === "staff" && (
            <div className="flex items-end gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <label className="flex-1 text-xs font-bold text-emerald-900">
                Chegirmali xizmat haqi (%)
                <input
                  type="number"
                  min="0"
                  max={config.serviceFeePercentage}
                  step="0.01"
                  value={feeDraft}
                  onChange={(event) => setFeeDraft(event.target.value)}
                  disabled={!canStaffLowerFee}
                  className="mt-1.5 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>
              <span className="max-w-44 pb-2 text-[10px] text-emerald-700">
                {canStaffLowerFee
                  ? `Mijoz summasi ${formatPrice(config.priceOffLimit)} limitidan yuqori.`
                  : `Faqat summa ${formatPrice(config.priceOffLimit)} dan yuqori bo'lsa yoqiladi.`}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("naqd")}
              className={`rounded-2xl border py-3 text-xs font-bold ${paymentType === "naqd" ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200 bg-slate-50"}`}
            >
              <Wallet className="w-4 h-4 mx-auto mb-1" /> Naqd
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("nasiya")}
              className={`rounded-2xl border py-3 text-xs font-bold ${paymentType === "nasiya" ? "bg-amber-600 border-amber-600 text-white" : "border-slate-200 bg-slate-50"}`}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1" /> Nasiya
            </button>
          </div>
          {paymentType === "nasiya" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
              <p className="text-xs font-bold text-amber-800">Nasiya daftari</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Xaridor ismi / ID"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  placeholder="Telefon raqami"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  min="0"
                  max={total}
                  step="0.01"
                  placeholder="Hozir to'lagani"
                  value={debtPaidNow}
                  onChange={(event) => setDebtPaidNow(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(event) => setDebtDueDate(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  placeholder="Izoh"
                  value={debtNotes}
                  onChange={(event) => setDebtNotes(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
          )}
          <button
            disabled={processing}
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Operatsiyani yakunlash"
            )}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="h-1" />
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-white">
          <p className="text-[11px] text-slate-400">Paynet balansi</p>
          <p className="text-sm font-black">{formatPrice(config.balance)}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-[11px] text-emerald-700">Bugungi operatsiyalar</p>
          <p className="text-sm font-black text-emerald-800">
            {shiftTransactions.length} ta
          </p>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-200 px-3 py-2">
          <p className="text-[11px] text-orange-700">Bugungi aylanma</p>
          <p className="text-sm font-black text-orange-800">
            {formatPrice(
              roundMoney(
                shiftTransactions.reduce((sum, item) => sum + item.amount, 0),
              ),
            )}
          </p>
        </div>
      </div>
      {currentUser.role === "admin" && (
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <CalendarDays className="w-4 h-4" />
              <p className="text-[11px] font-bold">Shu oy</p>
            </div>
            <p className="mt-2 text-xl font-black text-blue-900">
              {formatPrice(adminStats.month.total)}
            </p>
            <p className="mt-1 text-[11px] text-blue-700">
              {adminStats.month.count} ta · Foyda:{" "}
              {formatPrice(adminStats.month.fees)} ·{" "}
              {adminStats.month.total
                ? roundMoney(
                    (adminStats.month.fees / adminStats.month.total) * 100,
                  )
                : 0}
              %
            </p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-2 text-violet-700">
              <CalendarDays className="w-4 h-4" />
              <p className="text-[11px] font-bold">Butun vaqt</p>
            </div>
            <p className="mt-2 text-xl font-black text-violet-900">
              {formatPrice(adminStats.allTime.total)}
            </p>
            <p className="mt-1 text-[11px] text-violet-700">
              {adminStats.allTime.count} ta · Foyda:{" "}
              {formatPrice(adminStats.allTime.fees)} ·{" "}
              {adminStats.allTime.total
                ? roundMoney(
                    (adminStats.allTime.fees / adminStats.allTime.total) * 100,
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {categoryStats.map((item) => (
          <button
            type="button"
            key={item.category}
            onClick={() => setSelectedCategory(item.category)}
            className="text-left rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Smartphone className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {item.count} ta
              </span>
            </div>
            <h2 className="mt-5 font-black text-slate-900">{item.category}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Bugungi summa:{" "}
              <b className="text-slate-700">{formatPrice(item.total)}</b>
            </p>
          </button>
        ))}
      </div>
      {categoryStats.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Admin hali kategoriya qo'shmagan.
        </div>
      )}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-around gap-1">
          <button
            type="button"
            onClick={() => {
              setHistoryOpen(false);
              setSettingsOpen(false);
            }}
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-emerald-700"
          >
            <Smartphone className="h-5 w-5" /> Paynet
          </button>
          <button
            type="button"
            onClick={() => {
              setHistoryTab("transactions");
              setHistoryOpen(true);
              setSettingsOpen(false);
            }}
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-600"
          >
            <CalendarDays className="h-5 w-5" /> Tarix
          </button>
          <button
            type="button"
            onClick={() => {
              setHistoryTab("debtors");
              setHistoryOpen(true);
              setSettingsOpen(false);
            }}
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-amber-700"
          >
            <Wallet className="h-5 w-5" /> Qarzlar
          </button>
          {currentUser.role === "admin" && (
            <button
              type="button"
              onClick={() => {
                setDraftConfig(config);
                setSettingsOpen(true);
                setHistoryOpen(false);
              }}
              className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-700"
            >
              <Settings2 className="h-5 w-5" /> Sozlamalar
            </button>
          )}
        </div>
      </nav>
    </section>
  );
};
