import mongoose from 'mongoose';

const libraryEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: mongoose.Schema.Types.ObjectId, ref: 'Title', required: true },
  status: { type: String, enum: ['Reading', 'Plan to Read', 'Completed', 'Dropped', 'On Hold'], required: true },
  progress: { type: Number, default: 0 },
  score: { type: Number, min: 0, max: 10, default: 0 }
}, { timestamps: true });

libraryEntrySchema.index({ user: 1 });
libraryEntrySchema.index({ title: 1 });

export default mongoose.model('LibraryEntry', libraryEntrySchema);
