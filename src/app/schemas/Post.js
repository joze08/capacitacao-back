import mongoose from '@/database';
import Slugify from '../../utils/Slugify';
const { Schema } = mongoose;

const PostSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

PostSchema.pre('save', function (next) {
  const title = this.title;
  this.slug = Slugify(title);
  next();
})

export default mongoose.model('Post', PostSchema);