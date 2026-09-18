import api from "../../api/axios";

export const TABS = [
  "overview",
  "products",
  "orders",
  "returns",
  "store",
];

export const EMPTY_PRODUCT = {
  name: "",
  description: "",
  brand: "",
  price: "",
  stock: "",
  category: "",
  images: [],
  status: "active",
  sku: "",
  salePrice: "",
  lowStockThreshold: 5,
  variants: [],
};

export const VENDOR_ORDER_STATUSES = [
  "processing",
  "shipped",
];

export const capitalize = (word) =>
  word[0].toUpperCase() + word.slice(1);

export const uploadImage = async (file) => {
  const body = new FormData();

  body.append("image", file);

  const response = await api.post(
    "/uploads",
    body,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data.data.url;
};

