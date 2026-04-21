'use client';

import { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type QrScannerCameraProps = {
  onScan: (data: string) => void;
};

export default function QrScannerCamera({ onScan }: QrScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (canvasRef.current) {
          const canvas = canvasRef.current.getContext('2d', { willReadFrequently: true });
          if (canvas) {
            canvas.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const imageData = canvas.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
              onScan(code.data);
              return; // Stop the loop
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    const cleanup = () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
          videoRef.current.play();
          animationFrameId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasPermission(false);
      }
    };

    startCamera();

    return cleanup;
  }, [onScan]);

  return (
    <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" width="640" height="480" />
      {hasPermission === false && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
              Please enable camera permissions in your browser settings to scan QR codes.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {hasPermission === null && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
          <p>Requesting camera access...</p>
        </div>
      )}
      {/* Scanner overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-4 border-white/50 rounded-lg" style={{boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'}}></div>
      </div>
    </div>
  );
}