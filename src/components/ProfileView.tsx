import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { StaffUser } from "../types";
import { changeStaffPassword } from "../services/firestoreService";
import {
  hasTerminalPin,
  normalizeTerminalPin,
  setTerminalPin,
  verifyTerminalPin,
} from "../services/terminalPinService";

interface ProfileViewProps {
  currentUser: StaffUser;
  onBack: () => void;
  onLogout: () => Promise<void>;
  onLock: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onBack,
  onLogout,
  onLock,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinConfirmation, setPinConfirmation] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    if (newPassword !== passwordConfirmation) {
      setPasswordError("Yangi parollar mos kelmaydi.");
      return;
    }
    setSavingPassword(true);
    try {
      await changeStaffPassword(
        currentUser.phone,
        currentPassword,
        newPassword,
      );
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      setPasswordMessage("Parol muvaffaqiyatli yangilandi.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Parolni yangilab bo'lmadi.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPinError(null);
    setPinMessage(null);
    if (
      hasTerminalPin(currentUser.id) &&
      !(await verifyTerminalPin(currentUser.id, currentPin))
    ) {
      setPinError("Amaldagi terminal PIN-kodi noto'g'ri.");
      return;
    }
    if (newPin !== pinConfirmation) {
      setPinError("Yangi PIN-kodlar mos kelmaydi.");
      return;
    }
    setSavingPin(true);
    try {
      await setTerminalPin(currentUser.id, newPin);
      setCurrentPin("");
      setNewPin("");
      setPinConfirmation("");
      setPinMessage("Terminal PIN-kodi muvaffaqiyatli yangilandi.");
    } catch (error) {
      setPinError(
        error instanceof Error ? error.message : "PIN-kodni saqlab bo'lmadi.",
      );
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Ortga
      </button>

      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black">Profil</h1>
            <p className="text-sm text-slate-400">{currentUser.name}</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-5 h-5 text-rose-500" />
          <h2 className="font-bold text-slate-900">Parolni yangilash</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="grid gap-3">
          <input
            required
            type="password"
            placeholder="Amaldagi parol"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500"
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Yangi parol"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500"
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Yangi parolni takrorlang"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500"
          />
          {passwordError && (
            <p className="text-xs text-rose-600">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {passwordMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="w-full sm:w-auto sm:justify-self-start bg-slate-900 text-white font-bold py-2.5 px-5 rounded-xl text-sm disabled:opacity-50"
          >
            {savingPassword ? "Saqlanmoqda..." : "Parolni saqlash"}
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <LockKeyhole className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-slate-900">Terminal PIN-kodi</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          PIN-kod faqat shu qurilmada hash ko'rinishida saqlanadi.
        </p>
        <form onSubmit={handlePinSubmit} className="grid gap-3">
          {hasTerminalPin(currentUser.id) && (
            <input
              required
              inputMode="numeric"
              maxLength={4}
              type="password"
              placeholder="Amaldagi PIN-kod"
              value={currentPin}
              onChange={(event) =>
                setCurrentPin(normalizeTerminalPin(event.target.value))
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
          )}
          <input
            required
            inputMode="numeric"
            maxLength={4}
            type="password"
            placeholder="Yangi 4 raqamli PIN-kod"
            value={newPin}
            onChange={(event) =>
              setNewPin(normalizeTerminalPin(event.target.value))
            }
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
          />
          <input
            required
            inputMode="numeric"
            maxLength={4}
            type="password"
            placeholder="Yangi PIN-kodni takrorlang"
            value={pinConfirmation}
            onChange={(event) =>
              setPinConfirmation(normalizeTerminalPin(event.target.value))
            }
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500"
          />
          {pinError && <p className="text-xs text-rose-600">{pinError}</p>}
          {pinMessage && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {pinMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={savingPin}
            className="w-full sm:w-auto sm:justify-self-start bg-amber-500 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-sm disabled:opacity-50"
          >
            {savingPin ? "Saqlanmoqda..." : "PIN-kodni saqlash"}
          </button>
        </form>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 font-bold py-3 rounded-2xl hover:bg-rose-100"
      >
        <LogOut className="w-4 h-4" /> Tizimdan chiqish
      </button>
      <button
        type="button"
        onClick={onLock}
        className="w-full flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200"
      >
        <LockKeyhole className="w-4 h-4" /> Terminalni qulflash
      </button>
    </div>
  );
};
