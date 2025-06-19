import multer from "multer";
import fs from "fs";
import path from "path";


const uploadsDir = path.resolve("uploads"); 
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true }); 
}


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir); 
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});


const fileFilter = (_req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, png, jpg, webp) are allowed."), false);
  }
};

export const upload = multer({ storage, fileFilter });
