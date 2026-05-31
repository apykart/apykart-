const CLOUD_NAME = 'djcfq7tlf';
const UPLOAD_PRESET = 'Apykart';

/**
 * Upload file to Cloudinary
 * @param {File} file - Image or video file
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error('No file provided');

  // Determine endpoint based on file type
  const isVideo = file.type.startsWith('video/');
  const endpoint = isVideo ? 'video' : 'image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`);

    // Progress tracking
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error - please check your connection'));
    xhr.send(formData);
  });
    }
