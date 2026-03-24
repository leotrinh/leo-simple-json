import JsonBin from '../models/json-bin.js';
import { writeCache, deleteCache } from './cache-service.js';

const SLUG_RE = /^[a-zA-Z0-9_-]{3,50}$/;

export async function listBins(userId, group) {
  const filter = { userId };
  if (group) filter.group = group;
  return JsonBin.find(filter).sort({ updatedAt: -1 }).select('-content');
}

export async function listGroups(userId) {
  const groups = await JsonBin.distinct('group', { userId });
  return groups.sort();
}

export async function createBin(userId, { name, group, content, isPublic, slug }) {
  if (slug) {
    const taken = await JsonBin.findOne({ slug });
    if (taken) throw Object.assign(new Error('Slug already taken'), { status: 409 });
  }
  const bin = await JsonBin.create({ userId, name, group, content, isPublic, ...(slug && { slug }) });
  await writeCache(bin.slug, content);
  return bin;
}

export async function getBin(slug, userId) {
  const bin = await JsonBin.findOne({ slug, userId });
  if (!bin) throw Object.assign(new Error('Not found'), { status: 404 });
  return bin;
}

export async function updateBin(slug, userId, updates) {
  const { slug: newSlug, ...rest } = updates;

  // Handle slug change
  if (newSlug && newSlug !== slug) {
    if (!SLUG_RE.test(newSlug)) {
      throw Object.assign(new Error('slug: 3-50 chars, letters/numbers/- and _ only'), { status: 400 });
    }
    const taken = await JsonBin.findOne({ slug: newSlug });
    if (taken) throw Object.assign(new Error('Slug already taken'), { status: 409 });
    rest.slug = newSlug;
  }

  const bin = await JsonBin.findOneAndUpdate(
    { slug, userId },
    { $set: rest },
    { new: true, runValidators: true }
  );
  if (!bin) throw Object.assign(new Error('Not found'), { status: 404 });

  // If slug changed, delete old cache file and write new one
  if (newSlug && newSlug !== slug) {
    await deleteCache(slug);
  }
  await writeCache(bin.slug, bin.content);
  return bin;
}

export async function deleteBin(slug, userId) {
  const bin = await JsonBin.findOneAndDelete({ slug, userId });
  if (!bin) throw Object.assign(new Error('Not found'), { status: 404 });
  await deleteCache(slug);
}
