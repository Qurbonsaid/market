import React, { useState } from "react";
import {
  PackagePlus,
  ArrowDownToLine,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Loader2,
  Tag,
  TrendingUp,
  Layers,
  Coins,
  ScanLine,
} from "lucide-react";
import type { InventoryProduct, ProductUnit } from "../types";
import { formatPrice } from "../utils/formatters";
import { ImageUploader } from "./ImageUploader";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

interface WarehouseViewProps {
  inventory: InventoryProduct[];
  isAdmin: boolean;
  onSaveProduct: (product: InventoryProduct) => Promise<void>;
  onRestock: (
    productId: string,
    addedQty: number,
    newCostPrice?: number,
  ) => Promise<void>;
  onUpdatePrice: (productId: string, newSellingPrice: number) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  inventory,
  isAdmin,
  onSaveProduct,
  onRestock,
  onUpdatePrice,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Barchasi");
  const [scannerTarget, setScannerTarget] = useState<
    "search" | "barcode" | null
  >(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryProduct | null>(null);
  const [editPriceItem, setEditPriceItem] = useState<InventoryProduct | null>(
    null,
  );
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(
    null,
  );

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    barcode: string;
    category: string;
    costPrice: string;
    sellingPrice: string;
    quantity: string;
    minStockAlert: string;
    unit: ProductUnit;
    images: string[];
  }>({
    name: "",
    barcode: "",
    category: "Aksessuarlar",
    costPrice: "",
    sellingPrice: "",
    quantity: "",
    minStockAlert: "5",
    unit: "dona",
    images: [],
  });

  // Restock form states
  const [addedQty, setAddedQty] = useState("1");
  const [newCost, setNewCost] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Edit price form state
  const [newSellingPrice, setNewSellingPrice] = useState("");

  // Categories set
  const categories = [
    "Barchasi",
    ...Array.from(new Set(inventory.map((p) => p.category))),
  ];

  // Filtered inventory
  const filtered = inventory.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchCat =
      categoryFilter === "Barchasi" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Summary statistics
  const totalCostValue = inventory.reduce(
    (acc, p) => acc + p.costPrice * p.quantity,
    0,
  );
  const totalSellingValue = inventory.reduce(
    (acc, p) => acc + p.sellingPrice * p.quantity,
    0,
  );
  const totalProfitValue = totalSellingValue - totalCostValue;
  const lowStockCount = inventory.filter(
    (p) => p.quantity <= p.minStockAlert,
  ).length;

  const handleOpenAdd = (productToEdit?: InventoryProduct) => {
    if (productToEdit) {
      setEditingProduct(productToEdit);
      setFormData({
        name: productToEdit.name,
        barcode: productToEdit.barcode || "",
        category: productToEdit.category,
        costPrice: productToEdit.costPrice.toString(),
        sellingPrice: productToEdit.sellingPrice.toString(),
        quantity: productToEdit.quantity.toString(),
        minStockAlert: productToEdit.minStockAlert.toString(),
        unit: productToEdit.unit,
        images: productToEdit.images || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        barcode: "",
        category: "Aksessuarlar",
        costPrice: "",
        sellingPrice: "",
        quantity: "",
        minStockAlert: "5",
        unit: "dona",
        images: [],
      });
    }
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const p: InventoryProduct = {
        id: editingProduct ? editingProduct.id : "inv-" + Date.now(),
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || undefined,
        category: formData.category,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        quantity: parseFloat(formData.quantity) || 0,
        minStockAlert: parseFloat(formData.minStockAlert) || 5,
        unit: formData.unit,
        images: formData.images,
        updatedAt: Date.now(),
      };
      await onSaveProduct(p);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    setLoadingAction(true);
    try {
      await onRestock(
        restockItem.id,
        parseFloat(addedQty) || 0,
        newCost ? parseFloat(newCost) : undefined,
      );
      setRestockItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExecutePriceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPriceItem) return;
    setLoadingAction(true);
    try {
      await onUpdatePrice(editPriceItem.id, parseFloat(newSellingPrice) || 0);
      setEditPriceItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Metrics Cards */}
      <div
        className={`${isAdmin ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"} grid gap-2.5 sm:gap-4`}
      >
        {isAdmin && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-semibold">
                Ombor tannarxi
              </span>
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="text-sm sm:text-xl font-black text-slate-900 leading-tight">
              {formatPrice(totalCostValue)}
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Jami xarid qiymati
            </p>
          </div>
        )}

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">
              Sotuv qiymati
            </span>
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          </div>
          <div className="text-sm sm:text-xl font-black text-slate-900 leading-tight">
            {formatPrice(totalSellingValue)}
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Sotilgandagi summa
          </p>
        </div>

