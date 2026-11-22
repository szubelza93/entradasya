
const cloudinary = require('../config/cloudinary');

function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'entradasya/events',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(file.buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId);
}

module.exports = {
  uploadImage,
  deleteImage
};
