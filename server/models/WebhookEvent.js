import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
    },

    processedAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("WebhookEvent", webhookEventSchema);