        {isAdmin && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-semibold">
                Kutilayotgan foyda
              </span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <div className="text-sm sm:text-xl font-black text-emerald-600 leading-tight">
              +{formatPrice(totalProfitValue)}
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Sof marja
            </p>
          </div>
        )}

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold">
              Kam qolgan
            </span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
          </div>
          <div className="text-sm sm:text-xl font-black text-rose-600 leading-tight">
            {lowStockCount} ta tovar
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Qoldiq oz qoldi
          </p>
        </div>
      </div>

      {/* Actions & Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tovar nomi yoki shtrix-kod..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-11 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setScannerTarget("search")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
              title="Shtrix-kodni skanerlash"
            >
              <ScanLine className="h-4 w-4" />
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-2.5 py-2 text-xs sm:text-sm text-slate-700 outline-none focus:border-rose-500 shadow-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="flex items-center justify-center gap-2 bg-linear-to-r from-rose-500 to-orange-500 hover:from-rose-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Yangi tovar qo'shish</span>
          </button>
        )}
      </div>

      {/* 1. MOBILE CARDS VIEW (md:hidden - Optimized for Phones) */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((item) => {
          const isLowStock = item.quantity <= item.minStockAlert;
          const profitPerItem = item.sellingPrice - item.costPrice;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2.5"
            >
              {/* Product header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={item.images?.[0] || "/favicon.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {item.name}
                    </h4>
                    <span
                      className={`shrink-0 font-black text-xs px-2 py-0.5 rounded-lg ${
                        isLowStock
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                      {item.category}
                    </span>
                    {item.barcode && <span>• {item.barcode}</span>}
                  </div>
                </div>
              </div>

              {/* Price & Profit Row */}
              <div
                className={`${isAdmin ? "grid-cols-3" : "grid-cols-1"} grid gap-2 bg-slate-50 p-2 rounded-xl text-center text-xs`}
              >
                {isAdmin && (
                  <div>
                    <div className="text-[10px] text-slate-400">Tannarxi:</div>
                    <div className="font-semibold text-slate-700">
                      {formatPrice(item.costPrice)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-slate-400">Sotish:</div>
                  <div className="font-black text-rose-600">
                    {formatPrice(item.sellingPrice)}
                  </div>
                </div>
                {isAdmin && (
                  <div>
                    <div className="text-[10px] text-slate-400">Foyda:</div>
                    <div className="font-bold text-emerald-600">
                      +{formatPrice(profitPerItem)}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons (Touch-friendly) */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRestockItem(item);
                      setAddedQty("5");
                      setNewCost(item.costPrice.toString());
                    }}
                    className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Kirim qilish</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditPriceItem(item);
                        setNewSellingPrice(item.sellingPrice.toString());
                      }}
                      className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-2.5 py-1.5 rounded-xl text-xs active:scale-95"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Narx</span>
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `"${item.name}" tovarini o'chirishni tasdiqlaysizmi?`,
                          )
                        ) {
                          onDeleteProduct(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Hech qanday tovar topilmadi.
          </div>
        )}
      </div>

      {/* 2. DESKTOP TABLE VIEW (Hidden on mobile, shown on md+) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Tovar</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4">Qoldiq</th>
                {isAdmin && <th className="py-3 px-4">Tannarxi</th>}
                <th className="py-3 px-4">Sotish narxi</th>
                {isAdmin && <th className="py-3 px-4">Foyda</th>}
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
              {filtered.map((item) => {
                const isLowStock = item.quantity <= item.minStockAlert;
                const profitPerItem = item.sellingPrice - item.costPrice;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          <img
                            src={item.images?.[0] || "/favicon.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {item.name}
                          </div>
                          {item.barcode && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.barcode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-black text-sm ${
                            isLowStock ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        {isLowStock && (
                          <span
                            className="p-1 rounded-md bg-rose-50 text-rose-600"
                            title="Kam qoldi!"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {formatPrice(item.costPrice)}
                      </td>
                    )}

                    <td className="py-3 px-4 font-black text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{formatPrice(item.sellingPrice)}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditPriceItem(item);
                              setNewSellingPrice(item.sellingPrice.toString());
                            }}
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            title="Narxni o'zgartirish"
                          >
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        )}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        +{formatPrice(profitPerItem)}
                      </td>
                    )}

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRestockItem(item);
                            setAddedQty("5");
                            setNewCost(item.costPrice.toString());
                          }}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                          title="Tovarga kirim qilish"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Kirim</span>
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenAdd(item)}
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `"${item.name}" tovarini o'chirishni tasdiqlaysizmi?`,
                                  )
                                ) {
                                  onDeleteProduct(item.id);
                                }
                              }}
                              className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Modal: Add / Edit Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm sm:text-base">
                {editingProduct ? "Tovarni tahrirlash" : "Yangi tovar qo'shish"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
            >
              <ImageUploader
                images={formData.images}
                onChange={(imgs) =>
                  setFormData((prev) => ({ ...prev, images: imgs }))
                }
                maxImages={3}
              />

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tovar nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: iPhone 15 Pro"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Shtrix-kod / Artikul
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ixtiyoriy"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl pl-3 pr-11 py-2 text-xs sm:text-sm outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerTarget("barcode")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      title="Shtrix-kodni skanerlash"
                    >
                      <ScanLine className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Kategoriya
                  </label>
                  <input
                    type="text"
                    placeholder="Aksessuarlar, Smartfonlar..."
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tannarxi / Kirim narxi (so'm) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="9500000"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Sotish narxi (so'm) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="11200000"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Qoldiq soni *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Birligi
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: e.target.value as ProductUnit,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
                  >
                    <option value="dona">dona</option>
                    <option value="kg">kg</option>
                    <option value="metr">metr</option>
                    <option value="quti">quti</option>
                    <option value="litr">litr</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockAlert: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex items-center gap-2 bg-linear-to-r from-rose-500 to-orange-500 hover:from-rose-600 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {loadingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Omborga kirim qilish</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleExecuteRestock}
              className="p-4 sm:p-5 space-y-4"
            >
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-xs font-bold text-slate-900">
                  {restockItem.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Hozirgi qoldiq:{" "}
                  <span className="font-bold text-slate-800">
                    {restockItem.quantity} {restockItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qo'shilayotgan miqdor ({restockItem.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={addedQty}
                  onChange={(e) => setAddedQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm outline-none font-bold"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yangi tannarx (so'm, ixtiyoriy)
                  </label>
                  <input
                    type="number"
                    placeholder={restockItem.costPrice.toString()}
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loadingAction && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Price Change */}
      {editPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Sotish narxini yangilash</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditPriceItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleExecutePriceChange}
              className="p-4 sm:p-5 space-y-4"
            >
              <div className="text-xs font-bold text-slate-800">
                {editPriceItem.name}
              </div>
              <div className="text-[11px] text-slate-500">
                Tannarxi:{" "}
                <span className="font-bold">
                  {formatPrice(editPriceItem.costPrice)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yangi sotish narxi (so'm) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-sm outline-none font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditPriceItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {loadingAction ? "Saqlanmoqda..." : "Narxni saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scannerTarget && (
        <BarcodeScannerModal
          onClose={() => setScannerTarget(null)}
          onResult={(value) => {
            if (scannerTarget === "search") setSearch(value);
            else setFormData((previous) => ({ ...previous, barcode: value }));
            setScannerTarget(null);
          }}
        />
      )}
    </div>
  );
};
