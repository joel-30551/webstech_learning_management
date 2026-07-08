import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Mock implementation to prevent crashes when Cloudinary is not configured
const mockCloudinary = isCloudinaryConfigured
  ? cloudinary
  : ({
      uploader: {
        upload_stream: (options: any, callback: (error: any, result: any) => void) => {
          const Writable = require('stream').Writable;
          const writeStream = new Writable({
            write(chunk: any, encoding: any, next: any) {
              next();
            },
          });
          // Asynchronously respond to simulate file upload latency
          writeStream.on('finish', () => {
            setTimeout(() => {
              callback(null, {
                secure_url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
                public_id: options.public_id || `mock_${Date.now()}`,
              });
            }, 100);
          });
          return writeStream;
        },
        destroy: async (publicId: string, options?: any) => {
          return { result: 'ok' };
        },
      },
      config: () => {},
    } as any);

export default mockCloudinary;
