import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  bio: { type: String, default: '' },
  karma: { type: Number, default: 0 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

userSchema.index({ email: 1 }); // For login lookups
userSchema.index({ username: 1 }); // For profile lookups

export default mongoose.model('User', userSchema);
