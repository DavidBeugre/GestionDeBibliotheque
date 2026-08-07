import QRCode from 'qrcode';

/**
 * Génère un QR Code au format PNG (buffer) encodant les données fournies.
 * Utilisé pour les livres (identification/inventaire) et les cartes d'adhérent.
 */
export async function generateQrCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, { type: 'png', width: 300, margin: 2 });
}

/** QR intégré sous forme de data URL : il reste disponible après un redéploiement Render. */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, { type: 'image/png', width: 300, margin: 2 });
}
