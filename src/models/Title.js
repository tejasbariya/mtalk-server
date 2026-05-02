import mongoose from 'mongoose';

const titleSchema = new mongoose.Schema({
  apiId: { type: String, required: true, unique: true }, // e.g. AniList ID or Jikan ID
  title: { type: String, required: true },
  coverImage: { type: String, required: true },
  synopsis: { type: String },
  status: { type: String },
  genres: [{ type: String }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  source: { type: String, enum: ['ANILIST', 'JIKAN'], required: true }
}, { timestamps: true });

titleSchema.index({ apiId: 1 }); // Already has unique index, but explicit helps
titleSchema.index({ title: 'text' }); // For search

export default mongoose.model('Title', titleSchema);
