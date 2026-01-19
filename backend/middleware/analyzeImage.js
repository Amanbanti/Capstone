import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { generateChexnetReport, generateCtReport, generateMRIReport } from "../utils/geminiClient.js";

// Define __filename and __dirname for ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * analyzeImage middleware
 * Runs local AI models based on uploaded scan type
 * Expected: req.file.scanType = 'xray' | 'ct' | 'mri'
 */
export const analyzeImage = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const scanType = req.body.scanType; // 'xray', 'ctscan', or 'mri'
    if (!scanType) {
      return res
        .status(400)
        .json({ error: "Scan type not provided in req.body.scanType" });
    }
  }

  catch(err){

  }
}