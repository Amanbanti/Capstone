import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    scanType: {
      type: String,
      required: true,
      enum: ["xray", "ctscan", "mri"],
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    scanImage: {
      type: String,
      required: true,
    },
    // LLM-generated analysis text
    analysisResult: {
      type: String,
      default: null,
    },
    isAbnormal: {
      type: Boolean,
      default: false,
    },
    confidence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
