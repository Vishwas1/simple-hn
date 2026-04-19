/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'ai-cmo', 'data');

export const db = {
  async save(collection: 'brands' | 'campaigns', id: string, data: any) {
    const dir = path.join(DATA_DIR, collection);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(data, null, 2));
  },

  async get(collection: 'brands' | 'campaigns', id: string) {
    try {
      const filePath = path.join(DATA_DIR, collection, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  },

  async list(collection: 'brands' | 'campaigns') {
    const dir = path.join(DATA_DIR, collection);
    try {
      const files = await fs.readdir(dir);
      return files.map((f) => f.replace('.json', ''));
    } catch {
      return [];
    }
  },
};
