import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDB, isFirebaseConfigured } from "./firebase";
import type { StaffUser, InventoryProduct, Sale, DebtRecord } from "../types";

const KEYS = {
  CURRENT_USER: "market_erp_current_user",
};

function requireFirestore() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase sozlanmagan. Tizimdan foydalanish uchun Firebase sozlamalarini kiriting.",
    );
  }

  const db = getFirestoreDB();
  if (!db) {
    throw new Error(
      "Firestore ulanishi mavjud emas. Firebase sozlamalarini tekshiring.",
    );
  }

  return db;
}

// ----------------------------------------------------------------------
// 1. AUTH & STAFF OPERATIONS
// ----------------------------------------------------------------------

export function getCurrentUser(): StaffUser | null {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: StaffUser | null): void {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
}

export async function fetchStaffList(): Promise<StaffUser[]> {
  const snap = await getDocs(collection(requireFirestore(), "staff"));
  return snap.docs.map((d) => d.data() as StaffUser);
}

export async function saveStaffUser(user: StaffUser): Promise<void> {
  await setDoc(doc(requireFirestore(), "staff", user.id), user);
}

export async function deleteStaffUser(id: string): Promise<void> {
  await deleteDoc(doc(requireFirestore(), "staff", id));
}

export async function loginWithPin(pin: string): Promise<StaffUser | null> {
  const staff = await fetchStaffList();
  const found = staff.find((u) => u.pin === pin.trim() && u.isActive);
  if (found) {
    setCurrentUser(found);
    return found;
  }
  return null;
}

// ----------------------------------------------------------------------
// 2. WAREHOUSE / INVENTORY OPERATIONS
// ----------------------------------------------------------------------

export async function fetchInventory(): Promise<InventoryProduct[]> {
  const snap = await getDocs(collection(requireFirestore(), "inventory"));
  return snap.docs.map((d) => d.data() as InventoryProduct);
}

export async function saveInventoryProduct(
  product: InventoryProduct,
): Promise<void> {
  await setDoc(doc(requireFirestore(), "inventory", product.id), product);
}

export async function restockProduct(
  productId: string,
  addedQuantity: number,
  newCostPrice?: number,
): Promise<void> {
  const db = requireFirestore();
  const productRef = doc(db, "inventory", productId);
  const snapshot = await getDoc(productRef);
  const product = snapshot.exists()
    ? (snapshot.data() as InventoryProduct)
    : undefined;
  if (!product) return;

  const updatedProduct = {
    ...product,
    quantity: Math.max(0, product.quantity + addedQuantity),
    costPrice:
      newCostPrice && newCostPrice > 0 ? newCostPrice : product.costPrice,
    updatedAt: Date.now(),
  };
  await setDoc(productRef, updatedProduct);
}

export async function updateProductPrice(
  productId: string,
  newSellingPrice: number,
): Promise<void> {
  const db = requireFirestore();
  const productRef = doc(db, "inventory", productId);
  const snapshot = await getDoc(productRef);
  const product = snapshot.exists()
    ? (snapshot.data() as InventoryProduct)
    : undefined;
  if (!product) return;
  await setDoc(doc(db, "inventory", productId), {
    ...product,
    sellingPrice: newSellingPrice,
    updatedAt: Date.now(),
  });
}

export async function deleteInventoryProduct(productId: string): Promise<void> {
  await deleteDoc(doc(requireFirestore(), "inventory", productId));
}

// ----------------------------------------------------------------------
// 3. SALES / POS OPERATIONS
// ----------------------------------------------------------------------

