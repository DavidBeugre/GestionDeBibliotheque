import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DetectedCode = { rawValue: string };
type BarcodeDetectorInstance = { detect: (source: CanvasImageSource) => Promise<DetectedCode[]> };

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
  }
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState('Activez la caméra pour scanner un QR code ou un code-barres.');

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    timerRef.current = null;
    streamRef.current = null;
  };

  const openCode = (value: string) => {
    stop();
    try {
      const data = JSON.parse(value) as { type?: string; id?: string };
      if (data.type === 'book' && data.id) return navigate(`/books/${data.id}`);
      if (data.type === 'member' && data.id) return navigate(`/members/${data.id}`);
    } catch { /* Code-barres standard : recherche catalogue. */ }
    navigate(`/books?search=${encodeURIComponent(value)}`);
  };

  const start = async () => {
    if (!window.BarcodeDetector) {
      setMessage('Le scanner caméra n’est pas pris en charge par ce navigateur. Utilisez Chrome ou Edge récent.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const detector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128'] });
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) openCode(codes[0].rawValue);
      }, 500);
      setMessage('Caméra active : placez le code dans le cadre.');
    } catch {
      setMessage('Impossible d’accéder à la caméra. Vérifiez son autorisation dans le navigateur.');
    }
  };

  useEffect(() => stop, []);

  return <div className="mx-auto max-w-xl space-y-5"><div><h1 className="font-display text-2xl font-semibold">Scanner</h1><p className="text-sm text-muted-foreground">Identifiez un livre ou un adhérent instantanément.</p></div><div className="overflow-hidden rounded-xl border bg-black"><video ref={videoRef} autoPlay playsInline className="aspect-video w-full object-cover" /></div><p className="text-sm text-muted-foreground">{message}</p><div className="flex gap-2"><Button onClick={start}><Camera /> Activer la caméra</Button><Button variant="outline" onClick={stop}><ScanLine /> Arrêter</Button></div></div>;
}
