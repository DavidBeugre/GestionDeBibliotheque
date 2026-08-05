import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const isPlaceholder = (value: string): boolean => !value || value.startsWith('your_');

export const isCloudinaryConfigured = ![
  env.cloudinary.cloudName,
  env.cloudinary.apiKey,
  env.cloudinary.apiSecret,
].some(isPlaceholder);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export { cloudinary };
