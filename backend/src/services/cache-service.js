import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

export async function writeCache(slug, content) {
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
}

export async function deleteCache(slug) {
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  await fs.unlink(filePath).catch(() => {}); // ignore if already missing
}

export async function readCache(slug) {
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}
