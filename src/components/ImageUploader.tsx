import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import {
  uploadImageToImgCDN,
  getStoredImgcdnKey,
} from "../services/imgcdnService";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasApiKey = Boolean(getStoredImgcdnKey());

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Maksimal ${maxImages} tagacha rasm yuklash mumkin.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    setProgress(10);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        const result = await uploadImageToImgCDN(file, (p) => {
          const overall = Math.round(
            ((i + p / 100) / filesToUpload.length) * 100,
          );
          setProgress(overall);
        });
        if (result.url) {
          uploadedUrls.push(result.url);
        }
      } catch (err) {
        console.error("Rasm yuklashda xato:", err);
        alert(
          err instanceof Error
            ? err.message
            : "Rasm yuklashda xatolik yuz berdi.",
        );
      }
    }

    onChange([...images, ...uploadedUrls]);
    setUploading(false);
    setProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Mahsulot rasmlari ({images.length}/{maxImages})
        </label>
        {!hasApiKey && (
          <span className="text-[11px] text-amber-600 font-medium">
            (ImgCDN API kaliti talab qilinadi)
          </span>
        )}
      </div>

      {/* Grid of uploaded images and upload button */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((url, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs"
          >
            <img
              src={url}
              alt={`Rasm ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition"
              title="Rasmni o'chirish"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Asosiy
              </span>
            )}
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/40 flex flex-col items-center justify-center p-2 text-slate-500 hover:text-rose-600 transition group cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                <span className="text-[10px] font-bold text-slate-600">
                  {progress}%
                </span>
              </div>
            ) : (
              <>
                <div className="p-2 rounded-xl bg-white shadow-xs group-hover:scale-110 transition">
                  <UploadCloud className="w-5 h-5 text-rose-500" />
                </div>
                <span className="mt-1 text-[11px] font-bold">
                  Rasm qo'shish
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {images.length === 0 && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" />
          Birinchi yuklangan rasm asosiy muqova (cover) sifatida ko'rsatiladi.
        </p>
      )}
    </div>
  );
};
