import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface CheckinScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const CheckinScanner: React.FC<CheckinScannerProps> = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Ignore errors to avoid console spam during scanning
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200">
          ✕
        </button>
        <h3 className="text-xl font-bold mb-4 text-center">Quét mã QR Check-in</h3>
        <div id="reader" className="w-full"></div>
      </div>
    </div>
  );
};
