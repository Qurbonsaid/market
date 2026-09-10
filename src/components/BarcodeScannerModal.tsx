import React from "react";
import { Barcode, X } from "lucide-react";
import { BarcodeScanner, type DetectedBarcode } from "react-barcode-scanner";
import "react-barcode-scanner/polyfill";

interface BarcodeScannerModalProps {
  onResult: (value: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  onResult,
  onClose,
}) => {
  const handleCapture = (barcodes: DetectedBarcode[]) => {
    const value = barcodes[0]?.rawValue?.trim();
    if (value) onResult(value);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-rose-400" />
            <h2 className="text-sm font-bold">Shtrix-kodni skanerlang</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Skanerni yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <BarcodeScanner
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              options={{
                delay: 300,
                formats: [
                  "qr_code",
                  "ean_13",
                  "ean_8",
                  "upc_a",
                  "upc_e",
                  "code_128",
                  "code_39",
                  "itf",
                ],
              }}
              onCapture={handleCapture}
              onCameraError={(error) =>
                console.error("Skaner kamerasi:", error)
              }
              onScanError={(error) =>
                console.error("Shtrix-kod skaneri:", error)
              }
            />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Kamerani kodga qarating. Natija topilganda maydon avtomatik
            to'ldiriladi.
          </p>
        </div>
      </div>
    </div>
  );
};
