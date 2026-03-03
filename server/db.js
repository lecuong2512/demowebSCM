import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'server', 'data');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix) {
  return `${prefix}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

export function dataFile(name) {
  return path.join(DATA_DIR, name);
}

export async function readJsonArray(name) {
  const p = dataFile(name);
  if (!(await fileExists(p))) return [];
  const raw = await fs.readFile(p, 'utf8');
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Expected array in ${name}`);
  return parsed;
}

export async function writeJsonArray(name, arr) {
  const p = dataFile(name);
  await ensureDir(DATA_DIR);
  await fs.writeFile(p, JSON.stringify(arr, null, 2), 'utf8');
}

export async function upsertSeed(name, seedArray) {
  const p = dataFile(name);
  await ensureDir(DATA_DIR);
  if (await fileExists(p)) return;
  await fs.writeFile(p, JSON.stringify(seedArray, null, 2), 'utf8');
}