export async function fetchSales(): Promise<Sale[]> {
  const q = query(
    collection(requireFirestore(), "sales"),
    orderBy("createdAt", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Sale);
}

export interface NewSalePayload {
  items: Sale["items"];
  paymentType: Sale["paymentType"];
  staffId: string;
  staffName: string;
  customerName?: string;
  customerPhone?: string;
  debtDueDate?: number;
  debtPaidNow?: number;
  debtNotes?: string;
}

export async function recordSale(payload: NewSalePayload): Promise<Sale> {
  const db = requireFirestore();
  const now = Date.now();
  const totalAmount = payload.items.reduce(
    (acc, it) => acc + it.sellingPrice * it.quantity,
    0,
  );
  const totalCost = payload.items.reduce(
    (acc, it) => acc + it.costPrice * it.quantity,
    0,
  );
  const totalProfit = totalAmount - totalCost;

  const sale: Sale = {
    id: "sale-" + now,
    items: payload.items,
    totalAmount,
    totalCost,
    totalProfit,
    paymentType: payload.paymentType,
    staffId: payload.staffId,
    staffName: payload.staffName,
    createdAt: now,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
  };

  const inventorySnapshot = await getDocs(collection(db, "inventory"));
  const inventory = inventorySnapshot.docs.map(
    (item) => item.data() as InventoryProduct,
  );
  for (const it of payload.items) {
    const pIdx = inventory.findIndex((p) => p.id === it.productId);
    if (pIdx < 0) {
      throw new Error(`Mahsulot topilmadi: ${it.name}`);
    }
    if (inventory[pIdx].quantity < it.quantity) {
      throw new Error(`${it.name} uchun omborda yetarli qoldiq mavjud emas.`);
    }
    inventory[pIdx] = {
      ...inventory[pIdx],
      quantity: inventory[pIdx].quantity - it.quantity,
      updatedAt: now,
    };
  }

  let debt: DebtRecord | null = null;
  if (payload.paymentType === "nasiya" && payload.customerName) {
    const paidNow = payload.debtPaidNow || 0;
    const remaining = Math.max(0, totalAmount - paidNow);
    debt = {
      id: "debt-" + now,
      saleId: sale.id,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone || "",
      totalAmount,
      paidAmount: paidNow,
      remainingAmount: remaining,
      dueDate: payload.debtDueDate,
      status: remaining === 0 ? "yopildi" : "kutilmoqda",
      staffId: payload.staffId,
      staffName: payload.staffName,
      createdAt: now,
      notes: payload.debtNotes || "",
      paymentHistory:
        paidNow > 0
          ? [
              {
                id: "pay-" + now,
                amount: paidNow,
                date: now,
                staffName: payload.staffName,
              },
            ]
          : [],
    };
  }

  const batch = writeBatch(db);
  batch.set(doc(db, "sales", sale.id), sale);
  for (const item of inventory) {
    if (payload.items.some((saleItem) => saleItem.productId === item.id)) {
      batch.set(doc(db, "inventory", item.id), item);
    }
  }
  if (debt) batch.set(doc(db, "debts", debt.id), debt);
  await batch.commit();

  return sale;
}

// ----------------------------------------------------------------------
// 4. DEBTS OPERATIONS
// ----------------------------------------------------------------------

export async function fetchDebts(): Promise<DebtRecord[]> {
  const snap = await getDocs(collection(requireFirestore(), "debts"));
  return snap.docs.map((d) => d.data() as DebtRecord);
}

export async function payDebt(
  debtId: string,
  amount: number,
  staffName: string,
): Promise<void> {
  const db = requireFirestore();
  const debtSnapshot = await getDocs(collection(db, "debts"));
  const debt = debtSnapshot.docs.find((item) => item.id === debtId)?.data() as
    | DebtRecord
    | undefined;
  if (!debt) return;

  const updatedDebt = { ...debt };
  const newPaid = updatedDebt.paidAmount + amount;
  const newRemaining = Math.max(0, updatedDebt.totalAmount - newPaid);

  updatedDebt.paidAmount = newPaid;
  updatedDebt.remainingAmount = newRemaining;
  updatedDebt.status = newRemaining === 0 ? "yopildi" : "kutilmoqda";
  updatedDebt.paymentHistory = [
    ...(updatedDebt.paymentHistory || []),
    {
      id: "pay-" + Date.now(),
      amount,
      date: Date.now(),
      staffName,
    },
  ];

  await setDoc(doc(db, "debts", debtId), updatedDebt);
}
