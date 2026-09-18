import { useState } from "react";
import api from "../../api/axios";
import { notify } from "../Toast";
import { useDialog } from "../Dialog";
import { EMPTY_PRODUCT, uploadImage } from "./shared.js";

export function ProductsTab({
  products,
  categories,
  onChanged,
}) {
  const openDialog =
    useDialog();

  const [form, setForm] =
    useState(EMPTY_PRODUCT);

  const [editing, setEditing] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const resetForm = () => {
    setForm(EMPTY_PRODUCT);
    setEditing(null);
  };

  const edit = (product) => {
    setEditing(product._id);

    setForm({
      name: product.name,
      description:
        product.description || "",
      brand:
        product.brand || "",
      price: product.price,
      stock: product.stock,
      category:
        product.category?._id ||
        product.category,
      images:
        product.images || [],
      status: product.status,
      sku: product.sku || "",
      salePrice:
        product.salePrice ?? "",
      lowStockThreshold:
        product.lowStockThreshold ??
        5,
      variants:
        product.variants || [],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const saveProduct = async (
    event
  ) => {
    event.preventDefault();

    setSaving(true);

    try {
      const payload = {
        ...form,

        price: Number(
          form.price
        ),

        stock: Number(
          form.stock
        ),

        salePrice:
          form.salePrice === ""
            ? null
            : Number(
                form.salePrice
              ),

        lowStockThreshold:
          Number(
            form.lowStockThreshold
          ),

        variants:
          form.variants.map(
            (variant) => ({
              ...variant,

              price: Number(
                variant.price
              ),

              stock: Number(
                variant.stock
              ),
            })
          ),
      };

      if (editing) {
        await api.put(
          `/products/${editing}`,
          payload
        );
      } else {
        await api.post(
          "/products",
          payload
        );
      }

      notify(
        editing
          ? "Product updated and sent for review"
          : "Product created and sent for review"
      );

      resetForm();

      await onChanged();
    } catch (error) {
      notify(
        error.response?.data?.message ||
          "Product save failed",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      try {
        setUploading(true);

        const url =
          await uploadImage(file);

        setForm((current) => ({
          ...current,
          images: [
            ...current.images,
            url,
          ],
        }));

        notify(
          "Image uploaded"
        );
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            "Upload failed",
          "error"
        );
      } finally {
        setUploading(false);
      }
    };

  const removeProduct =
    async (product) => {
      const confirmed =
        await openDialog({
          title:
            "Delete product",

          description: `This permanently removes "${product.name}" from your store.`,

          confirmLabel:
            "Delete product",

          danger: true,
        });

      if (!confirmed) return;

      try {
        await api.delete(
          `/products/${product._id}`
        );

        notify(
          "Product deleted"
        );

        await onChanged();
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            "Delete failed",
          "error"
        );
      }
    };

  return (
    <>
      <div className="page-title">
        <h1>My products</h1>

        <p>
          Create and manage your listings.
          Material edits return a product to
          admin review.
        </p>
      </div>

      <form
        className="panel vendor-product-form"
        onSubmit={saveProduct}
      >
        <h2>
          {editing
            ? "Edit product"
            : "New product"}
        </h2>

        <div className="form-grid">
          <label>
            Name

            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Brand

            <input
              value={form.brand}
              onChange={(event) =>
                setForm({
                  ...form,
                  brand:
                    event.target.value,
                })
              }
            />
          </label>

          <label className="wide">
            Description

            <textarea
              value={
                form.description
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Price

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm({
                  ...form,
                  price:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Stock

            <input
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) =>
                setForm({
                  ...form,
                  stock:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            SKU

            <input
              value={form.sku}
              onChange={(event) =>
                setForm({
                  ...form,
                  sku:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Sale price

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.salePrice
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  salePrice:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Low stock threshold

            <input
              type="number"
              min="0"
              value={
                form.lowStockThreshold
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  lowStockThreshold:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Category

            <select
              required
              value={
                form.category
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  category:
                    event.target.value,
                })
              }
            >
              <option value="">
                Select category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category._id
                    }
                    value={
                      category._id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Listing status

            <select
              value={
                form.status
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  status:
                    event.target.value,
                })
              }
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="draft">
                Draft
              </option>
            </select>
          </label>

          <label className="wide">
            Product image

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImageUpload
              }
            />

            <small className="muted">
              {uploading
                ? "Uploading..."
                : "JPEG/PNG/WebP up to 5MB"}
            </small>
          </label>
        </div>

        <div className="panel">
          <h3>Variants</h3>

          <p className="muted">
            Add sizes, colors or storage
            options. Each has its own SKU,
            price and stock.
          </p>

          {form.variants.map(
            (
              variant,
              index
            ) => (
              <div
                className="form-grid"
                key={
                  variant._id ||
                  index
                }
              >
                <label>
                  Size / storage

                  <input
                    value={
                      variant
                        .attributes
                        ?.size ||
                      variant
                        .attributes
                        ?.storage ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          variants:
                            previous.variants.map(
                              (
                                entry,
                                i
                              ) =>
                                i ===
                                index
                                  ? {
                                      ...entry,

                                      attributes:
                                        {
                                          ...entry.attributes,

                                          size:
                                            event
                                              .target
                                              .value,
                                        },
                                    }
                                  : entry
                            ),
                        })
                      )
                    }
                  />
                </label>

                <label>
                  Color

                  <input
                    value={
                      variant
                        .attributes
                        ?.color ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          variants:
                            previous.variants.map(
                              (
                                entry,
                                i
                              ) =>
                                i ===
                                index
                                  ? {
                                      ...entry,

                                      attributes:
                                        {
                                          ...entry.attributes,

                                          color:
                                            event
                                              .target
                                              .value,
                                        },
                                    }
                                  : entry
                            ),
                        })
                      )
                    }
                  />
                </label>

                <label>
                  SKU

                  <input
                    required
                    value={
                      variant.sku
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          variants:
                            previous.variants.map(
                              (
                                entry,
                                i
                              ) =>
                                i ===
                                index
                                  ? {
                                      ...entry,

                                      sku:
                                        event
                                          .target
                                          .value,
                                    }
                                  : entry
                            ),
                        })
                      )
                    }
                  />
                </label>

                <label>
                  Price

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      variant.price
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          variants:
                            previous.variants.map(
                              (
                                entry,
                                i
                              ) =>
                                i ===
                                index
                                  ? {
                                      ...entry,

                                      price:
                                        event
                                          .target
                                          .value,
                                    }
                                  : entry
                            ),
                        })
                      )
                    }
                  />
                </label>

                <label>
                  Stock

                  <input
                    required
                    type="number"
                    min="0"
                    value={
                      variant.stock
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          variants:
                            previous.variants.map(
                              (
                                entry,
                                i
                              ) =>
                                i ===
                                index
                                  ? {
                                      ...entry,

                                      stock:
                                        event
                                          .target
                                          .value,
                                    }
                                  : entry
                            ),
                        })
                      )
                    }
                  />
                </label>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() =>
                    setForm({
                      ...form,

                      variants:
                        form.variants.filter(
                          (
                            _,
                            i
                          ) =>
                            i !==
                            index
                        ),
                    })
                  }
                >
                  Remove variant
                </button>
              </div>
            )
          )}

          <button
            type="button"
            className="button ghost"
            onClick={() =>
              setForm({
                ...form,

                variants: [
                  ...form.variants,

                  {
                    attributes: {},
                    sku: "",
                    price: "",
                    stock: "",
                  },
                ],
              })
            }
          >
            Add variant
          </button>
        </div>

        {form.images.length >
          0 && (
          <div className="image-preview-row">
            {form.images.map(
              (url, index) => (
                <div
                  key={`${url}-${index}`}
                >
                  <img
                    src={url}
                    alt="Product preview"
                  />

                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() =>
                      setForm({
                        ...form,

                        images:
                          form.images.filter(
                            (
                              _,
                              i
                            ) =>
                              i !==
                              index
                          ),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <div className="hero-actions">
          <button
            className="button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editing
                ? "Update product"
                : "Create product"}
          </button>

          {editing && (
            <button
              type="button"
              className="button ghost"
              onClick={
                resetForm
              }
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {!products.length && (
        <div className="state-card">
          <h3>
            You haven't listed any products
            yet
          </h3>
        </div>
      )}

      <div className="management-list">
        {products.map(
          (product) => (
            <div
              className="management-card panel"
              key={product._id}
            >
              <div className="management-product">
                {product.images?.[
                  0
                ] && (
                  <img
                    src={
                      product
                        .images[0]
                    }
                    alt={
                      product.name
                    }
                  />
                )}

                <div>
                  <h3>
                    {
                      product.name
                    }
                  </h3>

                  <p>
                    ${product.price} · Stock{" "}
                    {product.stock}
                  </p>

                  <span
                    className={`status-badge ${product.approvalStatus}`}
                  >
                    {
                      product.approvalStatus
                    }
                  </span>
                </div>
              </div>

              <div className="management-actions">
                <button
                  className="button ghost small"
                  onClick={() =>
                    edit(product)
                  }
                >
                  Edit
                </button>

                <button
                  className="button danger small"
                  onClick={() =>
                    removeProduct(
                      product
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
