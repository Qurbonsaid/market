import React, { useState } from "react";
import { ArrowRight, KeyRound, Lock, ShieldCheck } from "lucide-react";
import type { StaffUser } from "../types";
import { signInStaff } from "../services/firestoreService";
import {
  hasTerminalPin,
  normalizeTerminalPin,
  setTerminalPin,
} from "../services/terminalPinService";

interface AuthScreenProps {
  onLogin: (user: StaffUser) => Promise<void>;
  dataError?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  dataError,
}) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [terminalPin, setTerminalPinValue] = useState("");
  const [pendingUser, setPendingUser] = useState<StaffUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await signInStaff(phone, password);
      if (hasTerminalPin(user.id)) await onLogin(user);
      else setPendingUser(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tizimga kirishda xatolik yuz berdi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTerminalPinSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingUser) return;
    setError(null);
    setLoading(true);
    try {
      await setTerminalPin(pendingUser.id, terminalPin);
      await onLogin(pendingUser);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terminal PIN-kodini saqlab bo'lmadi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center space-y-2 mb-7">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800 ring-1 ring-white/10">
            <ShieldCheck className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-2xl font-black">Market Boshqaruv</h1>
          <p className="text-xs text-slate-400">Xavfsiz xodim kirishi</p>
        </div>

        {pendingUser ? (
          <form onSubmit={handleTerminalPinSetup} className="space-y-5">
            <div className="text-center space-y-2">
              <KeyRound className="w-8 h-8 mx-auto text-amber-400" />
              <h2 className="font-bold">Terminal PIN-kodini yarating</h2>
              <p className="text-xs text-slate-400">
                Bu PIN faqat shu qurilmada saqlanadi va Firebase'ga
                yuborilmaydi.
              </p>
            </div>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={4}
              type="password"
              value={terminalPin}
              onChange={(event) =>
                setTerminalPinValue(normalizeTerminalPin(event.target.value))
              }
              placeholder="4 raqam"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-rose-500"
            />
            {(error || dataError) && (
              <p className="text-xs text-center text-rose-400">
                {error || dataError}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || terminalPin.length !== 4}
              className="w-full bg-linear-to-r from-rose-500 to-orange-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Saqlash va davom etish <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-bold text-slate-400">
              Telefon raqami
              <input
                required
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="90 123 45 67"
                className="mt-1.5 w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500"
              />
            </label>
            <label className="block text-xs font-bold text-slate-400">
              Parol
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </label>
            {error && (
              <p className="text-xs text-center text-rose-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-rose-500 to-orange-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Tekshirilmoqda..." : "Tizimga kirish"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
