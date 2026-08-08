/**
 * Les fichiers du dossier local /uploads de Render sont éphémères. En production,
 * on ne les demande donc jamais : seules les URL Cloudinary (ou autres URL externes)
 * sont affichées. Cela évite les images cassées et les erreurs 404 des anciens enregistrements.
 */
export function getPersistentMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const isLocalUpload = value.startsWith('/uploads/') || /\/uploads\//i.test(value);
  if (isLocalUpload && !import.meta.env.DEV) return undefined;
  return value;
}
