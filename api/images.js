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

    // Static registry mapping short filenames to their actual details, contacts, and messages
    // You can easily update names, phones, emails, and messages right here without touching filenames!
    const memberRegistry = {
      "B.E.C_Chairperson_1": {
        name: "Maina Kamau Tom",
        role: "Chairperson",
        phone: "+254716443524",
        email: "mfelixnderitu@gmail.com"
      },
      "B.E.C_Secretary_2": {
        name: "Jane Wanjiku",
        role: "Secretary",
        phone: "+254722334455",
        email: "sec@kuppetkirinyaga.co.ke"
      },
      "B.G.C_Chairperson_1": {
        name: "James Mwangi",
        role: "Chairperson",
        phone: "+254711223344",
        email: "bgc.chair@kuppetkirinyaga.co.ke"
      },
      "B.G.C_Secretary_2": {
        name: "Alice Njeri",
        role: "Secretary",
        phone: "+254733445566",
        email: "bgc.sec@kuppetkirinyaga.co.ke"
      }
    };

    files.forEach((rawFile) => {
      if (!/\.(jpg|jpeg|png|webp|gif|svg)/i.test(rawFile)) return;

      const ext = path.extname(rawFile);
      const nameWithoutExt = path.basename(rawFile, ext);
      const webPath = `/images/${encodeURIComponent(rawFile)}`;

      if (nameWithoutExt.toLowerCase().startsWith('display_photo_')) {
        const parts = nameWithoutExt.split('_');
        const title = parts.slice(3).join(' ') || parts.slice(2).join(' ') || 'Teacher Teaching';
        displayPhotos.push({ src: webPath, title: title });
      }
      else if (nameWithoutExt.includes('_')) {
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 3) {
          let rawCommittee = parts[0].trim().toUpperCase();
          if (rawCommittee === 'B.E.C' || rawCommittee === 'BEC') rawCommittee = 'B.E.C (Branch Executive Committee)';
          else if (rawCommittee === 'B.G.C' || rawCommittee === 'BGC') rawCommittee = 'B.G.C (Branch Governing Council)';
          else if (rawCommittee === 'B.B.F' || rawCommittee === 'BBF') rawCommittee = 'B.B.F Committee';

          if (!committees[rawCommittee]) committees[rawCommittee] = [];

          const hierarchy = parseInt(parts[2], 10) || 99;
          
          // Lookup details from our registry using the base key (e.g. B.E.C_Chairperson_1)
          const registryKey = nameWithoutExt;
          const details = memberRegistry[registryKey] || {
            name: parts[1] ? parts[1].trim() : 'Official',
            role: parts[1] ? parts[1].trim() : 'Member',
            phone: '',
            email: ''
          };

          // Read corresponding .txt file for long messages if it exists
          let message = '';
          const txtFilename = `${parts[0]}_${parts[1]}.txt`; // e.g. B.E.C_Chairperson.txt
          const txtPath = path.join(imagesDir, txtFilename);
          if (fs.existsSync(txtPath)) {
            try {
              message = fs.readFileSync(txtPath, 'utf8').trim();
            } catch (txtErr) {
              console.error(`Error reading text file ${txtFilename}:`, txtErr);
            }
          }

          committees[rawCommittee].push({
            src: webPath,
            role: details.role,
            hierarchy: hierarchy,
            name: details.name,
            phone: details.phone,
            email: details.email,
            message: message
          });
        }
      }
    });

    Object.keys(committees).forEach((key) => {
      committees[key].sort((a, b) => a.hierarchy - b.hierarchy);
    });

    res.status(200).json({ displayPhotos, committees });
  } catch (error) {
    res.status(500).json({ error: 'Server process failed', details: error.message });
  }
}
