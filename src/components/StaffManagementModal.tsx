import React, { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Phone,
  Trash2,
  AlertCircle,
  Loader2,
  Edit2,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import type { StaffUser, UserRole } from "../types";

interface StaffManagementModalProps {
  staffList: StaffUser[];
  onClose: () => void;
  onSaveStaff: (user: StaffUser) => Promise<void>;
  onCreateStaff: (
    profile: Omit<StaffUser, "id" | "createdAt">,
    password: string,
  ) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  staffList,
  onClose,
  onSaveStaff,
  onCreateStaff,
  onDeleteStaff,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [role, setRole] = useState<UserRole>("staff");
  const [isActive, setIsActive] = useState(true);
  const [canAccessPaynet, setCanAccessPaynet] = useState(false);
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenEdit = (st: StaffUser) => {
    setIsEditing(true);
    setEditingId(st.id);
    setName(st.name);
    setPhone(st.phone);
    setRole(st.role);
    setIsActive(st.isActive);
    setCanAccessPaynet(st.canAccessPaynet === true);
    setPassword("");
    setError(null);
  };

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setName("");
    setPhone("");
    setRole("staff");
    setIsActive(true);
    setCanAccessPaynet(false);
    setPassword("");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Iltimos, xodim ismini kiriting");
      return;
    }
    setLoading(true);
    try {
      const profile = {
        name: name.trim(),
        phone,
        role,
        isActive,
        canAccessPaynet: role === "admin" || canAccessPaynet,
      };

      if (editingId) {
        await onSaveStaff({ ...profile, id: editingId, createdAt: Date.now() });
      } else {
        await onCreateStaff(profile, password);
      }
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xodimni saqlashda xato";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (st: StaffUser) => {
    if (st.id === "staff-admin") {
      alert("Bosh admin hisobini o'chirib bo'lmaydi!");
      return;
    }
    if (confirm(`"${st.name}" xodimini o'chirishni tasdiqlaysizmi?`)) {
      await onDeleteStaff(st.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white w-full rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base">Xodimlarni Boshqarish</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Ortga
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add or List toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Xodimlar ro'yxati ({staffList.length} ta)
            </span>
            {!isEditing && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Yangi xodim qo'shish</span>
              </button>
            )}
          </div>

          {/* Form (when adding/editing) */}
          {isEditing && (
            <form
              onSubmit={handleSave}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                <span>
                  {editingId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-700 text-[11px]"
                >
                  Bekor qilish
                </button>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ism familiya *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Jasurbek Omonov"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Telefon raqam *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Vaqtinchalik parol *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kamida 6 belgi"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Rol *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500"
                  >
                    <option value="staff">Sotuvchi</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Holati
                  </label>
                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(e) => setIsActive(e.target.value === "active")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Bloklangan</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === "admin" || canAccessPaynet}
                    disabled={role === "admin"}
                    onChange={(e) => setCanAccessPaynet(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  Paynet Terminalga ruxsat
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xodimni saqlash</span>
                </button>
              </div>
            </form>
          )}

          {/* Staff List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      st.role === "admin"
                        ? "bg-rose-500 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {st.role === "admin" ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{st.name}</span>
                      {!st.isActive && (
                        <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold">
                          Bloklangan
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {st.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(st)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 text-xs transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 inline-block mr-1" />
                  </button>
                  {st.id !== "staff-admin" && (
                    <button
                      type="button"
                      onClick={() => handleDelete(st)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
