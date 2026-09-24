import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { uniqueSlug } from "../utils/slugify.js";

const buildTree = (categories, parent = null) =>
  categories
    .filter((item) => String(item.parentCategory || "") === String(parent || ""))
    .map((item) => ({ ...item.toObject(), children: buildTree(categories, item._id) }));

export const createCategory = async (req, res, next) => {
  try {
    const { name, description = "", image = "", parentCategory = null, isActive = true } = req.body;
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Category name is required", data: null, error: null });
    const category = await Category.create({
      name: name.trim(),
      slug: uniqueSlug(name),
      description,
      image,
      parentCategory: parentCategory || null,
      isActive,
    });
    res
      .status(201)
      .json({ success: true, message: "Category created", data: category, error: null });
  } catch (error) {
    error.statusCode = 400;
    error.publicMessage = "Failed to create category";
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const isAdminRequest = req.query.admin === "true";

    const categories = await Category.find(isAdminRequest ? {} : { isActive: true }).sort({
      name: 1,
    });

    if (!isAdminRequest) {
      res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    }
    res.json({
      success: true,
      message: "Categories fetched",
      data: req.query.tree === "true" ? buildTree(categories) : categories,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found", data: null, error: null });
    res.json({ success: true, message: "Category fetched", data: category, error: null });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.name) updates.slug = uniqueSlug(updates.name);
    if (updates.parentCategory === "") updates.parentCategory = null;
    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found", data: null, error: null });
    res.json({ success: true, message: "Category updated", data: category, error: null });
  } catch (error) {
    error.statusCode = 400;
    error.publicMessage = "Failed to update category";
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    if (await Product.exists({ category: req.params.id })) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a category that still has products",
        data: null,
        error: null,
      });
    }
    if (await Category.exists({ parentCategory: req.params.id })) {
      return res.status(400).json({
        success: false,
        message: "Delete or move child categories first",
        data: null,
        error: null,
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found", data: null, error: null });
    res.json({ success: true, message: "Category deleted", data: category, error: null });
  } catch (error) {
    next(error);
  }
};
