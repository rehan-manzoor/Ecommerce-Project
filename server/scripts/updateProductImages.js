import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const imageMap = {
  "Wireless Headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",

  "Smart Watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",

  "Bluetooth Speaker": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",

  "Gaming Mouse": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800",

  "Mechanical Keyboard": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",

  "Classic T-Shirt": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",

  "Denim Jeans": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",

  "Running Shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",

  "Leather Jacket": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",

  "Casual Hoodie": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",

  "Coffee Maker": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",

  "Electric Kettle": "https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=800",

  Blender: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800",

  "Cookware Set": "https://images.unsplash.com/photo-1584990347449-a9a2aa4f2f69?w=800",

  "Table Lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",

  "Face Moisturizer": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",

  "Vitamin C Serum": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",

  Perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",

  "Hair Dryer": "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800",

  "Makeup Kit": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800",

  "Yoga Mat": "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800",

  Football: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",

  "Dumbbell Set": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",

  "Badminton Racket": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",

  "Gym Bag": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",

  "JavaScript Basics": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",

  "React Development": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",

  "Node.js Handbook": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800",

  "MongoDB Guide": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",

  "Clean Code Concepts": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800",
};

const updateImages = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern_ecommerce"
    );

    console.log("MongoDB connected");

    let updated = 0;

    for (const [name, image] of Object.entries(imageMap)) {
      const result = await Product.updateOne(
        { name },
        {
          $set: {
            images: [image],
          },
        }
      );

      if (result.matchedCount > 0) {
        console.log(`✓ Image updated: ${name}`);
        updated++;
      } else {
        console.log(`Skipped - not found: ${name}`);
      }
    }

    console.log("");
    console.log(`✅ ${updated} product images updated`);
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

updateImages();
