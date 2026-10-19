import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const imagesDir = path.join(process.cwd(), 'images');
    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ displayPhotos: [] });
    }

    const files = fs.readdirSync(imagesDir);
    const displayPhotos = [];

    files.forEach((rawFile) => {
      if (!/\.(jpg|jpeg|png|webp|gif|svg)/i.test(rawFile)) return;

      const ext = path.extname(rawFile);
      const nameWithoutExt = path.basename(rawFile, ext);
      const webPath = `/images/${encodeURIComponent(rawFile)}`;

      // Check if file starts with Display_photo_
      if (nameWithoutExt.toLowerCase().startsWith('display_photo_')) {
        const parts = nameWithoutExt.split('_');
        // Extracts title e.g. "Teacher Teaching" from "Display_photo_1_Teacher Teaching"
        const title = parts.slice(2).join(' ') || 'Kirinyaga Kuppet Gallery';
        displayPhotos.push({ src: webPath, title: title });
      }
    });

    res.status(200).json({ displayPhotos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load gallery photos', details: error.message });
  }
}
