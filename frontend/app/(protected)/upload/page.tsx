"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileImage, CheckCircle, AlertCircle, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "react-hot-toast"

import { axiosInstance } from "../../../lib/axios"

export default function UploadPage() {
  const [patientName, setPatientName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [scanType, setScanType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [aiResult, setAiResult] = useState<any | null>(null)
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [overallAbnormal, setOverallAbnormal] = useState<boolean | null>(null);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please upload a medical scan file")
      return
    }

    setIsUploading(true)
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    setIsUploading(false)

    setIsAnalyzing(true)

    const formData = new FormData()
    formData.append("fullName", patientName)
    formData.append("age", age.toString())
    formData.append("gender", gender)
    formData.append("scanType", scanType)
    formData.append("phone", phoneNumber)
    formData.append("address", address)
    if (file) {
      formData.append("scanImage", file)
    }

    try {
      const response = await axiosInstance.post("/patients", formData)
      const result = response.data

      console.log("Upload response:", result)
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setIsAnalyzing(false)

      if (result) {
        setAnalysisComplete(true)
        setAiResult(result.analysisResult)
        setOverallConfidence(result.confidence);
        setOverallAbnormal(result.isAbnormal); 
        toast.success("Scan uploaded and analyzed successfully")
      }
    } catch (err) {
      console.error("Upload error", err)
      toast.error("Failed to upload scan")
      setIsAnalyzing(false)
    }
  }

  const resetForm = () => {
    setPatientName("")
    setAge("")
    setGender("")
    setScanType("")
    setPhoneNumber("")
    setAddress("")
    setFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setIsAnalyzing(false)
    setAnalysisComplete(false)
    setAiResult(null)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Medical Scan</h1>
        <p className="text-muted-foreground">Upload and analyze medical scans using AI-powered diagnostics</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Enter patient details and upload the medical scan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Full Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scanType">Scan Type</Label>
                  <Select value={scanType} onValueChange={setScanType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xray">X-Ray</SelectItem>
                      <SelectItem value="ctscan">CT Scan</SelectItem>
                      <SelectItem value="mri">MRI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Patient Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter patient Phone Number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Patient Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter patient Address"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Medical Scan File</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, DICOM up to 10MB</p>
                  </label>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">Analyzing scan with AI...</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isUploading || isAnalyzing || analysisComplete}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : isAnalyzing ? "Analyzing..." : "Upload & Analyze"}
              </Button>

              {analysisComplete && (
                <Button type="button" variant="outline" className="w-full bg-transparent" onClick={resetForm}>
                  Upload Another Scan
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI-powered diagnostic results and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisComplete ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileImage className="mx-auto h-12 w-12 mb-4" />
                  <p>Upload a scan to see AI analysis results</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Analysis Complete</span>
                </div>

              

                {/* Cute Gemini text bubble */}
                <div className="mt-2 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-[1px] shadow-sm">
                  <div className="rounded-2xl bg-white/80 dark:bg-slate-950/80 p-4 flex gap-3">
                    <div className="mt-1">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg">
                        🩺
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">AI Summary (Gemini)</h3>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Not a diagnosis
                        </span>
                      </div>
                      {aiResult ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-3">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border-0 shadow-sm bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                {overallAbnormal ? "Flagged as Abnormal" : "Likely Normal"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border-0 shadow-sm bg-gradient-to-r from-sky-100 to-indigo-50 text-indigo-800"
                              >
                                <Sparkles className="h-3 w-3" />
                                Confidence: {overallConfidence}%
                              </Badge>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line">
                              {aiResult ?? "No AI summary available for this scan."}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No AI summary available for this scan.
                          </p>
                        )}

                      <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                        <AlertCircle className="h-3 w-3 mt-[2px]" />
                        <span>
                          This explanation is generated by an AI assistant and is for informational purposes only. Always consult a licensed clinician for medical decisions.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
