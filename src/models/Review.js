import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: mongoose.Schema.Types.ObjectId, ref: 'Title', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

reviewSchema.index({ title: 1 }); // For getTitleReviews queries
reviewSchema.index({ user: 1 }); // For user review search
reviewSchema.index({ createdAt: -1 }); // For sorting

export default mongoose.model('Review', reviewSchema);
