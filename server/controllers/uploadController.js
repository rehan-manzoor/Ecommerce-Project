import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
export const uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });
  const bytes = req.file.buffer;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const extension = jpeg && req.file.mimetype === 'image/jpeg' ? 'jpg' : png && req.file.mimetype === 'image/png' ? 'png' : webp && req.file.mimetype === 'image/webp' ? 'webp' : null;
  if (!extension) return res.status(400).json({ success: false, message: 'Invalid image contents' });
  const filename = `${crypto.randomUUID()}.${extension}`;
  const directory = path.resolve('uploads');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), bytes, { flag: 'wx' });
  res.status(201).json({ success: true, data: { url: `${req.protocol}://${req.get('host')}/uploads/${filename}`, filename } });
};
