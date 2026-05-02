import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['NEW_CHAPTER', 'HIATUS', 'FRIEND_REQUEST', 'MENTION', 'CHAT_REPLY', 'KARMA_EARNED'], required: true },
  message: { type: String, required: true },
  link: { type: String }, // e.g. /title/123 or /profile/xyz
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ user: 1 });
notificationSchema.index({ read: 1 });

export default mongoose.model('Notification', notificationSchema);
