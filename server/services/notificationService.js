import { sendEmail } from "../utils/sendEmail.js";
import { simpleEmail } from "../utils/emailTemplates.js";

export const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: "Welcome to MERN Market",
    html: simpleEmail(`Welcome ${user.name}!`, "Your account has been created successfully."),
  });

export const sendPasswordResetEmail = (user, token) =>
  sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: simpleEmail(
      "Reset your password",
      `Open ${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`
    ),
  });

export const sendOrderConfirmationEmail = (user, order) =>
  sendEmail({
    to: user.email,
    subject: "Order confirmed",
    html: simpleEmail("Order confirmed", `Your order ${order._id} has been created successfully.`),
  });

export const sendOrderStatusUpdateEmail = (user, order, newStatus) =>
  sendEmail({
    to: user.email,
    subject: "Order status updated",
    html: simpleEmail("Order update", `Order ${order._id} is now ${newStatus}.`),
  });

export const sendVendorApprovalEmail = (user, vendor) =>
  sendEmail({
    to: user.email,
    subject: "Vendor application update",
    html: simpleEmail(
      "Vendor application",
      `Your store ${vendor.storeName} is now ${vendor.status}.`
    ),
  });
