import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const imagesDir = path.join(process.cwd(), 'images');

    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ error: "Folder missing" });
    }

    const files = fs.readdirSync(imagesDir);
    
    const displayPhotos = [];
    const committees = {};
    
    // Diagnostic Arrays to see exactly what Vercel is rejecting
    const extensionFails = []; 
    const unparsedFiles = [];

    files.forEach((file) => {
      // 1. Check if the file extension is recognized
      if (!/\.(jpg|jpeg|png|webp|gif|svg)\$/i.test(file)) {
         extensionFails.push({ file: file, reason: "Did not match allowed image extensions" });
         return;
      }

      const ext = path.extname(file);
      const nameWithoutExt = path.basename(file, ext);

      // 2. Check Display Photos (Made case-insensitive)
      if (nameWithoutExt.toLowerCase().startsWith('display_photo_')) {
        const parts = nameWithoutExt.split('_');
        const title = parts.slice(3).join(' ') || parts.slice(2).join(' ') || 'Kirinyaga Kuppet Branch';
        displayPhotos.push({ src: `/images/${file}`, title: title });
      }
      // 3. Check Committees (Must have underscores)
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
            src: `/images/${file}`,
            role: parts[1] ? parts[1].trim() : '',
            hierarchy: parseInt(parts[2], 10) || 99,
            name: parts[3] ? parts[3].trim() : '',
            phone: parts[4] ? parts[4].trim() : '',
            email: parts[5] ? parts[5].trim() : '',
            message: parts.slice(6).join(' ').trim() || ''
          });
        } else {
           unparsedFiles.push({ file: file, reason: "Filename has less than 4 parts separated by underscores", partsDetected: parts.length });
        }
      } 
      // 4. Catch anything else
      else {
         unparsedFiles.push({ file: file, reason: "Filename does not contain any underscores" });
      }
    });

    Object.keys(committees).forEach((key) => {
      committees[key].sort((a, b) => a.hierarchy - b.hierarchy);
    });

    // Output EVERYTHING to the screen so we can see the hidden issue
    res.status(200).json({ 
        success: true, 
        filesDetectedCount: files.length, 
        rawFileList: files,
        extensionFails: extensionFails,
        unparsedFiles: unparsedFiles,
        displayPhotos, 
        committees 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server crashed', details: error.message });
  }
}
