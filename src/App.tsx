import { useState, useEffect, useCallback } from "react";
import { Header, type ActiveNavTab } from "./components/Header";
import { AuthScreen } from "./components/AuthScreen";
import { SalesPOSView } from "./components/SalesPOSView";
import { WarehouseView } from "./components/WarehouseView";
import { DebtsView } from "./components/DebtsView";
import { DashboardView } from "./components/DashboardView";
import { StaffManagementModal } from "./components/StaffManagementModal";
import { TerminalLockOverlay } from "./components/TerminalLockOverlay";
import { ProfileView } from "./components/ProfileView";
import PWABadge from "./PWABadge";
import {
  fetchStaffList,
  setCurrentUser as persistCurrentUser,
  getAuthenticatedStaff,
  signOutStaff,
  fetchInventory,
  fetchSales,
  fetchDebts,
  saveInventoryProduct,
  restockProduct,
  updateProductPrice,
  deleteInventoryProduct,
  recordSale,
  payDebt,
  saveStaffUser,
  provisionStaffUser,
  deleteStaffUser,
  type NewSalePayload,
} from "./services/firestoreService";
import { getFirebaseAuth } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  isTerminalLocked,
  setTerminalLocked,
} from "./services/terminalPinService";
import type {
  StaffUser,
  InventoryProduct,
  Sale,
  DebtRecord,
  BeforeInstallPromptEvent,
} from "./types";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUserState] = useState<StaffUser | null>(null);

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveNavTab>("pos");

  // Modals
  const [isTerminalLockedState, setIsTerminalLockedState] = useState(false);

  // PWA Install Prompt
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  // Load all core data
  const loadData = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      const [staffData, invData, salesData, debtsData] = await Promise.all([
        fetchStaffList(),
        fetchInventory(),
        fetchSales(),
        fetchDebts(),
      ]);
      setStaffList(staffData);
      setInventory(invData);
      setSales(salesData);
      setDebts(debtsData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ma'lumotlarni yuklashda xatolik yuz berdi.";
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
      setDataError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
        if (!firebaseUser) {
          setCurrentUserState(null);
          setLoading(false);
          return;
        }
        try {
          const staff = await getAuthenticatedStaff();
          if (staff) {
            setCurrentUserState(staff);
            setIsTerminalLockedState(isTerminalLocked());
            await loadData();
          }
        } catch (err) {
          setDataError(
            err instanceof Error
              ? err.message
              : "Sessiyani tekshirib bo'lmadi.",
          );
          setLoading(false);
        }
      });
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Firebase sozlanmagan.",
      );
      setLoading(false);
    }
  }, [loadData]);

  // Login handler
  const handleLogin = async (user: StaffUser) => {
    setCurrentUserState(user);
    persistCurrentUser(user);
    await loadData();
    showToast(`Xush kelibsiz, ${user.name}!`);
  };

  // Logout handler
  const handleLogout = async () => {
    if (confirm("Tizimdan chiqishni tasdiqlaysizmi?")) {
      await signOutStaff();
      setTerminalLocked(false);
      setIsTerminalLockedState(false);
      setCurrentUserState(null);
      persistCurrentUser(null);
      showToast("Tizimdan chiqildi");
    }
  };

  // Warehouse Actions
  const handleSaveProduct = async (product: InventoryProduct) => {
    await saveInventoryProduct(product);
    const updated = await fetchInventory();
    setInventory(updated);
    showToast("Mahsulot muvaffaqiyatli saqlandi!");
  };

  const handleRestock = async (
    productId: string,
    addedQty: number,
    newCostPrice?: number,
  ) => {
    await restockProduct(productId, addedQty, newCostPrice);
    const updated = await fetchInventory();
    setInventory(updated);
    showToast("Omborga kirim qilindi!");
  };

  const handleUpdatePrice = async (
    productId: string,
    newSellingPrice: number,
  ) => {
    await updateProductPrice(productId, newSellingPrice);
    const updated = await fetchInventory();
    setInventory(updated);
    showToast("Mahsulot narxi yangilandi!");
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteInventoryProduct(productId);
    const updated = await fetchInventory();
    setInventory(updated);
    showToast("Mahsulot ombordan o'chirildi");
  };

  // Sales Action
  const handleCompleteSale = async (payload: NewSalePayload) => {
    await recordSale(payload);
    const [invUpdated, salesUpdated, debtsUpdated] = await Promise.all([
      fetchInventory(),
      fetchSales(),
      fetchDebts(),
    ]);
    setInventory(invUpdated);
    setSales(salesUpdated);
    setDebts(debtsUpdated);
    showToast("Savdo muvaffaqiyatli yakunlandi!");
  };

  // Debt Action
  const handlePayDebt = async (
    debtId: string,
    amount: number,
    staffName: string,
  ) => {
    await payDebt(debtId, amount, staffName);
    const debtsUpdated = await fetchDebts();
    setDebts(debtsUpdated);
    showToast("Nasiya to'lovi qabul qilindi!");
  };

  // Staff Management Actions
  const handleSaveStaff = async (user: StaffUser) => {
    await saveStaffUser(user);
    const staffUpdated = await fetchStaffList();
    setStaffList(staffUpdated);
    showToast("Xodim ma'lumotlari saqlandi!");
  };

  const handleCreateStaff = async (
    profile: Omit<StaffUser, "id" | "createdAt">,
    password: string,
  ) => {
    await provisionStaffUser(profile, password);
    const staffUpdated = await fetchStaffList();
    setStaffList(staffUpdated);
    showToast("Xodim Auth va Firestore'da yaratildi!");
  };

  const handleDeleteStaff = async (id: string) => {
    await deleteStaffUser(id);
    const staffUpdated = await fetchStaffList();
    setStaffList(staffUpdated);
    showToast("Xodim tizimdan o'chirildi");
  };

  const handleLock = () => {
    setTerminalLocked(true);
    setIsTerminalLockedState(true);
  };

  const handleUnlock = () => {
    setTerminalLocked(false);
    setIsTerminalLockedState(false);
  };

  // Badges calculation
  const lowStockCount = inventory.filter(
    (p) => p.quantity <= p.minStockAlert,
  ).length;
  const unpaidDebtCount = debts.filter((d) => d.status === "kutilmoqda").length;

  // If initial loading
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-xs text-slate-400 font-medium">
          Market ERP tizimi yuklanmoqda...
        </p>
      </div>
    );
  }

  // If not logged in, render Auth Screen
  if (!currentUser) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} dataError={dataError} />
        <PWABadge />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* App Header with ERP navigation */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenStaffModal={() => setActiveTab("staff")}
        onOpenProfile={() => setActiveTab("profile")}
        onLock={handleLock}
        installPrompt={installPrompt}
        onInstallApp={handleInstallApp}
        lowStockCount={lowStockCount}
        unpaidDebtCount={unpaidDebtCount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-24 md:pb-8 flex-1 w-full">
        {activeTab === "profile" && (
          <ProfileView
            currentUser={currentUser}
            onBack={() => setActiveTab("pos")}
            onLogout={handleLogout}
            onLock={handleLock}
          />
        )}
        {activeTab === "staff" && currentUser.role === "admin" && (
          <StaffManagementModal
            staffList={staffList}
            onClose={() => setActiveTab("pos")}
            onSaveStaff={handleSaveStaff}
            onCreateStaff={handleCreateStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        )}
        {activeTab === "pos" && (
          <SalesPOSView
            inventory={inventory}
            currentUser={currentUser}
            onCompleteSale={handleCompleteSale}
          />
        )}

        {activeTab === "warehouse" && (
          <WarehouseView
            inventory={inventory}
            onSaveProduct={handleSaveProduct}
            onRestock={handleRestock}
            onUpdatePrice={handleUpdatePrice}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === "debts" && (
          <DebtsView
            debts={debts}
            currentUser={currentUser}
            onPayDebt={handlePayDebt}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardView
            currentUser={currentUser}
            sales={sales}
            staffList={staffList}
            inventory={inventory}
            debts={debts}
          />
        )}
      </main>

      {isTerminalLockedState && (
        <TerminalLockOverlay
          user={currentUser}
          onUnlock={handleUnlock}
          onSignOut={handleLogout}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 sm:top-20 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PWA Updates Badge */}
      <PWABadge />
    </div>
  );
}
