import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ url: string; publicId: string }> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        resource_type: 'auto',
        public_id: `toff/${Date.now()}_${fileName}`,
        format: mimeType.startsWith('image/') ? undefined : 'auto',
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Upload failed - no result'));
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info('File deleted from Cloudinary:', publicId);
  } catch (error) {
    logger.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

export { cloudinary };
