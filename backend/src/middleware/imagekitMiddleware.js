const multer = require("multer");
const imagekit = require("../config/imagekit");

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileExt = require("path").extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, gif, webp)"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Middleware to upload to ImageKit after multer processes the file
const uploadToImageKit = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const folderPath = `/readify/${new Date().getFullYear()}/${new Date().getMonth() + 1}`;

    console.log("🔄 Uploading to ImageKit...");
    console.log("URL Endpoint:", process.env.IMAGEKIT_URL_ENDPOINT);
    console.log("Public Key Set:", !!process.env.IMAGEKIT_PUBLIC_KEY);
    console.log("Private Key Set:", !!process.env.IMAGEKIT_PRIVATE_KEY);

    const response = await imagekit.upload({
      file: req.file.buffer,
      fileName: fileName,
      folder: folderPath,
      isPrivateFile: false,
    });

    console.log("✅ ImageKit Upload Success:");
    console.log("URL:", response.url);
    console.log("File ID:", response.fileId);
    console.log("File Path:", response.filePath);

    // Replace file object with ImageKit URL
    req.file.imageUrl = response.url;
    req.file.imagePath = response.filePath;
    req.file.imageId = response.fileId;

    next();
  } catch (error) {
    console.error("❌ ImageKit Upload Error:", error.message);
    console.error("Full Error:", error);
    return res.status(500).json({
      message: "Error uploading image to ImageKit",
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  uploadToImageKit,
};
