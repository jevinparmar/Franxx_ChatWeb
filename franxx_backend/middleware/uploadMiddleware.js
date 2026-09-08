import multer from 'multer';
import path from 'path';

// Set storage engine
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${sanitized}-${Date.now()}${ext}`);
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|webp|gif|mp4|webm|mpeg|pdf|txt|doc|docx|xls|xlsx|ppt|pptx|zip|rar/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  const mimetypePattern = /image|video|pdf|text|plain|msword|wordprocessingml|spreadsheetml|presentationml|zip|x-rar|octet-stream/;
  const mimetype = mimetypePattern.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Unsupported file format! Only images, videos, PDFs, office documents, zip, and rar files are supported.'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max size
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
