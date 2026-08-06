import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { Button } from '@/components/ui/button';

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState('Activez la caméra pour scanner un QR code ou un code-barres.');

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
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
    try {
      if (!videoRef.current) return;
      stop();
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (result) => { if (result) openCode(result.getText()); }
      );
      setMessage('Caméra active : placez le code dans le cadre.');
    } catch {
      setMessage('Impossible d’accéder à la caméra. Vérifiez son autorisation dans le navigateur.');
    }
  };

  useEffect(() => stop, []);

  return <div className="mx-auto max-w-xl space-y-5"><div><h1 className="font-display text-2xl font-semibold">Scanner</h1><p className="text-sm text-muted-foreground">Identifiez un livre ou un adhérent instantanément.</p></div><div className="overflow-hidden rounded-xl border bg-black"><video ref={videoRef} autoPlay playsInline className="aspect-video w-full object-cover" /></div><p className="text-sm text-muted-foreground">{message}</p><div className="flex gap-2"><Button onClick={start}><Camera /> Activer la caméra</Button><Button variant="outline" onClick={stop}><ScanLine /> Arrêter</Button></div></div>;
}
