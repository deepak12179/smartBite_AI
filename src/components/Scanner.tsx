import React, { useState, useRef } from "react";
import { Camera, Upload, RefreshCw, Check, Sparkles, Smile, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { FoodLog, UserProfile, MealType } from "../types";

interface ScannerProps {
  profile: UserProfile;
  onLogMeal: (log: Omit<FoodLog, "id" | "userId" | "timestamp" | "date">) => void;
  onClose: () => void;
}

export default function Scanner({ profile, onLogMeal, onClose }: ScannerProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "manual">("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [mealType, setMealType] = useState<MealType>("Breakfast");
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Manual Input States
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualCalories, setManualCalories] = useState<number | "">("");
  const [manualProtein, setManualProtein] = useState<number | "">("");
  const [manualCarbs, setManualCarbs] = useState<number | "">("");
  const [manualFats, setManualFats] = useState<number | "">("");
  const [manualSummary, setManualSummary] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  
  // Camera specific captures
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto clean up camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      // Wait for React to render the video element first
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setCameraError("Camera access was blocked or is unavailable. Please choose upload or presets instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
        setAnalysisResult(null);
        setErrorText(null);
        stopCamera();
      }
    }
  };

  const samplePlates = [
    {
      name: "Avocado Salad Plate",
      img: "🥗",
      base64: "MOCK_SALAD", // we trigger the mock salmon/rich items handled gracefully by express backend when Gemini key might be absent or generic
      mime: "image/png",
      label: "Try Healthy Salad"
    },
    {
      name: "Choc Fudge Cookies",
      img: "🍪",
      base64: "MOCK_COOKIE",
      mime: "image/png",
      label: "Try Sweet Cheat Meal"
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        setErrorText(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Convert raw base64 standard representation
  const performScanning = async (base64String: string) => {
    setIsScanning(true);
    setErrorText(null);

    try {
      // Extract the raw base64
      let cleanBase64 = base64String;
      let mimeType = "image/jpeg";
      if (base64String.includes(",")) {
        const parts = base64String.split(",");
        cleanBase64 = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
      }

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType,
          userProfile: {
            age: profile.age,
            weight: profile.weight,
            dietPlan: profile.dietPlan,
            healthGoals: profile.healthGoals,
            dailyGoal: profile.dailyCalorieGoal
          }
        })
      });

      if (!response.ok) {
        throw new Error("HTTP connection failed: " + response.statusText);
      }

      const data = await response.json();
      
      // If mock Salmon triggered, let's adjust slightly for visual diversity if they clicked Cookie
      if (data.isMock && base64String === "MOCK_COOKIE") {
        setAnalysisResult({
          foodName: "Triple Chocolate Chip Cookies",
          confidence: 0.98,
          calories: 450,
          protein: 4,
          carbs: 65,
          fats: 24,
          vitamins: ["Sodium: 12% DV", "Sugar: 38g"],
          minerals: ["Calcium: 2%", "Iron: 4%"],
          dietaryFiber: 1,
          healthScore: 32,
          summary: "This is a sugar-dense caloric dessert. It is high in refined carbohydrates and saturated fats while lacking cellular dietary fiber and bioavailable proteins.",
          suitability: {
            recommendation: "AVOID",
            reason: `Directly impacts your '${profile.healthGoals}' goal. Refined sugars trigger high insulin spikes, leading to calorie storage and sudden fatigue loops.`
          }
        });
      } else {
        setAnalysisResult(data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText("Gemini scanning service timed out. Please verify your connection setup.");
    } finally {
      setIsScanning(false);
    }
  };

  const estimateFoodNutrition = async () => {
    if (!manualFoodName.trim()) {
      setErrorText("Please enter a food name first to estimate.");
      return;
    }
    setIsEstimating(true);
    setErrorText(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/estimate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: manualFoodName.trim(),
          userProfile: {
            age: profile.age,
            weight: profile.weight,
            dietPlan: profile.dietPlan,
            healthGoals: profile.healthGoals,
            dailyGoal: profile.dailyCalorieGoal
          }
        })
      });

      if (!response.ok) {
        throw new Error("Estimation query failed: " + response.statusText);
      }

      const data = await response.json();
      setAnalysisResult(data);
      // Autofill manual input values
      setManualCalories(data.calories);
      setManualProtein(data.protein);
      setManualCarbs(data.carbs);
      setManualFats(data.fats);
      setManualSummary(data.summary);
    } catch (err: any) {
      console.error(err);
      setErrorText("Gemini estimating service is temporarily unavailable. Please type nutritional values manually.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleConfirmSave = () => {
    if (activeTab === "manual") {
      if (!manualFoodName.trim()) {
        setErrorText("Please enter a food name.");
        return;
      }
      const finalCals = Number(manualCalories) || 0;
      const finalPro = Number(manualProtein) || 0;
      const finalCarbs = Number(manualCarbs) || 0;
      const finalFats = Number(manualFats) || 0;

      onLogMeal({
        foodName: manualFoodName.trim(),
        mealType,
        calories: finalCals,
        protein: finalPro,
        carbs: finalCarbs,
        fats: finalFats,
        dietaryFiber: analysisResult?.dietaryFiber || 0,
        healthScore: analysisResult?.healthScore || (finalPro > 15 ? 85 : 70),
        vitamins: analysisResult?.vitamins || [],
        minerals: analysisResult?.minerals || [],
        summary: manualSummary || `Manually logged food portion. Estimated calories: ${finalCals} kcal.`,
        recommendation: analysisResult?.suitability?.recommendation || (finalCals > 500 ? "MODERATE" : "EAT"),
        reason: analysisResult?.suitability?.reason || "Manually recorded item to guide personal nutrition progress.",
        imageBase64: undefined
      });
      onClose();
      return;
    }

    if (!analysisResult) return;

    onLogMeal({
      foodName: analysisResult.foodName,
      mealType,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fats: analysisResult.fats,
      dietaryFiber: analysisResult.dietaryFiber || 0,
      healthScore: analysisResult.healthScore,
      vitamins: analysisResult.vitamins || [],
      minerals: analysisResult.minerals || [],
      summary: analysisResult.summary || "",
      recommendation: analysisResult.suitability?.recommendation || "EAT",
      reason: analysisResult.suitability?.reason || "",
      imageBase64: selectedImage && !selectedImage.startsWith("MOCK") ? selectedImage.split(",")[1] : undefined
    });

    onClose();
  };

  return (
    <div id="scanner_station" className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
      <div className="flex justify-between items-center pb-4 border-b border-stone-100">
        <div>
          <span className="text-[10px] tracking-wider font-bold text-stone-400 font-mono uppercase">AI COMPUTER VISION</span>
          <h2 className="text-xl font-extrabold text-stone-900 font-sans tracking-tight">Personal Meal Scanner</h2>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Left Side: Upload block */}
        <div className="md:col-span-5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-500 font-mono">SELECT SOURCE</label>
              <span className="text-[11px] text-emerald-600 font-semibold">• Active</span>
            </div>
            
            {/* Source selector tabs */}
            <div className="flex bg-stone-100 p-1 rounded-xl gap-1 font-sans">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  stopCamera();
                }}
                className={`flex-1 text-center py-2 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === "upload" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                File & Presets
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("camera");
                  startCamera();
                }}
                className={`flex-1 text-center py-2 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === "camera" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-850"
                }`}
              >
                📹 Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("manual");
                  stopCamera();
                }}
                className={`flex-1 text-center py-2 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-stone-500 hover:text-stone-850"
                }`}
              >
                📝 Manual / AI
              </button>
            </div>
          </div>

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {activeTab === "camera" && (
            /* Live Camera view box */
            <div id="live_camera_view" className="border border-stone-250 rounded-2xl aspect-square bg-stone-950 relative overflow-hidden flex flex-col justify-between">
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              />
              
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-mono px-2 py-1 rounded-md font-extrabold z-10">
                Live Video Feed
              </div>

              {/* Aiming crosshairs overlay */}
              <div className="absolute inset-16 border-2 border-dashed border-white/20 rounded-full pointer-events-none flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981]"></div>
              </div>

              <div className="absolute bottom-3 inset-x-3 flex gap-2 z-10">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-grow bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("upload");
                    stopCamera();
                  }}
                  className="bg-stone-900/80 hover:bg-stone-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            /* Target canvas container */
            <div 
              id="upload_canvas_container"
              onClick={triggerUploadClick}
              className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer relative overflow-hidden transition ${
                selectedImage ? "border-emerald-500/60" : "border-stone-300 hover:border-emerald-500"
              }`}
            >
              {selectedImage ? (
                <>
                  {selectedImage.startsWith("MOCK") ? (
                    <div className="text-6xl select-none animate-bounce">
                      {selectedImage === "MOCK_SALAD" ? "🥗" : "🍪"}
                    </div>
                  ) : (
                    <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  )}

                  {/* Glowing Scanning Animation Line */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite] z-20"></div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition z-10 text-white text-xs font-bold gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Replace Photo</span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5 text-stone-500" />
                  </div>
                  <div>
                    <span className="text-emerald-600 font-bold text-sm block">Choose snapshot image</span>
                    <span className="text-stone-400 text-xs font-semibold block mt-1">PNG, JPG or JPEG up to 10MB</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            /* Gorgeous Manual Entry form */
            <div id="manual_log_form" className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-sm font-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest font-mono">Dishes & Ingredients Name</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={manualFoodName}
                    onChange={(e) => setManualFoodName(e.target.value)}
                    placeholder="e.g. Chicken Caesar Salad or Oatmeal"
                    className="flex-1 px-3 py-2 border border-stone-250 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={estimateFoodNutrition}
                    disabled={isEstimating || !manualFoodName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {isEstimating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    )}
                    <span>Estimate with AI</span>
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 block font-semibold leading-normal">Type any dishes & let Gemini forecast calories, macros, and suitability profiles beautifully.</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 font-mono">CALORIES (KCAL)</label>
                  <input
                    type="number"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 350"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-400 text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 font-mono">PROTEIN (G)</label>
                  <input
                    type="number"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 24"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-400 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 font-mono">CARBOHYDRATES (G)</label>
                  <input
                    type="number"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-400 text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 font-mono">FATS (G)</label>
                  <input
                    type="number"
                    value={manualFats}
                    onChange={(e) => setManualFats(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 8"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-400 text-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-stone-500 font-mono">Composition Notes / Nutritional Summary</label>
                <textarea
                  value={manualSummary}
                  onChange={(e) => setManualSummary(e.target.value)}
                  placeholder="Tell us about the ingredients or keep the auto-estimated summary..."
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-400 resize-none text-stone-850"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={!manualFoodName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-705 text-white font-bold py-2.5 rounded-xl transition text-xs select-none disabled:opacity-40 cursor-pointer"
              >
                Log Manual Entry to Tracker
              </button>
            </div>
          )}

          {/* Quick Trial onboarding presets */}
          {activeTab === "upload" && !selectedImage && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-stone-400 font-mono block font-sans">QUICK TRY DEMO PRESETS:</span>
              <div className="grid grid-cols-2 gap-2">
                {samplePlates.map((plate, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(plate.base64);
                      setAnalysisResult(null);
                    }}
                    className="p-2 border border-stone-200 hover:border-emerald-500 rounded-xl flex items-center gap-2 text-xs font-bold bg-stone-50 text-stone-700 transition cursor-pointer"
                  >
                    <span className="text-lg shrink-0">{plate.img}</span>
                    <span className="truncate">{plate.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Action button logic */}
          {selectedImage && !isScanning && (
            <div className="flex gap-2">
              <button
                onClick={() => performScanning(selectedImage)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Run Instant AI Scan</span>
              </button>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysisResult(null);
                  setErrorText(null);
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold p-3 rounded-xl transition text-xs sm:text-sm"
              >
                Clear
              </button>
            </div>
          )}

          {/* Loading view state */}
          {isScanning && (
            <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-3.5 border border-stone-200">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <div>
                <strong className="text-xs text-stone-800 block">Gemini analyzing food composition...</strong>
                <span className="text-[10px] text-stone-400 font-mono">Processing raw calorie profiles</span>
              </div>
            </div>
          )}

          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}
        </div>

        {/* Right Side: Displaying returned analysis fields */}
        <div className="md:col-span-7 space-y-5">
          {!analysisResult ? (
            <div className="bg-stone-50/50 rounded-2xl p-8 text-center border border-stone-200/60 h-full flex flex-col justify-center items-center space-y-3">
              <HelpCircle className="w-10 h-10 text-stone-300" />
              <div className="max-w-xs">
                <span className="font-bold text-sm text-stone-500 block">No food scanned yet</span>
                <span className="text-xs text-stone-400 font-semibold leading-normal block mt-1">Upload a meal image, then press &quot;Run Instant AI Scan&quot; to inspect full micro nutritional scores.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Header result */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-bold font-mono text-stone-400 uppercase">IDENTIFIED DISH</span>
                  <h3 className="text-xl font-bold text-stone-900 leading-tight">{analysisResult.foodName}</h3>
                  <div className="text-[11px] text-stone-400 font-mono mt-0.5">Recognition Confidence: {Math.round(analysisResult.confidence * 100)}%</div>
                </div>

                {/* Score badge */}
                <div className="p-2 bg-stone-50 rounded-2xl border border-stone-200 text-center shrink-0 min-w-[70px]">
                  <span className="block text-[8px] font-bold text-stone-400 font-mono uppercase">QUALITY</span>
                  <span className={`text-lg font-black block leading-none mt-0.5 ${
                    analysisResult.healthScore >= 80 ? "text-emerald-600" :
                    analysisResult.healthScore >= 50 ? "text-amber-500" :
                    "text-rose-500"
                  }`}>{analysisResult.healthScore}</span>
                  <span className="text-[8px] text-stone-400 tracking-wide block font-semibold">/ 100 max</span>
                </div>
              </div>

              {/* Suitability recommendation box */}
              <div className={`p-4 rounded-xl border flex gap-3 ${
                analysisResult.suitability?.recommendation === "EAT" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                analysisResult.suitability?.recommendation === "MODERATE" ? "bg-amber-50 border-amber-200 text-amber-900" :
                "bg-rose-50 border-rose-200 text-rose-900"
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  analysisResult.suitability?.recommendation === "EAT" ? "bg-emerald-100 text-emerald-800" :
                  analysisResult.suitability?.recommendation === "MODERATE" ? "bg-amber-100 text-amber-800" :
                  "bg-rose-100 text-rose-800"
                }`}>
                  {analysisResult.suitability?.recommendation === "EAT" ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase font-mono tracking-wider">
                    RECOMMENDED: {analysisResult.suitability?.recommendation}
                  </div>
                  <p className="text-xs font-semibold leading-relaxed opacity-95">{analysisResult.suitability?.reason}</p>
                </div>
              </div>

              {/* Main macros pill logs */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-150 text-center">
                  <span className="block text-[9px] font-bold text-stone-400 font-mono">CALORIES</span>
                  <span className="text-sm font-black text-stone-900 block mt-0.5">{analysisResult.calories} kcal</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-150 text-center">
                  <span className="block text-[9px] font-bold text-stone-400 font-mono">PROTEIN</span>
                  <span className="text-sm font-black text-stone-950 block mt-0.5">{analysisResult.protein}g</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-150 text-center">
                  <span className="block text-[9px] font-bold text-stone-400 font-mono">CARBS</span>
                  <span className="text-sm font-black text-stone-950 block mt-0.5">{analysisResult.carbs}g</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-150 text-center">
                  <span className="block text-[9px] font-bold text-stone-400 font-mono">FATS</span>
                  <span className="text-sm font-black text-stone-950 block mt-0.5">{analysisResult.fats}g</span>
                </div>
              </div>

              {/* Summary paragraph */}
              <div className="space-y-1.5">
                <strong className="text-xs text-stone-500 font-mono uppercase block">COMPOSITION SUMMARY</strong>
                <p className="text-xs text-stone-600 leading-relaxed font-semibold">{analysisResult.summary}</p>
              </div>

              {/* Vitamins and minerals lists */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 font-mono uppercase block">VITAMINS DETECTED</span>
                  {analysisResult.vitamins && analysisResult.vitamins.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.vitamins.map((v: string, i: number) => (
                        <span key={i} className="text-[10px] font-semibold font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-100">{v}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">None detected</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 font-mono uppercase block">MINERALS DETECTED</span>
                  {analysisResult.minerals && analysisResult.minerals.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.minerals.map((m: string, i: number) => (
                        <span key={i} className="text-[10px] font-semibold font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100">{m}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">None detected</span>
                  )}
                </div>
              </div>

              {/* Meal Select Category controls and confirming save buttons */}
              <div className="pt-5 border-t border-stone-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between border-b sm:border-0 pb-3 sm:pb-0">
                  <label className="text-xs font-bold text-stone-500 font-mono shrink-0">MEAL CLASSIFICATION</label>
                  <select 
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="bg-stone-50 border border-stone-250 hover:border-stone-450 p-2 rounded-xl text-xs font-bold text-stone-700 font-mono cursor-pointer"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                <button
                  onClick={handleConfirmSave}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Log to Daily Nutrition Tracker</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
