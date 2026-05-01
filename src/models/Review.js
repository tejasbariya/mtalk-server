import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: mongoose.Schema.Types.ObjectId, ref: 'Title', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
