import React, { useEffect, useState } from "react";
import { Lock, ShieldCheck, UserCheck, Delete, ArrowRight } from "lucide-react";
import type { StaffUser } from "../types";

interface AuthScreenProps {
  staffList: StaffUser[];
  onLogin: (user: StaffUser) => void;
  dataError?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  staffList,
  onLogin,
  dataError,
}) => {
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(
    staffList[0] || null,
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUser && staffList.length > 0) {
      setSelectedUser(staffList.find((user) => user.isActive) || null);
    }
  }, [selectedUser, staffList]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setError(null);
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin("");
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setError("Iltimos, xodimni tanlang");
      return;
    }

    if (selectedUser.pin === pin.trim()) {
      onLogin(selectedUser);
    } else {
      setError("PIN-kod noto'g'ri. Qayta urinib ko'ring.");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 text-white select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-lg mb-1">
            <img
              src="/favicon.svg"
              alt="Market Logosi"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
            Market Boshqaruv
          </h1>
          <p className="text-xs text-slate-400">
            Kassa, Omborxona va Savdo Tizimiga kirish
          </p>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Foydalanuvchi / Xodimni tanlang:
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
            {dataError && (
              <p className="text-xs text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                {dataError}
              </p>
            )}
            {!dataError && staffList.filter((u) => u.isActive).length === 0 && (
              <p className="text-xs text-center text-slate-400 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                Faol xodimlar topilmadi. Firebase'da staff kolleksiyasini
                sozlang.
              </p>
            )}
            {staffList
              .filter((u) => u.isActive)
              .map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setPin("");
                      setError(null);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition text-left ${
                      isSelected
                        ? "bg-rose-500/20 border-rose-500 text-white shadow-sm shadow-rose-500/20"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          u.role === "admin"
                            ? "bg-rose-500 text-white"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{u.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {u.role === "admin" ? "Admin" : "Sotuvchi"}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* PIN Input Display */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
            PIN-kodni kiriting:
          </label>
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const hasChar = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    hasChar
                      ? "bg-rose-500/20 border-rose-500 text-rose-400 scale-105"
                      : "bg-slate-800/80 border-slate-700 text-slate-600"
                  }`}
                >
                  {hasChar ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-400" />
                  ) : (
                    <Lock className="w-4 h-4 opacity-30" />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-center font-semibold text-rose-400 animate-shake">
              {error}
            </p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-lg font-bold text-white shadow-xs transition active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-400 transition active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Tozalash
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-lg font-bold text-white shadow-xs transition active:scale-95 flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Enter Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={pin.length < 4}
          className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-rose-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tizimga kirish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
