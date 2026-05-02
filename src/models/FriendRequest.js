import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED'], default: 'PENDING' }
}, { timestamps: true });

friendRequestSchema.index({ sender: 1 });
friendRequestSchema.index({ receiver: 1 });
friendRequestSchema.index({ status: 1 });

export default mongoose.model('FriendRequest', friendRequestSchema);
