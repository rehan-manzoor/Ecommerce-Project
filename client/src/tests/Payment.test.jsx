import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";

import Payment from "../pages/Payment";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  locationState: null,

  apiPost: vi.fn(),
  notify: vi.fn(),

  stripe: {
    confirmPayment: vi.fn(),
  },

  elements: {},
}));

vi.mock("../api/axios", () => ({
  default: {
    post: mocks.apiPost,
  },
}));

vi.mock("../components/Toast", () => ({
  notify: mocks.notify,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useLocation: () => ({
      state: mocks.locationState,
    }),
  };
});

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,

  PaymentElement: () => (
    <div data-testid="payment-element">
      Stripe Payment Element
    </div>
  ),

  useStripe: () => mocks.stripe,

  useElements: () => mocks.elements,
}));

const shippingAddress = {
  address: "123 Main Road",
  city: "Lahore",
  state: "Punjab",
  postalCode: "54000",
  country: "Pakistan",
};

const initialPricing = {
  subtotalAmount: 200,
  discountAmount: 20,
  shippingAmount: 10,
  taxAmount: 17.1,
  totalAmount: 207.1,
};

const serverPricing = {
  subtotalAmount: 200,
  discountAmount: 20,
  shippingAmount: 10,
  taxAmount: 17.1,
  totalAmount: 207.1,
};

const renderPayment = () =>
  render(
    <MemoryRouter>
      <Payment />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("Payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.locationState = {
      shippingAddress,
      couponCode: "SAVE20",
      shippingMethodId: "shipping-1",
      pricing: initialPricing,
    };

    mocks.apiPost.mockResolvedValue({
      data: {
        data: {
          clientSecret: "pi_test_secret",
          pricing: serverPricing,
        },
      },
    });

    mocks.stripe.confirmPayment.mockResolvedValue({
      error: undefined,
    });
  });

  it("shows checkout summary and shipping address", () => {
    renderPayment();

    expect(
      screen.getByRole("heading", {
        name: "Complete your order",
      })
    ).toBeInTheDocument();

    expect(screen.getByText("123 Main Road")).toBeInTheDocument();
    expect(screen.getByText("Lahore, Punjab")).toBeInTheDocument();
    expect(screen.getByText("54000, Pakistan")).toBeInTheDocument();

    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText("−$20.00")).toBeInTheDocument();
    expect(screen.getByText("$17.10")).toBeInTheDocument();
    expect(screen.getByText("$207.10")).toBeInTheDocument();
  });

  it("shows missing-checkout-information state when shipping address is absent", () => {
    mocks.locationState = null;

    renderPayment();

    expect(
      screen.getByRole("heading", {
        name: "Checkout information is missing",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Back to cart",
      })
    ).toBeInTheDocument();
  });

  it("navigates back to cart from missing checkout state", () => {
    mocks.locationState = null;

    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Back to cart",
      })
    );

    expect(mocks.navigate).toHaveBeenCalledWith("/cart");
  });

  it("creates a payment intent with coupon and shipping method", async () => {
    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to payment",
      })
    );

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        "/payments/create-intent",
        {
          couponCode: "SAVE20",
          shippingMethodId: "shipping-1",
        }
      );
    });
  });

  it("stores checkout payload after payment intent is created", async () => {
    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to payment",
      })
    );

    await waitFor(() => {
      expect(
        sessionStorage.getItem("checkoutPayload")
      ).not.toBeNull();
    });

    const stored = JSON.parse(
      sessionStorage.getItem("checkoutPayload")
    );

    expect(stored).toEqual({
      shippingAddress,
      couponCode: "SAVE20",
      shippingMethodId: "shipping-1",
    });
  });

  it("renders Stripe payment form after client secret is returned", async () => {
    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to payment",
      })
    );

    expect(
      await screen.findByTestId("payment-element")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Pay $207.10",
      })
    ).toBeInTheDocument();
  });

  it("shows payment preparation error when create-intent fails", async () => {
    mocks.apiPost.mockRejectedValue({
      response: {
        data: {
          message: "Payment service unavailable",
        },
      },
    });

    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to payment",
      })
    );

    await waitFor(() => {
      expect(mocks.notify).toHaveBeenCalledWith(
        "Payment service unavailable",
        "error"
      );
    });
  });

  it("confirms Stripe payment with the expected return URL", async () => {
    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to payment",
      })
    );

    const payButton = await screen.findByRole("button", {
      name: "Pay $207.10",
    });

    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mocks.stripe.confirmPayment).toHaveBeenCalledWith({
        elements: mocks.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });
    });
  });

  it("shows Stripe payment error when confirmation fails", async () => {
    mocks.stripe.confirmPayment.mockResolvedValue({
      error: {
        message: "Your card was declined",
      },
    });

    renderPayment();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to payment",
      })
    );

    const payButton = await screen.findByRole("button", {
      name: "Pay $207.10",
    });

    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mocks.notify).toHaveBeenCalledWith(
        "Your card was declined",
        "error"
      );
    });
  });
});