// cloudinaryPost.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = 'post_media';
    let allowedFormats = ['jpg', 'png', 'mp4', 'pdf', 'gif'];

    if (file.mimetype.startsWith('image/')) {
      folder = 'post_images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'post_videos';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'post_pdfs';
    } else {
      folder = 'post_others';
      allowedFormats = undefined; 
    }

    return {
      folder: folder,
      resource_type: 'auto', 
      public_id: `${file.fieldname}-${Date.now()}`, 
    };
  },
});

const postUpload = multer({ storage: storage });

module.exports = postUpload;
