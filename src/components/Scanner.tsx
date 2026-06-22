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

  // Advanced contextual inputs for higher fidelity calorie forecasting
  const [portionSize, setPortionSize] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [cookingMethod, setCookingMethod] = useState("");
  const [packagingLabel, setPackagingLabel] = useState("");
  const [showRefinements, setShowRefinements] = useState(false);

  // Active tab inside returned smart analysis report panel
  const [resultsTab, setResultsTab] = useState<"overview" | "micronutrition" | "recommendations">("overview");

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

  const handleImageCompression = (imageSrc: string) => {
    if (!imageSrc || !imageSrc.startsWith("data:image")) {
      setSelectedImage(imageSrc);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      const max_size = 350; // keep under 30kb in base64 string width/height limits
      if (width > height) {
        if (width > max_size) {
          height *= max_size / width;
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width *= max_size / height;
          height = max_size;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setSelectedImage(compressedDataUrl);
      } else {
        setSelectedImage(imageSrc);
      }
    };
    img.onerror = () => {
      setSelectedImage(imageSrc);
    };
    img.src = imageSrc;
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
        handleImageCompression(dataUrl);
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
        handleImageCompression(reader.result as string);
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
          portionSize,
          ingredients,
          cookingMethod,
          packagingLabel,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP connection failed (Status: ${response.status})`);
      }

      const data = await response.json();
      
      // If mock Salmon triggered, let's adjust slightly for visual diversity if they clicked Cookie
      if (data.isMock && base64String === "MOCK_COOKIE") {
        setAnalysisResult({
          ...data,
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
      setErrorText(err.message || "Failed to scan food. Please try again or type values manually.");
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP connection failed (Status: ${response.status})`);
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
      setErrorText(err.message || "Gemini estimating service is temporarily unavailable. Please type nutritional values manually.");
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

    if (!analysisResult || analysisResult.isImageUnclear) return;

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

          {/* Detailed portion & recipe helper refinements if image is loaded */}
          {selectedImage && !isScanning && (
            <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-2xl space-y-3 font-sans">
              <button
                type="button"
                onClick={() => setShowRefinements(!showRefinements)}
                className="w-full flex justify-between items-center text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">🎯 Enhance Accuracy</span>
                  <span className="text-xs font-black text-stone-700">Add Portion & Recipe Details</span>
                </div>
                <span className="text-[11px] font-bold text-stone-400">{showRefinements ? "Hide ▴" : "Add ▾"}</span>
              </button>

              {showRefinements && (
                <div className="space-y-3 pt-2.5 border-t border-stone-200/60 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider font-mono">Portion Size / Quantity</label>
                    <input
                      type="text"
                      value={portionSize}
                      onChange={(e) => setPortionSize(e.target.value)}
                      placeholder="e.g. 2 rotis, 1 cup rice, 250 ml drink"
                      className="w-full bg-white border border-stone-250 p-2 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider font-mono">Ingredients if known</label>
                    <textarea
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="e.g. wheat, potato, mustard oil, salt"
                      rows={2}
                      className="w-full bg-white border border-stone-250 p-2 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-emerald-600 font-semibold resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider font-mono font-bold">Cooking Method</label>
                      <select
                        value={cookingMethod}
                        onChange={(e) => setCookingMethod(e.target.value)}
                        className="w-full bg-white border border-stone-250 p-2 rounded-xl text-[11px] text-stone-800 focus:outline-none focus:border-emerald-600 font-bold"
                      >
                        <option value="">Default (Auto-detect)</option>
                        <option value="fried">Fried</option>
                        <option value="baked">Baked</option>
                        <option value="boiled">Boiled</option>
                        <option value="grilled">Grilled</option>
                        <option value="steamed">Steamed</option>
                        <option value="sauteed">Sauteed</option>
                        <option value="roasted">Roasted</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider font-mono">Packaging/Label Info</label>
                      <input
                        type="text"
                        value={packagingLabel}
                        onChange={(e) => setPackagingLabel(e.target.value)}
                        placeholder="e.g. Barcode descriptors"
                        className="w-full bg-white border border-stone-250 p-2 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}
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
          ) : analysisResult.isImageUnclear ? (
            <div className="bg-rose-50/70 rounded-3xl p-8 border border-rose-200 h-full flex flex-col justify-center items-center space-y-4">
              <div className="w-16 h-16 bg-rose-100/90 text-rose-600 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="max-w-sm text-center space-y-3">
                <h3 className="font-extrabold text-lg text-rose-950">Please take picture again</h3>
                <p className="text-xs text-rose-800 font-medium leading-relaxed">
                  The uploaded photo appears blurry, dark, or didn't show recognizable food clearly enough for a precise nutritional scan.
                </p>
                <div className="pt-2 pb-1 px-4 bg-white/70 border border-rose-100 rounded-2xl text-left text-[11px] text-stone-600 space-y-2 font-semibold">
                  <div className="text-rose-900 font-extrabold uppercase text-[9px] tracking-wider">Tips for a Great Scan:</div>
                  <div className="flex gap-2">
                    <span className="text-rose-500 font-bold">✓</span>
                    <span>Ensure bright, natural, or direct overhead lighting</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-rose-500 font-bold">✓</span>
                    <span>Hold your camera steady to avoid blurriness</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-rose-500 font-bold">✓</span>
                    <span>Center the food plate clearly in the screen</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {analysisResult.warning && (
                <div className="p-3 bg-amber-50/85 border border-amber-200/50 text-stone-800 rounded-xl text-xs font-semibold flex gap-2.5 items-start">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5">
                    <span className="text-amber-850 font-bold block">Smart Local Calibration Active</span>
                    <span className="text-stone-600 block leading-relaxed font-normal text-[11px]">{analysisResult.warning}</span>
                  </div>
                </div>
              )}

              {/* Header result */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-widest block">IDENTIFIED DISH</span>
                  <h3 className="text-xl font-extrabold text-stone-900 leading-tight font-sans tracking-tight">{analysisResult.foodName}</h3>
                  {/* Dynamic Confidence Level Badge & Description */}
                  {(() => {
                    const confVal = analysisResult.confidence || 0.92;
                    let level = "Medium";
                    if (confVal >= 0.88) level = "High";
                    else if (confVal < 0.65) level = "Low";

                    let detail = "portion size estimated from image visual context";
                    if (analysisResult.isFallback || analysisResult.isMock) {
                      detail = "estimated from offline smart local databases";
                    } else if (portionSize && ingredients) {
                      detail = "refined by custom ingredients & portion specifications";
                    } else if (portionSize) {
                      detail = "custom portion size verified by user description";
                    } else if (ingredients) {
                      detail = "refined with custom user ingredients lists";
                    } else if (cookingMethod) {
                      detail = "custom cooking method verified";
                    }

                    return (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 font-sans">
                        <span className="text-[11px] text-stone-500 font-bold">Confidence:</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                          level === "High" ? "bg-emerald-100 text-emerald-800 border border-emerald-200/50" :
                          level === "Medium" ? "bg-amber-100 text-amber-800 border border-amber-200/50" :
                          "bg-stone-100 text-stone-700 border border-stone-200/50"
                        }`}>
                          {level}
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium italic">
                          ({detail})
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Score badge */}
                <div className="p-2 bg-stone-50 rounded-2xl border border-stone-200 text-center shrink-0 min-w-[75px]">
                  <span className="block text-[8px] font-bold text-stone-400 font-mono uppercase">HEALTY RATIO</span>
                  <span className={`text-lg font-black block leading-none mt-0.5 ${
                    (analysisResult.healthScore || 75) >= 80 ? "text-emerald-600" :
                    (analysisResult.healthScore || 75) >= 50 ? "text-amber-500" :
                    "text-rose-500"
                  }`}>{analysisResult.healthScore || 75}</span>
                  <span className="text-[7px] text-stone-400 tracking-wide block font-extrabold">/ 100 max</span>
                </div>
              </div>

              {/* Detailed Report Sub-Tabs Dashboard Selector */}
              <div className="flex bg-stone-100 p-1 rounded-xl gap-1 border border-stone-200/60 font-sans">
                <button
                  type="button"
                  onClick={() => setResultsTab("overview")}
                  className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 cursor-pointer ${
                    resultsTab === "overview" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  📊 Overview & Macros
                </button>
                <button
                  type="button"
                  onClick={() => setResultsTab("micronutrition")}
                  className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 cursor-pointer ${
                    resultsTab === "micronutrition" ? "bg-emerald-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  🥗 Micros & Cooking
                </button>
                <button
                  type="button"
                  onClick={() => setResultsTab("recommendations")}
                  className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 cursor-pointer ${
                    resultsTab === "recommendations" ? "bg-rose-500 text-white shadow-sm" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  ⚠️ Concerns & Changes
                </button>
              </div>

              {/* TAB CONTENT 1: OVERVIEW & MACROS */}
              {resultsTab === "overview" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Suitability recommendation box */}
                  <div className={`p-4 rounded-xl border flex gap-3 ${
                    analysisResult.suitability?.recommendation === "EAT" ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" :
                    analysisResult.suitability?.recommendation === "MODERATE" ? "bg-amber-50/70 border-amber-200 text-amber-900" :
                    "bg-rose-50/70 border-rose-200 text-rose-900"
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
                        RECOMMENDED: {analysisResult.suitability?.recommendation || "EAT"}
                      </div>
                      <p className="text-xs font-semibold leading-relaxed opacity-95">{analysisResult.suitability?.reason}</p>
                    </div>
                  </div>

                  {/* Macros extended grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="block text-[9px] font-bold text-stone-400 font-mono tracking-wider">CALORIES</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900 block mt-0.5">{analysisResult.calories} kcal</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="block text-[9px] font-bold text-stone-400 font-mono tracking-wider">PROTEIN</span>
                      <span className="text-xs sm:text-sm font-black text-stone-950 block mt-0.5">{analysisResult.protein}g</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="block text-[9px] font-bold text-stone-400 font-mono tracking-wider">TOTAL CARBS</span>
                      <span className="text-xs sm:text-sm font-black text-stone-950 block mt-0.5">{analysisResult.carbs}g</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="block text-[9px] font-bold text-stone-400 font-mono tracking-wider">FAT PROFILE</span>
                      <span className="text-xs sm:text-sm font-black text-stone-950 block mt-0.5">{analysisResult.fats}g</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="block text-[9px] font-bold text-stone-400 font-mono tracking-wider">DIETARY FIBER</span>
                      <span className="text-xs sm:text-sm font-black text-stone-950 block mt-0.5">{analysisResult.dietaryFiber || 0}g</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="block text-[9px] font-bold text-stone-400 font-mono tracking-wider">TOTAL SUGAR</span>
                      <span className="text-xs sm:text-sm font-black text-stone-950 block mt-0.5">{analysisResult.sugar || 0}g</span>
                    </div>
                  </div>

                  {/* Summary phrase */}
                  <div className="space-y-1">
                    <strong className="text-[10px] text-stone-400 font-sans tracking-wide block">COMPOSITION SUMMARY</strong>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">{analysisResult.summary}</p>
                  </div>

                  {/* Itemized breakdown table */}
                  {analysisResult.itemsBreakdown && analysisResult.itemsBreakdown.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold text-stone-400 font-mono uppercase block">ITEMIZED DISH BREAKDOWN</span>
                      <div className="overflow-x-auto border border-stone-200/70 rounded-xl">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-150 text-stone-550 font-extrabold uppercase text-[9px] tracking-wider font-mono">
                              <th className="p-2.5">Item / Ingredient</th>
                              <th className="p-2.5 text-center">Estimate Wt</th>
                              <th className="p-2.5 text-center">Calories</th>
                              <th className="p-2.5">Macronutrients</th>
                              <th className="p-2.5 text-right">Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 text-stone-700 font-semibold">
                            {analysisResult.itemsBreakdown.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-stone-50/40">
                                <td className="p-2.5 text-stone-900 font-bold">{item.itemName}</td>
                                <td className="p-2.5 text-center">{item.weightGrams}g</td>
                                <td className="p-2.5 text-center text-amber-600">{item.calories} kcal</td>
                                <td className="p-2.5 font-mono text-[10px] text-stone-500">{item.macros}</td>
                                <td className="p-2.5 text-right font-mono text-[10px] text-emerald-600 font-bold">{item.confidence}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 2: MICROS & COOKING STYLE */}
              {resultsTab === "micronutrition" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Health Score 1-10 Slider */}
                  <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-2xl space-y-3.5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block">DIET HEALTHINESS SCORE</span>
                        <strong className="text-lg font-black text-stone-900 tracking-tight font-sans">
                          Aesthetic Rating: {analysisResult.healthScore1To10 || Math.round((analysisResult.healthScore || 75) / 10)} / 10
                        </strong>
                      </div>
                      {/* Rating Dots */}
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const ratingVal = analysisResult.healthScore1To10 || Math.round((analysisResult.healthScore || 75) / 10);
                          const isActive = idx < ratingVal;
                          return (
                            <div
                              key={idx}
                              className={`w-3.5 h-3.5 rounded-full transition duration-300 ${
                                isActive 
                                  ? ratingVal >= 8 ? "bg-emerald-500 shadow-sm" :
                                    ratingVal >= 5 ? "bg-amber-400" : "bg-rose-500"
                                  : "bg-stone-250"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 font-semibold leading-relaxed border-t border-stone-200/60 pt-2.5">
                      {analysisResult.healthScoreExplanation || analysisResult.summary}
                    </p>
                  </div>

                  {/* Determined Cooking Method */}
                  <div className="p-3.5 bg-sky-50 border border-sky-150 rounded-2xl flex items-center justify-between text-xs font-sans">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-sky-600 font-mono uppercase tracking-wider block">DETERMINED COOKING METHOD</span>
                      <strong className="text-stone-850 capitalize font-extrabold text-sm block">
                        {analysisResult.cookingMethod || "Baking / Boiling"}
                      </strong>
                    </div>
                    <span className="text-2xl">🍳</span>
                  </div>

                  {/* Micronutrient Estimates Grid */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-stone-400 font-mono uppercase block tracking-wider">MICRONUTRIENT SCIENTIFIC ESTIMATES</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-sans">
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 font-mono block">SODIUM</span>
                        <strong className="text-stone-800 block text-xs font-bold mt-0.5">{analysisResult.micronutrients?.sodium || "160mg (7% DV)"}</strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 font-mono block">POTASSIUM</span>
                        <strong className="text-stone-800 block text-xs font-bold mt-0.5">{analysisResult.micronutrients?.potassium || "310mg (9% DV)"}</strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 font-mono block">CALCIUM</span>
                        <strong className="text-stone-800 block text-xs font-bold mt-0.5">{analysisResult.micronutrients?.calcium || "45mg (5% DV)"}</strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 font-mono block">IRON</span>
                        <strong className="text-stone-800 block text-xs font-bold mt-0.5">{analysisResult.micronutrients?.iron || "1.3mg (7% DV)"}</strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 font-mono block">VITAMIN A</span>
                        <strong className="text-stone-800 block text-xs font-bold mt-0.5">{analysisResult.micronutrients?.vitaminA || "55mcg (6% DV)"}</strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] font-bold text-stone-400 font-mono block">VITAMIN C</span>
                        <strong className="text-stone-800 block text-xs font-bold mt-0.5">{analysisResult.micronutrients?.vitaminC || "6mg (8% DV)"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: CONCERNS & HEALTHY CHANGES */}
              {resultsTab === "recommendations" && (
                <div className="space-y-5 animate-in fade-in duration-200 font-sans">
                  {/* Warning categories triggers */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-stone-400 font-mono uppercase block tracking-wider">NUTRITION COMPOSITION CONCERNS</span>
                    <div className="space-y-2 text-xs font-sans font-semibold">
                      {analysisResult.concerns?.highSugar && analysisResult.concerns.highSugar.length > 0 ? (
                        <div className="p-2.5 bg-amber-50/65 border border-amber-200/40 rounded-xl flex items-center justify-between">
                          <span className="text-amber-800 font-bold shrink-0">⚠️ High Sugar content:</span>
                          <span className="text-amber-900 font-bold font-mono text-[11px] text-right truncate pl-2">{analysisResult.concerns.highSugar.join(", ")}</span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-150 rounded-xl flex items-center justify-between">
                          <span className="text-emerald-800 font-bold">✓ Low sugar index</span>
                          <span className="text-emerald-900 font-mono text-[10px] uppercase font-bold">Safe Limit</span>
                        </div>
                      )}

                      {analysisResult.concerns?.highSalt && analysisResult.concerns.highSalt.length > 0 ? (
                        <div className="p-2.5 bg-amber-50/65 border border-amber-200/40 rounded-xl flex items-center justify-between">
                          <span className="text-amber-800 font-bold shrink-0">⚠️ High Sodium/Salt:</span>
                          <span className="text-amber-900 font-bold font-mono text-[11px] text-right truncate pl-2">{analysisResult.concerns.highSalt.join(", ")}</span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-150 rounded-xl flex items-center justify-between">
                          <span className="text-emerald-800 font-bold">✓ Standard sodium balance</span>
                          <span className="text-emerald-900 font-mono text-[10px] uppercase font-bold">Safe Limit</span>
                        </div>
                      )}

                      {analysisResult.concerns?.highSaturatedFat && analysisResult.concerns.highSaturatedFat.length > 0 && (
                        <div className="p-2.5 bg-amber-50/65 border border-amber-200/40 rounded-xl flex items-center justify-between">
                          <span className="text-amber-800 font-bold shrink-0">⚠️ Saturated lipids concentration:</span>
                          <span className="text-amber-900 font-bold font-mono text-[11px] text-right truncate pl-2">{analysisResult.concerns.highSaturatedFat.join(", ")}</span>
                        </div>
                      )}

                      {analysisResult.concerns?.highTransFat && analysisResult.concerns.highTransFat.length > 0 && (
                        <div className="p-2.5 bg-rose-50/80 border border-rose-200/40 rounded-xl flex items-center justify-between">
                          <span className="text-rose-800 font-black shrink-0">🚨 Trans Fat elements:</span>
                          <span className="text-rose-900 font-black font-mono text-[11px] text-right truncate pl-2">{analysisResult.concerns.highTransFat.join(", ")}</span>
                        </div>
                      )}

                      {analysisResult.concerns?.ultraProcessedAdditives && analysisResult.concerns.ultraProcessedAdditives.length > 0 && (
                        <div className="p-2.5 bg-rose-50/80 border border-rose-200/40 rounded-xl flex items-center justify-between">
                          <span className="text-rose-800 font-black shrink-0">🚨 Ultra-processed additives:</span>
                          <span className="text-rose-900 font-black font-mono text-[11px] text-right truncate pl-2">{analysisResult.concerns.ultraProcessedAdditives.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clean recipe modifications & alternatives */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-stone-400 font-mono uppercase block tracking-wider">HEALTHY RECIPE REPLACEMENTS / CONVERSIONS</span>
                    <div className="space-y-2">
                      {analysisResult.alternatives?.map((item: string, i: number) => (
                        <div key={i} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex gap-x-2.5 text-xs text-stone-700 font-semibold leading-relaxed">
                          <span className="text-emerald-500 font-black text-sm shrink-0">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Uncertainties & Required additional info inputs */}
                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-2 text-xs">
                    <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest font-mono">Assumptions made</span>
                    <p className="text-stone-500 text-[11px] font-semibold leading-relaxed">
                      <strong>Uncertainties:</strong> {analysisResult.uncertainties || "Standard database reference matches utilized."}
                    </p>
                    {analysisResult.requiredAdditionalInfo && analysisResult.requiredAdditionalInfo !== "None" && (
                      <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2 text-amber-800 text-[11px] font-bold block leading-relaxed">
                        <span>ℹ</span>
                        <span><strong>Enhancement Parameters Requested:</strong> {analysisResult.requiredAdditionalInfo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Meal Select Category controls and confirming save buttons */}
              <div className="pt-5 border-t border-stone-205 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between border-b sm:border-0 pb-3 sm:pb-0 font-sans">
                  <label className="text-[10px] font-bold text-stone-400 font-mono shrink-0 uppercase tracking-wider">MEAL CLASSIFICATION</label>
                  <select 
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="bg-white border border-stone-250 p-2 rounded-xl text-xs font-bold text-stone-700 font-mono cursor-pointer focus:outline-none focus:border-emerald-600"
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
                  <Check className="w-4 h-4 text-white font-bold" />
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
