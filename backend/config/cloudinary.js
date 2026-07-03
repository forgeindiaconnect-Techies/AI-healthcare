const multer = require('multer');
const path = require('path');
const fs = require('fs');

let cloudinary = null;
let uploadReport, uploadProfile, deleteFile, getFileUrl;

// Check if Cloudinary is configured
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const reportStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'healthcare/medical-reports',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      resource_type: 'auto',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

  const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'healthcare/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
  });

  uploadReport = multer({
    storage: reportStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  deleteFile = async (publicId) => {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  };

  getFileUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, { secure: true, ...options });
  };
} else {
  // If in production and Cloudinary is not configured, we MUST throw an error.
  // Local storage on Render/Vercel is ephemeral, files will be lost on next restart/deploy.
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY) are REQUIRED in production.');
    
    // Create a dummy multer that just throws an error
    const errorStorage = multer.diskStorage({
      destination: (req, file, cb) => cb(new Error('Cloud Storage is not configured for production environment.'), null)
    });
    
    uploadReport = multer({ storage: errorStorage });
    uploadProfile = multer({ storage: errorStorage });
    
    deleteFile = async () => {};
    getFileUrl = () => null;
  } else {
    // Local file storage fallback for development ONLY
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const name = file.originalname || 'uploaded_file';
      cb(null, `${Date.now()}-${name.replace(/\\s+/g, '_')}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    
    if (allowedMime.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed. Received: ${file.mimetype} / ${ext}`), false);
    }
  };

  uploadReport = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
  uploadProfile = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

  deleteFile = async (publicId) => {
    const filePath = path.join(__dirname, '../uploads', publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };

  getFileUrl = (publicId) => {
    return `/uploads/${publicId}`;
  };
}
}

module.exports = { cloudinary, uploadReport, uploadProfile, deleteFile, getFileUrl };
