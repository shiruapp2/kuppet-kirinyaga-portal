import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const imagesDir = path.join(process.cwd(), 'images');
    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ displayPhotos: [], committees: {} });
    }

    const files = fs.readdirSync(imagesDir);
    const displayPhotos = [];
    const committees = {};

    files.forEach((rawFile) => {
      // Forgiving extension check that ignores hidden trailing characters
      if (!/\.(jpg|jpeg|png|webp|gif|svg)/i.test(rawFile)) return;

      const ext = path.extname(rawFile);
      const nameWithoutExt = path.basename(rawFile, ext);
      
      // Clean the web path so spaces and symbols load correctly in HTML
      const webPath = encodeURI(`/images/${rawFile}`);

      if (nameWithoutExt.toLowerCase().startsWith('display_photo_')) {
        const parts = nameWithoutExt.split('_');
        const title = parts.slice(3).join(' ') || parts.slice(2).join(' ') || 'Kirinyaga Kuppet Branch';
        displayPhotos.push({ src: webPath, title: title });
      }
      else if (nameWithoutExt.includes('_')) {
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 4) {
          let rawCommittee = parts[0].trim().toUpperCase();
          if (rawCommittee === 'B.E.C' || rawCommittee === 'BEC') rawCommittee = 'B.E.C (Branch Executive Committee)';
          else if (rawCommittee === 'B.G.C' || rawCommittee === 'BGC') rawCommittee = 'B.G.C (Branch Governing Council)';
          else if (rawCommittee === 'B.B.F' || rawCommittee === 'BBF') rawCommittee = 'B.B.F Committee';
          else if (rawCommittee.includes('EXECUTIVE')) rawCommittee = 'Executive Members Committee';

          if (!committees[rawCommittee]) committees[rawCommittee] = [];

          committees[rawCommittee].push({
            src: webPath,
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

    // Sort leadership hierarchy (1 = Chairman, 2 = Vice, etc.)
    Object.keys(committees).forEach((key) => {
      committees[key].sort((a, b) => a.hierarchy - b.hierarchy);
    });

    res.status(200).json({ displayPhotos, committees });
  } catch (error) {
    res.status(500).json({ error: 'Server process failed', details: error.message });
  }
}
