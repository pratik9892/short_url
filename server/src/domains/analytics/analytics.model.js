import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      required: true,
      index: true,
    },
    linkOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    longUrl: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    referer: {
      type: String,
    },
    country: {
      type: String,
    },
    region: {
      type: String,
    },
    city: {
      type: String,
    },
    deviceType: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Analytics = mongoose.model("Analytics", analyticsSchema);


