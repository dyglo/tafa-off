import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiting';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../config/cloudinary';
import { logger } from '../config/logger';
import { getFileTypeFromMimeType, isAllowedFileType, getMaxFileSize } from '@toff/shared';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (!isAllowedFileType(file.mimetype)) {
    return cb(new Error('File type not allowed'));
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Upload single file
router.post('/',
  uploadLimiter,
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Validate file size based on type
    const maxSize = getMaxFileSize(file.mimetype);
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum limit of ${Math.round(maxSize / (1024 * 1024))}MB`,
      });
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      const fileData = {
        url: uploadResult.url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        messageType: getFileTypeFromMimeType(file.mimetype),
      };

      logger.info('File uploaded:', {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        cloudinaryPublicId: uploadResult.publicId,
      });

      res.json({
        success: true,
        data: fileData,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      logger.error('File upload failed:', { userId, error });
      res.status(500).json({
        success: false,
        error: 'File upload failed',
      });
    }
  })
);

// Upload multiple files
router.post('/multiple',
  uploadLimiter,
  authenticateToken,
  upload.array('files', 5), // Max 5 files
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    const uploadPromises = files.map(async (file) => {
      // Validate file size
      const maxSize = getMaxFileSize(file.mimetype);
      if (file.size > maxSize) {
        throw new Error(`File ${file.originalname} exceeds maximum size limit`);
      }

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      return {
        url: uploadResult.url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        messageType: getFileTypeFromMimeType(file.mimetype),
        publicId: uploadResult.publicId,
      };
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);

      logger.info('Multiple files uploaded:', {
        userId,
        fileCount: files.length,
        files: uploadedFiles.map(f => ({
          fileName: f.fileName,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
        })),
      });

      res.json({
        success: true,
        data: uploadedFiles,
        message: `${files.length} files uploaded successfully`,
      });
    } catch (error) {
      logger.error('Multiple file upload failed:', { userId, error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      });
    }
  })
);

// Handle file upload errors
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
      });
    }
  }

  if (error.message === 'File type not allowed') {
    return res.status(400).json({
      success: false,
      error: 'File type not supported. Supported types: images, PDFs, and text files',
    });
  }

  logger.error('File upload error:', error);
  res.status(500).json({
    success: false,
    error: 'File upload failed',
  });
});

export default router;
