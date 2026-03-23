import JsonBin from '../models/json-bin.js';
import { writeCache, deleteCache } from './cache-service.js';

export async function listBins(userId, group) {
  const filter = { userId };
  if (group) filter.group = group;
  return JsonBin.find(filter).sort({ updatedAt: -1 }).select('-content');
}

export async function createBin(userId, { name, group, content, isPublic }) {
  const bin = await JsonBin.create({ userId, name, group, content, isPublic });
  await writeCache(bin.slug, content);
  return bin;
}

export async function getBin(slug, userId) {
  const bin = await JsonBin.findOne({ slug, userId });
  if (!bin) throw Object.assign(new Error('Not found'), { status: 404 });
  return bin;
}

export async function updateBin(slug, userId, updates) {
  const bin = await JsonBin.findOneAndUpdate(
    { slug, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!bin) throw Object.assign(new Error('Not found'), { status: 404 });
  await writeCache(bin.slug, bin.content);
  return bin;
}

export async function deleteBin(slug, userId) {
  const bin = await JsonBin.findOneAndDelete({ slug, userId });
  if (!bin) throw Object.assign(new Error('Not found'), { status: 404 });
  await deleteCache(slug);
}
