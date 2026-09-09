import React, { useState } from "react";
import {
  X,
  KeyRound,
  Database,
  Image as ImageIcon,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  clearStoredFirebaseConfig,
  isFirebaseConfigured,
  type FirebaseConfig,
} from "../services/firebase";
import {
  getStoredImgcdnKey,
  setStoredImgcdnKey,
  getStoredImgcdnEndpoint,
  setStoredImgcdnEndpoint,
} from "../services/imgcdnService";

interface SettingsModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onRefreshData,
}) => {
  const currentFb = getStoredFirebaseConfig();
  const [apiKey, setApiKey] = useState(currentFb?.apiKey || "");
  const [projectId, setProjectId] = useState(currentFb?.projectId || "");
  const [authDomain, setAuthDomain] = useState(currentFb?.authDomain || "");
  const [appId, setAppId] = useState(currentFb?.appId || "");

  const [imgcdnKey, setImgcdnKeyVal] = useState(getStoredImgcdnKey());
  const [imgcdnEndpoint, setImgcdnEndpointVal] = useState(
    getStoredImgcdnEndpoint(),
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (apiKey.trim() && projectId.trim()) {
      const fbConfig: FirebaseConfig = {
        apiKey: apiKey.trim(),
        projectId: projectId.trim(),
        authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
        storageBucket: `${projectId.trim()}.appspot.com`,
        messagingSenderId: "",
        appId: appId.trim(),
      };
      saveStoredFirebaseConfig(fbConfig);
    }

    setStoredImgcdnKey(imgcdnKey.trim());
    setStoredImgcdnEndpoint(
      imgcdnEndpoint.trim() || "https://imgcdn.dev/api/1/upload",
    );

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onRefreshData();
      onClose();
    }, 1200);
  };

  const handleClearFirebase = () => {
    if (confirm("Firebase sozlamalarini tozalashni xohlaysizmi?")) {
      clearStoredFirebaseConfig();
      setApiKey("");
      setProjectId("");
      setAuthDomain("");
      setAppId("");
      alert("Firebase sozlamalari tozalandi. Ilova lokal rejimda ishlaydi.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base">Serverless Sozlamalari</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSave}
          className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800"
        >
          {/* Status info alert */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">
                Holat:{" "}
                {isFirebaseConfigured()
                  ? "Firebase Firestore faol (Bulut)"
                  : "Firebase sozlanmagan"}
              </span>
              <p className="mt-0.5 text-slate-500">
                Ishlab chiqarish rejimida ma'lumotlar Firestore'da saqlanadi.
                Ishni boshlashdan oldin Firebase ulanishini sozlang.
              </p>
            </div>
          </div>

          {/* Section: Firebase Firestore */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                Firebase Firestore (Free Tier)
              </h4>
              {isFirebaseConfigured() && (
                <button
                  type="button"
                  onClick={handleClearFirebase}
                  className="text-[11px] text-red-600 hover:underline font-semibold"
                >
                  O'chirish
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  placeholder="market-uz-123"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Auth Domain (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  App ID (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: ImgCDN */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              ImgCDN Rasm Yuklash API
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ImgCDN / Chevereto API Key
              </label>
              <input
                type="text"
                placeholder="Masalan: 6d207e02198a847aa98d0a2a901485a5"
                value={imgcdnKey}
                onChange={(e) => setImgcdnKeyVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                ImgCDN.dev yoki Chevereto profilidagi shaxsiy API kalit.
                Kiritilmaganda rasmlar brauzerda siqilib lokal saqlanadi.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Upload Endpoint URL
              </label>
              <input
                type="text"
                placeholder="https://imgcdn.dev/api/1/upload"
                value={imgcdnEndpoint}
                onChange={(e) => setImgcdnEndpointVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            {savedSuccess ? (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 py-2.5">
                <CheckCircle className="w-5 h-5" />
                <span>Sozlamalar saqlandi!</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-linear-to-r from-rose-500 to-orange-500 hover:from-rose-600 text-white font-bold py-3 rounded-2xl text-sm shadow-md shadow-rose-500/25 transition active:scale-95"
              >
                Sozlamalarni saqlash
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
