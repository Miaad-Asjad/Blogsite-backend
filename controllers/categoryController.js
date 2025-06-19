import Category from '../models/category.js';

// Get All Categories
export const getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); 
    res.status(200).json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Create New Category 
export const createCategory = async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description || "No description provided.",
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category", error });
  }
};


// Update Category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldSlug = existingCategory.slug;

   
    if (name && name !== existingCategory.name) {
      existingCategory.name = name;

      
      const newSlug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

      if (newSlug !== oldSlug) {
        existingCategory.slugHistory.push(oldSlug); 
        existingCategory.slug = newSlug;
      }
    }

    if (description) {
      existingCategory.description = description;
    }

    const updatedCategory = await existingCategory.save();
    res.status(200).json(updatedCategory);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Failed to update category' });
  }
};
