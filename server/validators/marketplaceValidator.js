import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i);

const text = (max) => z.string().trim().min(1).max(max);

const variant = z
  .object({
    _id: id.optional(),

    attributes: z.record(z.string(), text(80)),

    sku: text(80),

    price: z.coerce.number().finite().nonnegative(),

    stock: z.coerce.number().int().nonnegative(),
  })
  .strict();

export const productSchema = z
  .object({
    name: text(160),

    category: id,

    description: z.string().max(5000).default(""),

    brand: z.string().max(120).default(""),

    price: z.coerce.number().finite().nonnegative(),

    stock: z.coerce.number().int().nonnegative(),

    images: z.array(z.string().url()).max(12).default([]),

    status: z.enum(["draft", "active", "inactive"]).default("active"),

    sku: z.string().max(80).default(""),

    salePrice: z.coerce.number().finite().nonnegative().nullable().optional(),

    lowStockThreshold: z.coerce.number().int().nonnegative().default(5),

    tags: z.array(text(60)).max(20).default([]),

    specifications: z.record(z.string(), z.string().max(200)).default({}),

    variants: z.array(variant).max(40).default([]),
  })
  .strict();

export const cartSchema = z
  .object({
    productId: id,

    variantId: id.nullable().optional(),

    quantity: z.number().int().positive().max(99),
  })
  .strict();

export const addressSchema = z
  .object({
    address: text(160),

    city: text(80),

    state: z.string().max(80).optional(),

    postalCode: text(30),

    country: text(80),
  })
  .strict();

export const intentSchema = z
  .object({
    couponCode: z.string().trim().max(60).optional(),

    shippingMethodId: id.nullable().optional(),

    shippingAddress: addressSchema,
  })
  .strict();

export const orderSchema = z
  .object({
    paymentIntentId: text(150),
  })
  .strict();
