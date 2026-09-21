import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
await connectDB();
let migrated = 0;
for (const order of await Order.find({ "vendorOrders.0": { $exists: false } })) {
  const groups = new Map();
  for (const item of order.items) {
    const vendor = String(item.vendor);
    if (!groups.has(vendor))
      groups.set(vendor, {
        vendor: item.vendor,
        items: [],
        subtotal: 0,
        status: ["delivered", "shipped", "processing", "cancelled"].includes(order.status)
          ? order.status
          : "confirmed",
      });
    const group = groups.get(vendor);
    group.items.push(item);
    group.subtotal = Math.round((group.subtotal + item.price * item.quantity) * 100) / 100;
  }
  if (!groups.size) continue;
  order.vendorOrders = [...groups.values()];
  order.shippingAmount ||= 0;
  order.taxAmount ||= 0;
  await order.save();
  migrated++;
}
const duplicates = await Review.aggregate([
  { $sort: { createdAt: 1 } },
  {
    $group: {
      _id: { user: "$user", product: "$product" },
      keep: { $first: "$_id" },
      count: { $sum: 1 },
    },
  },
  { $match: { count: { $gt: 1 } } },
]);
for (const duplicate of duplicates) {
  await Review.updateMany(
    { user: duplicate._id.user, product: duplicate._id.product, _id: { $ne: duplicate.keep } },
    { status: "rejected" }
  );
  console.warn(
    `Duplicate review pair detected for ${duplicate._id.product}; resolve it before creating the unique index.`
  );
}
console.log(
  `Migrated ${migrated} orders. Duplicate review pairs requiring manual resolution: ${duplicates.length}`
);
await mongoose.disconnect();
