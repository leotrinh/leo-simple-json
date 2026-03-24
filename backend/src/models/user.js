import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    picture: { type: String, default: '' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true }
);

// Never expose passwordHash in API responses
userSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.passwordHash;
    return obj;
  },
});

export default mongoose.model('User', userSchema);
