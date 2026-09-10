import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
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
import {
  createSecondaryAuthUser,
  getFirebaseAuth,
  getFirestoreDB,
  isFirebaseConfigured,
} from "./firebase";
import type {
  StaffUser,
  InventoryProduct,
  Sale,
  DebtRecord,
  PaynetConfig,
  PaynetTransaction,
} from "../types";
import { formatPrice, roundMoney } from "../utils/formatters";

const KEYS = {
  CURRENT_USER: "market_erp_current_user",
};

export function phoneToVirtualEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized =
    digits.startsWith("998") && digits.length === 12 ? digits.slice(3) : digits;
  if (!/^\d{9}$/.test(normalized)) {
    throw new Error("Telefon raqami aynan 9 raqamdan iborat bo'lishi kerak.");
  }
  return `${normalized}@marketcom.local`;
}

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

export async function signInStaff(
  phone: string,
  password: string,
): Promise<StaffUser> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(
    auth,
    phoneToVirtualEmail(phone),
    password,
  );
  const profile = await getDoc(
    doc(getFirestoreDBOrThrow(), "staff", credential.user.uid),
  );
  if (!profile.exists()) {
    await signOut(auth);
    throw new Error("Bu hisob uchun staff profili topilmadi.");
  }

  const staff = profile.data() as StaffUser;
  if (!staff.isActive) {
    await signOut(auth);
    throw new Error("Bu xodim hisobi bloklangan.");
  }

  const authenticatedStaff = { ...staff, id: credential.user.uid };
  setCurrentUser(authenticatedStaff);
  return authenticatedStaff;
}

export async function getAuthenticatedStaff(): Promise<StaffUser | null> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return null;

  const profile = await getDoc(
    doc(getFirestoreDBOrThrow(), "staff", auth.currentUser.uid),
  );
  if (!profile.exists()) {
    await signOut(auth);
    throw new Error("Bu hisob uchun staff profili topilmadi.");
  }

  const staff = { ...(profile.data() as StaffUser), id: auth.currentUser.uid };
  if (!staff.isActive) {
    await signOut(auth);
    throw new Error("Bu xodim hisobi bloklangan.");
  }
  setCurrentUser(staff);
  return staff;
}

export async function signOutStaff(): Promise<void> {
  await signOut(getFirebaseAuth());
  setCurrentUser(null);
}

