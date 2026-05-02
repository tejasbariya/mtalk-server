import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  room: { type: String, required: true }, // 'global' or 'title_<id>'
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
