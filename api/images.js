import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Vercel standard path for included root folders
    const imagesDir = path.join(process.cwd(), 'images');
    
    // Safety check: If it still can't find it, tell us exactly where it looked
    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ 
        error: "Folder missing", 
        searchedPath: imagesDir,
        displayPhotos: [], 
        committees: {} 
      });
    }

    const files = fs.readdirSync(imagesDir);
    const displayPhotos = [];
    const committees = {};

    files.forEach((file) => {
      if (!/\.(jpg|jpeg|png|webp|gif|svg)\$/i.test(file)) return;

      const ext = path.extname(file);
      const nameWithoutExt = path.basename(file, ext);

      if (file.startsWith('Display_photo_')) {
        const parts = nameWithoutExt.split('_');
        const title = parts.slice(3).join(' ') || parts.slice(2).join(' ') || 'Kirinyaga Kuppet Branch';
        displayPhotos.push({
          src: `/images/${file}`,
          title: title
        });
      } 
      else if (file.includes('_')) {
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 4) {
          const rawCommittee = parts[0].trim();
          const role = parts[1] ? parts[1].trim() : '';
          const hierarchy = parseInt(parts[2], 10) || 99;
          const name = parts[3] ? parts[3].trim() : '';
          const phone = parts[4] ? parts[4].trim() : '';
          const email = parts[5] ? parts[5].trim() : '';
          const message = parts.slice(6).join(' ').trim() || '';

          let committeeKey = rawCommittee.toUpperCase();
          if (committeeKey === 'B.E.C' || committeeKey === 'BEC') committeeKey = 'B.E.C (Branch Executive Committee)';
          else if (committeeKey === 'B.G.C' || committeeKey === 'BGC') committeeKey = 'B.G.C (Branch Governing Council)';
          else if (committeeKey === 'B.B.F' || committeeKey === 'BBF') committeeKey = 'B.B.F Committee';
          else if (committeeKey.includes('EXECUTIVE')) committeeKey = 'Executive Members Committee';

          if (!committees[committeeKey]) {
            committees[committeeKey] = [];
          }

          committees[committeeKey].push({
            src: `/images/${file}`,
            role,
            hierarchy,
            name,
            phone,
            email,
            message
          });
        }
      }
    });

    Object.keys(committees).forEach((key) => {
      committees[key].sort((a, b) => a.hierarchy - b.hierarchy);
    });

    res.status(200).json({ displayPhotos, committees });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process images folder', details: error.message });
  }
}