export async function changeStaffPassword(
  phone: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Faol Firebase sessiyasi topilmadi.");
  if (newPassword.length < 6)
    throw new Error("Yangi parol kamida 6 belgidan iborat bo'lishi kerak.");

  const credential = EmailAuthProvider.credential(
    phoneToVirtualEmail(phone),
    currentPassword,
  );
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

function getFirestoreDBOrThrow() {
  const db = getFirestoreDB();
  if (!db) throw new Error("Firestore ulanishi mavjud emas.");
  return db;
}

export async function fetchStaffList(): Promise<StaffUser[]> {
  const snap = await getDocs(collection(requireFirestore(), "staff"));
  return snap.docs.map((d) => d.data() as StaffUser);
}

export async function saveStaffUser(user: StaffUser): Promise<void> {
  await setDoc(doc(requireFirestore(), "staff", user.id), user);
}

export async function provisionStaffUser(
  profile: Omit<StaffUser, "id" | "createdAt">,
  password: string,
): Promise<StaffUser> {
  const email = phoneToVirtualEmail(profile.phone);
  if (password.length < 6) {
    throw new Error("Parol kamida 6 belgidan iborat bo'lishi kerak.");
  }

  const uid = await createSecondaryAuthUser(email, password);
  const staff: StaffUser = {
    ...profile,
    id: uid,
    createdAt: Date.now(),
  };

  try {
    await setDoc(doc(requireFirestore(), "staff", uid), staff);
  } catch (error) {
    throw new Error(
      `Firebase Auth hisob yaratildi, lekin staff profili saqlanmadi. UID: ${uid}. ${
        error instanceof Error ? error.message : "Firestore xatosi"
      }`,
    );
  }

  return staff;
}

export async function deleteStaffUser(id: string): Promise<void> {
  await deleteDoc(doc(requireFirestore(), "staff", id));
}

const defaultPaynetConfig: PaynetConfig = {
  balance: 0,
  balanceAlertLimit: 0,
  priceOffLimit: 0,
  serviceFeePercentage: 0,
  categories: ["Mobil Aloqa", "Kartani to'ldirish", "Davlat Xizmatlari"],
};

export async function fetchPaynetConfig(): Promise<PaynetConfig> {
  const snapshot = await getDoc(
    doc(requireFirestore(), "settings", "paynet_config"),
  );
  if (!snapshot.exists()) return defaultPaynetConfig;
  const data = snapshot.data();
  return {
    balance: roundMoney(Number(data.balance) || 0),
    balanceAlertLimit: roundMoney(Number(data.balanceAlertLimit) || 0),
    priceOffLimit: roundMoney(Number(data.priceOffLimit) || 0),
    serviceFeePercentage: roundMoney(Number(data.serviceFeePercentage) || 0),
    categories: Array.isArray(data.categories)
      ? data.categories.filter(
          (item): item is string => typeof item === "string",
        )
      : defaultPaynetConfig.categories,
  };
}

export async function savePaynetConfig(config: PaynetConfig): Promise<void> {
  await setDoc(doc(requireFirestore(), "settings", "paynet_config"), {
    balance: roundMoney(config.balance),
    balanceAlertLimit: roundMoney(config.balanceAlertLimit),
    priceOffLimit: roundMoney(config.priceOffLimit),
    serviceFeePercentage: roundMoney(config.serviceFeePercentage),
    categories: config.categories.filter(Boolean),
  });
}

export async function saveNotificationToken(
  userId: string,
  token: string,
): Promise<void> {
  await setDoc(
    doc(requireFirestore(), "notificationTokens", encodeURIComponent(token)),
    {
      userId,
      token,
      platform: "web",
      updatedAt: Date.now(),
    },
  );
}

export async function fetchPaynetTransactions(): Promise<PaynetTransaction[]> {
  const snapshot = await getDocs(
    query(
      collection(requireFirestore(), "paynetTransactions"),
      orderBy("createdAt", "desc"),
    ),
  );
  return snapshot.docs.map((item) => item.data() as PaynetTransaction);
}

export interface NewPaynetTransactionPayload {
  category: string;
  target: string;
  amount: number;
  staffId: string;
  staffName: string;
  paymentType: "naqd" | "nasiya";
  customerName?: string;
  customerPhone?: string;
  debtDueDate?: number;
  debtNotes?: string;
  debtPaidNow?: number;
  serviceFeePercentage?: number;
}

export async function recordPaynetTransaction(
  payload: NewPaynetTransactionPayload,
  config: PaynetConfig,
): Promise<PaynetTransaction> {
  const db = requireFirestore();
  const now = Date.now();
  const amount = roundMoney(payload.amount);
  const requestedFee = payload.serviceFeePercentage;
  if (requestedFee !== undefined) {
    if (amount <= config.priceOffLimit) {
      throw new Error(
        `Chegirmali xizmat haqi faqat ${formatPrice(config.priceOffLimit)} dan yuqori summalarda ishlaydi.`,
      );
    }
    if (requestedFee < 0 || requestedFee >= config.serviceFeePercentage) {
      throw new Error(
        "Chegirmali xizmat haqi asosiy foizdan past bo'lishi kerak.",
      );
    }
  }
  const serviceFeePercentage = roundMoney(
    requestedFee ?? config.serviceFeePercentage,
  );
  const fee = roundMoney((amount * serviceFeePercentage) / 100);
  const totalAmount = roundMoney(amount + fee);
  const balanceAfter = roundMoney(config.balance - amount);
  const transaction: PaynetTransaction = {
    id: `paynet-${now}`,
    category: payload.category,
    target: payload.target,
    amount,
    fee,
    serviceFeePercentage,
    totalAmount,
    balanceAfter,
    staffId: payload.staffId,
    staffName: payload.staffName,
    createdAt: now,
    paymentType: payload.paymentType,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "paynetTransactions", transaction.id), transaction);
  batch.set(doc(db, "settings", "paynet_config"), {
    ...config,
    priceOffLimit: roundMoney(config.priceOffLimit),
    balance: balanceAfter,
  });
  if (payload.paymentType === "nasiya") {
    if (!payload.customerName?.trim())
      throw new Error("Nasiya uchun mijoz ismini kiriting.");
    const paidNow = roundMoney(payload.debtPaidNow || 0);
    if (paidNow < 0 || paidNow > totalAmount) {
      throw new Error("Boshlang'ich to'lov jami summadan oshmasligi kerak.");
    }
    const remainingAmount = roundMoney(totalAmount - paidNow);
    const debt: DebtRecord = {
      id: `debt-paynet-${now}`,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone?.trim() || "",
      totalAmount,
      paidAmount: paidNow,
      remainingAmount,
      status: remainingAmount === 0 ? "yopildi" : "kutilmoqda",
      staffId: payload.staffId,
      staffName: payload.staffName,
      createdAt: now,
      notes: payload.debtNotes?.trim() || "",
      paymentHistory:
        paidNow > 0
          ? [
              {
                id: `pay-${now}`,
                amount: paidNow,
                date: now,
                staffName: payload.staffName,
              },
            ]
          : [],
      origin: "paynet",
    };
    if (payload.debtDueDate) debt.dueDate = payload.debtDueDate;
    batch.set(doc(db, "debts", debt.id), debt);
  }
  await batch.commit();
  return transaction;
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
  const totalAmount = roundMoney(
    payload.items.reduce((acc, it) => acc + it.sellingPrice * it.quantity, 0),
  );
  const totalCost = roundMoney(
    payload.items.reduce((acc, it) => acc + it.costPrice * it.quantity, 0),
  );
  const totalProfit = roundMoney(totalAmount - totalCost);

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
  };

  if (payload.customerName) sale.customerName = payload.customerName;
  if (payload.customerPhone) sale.customerPhone = payload.customerPhone;

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
    const paidNow = roundMoney(payload.debtPaidNow || 0);
    const remaining = roundMoney(Math.max(0, totalAmount - paidNow));
    debt = {
      id: "debt-" + now,
      saleId: sale.id,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone || "",
      totalAmount,
      paidAmount: paidNow,
      remainingAmount: remaining,
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
    if (payload.debtDueDate) debt.dueDate = payload.debtDueDate;
    if (payload.debtNotes) debt.notes = payload.debtNotes;
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
  const newPaid = roundMoney(updatedDebt.paidAmount + amount);
  const newRemaining = roundMoney(
    Math.max(0, updatedDebt.totalAmount - newPaid),
  );

  updatedDebt.paidAmount = newPaid;
  updatedDebt.remainingAmount = newRemaining;
  updatedDebt.status = newRemaining === 0 ? "yopildi" : "kutilmoqda";
  updatedDebt.paymentHistory = [
    ...(updatedDebt.paymentHistory || []),
    {
      id: "pay-" + Date.now(),
      amount: roundMoney(amount),
      date: Date.now(),
      staffName,
    },
  ];

  await setDoc(doc(db, "debts", debtId), updatedDebt);
}
