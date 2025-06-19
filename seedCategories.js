import Category from './models/category.js';

const categories = [
  {
    name: 'Technology',
    description: 'All about tech trends, gadgets, software, and more.',
  },
  {
    name: 'Health & Wellness',
    description: 'Tips and info on health, fitness, and well-being.',
  },
  {
    name: 'Business & Finance',
    description: 'Insights into business strategies, startups, and money management.',
  },
  {
    name: 'Travel & Adventure',
    description: 'Travel guides, tips, and adventure stories.',
  },
  {
    name: 'Lifestyle & Culture',
    description: 'Articles on daily life, culture, fashion, and more.',
  },
];

const seedCategories = async () => {
  try {
    await Category.deleteMany(); 
    await Category.insertMany(categories);
    console.log('Categories seeded successfully');
    process.exit(); 
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

export default seedCategories;
