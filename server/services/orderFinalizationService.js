import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { selectedVariant, money } from "./catalogService.js";
import { refundPayment } from "./refundService.js";
import { sendOrderConfirmationEmail } from "./notificationService.js";

const reserveInventory = async (items) => {
  const reserved = [];

  try {
    for (const item of items) {
      const field = item.variantId ? "variants.$.stock" : "stock";

      const filter = {
        _id: item.product._id,
        status: "active",
        approvalStatus: "approved",
      };

      if (item.variantId) {
        filter.variants = {
          $elemMatch: {
            _id: item.variantId,
            stock: { $gte: item.quantity },
          },
        };
      } else {
        filter.stock = { $gte: item.quantity };
      }

      const result = await Product.updateOne(
        filter,
        {
          $inc: {
            [field]: -item.quantity,
          },
        }
      );

      if (!result.modifiedCount) {
        throw new Error(`Not enough stock for ${item.product.name}`);
      }

      reserved.push({
        product: item.product._id,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }

    return reserved;
  } catch (error) {
    await restoreInventory(reserved);
    throw error;
  }
};

const restoreInventory = async (items) => {
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        {
          _id: item.product,
          ...(item.variantId
            ? { "variants._id": item.variantId }
            : {}),
        },
        {
          $inc: {
            [item.variantId
              ? "variants.$.stock"
              : "stock"]: item.quantity,
          },
        }
      )
    )
  );
};

export const finalizePaidOrder = async (payment) => {
  const existing = await Order.findOne({
    payment: payment._id,
  });

  if (existing) {
    return existing;
  }

  if (payment.status === "refunded") {
    throw new Error("Payment was refunded");
  }

  const snapshot = payment.cartSnapshot || [];

  if (!snapshot.length) {
    throw new Error("Payment cart snapshot is empty");
  }

  const productIds = snapshot.map((item) => item.product);

  const products = await Product.find({
    _id: { $in: productIds },
  });

  const productMap = new Map(
    products.map((product) => [
      String(product._id),
      product,
    ])
  );

  const itemsNow = snapshot.map((entry) => {
    const product = productMap.get(
      String(entry.product)
    );

    if (
      !product ||
      product.status !== "active" ||
      product.approvalStatus !== "approved"
    ) {
      throw new Error(
        "A product is no longer available"
      );
    }

    const choice = selectedVariant(
      product,
      entry.variantId
    );

    return {
      product,
      variantId:
        choice.variant?._id || null,
      variantAttributes:
        choice.variant?.attributes || {},
      quantity: entry.quantity,
      price: entry.price,
    };
  });

  let reserved = [];
  let couponReserved = false;

  try {
    reserved =
      await reserveInventory(itemsNow);

    if (payment.couponCode) {
      const coupon =
        await Coupon.findOneAndUpdate(
          {
            code: payment.couponCode,
            active: true,
            expiresAt: { $gte: new Date() },
            $or: [
              { usageLimit: null },
              {
                $expr: {
                  $lt: [
                    "$usedCount",
                    "$usageLimit",
                  ],
                },
              },
            ],
          },
          {
            $inc: {
              usedCount: 1,
            },
          },
          {
            new: true,
          }
        );

      if (!coupon) {
        throw new Error(
          "Coupon usage limit reached after payment"
        );
      }

      couponReserved = true;
    }

    const items = itemsNow.map((entry) => ({
      product: entry.product._id,
      vendor: entry.product.vendor,
      variantId: entry.variantId,
      variantAttributes:
        entry.variantAttributes,
      name: entry.product.name,
      image:
        entry.product.images?.[0] || "",
      quantity: entry.quantity,
      price: entry.price,
    }));

    const groups = new Map();

    for (const item of items) {
      const vendor = String(item.vendor);

      if (!groups.has(vendor)) {
        groups.set(vendor, {
          vendor: item.vendor,
          items: [],
          subtotal: 0,
          status: "confirmed",
          history: [
            {
              status: "confirmed",
              changedAt: new Date(),
            },
          ],
        });
      }

      const group = groups.get(vendor);

      group.items.push(item);

      group.subtotal = money(
        group.subtotal +
          item.price * item.quantity
      );
    }

    const order = await Order.create({
      user: payment.user,
      payment: payment._id,
      items,
      vendorOrders: [...groups.values()],
      subtotalAmount:
        payment.subtotalAmount,
      discountAmount:
        payment.discountAmount,
      shippingAmount:
        payment.shippingAmount,
      taxAmount: payment.taxAmount,
      shippingMethod:
        payment.shippingMethod,
      totalAmount: payment.totalAmount,
      couponCode: payment.couponCode,
      status: "paid",
      paymentStatus: "paid",
      statusHistory: [
        {
          status: "paid",
          note: "Stripe payment verified",
        },
      ],
      shippingAddress:
        payment.shippingAddress,
    });

    reserved = [];

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          order: order._id,
          status: "succeeded",
        },
      }
    );

    await Cart.updateOne(
      { user: payment.user },
      {
        $set: {
          items: [],
        },
      }
    );

    await Notification.create({
      user: payment.user,
      type: "order",
      title: "Order placed",
      message: `Order #${String(
        order._id
      ).slice(-8)} is confirmed`,
      link: "/orders",
    }).catch(() => {});

    const user = await User.findById(
      payment.user
    );

    if (user) {
      sendOrderConfirmationEmail(
        user,
        order
      ).catch(() => {});
    }

    return order;
  } catch (error) {
    if (reserved.length) {
      await restoreInventory(reserved);
    }

    if (couponReserved) {
      await Coupon.updateOne(
        {
          code: payment.couponCode,
        },
        {
          $inc: {
            usedCount: -1,
          },
        }
      );
    }

    if (
      /stock|coupon|available/i.test(
        String(error.message || "")
      )
    ) {
      try {
        await refundPayment(
          payment,
          payment.amount / 100,
          "Unable to finalize order after payment"
        );
      } catch (refundError) {
        console.error(
          "Automatic order refund failed:",
          refundError
        );
      }
    }

    if (error.code === 11000) {
      const existing =
        await Order.findOne({
          payment: payment._id,
        });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
};