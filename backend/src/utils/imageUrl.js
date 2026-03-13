
const getImageUrl = (filename) => {
  if (!filename) return null;
  
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${filename}`;
};

module.exports = { getImageUrl };
