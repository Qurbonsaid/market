import React, { useState } from "react";
import { LockKeyhole } from "lucide-react";
import {
  normalizeTerminalPin,
  verifyTerminalPin,
} from "../services/terminalPinService";
import type { StaffUser } from "../types";

interface TerminalLockOverlayProps {
  user: StaffUser;
  onUnlock: () => void;
  onSignOut: () => void;
}

export const TerminalLockOverlay: React.FC<TerminalLockOverlayProps> = ({
  user,
  onUnlock,
  onSignOut,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await verifyTerminalPin(user.id, pin)) onUnlock();
    else {
      setPin("");
      setError("Terminal PIN-kodi noto'g'ri.");
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950 text-white p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm text-center space-y-5"
      >
        <LockKeyhole className="w-12 h-12 mx-auto text-amber-400" />
        <div>
          <h2 className="text-xl font-bold">Terminal qulflandi</h2>
          <p className="text-xs text-slate-400 mt-1">
            {user.name} uchun 4 raqamli PIN-kodni kiriting.
          </p>
        </div>
        <input
          autoFocus
          required
          inputMode="numeric"
          maxLength={4}
          type="password"
          value={pin}
          onChange={(event) => setPin(normalizeTerminalPin(event.target.value))}
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-amber-400"
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={pin.length !== 4}
          className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-2xl disabled:opacity-50"
        >
          Ochish
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="text-xs text-slate-400 hover:text-white"
        >
          Boshqa hisob bilan kirish
        </button>
      </form>
    </div>
  );
};
