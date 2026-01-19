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
    
    // Map scan type to Python script
    const scripts = {
      xray: "run_chexnet.py",
      ctscan: "run_ctscan.py",
      mri: "run_mri.py",
    };

    const scriptName = scripts[scanType];
    if (!scriptName) {
      return res.status(400).json({ error: "Invalid scan type" });
    }

    const scriptPath = path.join(__dirname, "../python", scriptName);
    const imagePath = req.file.path;

    console.log(`Running ${scanType} model on image: ${imagePath}`);

    execFile("python", [scriptPath, imagePath], async (error, stdout, stderr) => {
      if (error) {
        console.error(`${scanType} AI error:`, stderr || error.message);
        return res.status(500).json({ error: `${scanType} model failed` });
      }

      try {
        const rawResult = JSON.parse(stdout);
        console.log("Model rawResult:", rawResult);

        let confidence = null; // null means "not computed as global normality confidence"
        let isAbnormal = false;

        if (scanType === "xray" && rawResult && typeof rawResult === "object") {
          // X-ray: use abnormalRate-based heuristic on flat logits
          const numericValues = Object.values(rawResult).filter(
            (v) => typeof v === "number"
          );

          if (numericValues.length > 0) {
            const abnormalAbove = numericValues.filter((v) => v > 0.05).length;
            const abnormalRate = (abnormalAbove / numericValues.length) * 100;
            confidence = Number((100 - abnormalRate).toFixed(2));
            isAbnormal = abnormalRate > 50;
          }
        } else if (
          (scanType === "ctscan" || scanType === "mri") &&
          rawResult &&
          typeof rawResult === "object"
        ) {
          // CT / MRI: derive a simple confidence from top-class probability
          const scores = rawResult.scores && typeof rawResult.scores === "object"
            ? rawResult.scores
            : {};
          const vals = Object.values(scores).filter(
            (v) => typeof v === "number"
          );
          if (vals.length > 0) {
            const topProb = Math.max(...vals); // e.g. 0.4160
            confidence = Number((topProb * 100).toFixed(2));
          }

          const topClass = rawResult.top_class;
          if (scanType === "ctscan") {
            // Mark abnormal if top class is not Normal
            isAbnormal = topClass && topClass !== "Normal";
          } else if (scanType === "mri") {
            // Mark abnormal if top class is not No_Tumor
            isAbnormal = topClass && topClass !== "No_Tumor";
          }
        }

        req.confidence = confidence;
        req.isAbnormal = !!isAbnormal;

        // Dynamically pick the right LLM helper based on scanType
        let llmReportText = null;
        try {
          const patientInfo = {
            fullName: req.body.fullName,
            age: req.body.age,
            gender: req.body.gender,
            scanType,
            confidence,
            isAbnormal: !!isAbnormal,
          };

          if (scanType === "xray") {
            llmReportText = await generateChexnetReport(patientInfo, rawResult);
          } else if (scanType === "ctscan") {
            llmReportText = await generateCtReport(patientInfo, rawResult);
          } else if (scanType === "mri") {
            llmReportText = await generateMRIReport(patientInfo, rawResult);
          } else {
            llmReportText = await generateChexnetReport(patientInfo, rawResult);
          }
        } catch (llmError) {
          console.error("Gemini report generation failed:", llmError.message);
          llmReportText = null;
        }

        // For the controller / DB we only care about the text summary string.
        // createPatient already does: analysisResult: req.analysisResult?.text || null
        if (llmReportText) {
          req.analysisResult = {
            type: "gemini_report",
            text: llmReportText,
            confidence,
            isAbnormal: !!isAbnormal,
          };
        } else {
          req.analysisResult = {
            type: "numeric_fallback",
            raw: rawResult,
            confidence,
            isAbnormal: !!isAbnormal,
          };
        }

        next();
      } catch (err) {
        console.error(`${scanType} output parsing error:`, err.message);
        return res.status(500).json({ error: `${scanType} model output invalid` });
      }
    });
  }

  catch(err){

  }
}