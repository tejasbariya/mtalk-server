import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' }, // If it's a comment on a review
  title: { type: mongoose.Schema.Types.ObjectId, ref: 'Title' }, // If it's a general comment on a title
  content: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
