import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const isPlaceholder = (value: string): boolean => !value || value.startsWith('your_');

function cloudinaryUrlCredentials() {
  try {
    const value = process.env.CLOUDINARY_URL;
    if (!value) return null;
    const parsed = new URL(value);
    if (parsed.protocol !== 'cloudinary:') return null;
    return {
      cloudName: parsed.hostname,
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

const urlCredentials = cloudinaryUrlCredentials();
const credentials = {
  cloudName: env.cloudinary.cloudName || urlCredentials?.cloudName || '',
  apiKey: env.cloudinary.apiKey || urlCredentials?.apiKey || '',
  apiSecret: env.cloudinary.apiSecret || urlCredentials?.apiSecret || '',
};

export const isCloudinaryConfigured = ![
  credentials.cloudName,
  credentials.apiKey,
  credentials.apiSecret,
].some(isPlaceholder);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
}

export { cloudinary };
