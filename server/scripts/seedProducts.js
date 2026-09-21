import "dotenv/config";
import mongoose from "mongoose";

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Vendor from "../models/Vendor.js";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const productsData = {
  Electronics: [
    [
      "Wireless Headphones",
      "Premium wireless headphones",
      "SoundMax",
      120,
      25,
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    ],
    [
      "Smart Watch",
      "Fitness smart watch",
      "FitPro",
      85,
      30,
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    ],
    [
      "Bluetooth Speaker",
      "Portable Bluetooth speaker",
      "AudioBox",
      60,
      20,
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
    ],
  ],

  Fashion: [
    [
      "Classic T-Shirt",
      "Cotton t-shirt",
      "UrbanWear",
      25,
      50,
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    ],
    [
      "Denim Jeans",
      "Blue denim jeans",
      "DenimCo",
      55,
      35,
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
    ],
    [
      "Running Shoes",
      "Lightweight shoes",
      "Sprint",
      80,
      25,
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    ],
  ],

  "Home & Kitchen": [
    [
      "Coffee Maker",
      "Automatic coffee maker",
      "HomeBrew",
      95,
      15,
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
    ],
    [
      "Electric Kettle",
      "Electric kettle",
      "KitchenPro",
      40,
      25,
      "https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=800",
    ],
    [
      "Cookware Set",
      "Non-stick cookware",
      "ChefHome",
      110,
      12,
      "https://images.unsplash.com/photo-1584990347449-a9a2aa4f2f69?w=800",
    ],
  ],

  Beauty: [
    [
      "Face Moisturizer",
      "Daily moisturizer",
      "GlowCare",
      28,
      40,
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",
    ],
    [
      "Vitamin C Serum",
      "Facial serum",
      "PureSkin",
      32,
      30,
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
    ],
    [
      "Perfume",
      "Long lasting fragrance",
      "Aura",
      55,
      22,
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",
    ],
  ],

  Sports: [
    [
      "Yoga Mat",
      "Non-slip yoga mat",
      "FitLife",
      30,
      30,
      "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800",
    ],
    [
      "Football",
      "Professional football",
      "SportX",
      25,
      35,
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",
    ],
    [
      "Dumbbell Set",
      "Workout dumbbells",
      "PowerFit",
      90,
      15,
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    ],
  ],

  Books: [
    [
      "JavaScript Basics",
      "JavaScript programming book",
      "CodeBooks",
      22,
      40,
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
    ],
    [
      "React Development",
      "Modern React guide",
      "CodeBooks",
      30,
      30,
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    ],
    [
      "MongoDB Guide",
      "MongoDB guide",
      "DevPress",
      26,
      30,
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
    ],
  ],
};

const seed = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern_ecommerce"
    );
    console.log("MongoDB connected");

    // Find an approved vendor
    const vendor = await Vendor.findOne({
      status: "approved",
      approved: true,
    });

    if (!vendor) {
      console.log("❌ No approved vendor found.");
      console.log("Create/apply a vendor and approve it from Admin first.");
      process.exit(1);
    }

    console.log(`Using vendor: ${vendor.storeName}`);

    let createdCount = 0;

    for (const [categoryName, products] of Object.entries(productsData)) {
      const categorySlug = slugify(categoryName);

      let category = await Category.findOne({
        $or: [{ name: categoryName }, { slug: categorySlug }],
      });

      if (!category) {
        category = await Category.create({
          name: categoryName,
          slug: categorySlug,
          description: `${categoryName} products`,
          isActive: true,
        });

        console.log(`Category created: ${categoryName}`);
      }

      for (const [name, description, brand, price, stock] of products) {
        const slug = slugify(name);

        const exists = await Product.findOne({ slug });

        if (exists) {
          console.log(`Skipped existing: ${name}`);
          continue;
        }

        await Product.create({
          vendor: vendor._id,
          category: category._id,
          name,
          slug,
          description,
          brand,
          price,
          stock,

          // Later you can replace these with uploaded images
          images: [],

          status: "active",
          approvalStatus: "approved",
          ratingsAverage: 0,
          numReviews: 0,
        });

        createdCount++;
        console.log(`✓ ${name}`);
      }
    }

    console.log("");
    console.log(`✅ ${createdCount} products created successfully`);
    console.log("✅ 6 categories ready");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

seed();
