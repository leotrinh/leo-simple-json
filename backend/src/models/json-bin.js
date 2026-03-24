import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const jsonBinSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    group: { type: String, default: 'default' },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug before first save
jsonBinSchema.pre('save', function (next) {
  if (!this.slug) this.slug = nanoid(10);
  next();
});

export default mongoose.model('JsonBin', jsonBinSchema);
