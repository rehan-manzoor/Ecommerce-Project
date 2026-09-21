import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";

import Orders from "../pages/Orders";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  notify: vi.fn(),
  openDialog: vi.fn(),
}));

vi.mock("../api/axios", () => ({
  default: {
    get: mocks.apiGet,
    post: mocks.apiPost,
  },
}));

vi.mock("../components/Toast", () => ({
  notify: mocks.notify,
}));

vi.mock("../components/Dialog", () => ({
  useDialog: () => mocks.openDialog,
}));

const pendingOrder = {
  _id: "order-12345678",
  status: "confirmed",
  createdAt: "2026-09-16T12:00:00.000Z",
  totalAmount: 220,
  shippingAmount: 10,
  taxAmount: 10,
  discountAmount: 0,
  couponCode: "",
  items: [
    {
      product: {
        _id: "product-1",
        name: "Test Product",
        images: ["https://example.com/product.jpg"],
      },
      name: "Test Product",
      image: "https://example.com/product.jpg",
      quantity: 2,
      price: 100,
    },
  ],
  vendorOrders: [
    {
      _id: "group-1",
      vendor: {
        _id: "vendor-1",
        storeName: "Test Store",
      },
      status: "confirmed",
      items: [
        {
          product: "product-1",
          name: "Test Product",
          quantity: 2,
          price: 100,
        },
      ],
      history: [
        {
          status: "confirmed",
          changedAt: "2026-09-16T12:00:00.000Z",
        },
      ],
      carrier: "",
      trackingNumber: "",
    },
  ],
};

const deliveredOrder = {
  ...pendingOrder,
  _id: "order-delivered-87654321",
  status: "delivered",
  vendorOrders: [
    {
      _id: "group-2",
      vendor: {
        _id: "vendor-1",
        storeName: "Test Store",
      },
      status: "delivered",
      items: [
        {
          product: "product-1",
          name: "Test Product",
          quantity: 2,
          price: 100,
        },
      ],
      history: [
        {
          status: "delivered",
          changedAt: "2026-09-16T12:00:00.000Z",
        },
      ],
      carrier: "TCS",
      trackingNumber: "TRACK123",
    },
  ],
};

const renderOrders = () =>
  render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
});

describe("Orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.apiGet.mockResolvedValue({
      data: {
        data: [pendingOrder],
      },
    });

    mocks.apiPost.mockResolvedValue({
      data: {
        success: true,
      },
    });

    mocks.openDialog.mockResolvedValue({
      reason: "Changed my mind",
    });
  });

  it("loads and displays the user's orders", async () => {
    renderOrders();

    await waitFor(() => {
      expect(mocks.apiGet).toHaveBeenCalledWith("/orders/my");
    });

    expect(
      await screen.findByRole("heading", {
        name: "#12345678",
      })
    ).toBeInTheDocument();

    expect(screen.getByText("Test Store · confirmed")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Test Product",
      })
    ).toHaveAttribute("href", "/products/product-1");

    expect(
      screen.getByRole("button", {
        name: "Cancel seller items",
      })
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no orders", async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        data: [],
      },
    });

    renderOrders();

    expect(
      await screen.findByRole("heading", {
        name: "No orders yet",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Start shopping",
      })
    ).toHaveAttribute("href", "/products");
  });

  it("opens the cancellation dialog", async () => {
    renderOrders();

    const cancelButton = await screen.findByRole("button", {
      name: "Cancel seller items",
    });

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mocks.openDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Cancel seller items",
          confirmLabel: "Cancel items",
          danger: true,
        })
      );
    });
  });

  it("cancels seller items and refreshes the order list", async () => {
    mocks.apiGet
      .mockResolvedValueOnce({
        data: {
          data: [pendingOrder],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

    renderOrders();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Cancel seller items",
      })
    );

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith("/orders/order-12345678/vendors/vendor-1/cancel", {
        reason: "Changed my mind",
      });
    });

    await waitFor(() => {
      expect(mocks.apiGet).toHaveBeenCalledTimes(2);
    });

    expect(mocks.notify).toHaveBeenCalledWith("Cancellation and refund initiated");

    expect(
      screen.getByRole("heading", {
        name: "No orders yet",
      })
    ).toBeInTheDocument();
  });

  it("does not cancel when the dialog returns no reason", async () => {
    mocks.openDialog.mockResolvedValue(null);

    renderOrders();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Cancel seller items",
      })
    );

    await waitFor(() => {
      expect(mocks.openDialog).toHaveBeenCalled();
    });

    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it("shows a cancellation error when the API fails", async () => {
    mocks.apiPost.mockRejectedValue({
      response: {
        data: {
          message: "Cancellation is not allowed",
        },
      },
    });

    renderOrders();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Cancel seller items",
      })
    );

    await waitFor(() => {
      expect(mocks.notify).toHaveBeenCalledWith("Cancellation is not allowed", "error");
    });
  });

  it("shows tracking information for a delivered order", async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        data: [deliveredOrder],
      },
    });

    renderOrders();

    expect(await screen.findByText("Tracking: TCS · TRACK123")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Return Test Product",
      })
    ).toBeInTheDocument();
  });

  it("submits a return request for a delivered item", async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        data: [deliveredOrder],
      },
    });

    mocks.openDialog.mockResolvedValue({
      reason: "Item arrived damaged",
    });

    renderOrders();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Return Test Product",
      })
    );

    await waitFor(() => {
      expect(mocks.openDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Return Test Product",
          confirmLabel: "Request return",
        })
      );
    });

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith("/returns", {
        orderId: "order-delivered-87654321",
        productId: "product-1",
        quantity: 2,
        reason: "Item arrived damaged",
      });
    });

    expect(mocks.notify).toHaveBeenCalledWith("Return requested");
  });

  it("shows an error when a return request fails", async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        data: [deliveredOrder],
      },
    });

    mocks.openDialog.mockResolvedValue({
      reason: "Item arrived damaged",
    });

    mocks.apiPost.mockRejectedValue({
      response: {
        data: {
          message: "Return window expired",
        },
      },
    });

    renderOrders();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Return Test Product",
      })
    );

    await waitFor(() => {
      expect(mocks.notify).toHaveBeenCalledWith("Return window expired", "error");
    });
  });
});
