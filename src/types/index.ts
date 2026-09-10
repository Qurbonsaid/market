export type UserRole = "admin" | "staff";

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: number;
}

export type ProductUnit = "dona" | "kg" | "metr" | "quti" | "litr";

export interface InventoryProduct {
  id: string;
  name: string;
  barcode?: string;
  category: string;
  costPrice: number; // Tannarxi / Kirim narxi (so'm)
  sellingPrice: number; // Sotish narxi (so'm)
  quantity: number; // Ombordagi qoldiq soni
  minStockAlert: number; // Kam qolganda ogohlantirish (masalan <= 5)
  unit: ProductUnit;
  images: string[]; // ImgCDN orqali yuklangan rasmlar
  updatedAt: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  unit: ProductUnit;
}

export type PaymentType = "naqd" | "karta" | "nasiya";

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number; // Jami sotuv summasi
  totalCost: number; // Jami tannarx
  totalProfit: number; // Sof foyda
  paymentType: PaymentType;
  staffId: string;
  staffName: string;
  createdAt: number;
  customerName?: string;
  customerPhone?: string;
}

export type DebtStatus = "kutilmoqda" | "yopildi";

export interface DebtPaymentHistory {
  id: string;
  amount: number;
  date: number;
  staffName: string;
}

export interface DebtRecord {
  id: string;
  saleId?: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: number; // Qaytarish va'da qilingan sana (timestamp)
  status: DebtStatus;
  staffId: string;
  staffName: string;
  createdAt: number;
  notes?: string;
  paymentHistory: DebtPaymentHistory[];
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
