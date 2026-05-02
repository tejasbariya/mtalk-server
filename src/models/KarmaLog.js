import mongoose from 'mongoose';

const karmaLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // positive or negative
  reason: { type: String, required: true }, // 'Review Upvoted', 'Comment Downvoted', etc.
  referenceId: { type: mongoose.Schema.Types.ObjectId } // Optional: link to review/comment
}, { timestamps: true });

karmaLogSchema.index({ user: 1 });
karmaLogSchema.index({ reason: 1 });

export default mongoose.model('KarmaLog', karmaLogSchema);
