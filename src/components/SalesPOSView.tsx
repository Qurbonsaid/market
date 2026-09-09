import React, { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Banknote,
  Clock,
  Search,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Receipt,
  X,
  ArrowRight,
} from "lucide-react";
import type {
  InventoryProduct,
  StaffUser,
  PaymentType,
  SaleItem,
} from "../types";
import { formatPrice } from "../utils/formatters";
import type { NewSalePayload } from "../services/firestoreService";

interface SalesPOSViewProps {
  inventory: InventoryProduct[];
  currentUser: StaffUser;
  onCompleteSale: (payload: NewSalePayload) => Promise<void>;
}

export const SalesPOSView: React.FC<SalesPOSViewProps> = ({
  inventory,
  currentUser,
  onCompleteSale,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barchasi");

  // Cart
  const [cart, setCart] = useState<SaleItem[]>([]);

  // Mobile cart sheet toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Checkout modal & payment state
  const [paymentType, setPaymentType] = useState<PaymentType>("naqd");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+998");
  const [debtPaidNow, setDebtPaidNow] = useState("");
  const [debtDueDate, setDebtDueDate] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split("T")[0],
  );
  const [debtNotes, setDebtNotes] = useState("");

  const [processing, setProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    total: number;
    count: number;
  } | null>(null);

  const categories = [
    "Barchasi",
    ...Array.from(new Set(inventory.map((p) => p.category))),
  ];

  // Filter products
  const filteredProducts = inventory.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchCat =
      selectedCategory === "Barchasi" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Add to cart
  const handleAddToCart = (product: InventoryProduct) => {
    if (product.quantity <= 0) {
      alert(`"${product.name}" mahsulotidan omborda qolmagan!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`Omborda faqat ${product.quantity} ${product.unit} mavjud!`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          unit: product.unit,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    const p = inventory.find((it) => it.id === productId);
    const max = p ? p.quantity : 9999;

    setCart((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const next = it.quantity + delta;
            if (next > max) {
              alert(`Omborda faqat ${max} ${it.unit} mavjud!`);
              return it;
            }
            return { ...it, quantity: next };
          }
          return it;
        })
        .filter((it) => it.quantity > 0),
    );
  };

  const handlePriceChange = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((it) =>
        it.productId === productId
          ? { ...it, sellingPrice: Math.max(0, newPrice) }
          : it,
      ),
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.productId !== productId));
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm("Savatni tozalashni tasdiqlaysizmi?")) {
      setCart([]);
    }
  };

  // Calculations
  const totalAmount = cart.reduce(
    (acc, it) => acc + it.sellingPrice * it.quantity,
    0,
  );
  const totalCost = cart.reduce(
    (acc, it) => acc + it.costPrice * it.quantity,
    0,
  );
  const totalProfit = totalAmount - totalCost;
  const totalItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Submit sale
  const handleFinishSale = async () => {
    if (cart.length === 0) return;

    if (paymentType === "nasiya") {
      if (!customerName.trim()) {
        alert("Nasiyaga sotish uchun xaridor ismini kiriting!");
        return;
      }
      if (!customerPhone.trim() || customerPhone.length < 9) {
        alert("Nasiyaga sotish uchun xaridor telefon raqamini kiriting!");
        return;
      }
    }

    setProcessing(true);
    try {
      const payload: NewSalePayload = {
        items: cart,
        paymentType,
        staffId: currentUser.id,
        staffName: currentUser.name,
        customerName:
          paymentType === "nasiya" ? customerName.trim() : undefined,
        customerPhone:
          paymentType === "nasiya" ? customerPhone.trim() : undefined,
        debtDueDate:
          paymentType === "nasiya"
            ? new Date(debtDueDate).getTime()
            : undefined,
        debtPaidNow:
          paymentType === "nasiya" ? parseFloat(debtPaidNow) || 0 : undefined,
        debtNotes: paymentType === "nasiya" ? debtNotes.trim() : undefined,
      };

      await onCompleteSale(payload);

      setSuccessReceipt({ total: totalAmount, count: totalItemsCount });
      setCart([]);
      setIsMobileCartOpen(false);
      setCustomerName("");
      setCustomerPhone("+998");
      setDebtPaidNow("");
      setDebtNotes("");
      setPaymentType("naqd");

      setTimeout(() => setSuccessReceipt(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Savdoni yakunlashda xatolik yuz berdi");
    } finally {
      setProcessing(false);
    }
  };

  // Reusable Cart Content Component (Used in Desktop sidebar and Mobile sheet)
  const renderCartContent = (isMobileSheet = false) => (
    <div className="space-y-4">
      {/* Success Alert Banner */}
      {successReceipt && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Savdo muvaffaqiyatli yakunlandi!</div>
            <div className="text-[11px]">
              {successReceipt.count} dona mahsulot —{" "}
              {formatPrice(successReceipt.total)}
            </div>
          </div>
        </div>
      )}

      {/* Cart Items List */}
      <div
        className={`space-y-2.5 overflow-y-auto pr-1 ${isMobileSheet ? "max-h-[36vh]" : "max-h-64"}`}
      >
        {cart.map((item) => (
          <div
            key={item.productId}
            className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-slate-900 leading-snug">
                {item.name}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFromCart(item.productId)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Quantity Controls with big tap targets for mobile */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => handleUpdateQty(item.productId, -1)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black px-2 min-w-[24px] text-center text-xs">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateQty(item.productId, 1)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Price edit on the fly */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={item.sellingPrice}
                  onChange={(e) =>
                    handlePriceChange(
                      item.productId,
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-right font-bold text-slate-900 outline-none focus:border-rose-500 text-xs sm:text-sm"
                />
                <span className="text-[10px] text-slate-400">so'm</span>
              </div>
            </div>

            <div className="text-right font-black text-slate-800 text-xs">
              Jami: {formatPrice(item.sellingPrice * item.quantity)}
            </div>
          </div>
        ))}

        {cart.length === 0 && (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <Receipt className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs">Savat bo'sh. Mahsulotlarni tanlang.</p>
          </div>
        )}
      </div>

      {/* Totals & Profit Breakdown */}
      {cart.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mahsulotlar soni:</span>
            <span className="font-bold text-slate-800">
              {totalItemsCount} dona
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Foyda:</span>
            <span className="font-bold text-emerald-600">
              +{formatPrice(totalProfit)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm sm:text-base font-black text-slate-900 pt-1">
            <span>Jami summa:</span>
            <span className="text-lg sm:text-xl text-rose-600">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Type Selection */}
      {cart.length > 0 && (
        <div className="space-y-3 pt-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            To'lov turi:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("naqd")}
              className={`py-2 px-1 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition active:scale-95 ${
                paymentType === "naqd"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Naqd</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("karta")}
              className={`py-2 px-1 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition active:scale-95 ${
                paymentType === "karta"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Karta</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("nasiya")}
              className={`py-2 px-1 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition active:scale-95 ${
                paymentType === "nasiya"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Nasiya</span>
            </button>
          </div>

          {/* Nasiya (Debt) customer fields */}
          {paymentType === "nasiya" && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Nasiya daftari:</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Xaridor ismi *
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Bekzod"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Telefon raqami *
                </label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123 45 67"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Hozir to'lagani (so'm)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={debtPaidNow}
                    onChange={(e) => setDebtPaidNow(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Muddat
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-6 pr-2 py-1.5 text-[11px] outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Izoh (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Kelishuv tafsilotlari..."
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            type="button"
            disabled={processing || cart.length === 0}
            onClick={handleFinishSale}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-rose-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {processing ? (
              <span>Kassadan o'tkazilmoqda...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Savdoni yakunlash ({formatPrice(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative pb-16 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / MAIN: Products Selection */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          {/* Search & Category Tabs */}
          <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Mahsulot nomi yoki shtrix-kod..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === c
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid - Mobile 2 columns, Desktop 3 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.quantity <= 0;
              const inCart = cart.find((it) => it.productId === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && handleAddToCart(p)}
                  className={`relative bg-white rounded-2xl border p-2.5 sm:p-3 flex flex-col justify-between transition cursor-pointer select-none shadow-xs active:scale-98 ${
                    isOutOfStock
                      ? "opacity-50 border-slate-200 cursor-not-allowed"
                      : inCart
                        ? "border-rose-500 ring-2 ring-rose-500/10 hover:shadow-md"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-2">
                    <img
                      src={p.images?.[0] || "/favicon.svg"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute bottom-1 left-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        p.quantity <= p.minStockAlert
                          ? "bg-rose-600 text-white"
                          : "bg-slate-900/80 text-white"
                      }`}
                    >
                      {p.quantity} {p.unit}
                    </span>

                    {inCart && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                        {inCart.quantity}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {p.name}
                    </h4>
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm font-black text-rose-600">
                        {formatPrice(p.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      isOutOfStock
                        ? "bg-slate-100 text-slate-400"
                        : "bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-800 active:bg-rose-600"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? "Qolmagan" : "Savatga"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Cart on Desktop (Hidden on mobile, shown in drawer) */}
        <div className="hidden lg:block lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-base text-slate-900">
                Joriy Savat / Chek
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>
            )}
          </div>

          {renderCartContent(false)}
        </div>
      </div>

      {/* MOBILE FLOATING CART BAR (Shown when cart has items on mobile) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-14 inset-x-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 flex items-center justify-between active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-rose-500 text-white">
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsCount}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400 font-medium">
                  Savat ({totalItemsCount} ta tovar)
                </div>
                <div className="text-sm font-black text-white leading-tight">
                  {formatPrice(totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-slate-800 px-3 py-1.5 rounded-xl">
              <span>Sotish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE FULL-SCREEN CART DRAWER / BOTTOM SHEET */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 overflow-hidden max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-5">
            {/* Sheet Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm">
                  Savat va To'lov ({totalItemsCount} ta)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-xs text-slate-400 hover:text-rose-400"
                  >
                    Tozalash
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sheet Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {renderCartContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
