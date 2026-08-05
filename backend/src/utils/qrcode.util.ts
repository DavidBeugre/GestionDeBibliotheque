import QRCode from 'qrcode';

/**
 * Génère un QR Code au format PNG (buffer) encodant les données fournies.
 * Utilisé pour les livres (identification/inventaire) et les cartes d'adhérent.
 */
export async function generateQrCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, { type: 'png', width: 300, margin: 2 });
}
