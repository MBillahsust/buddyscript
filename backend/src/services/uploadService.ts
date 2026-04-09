import { cloudinary } from '@config/cloudinary';
import { env } from '@config/environment';

const UPLOAD_FOLDER = 'buddy-script';

/** Generate signed parameters for a direct client-side Cloudinary upload. */
const generateSignature = () => {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: UPLOAD_FOLDER };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.cloudinary.apiSecret);

  return {
    signature,
    timestamp,
    folder:    UPLOAD_FOLDER,
    cloudName: env.cloudinary.cloudName,
    apiKey:    env.cloudinary.apiKey,
  };
};

export const UploadService = { generateSignature };
