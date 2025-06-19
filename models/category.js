import mongoose from 'mongoose';

const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    slugHistory: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: 'No description provided.',
    },
  },
  { timestamps: true }
);


categorySchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    const newSlug = createSlug(this.name);
    if (this.slug && this.slug !== newSlug) {
      this.slugHistory.push(this.slug);
    }
    this.slug = newSlug;
  }
  next();
});


categorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.name) {
    const newSlug = createSlug(update.name);
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (docToUpdate && docToUpdate.slug !== newSlug) {
      if (!update.slugHistory) update.slugHistory = docToUpdate.slugHistory || [];
      update.slugHistory.push(docToUpdate.slug);
      update.slug = newSlug;
    }
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
