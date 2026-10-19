import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Force Vercel and the browser to never cache this response
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const imagesDir = path.join(process.cwd(), 'images');

    // Debugging output to see exactly what Vercel detects
    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ error: "Folder completely missing", searchedPath: imagesDir });
    }

    const files = fs.readdirSync(imagesDir);
    if (files.length === 0) {
      return res.status(200).json({ error: "Folder exists but is empty", searchedPath: imagesDir });
    }

    const displayPhotos = [];
    const committees = {};

    files.forEach((file) => {
      if (!/\.(jpg|jpeg|png|webp|gif|svg)\$/i.test(file)) return;

      const ext = path.extname(file);
      const nameWithoutExt = path.basename(file, ext);

      if (file.startsWith('Display_photo_')) {
        const parts = nameWithoutExt.split('_');
        const title = parts.slice(3).join(' ') || parts.slice(2).join(' ') || 'Kirinyaga Kuppet Branch';
        displayPhotos.push({ src: `/images/${file}`, title: title });
      }
      else if (file.includes('_')) {
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 4) {
          let rawCommittee = parts[0].trim().toUpperCase();
          if (rawCommittee === 'B.E.C' || rawCommittee === 'BEC') rawCommittee = 'B.E.C (Branch Executive Committee)';
          else if (rawCommittee === 'B.G.C' || rawCommittee === 'BGC') rawCommittee = 'B.G.C (Branch Governing Council)';
          else if (rawCommittee === 'B.B.F' || rawCommittee === 'BBF') rawCommittee = 'B.B.F Committee';
          else if (rawCommittee.includes('EXECUTIVE')) rawCommittee = 'Executive Members Committee';

          if (!committees[rawCommittee]) committees[rawCommittee] = [];

          committees[rawCommittee].push({
            src: `/images/${file}`,
            role: parts[1] ? parts[1].trim() : '',
            hierarchy: parseInt(parts[2], 10) || 99,
            name: parts[3] ? parts[3].trim() : '',
            phone: parts[4] ? parts[4].trim() : '',
            email: parts[5] ? parts[5].trim() : '',
            message: parts.slice(6).join(' ').trim() || ''
          });
        }
      }
    });

    Object.keys(committees).forEach((key) => {
      committees[key].sort((a, b) => a.hierarchy - b.hierarchy);
    });

    res.status(200).json({ success: true, filesDetected: files.length, displayPhotos, committees });
  } catch (error) {
    res.status(500).json({ error: 'Server crashed', details: error.message });
  }
}
