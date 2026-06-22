import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  Activity, 
  Award, 
  Users, 
  Sparkles, 
  Heart, 
  Flame, 
  Smartphone, 
  Monitor, 
  Apple, 
  Clock, 
  Sparkle,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Brain,
  Coffee,
  CheckCircle2,
  ListRestart,
  RefreshCw
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onContinueAsGuest: () => void;
}

interface SandboxFood {
  id: string;
  name: string;
  emoji: string;
  bgEmoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  healthScore: number;
  recommendation: "EAT" | "MODERATE" | "AVOID";
  reason: string;
  summary: string;
  vitamins: string[];
  minerals: string[];
  confidence: number;
}

const SANDBOX_FOODS: SandboxFood[] = [
  {
    id: "avocado_toast",
    name: "California Sourdough Avocado Toast",
    emoji: "🥑",
    bgEmoji: "🥑🍞🍅",
    calories: 285,
    protein: 11,
    carbs: 26,
    fats: 15,
    healthScore: 94,
    recommendation: "EAT",
    reason: "Highly aligned with 'Stay healthy' programs. Loaded with healthy unsaturated fats, potassium, and active soluble dietary fibers.",
    summary: "A premium wholesome choice! Features high avocado fat quality and quality stoneground grain grains to stabilize glycogen levels.",
    vitamins: ["Vitamin K", "Vitamin E", "Folate (B9)", "Vitamin C"],
    minerals: ["Potassium", "Magnesium", "Zinc"],
    confidence: 97
  },
  {
    id: "quinoa_bowl",
    name: "Mediterranean Grilled Salmon Quinoa Bowl",
    emoji: "🥗",
    bgEmoji: "🥗🐟🍋",
    calories: 420,
    protein: 34,
    carbs: 38,
    fats: 16,
    healthScore: 98,
    recommendation: "EAT",
    reason: "Superb high-protein, heart-healthy dish! Rich in Omega-3 essential fatty acids supporting metabolic & cognitive cardiovascular wellness.",
    summary: "An elite health-champion plate! Beautiful balance of lean marine proteins and slow-burning complex carbs for sustained cellular release.",
    vitamins: ["Vitamin D", "B12 Complex", "Niacin"],
    minerals: ["Iron", "Selenium", "Phosphorus", "Omega-3"],
    confidence: 99
  },
  {
    id: "pepperoni_pizza",
    name: "Loaded Triple Cheese Pepperoni Pizza",
    emoji: "🍕",
    bgEmoji: "🍕🧀🌶️",
    calories: 590,
    protein: 22,
    carbs: 58,
    fats: 28,
    healthScore: 36,
    recommendation: "AVOID",
    reason: "Exceeds daily recommended levels of processed saturated lipids and refined sodium. Non-optimal for active weight management goals.",
    summary: "Very high caloric density with refined white flour gluten and high sodium content. Consider limiting portion size or substituting crust with cauliflower dough.",
    vitamins: ["Vitamin B6", "Calcium Active"],
    minerals: ["Sodium (High)", "Saturated Fats"],
    confidence: 94
  },
  {
    id: "chocolate_cookie",
    name: "Dark Chocolate Lava Fudge Cookie",
    emoji: "🍪",
    bgEmoji: "🍪🍫🥛",
    calories: 340,
    protein: 5,
    carbs: 48,
    fats: 16,
    healthScore: 48,
    recommendation: "MODERATE",
    reason: "Good antioxidant flavonoids from dark cacao, but accompanied by simple sugars. Enjoy mindfully as an occasional athletic luxury.",
    summary: "A delicious psychological treat! Best logging practice is to pair with dietary fibers or enjoy post-workout to burn down glucose efficiently.",
    vitamins: ["Iron (Trace)"],
    minerals: ["Antioxidants", "Magnesium"],
    confidence: 96
  }
];

export default function LandingPage({ onGetStarted, onContinueAsGuest }: LandingPageProps) {
  const [devicePreviewMode, setDevicePreviewMode] = useState<"desktop" | "mobile">("desktop");
  
  // Interactive Sandbox state
  const [selectedSandboxId, setSelectedSandboxId] = useState<string>("avocado_toast");
  const [isSandboxScanning, setIsSandboxScanning] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<SandboxFood | null>(SANDBOX_FOODS[0]);
  const [sandboxProgressText, setSandboxProgressText] = useState<string>("");
  const [sandboxProgressValue, setSandboxProgressValue] = useState<number>(0);

  const activeSandboxFood = SANDBOX_FOODS.find(f => f.id === selectedSandboxId) || SANDBOX_FOODS[0];

  // Simulated AI Scanning Loop
  const handleSandboxScan = () => {
    setIsSandboxScanning(true);
    setSandboxResult(null);
    setSandboxProgressValue(0);
    
    const logs = [
      "📷 Camera feed decoded. Calibrating contrast matrix...",
      "🔍 Multi-modal boundary scan: item shape & color map identified...",
      "⚙️ Querying Gemini 3.5 multi-modal nutrition layer...",
      "📊 Estimating volumetric portions and lipid densities...",
      "🏆 Scoring micronutrients and health rating targets..."
    ];

    let logIndex = 0;
    setSandboxProgressText(logs[0]);

    const progressInterval = setInterval(() => {
      setSandboxProgressValue(prev => {
        const next = prev + 8;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        
        // update text periodically
        const index = Math.min(logs.length - 1, Math.floor((next / 100) * logs.length));
        setSandboxProgressText(logs[index]);
        return next;
      });
    }, 150);

    setTimeout(() => {
      setSandboxResult(activeSandboxFood);
      setIsSandboxScanning(false);
    }, 2000);
  };

  useEffect(() => {
    // Automatically trigger fresh results on selecting a plate
    setSandboxResult(activeSandboxFood);
  }, [selectedSandboxId]);

  const coreFeatures = [
    {
      icon: <Camera className="w-6 h-6 text-emerald-500" />,
      title: "Fast AI Recognition",
      description: "Snap a photo of your food, and our Gemini-backed engine instantly decodes ingredients and volumetric weights."
    },
    {
      icon: <Activity className="w-6 h-6 text-sky-500" />,
      title: "Granular Macro Insights",
      description: "Detailed breakdowns of high-purity protein, net carbs, good fats, fiber, vitamins, and minerals in real time."
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      title: "Coached Health Ratings",
      description: "Custom recommendations dynamically customized for your weight control goals, age, and personalized diet plan."
    },
    {
      icon: <Award className="w-6 h-6 text-amber-500" />,
      title: "Gamified Challenges",
      description: "Maintain consecutive logging streaks, complete calorie quests, gain points, and unlock sleek collectable badges."
    }
  ];

  return (
    <div id="landing_container" className="bg-gradient-to-b from-stone-900 via-neutral-950 to-stone-950 min-h-screen text-stone-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Glow Backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Header */}
      <header className="border-b border-stone-800/80 backdrop-blur-md sticky top-0 bg-stone-900/80 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-emerald-600/30">
              <Apple className="w-6 h-6" />
            </div>
            <div>
              <span className="font-sans font-black text-xl tracking-tight bg-gradient-to-r from-white via-stone-200 to-emerald-400 bg-clip-text text-transparent block">SmartBite AI</span>
              <span className="font-mono text-[9px] text-emerald-400 tracking-wider font-bold uppercase -mt-1 block">Live Nutrition assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              id="start-button-header-guest"
              onClick={onContinueAsGuest}
              className="text-stone-400 hover:text-white font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition duration-150 cursor-pointer"
            >
              Continue as Guest
            </button>
            <button 
              id="start-button-header"
              onClick={onGetStarted}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-4.5 py-2.5 rounded-xl transition duration-200 shadow-md flex items-center gap-2 cursor-pointer border border-emerald-500/20 active:scale-95"
            >
              <span>Scan My Plate</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
              <Sparkle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Now Powered by Google Gemini 3.5 AI Core</span>
            </div>
            
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.08]">
              Snap, Analyze & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Eat Smarter</span>
            </h1>
            
            <p className="text-stone-400 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Scan any meal with your camera to instantly decode carbs, protein, fats, and suitability targets. Lock in daily healthy streaks and gamify your physical wellness goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                id="start-tracking-cta"
                onClick={onGetStarted}
                className="bg-emerald-600 hover:bg-emerald-505 text-white font-semibold px-8 py-4 rounded-xl transition shadow-xl shadow-emerald-600/25 duration-200 text-base flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-500/30 hover:bg-emerald-500 active:scale-95"
              >
                <span>Login with Google</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>
              <button
                id="guest-tracking-cta"
                onClick={onContinueAsGuest}
                className="bg-stone-800 hover:bg-stone-700/90 text-stone-200 font-semibold px-8 py-4 rounded-xl transition duration-200 text-base flex justify-center items-center gap-2 cursor-pointer border border-stone-700/50 active:scale-95"
              >
                <span>Try as Guest (Instantly)</span>
              </button>
            </div>

            {/* Micro Stats Banner */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-stone-800/80 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="block text-2xl font-extrabold text-white">99.4%</span>
                <span className="block text-[10px] text-stone-500 font-bold font-mono tracking-wider">RECOGNITION ACCURACY</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-white">&lt; 1.5s</span>
                <span className="block text-[10px] text-stone-500 font-bold font-mono tracking-wider">RESPONSE SPEED</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-emerald-400">Durable</span>
                <span className="block text-[10px] text-stone-500 font-bold font-mono tracking-wider">FIRESTORE STORAGE</span>
              </div>
            </div>
          </div>

          {/* Device Mockup with Dual-Preview Modes */}
          <div className="lg:col-span-6 relative mt-10 lg:mt-0">
            <div className="flex justify-center gap-2.5 mb-4 bg-stone-900/60 p-1 rounded-xl max-w-[280px] mx-auto border border-stone-800">
              <button
                onClick={() => setDevicePreviewMode("desktop")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  devicePreviewMode === "desktop" ? "bg-stone-800 text-emerald-400 border border-stone-700/55" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Setup</span>
              </button>
              <button
                onClick={() => setDevicePreviewMode("mobile")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  devicePreviewMode === "mobile" ? "bg-stone-800 text-emerald-400 border border-stone-700/55" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Feed</span>
              </button>
            </div>

            {devicePreviewMode === "desktop" ? (
              /* High-Fidelity Desktop Mockup representation */
              <motion.div 
                key="desktop"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl shadow-emerald-950/20 overflow-hidden aspect-[4/3] flex flex-col"
              >
                {/* Simulated Window Control Row */}
                <div className="bg-stone-900 border-b border-stone-800/80 px-4 py-3 flex justify-between items-center select-none text-xs font-mono text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <span className="ml-3 text-[10px] text-stone-500 tracking-tight">smartbite-nutrition.ai/hub</span>
                  </div>
                  <div className="text-[10px] text-emerald-500/80 font-mono flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>AI Engine Status: Active</span>
                  </div>
                </div>

                {/* Simulated Dashboard content */}
                <div className="flex-1 bg-stone-950 p-4 grid grid-cols-12 gap-3 text-left overflow-y-auto font-sans">
                  
                  {/* Left Side menu preview */}
                  <div className="col-span-4 bg-stone-900/40 border border-stone-800 rounded-xl p-3.5 flex flex-col justify-between text-xs space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-xs">US</div>
                        <div>
                          <p className="font-bold text-stone-200">User Profile</p>
                          <span className="text-[10px] text-stone-500 block">Stay healthy target</span>
                        </div>
                      </div>
                      <div className="p-2 bg-stone-900/50 rounded-lg text-[10px] text-stone-400 border border-stone-800 space-y-1 font-mono">
                        <div className="flex justify-between"><span>Active Streak:</span> <span className="text-amber-400 font-bold">🔥 5 Days</span></div>
                        <div className="flex justify-between"><span>User Points:</span> <span className="text-emerald-400 font-bold">420 XP</span></div>
                      </div>
                    </div>
                    <button onClick={onGetStarted} className="w-full bg-emerald-600/90 text-white font-bold py-2 rounded-lg text-center border border-emerald-500/20 active:scale-95 transition-all text-[11px]">📸 Scan Food Plate</button>
                  </div>

                  {/* Right main area preview */}
                  <div className="col-span-8 space-y-3">
                    <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <div className="text-stone-500 text-[9px] font-bold tracking-wider font-mono">CALORIC TRACKER (TODAY)</div>
                        <div className="font-bold text-stone-200 text-sm mt-0.5">1,480 / 2,200 kcal</div>
                        <div className="w-32 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[65%]"></div>
                        </div>
                      </div>
                      <div className="text-right text-[10px]">
                        <span className="text-emerald-400 font-bold block">✓ Safe Budget Balance</span>
                        <span className="text-stone-500">720 kcal left</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {SANDBOX_FOODS.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xl">{item.emoji}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">{item.recommendation}</span>
                          </div>
                          <div>
                            <div className="font-bold text-stone-200 text-xs truncate leading-snug">{item.name}</div>
                            <div className="text-[9px] text-stone-500 font-mono mt-1 flex justify-between">
                              <span>🔥 {item.calories} kcal</span>
                              <span className="text-emerald-400">Score: {item.healthScore}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              /* Mobile screen simulation preview */
              <motion.div
                key="mobile"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-stone-904 rounded-[36px] border-[10px] border-stone-800 shadow-2xl overflow-hidden aspect-[9/18] max-w-[280px] mx-auto bg-stone-950"
              >
                {/* Speaker top grill notch */}
                <div className="absolute top-0 inset-x-0 h-4 bg-stone-800 flex justify-center z-10">
                  <div className="w-14 h-3 bg-stone-800 rounded-b-md"></div>
                </div>
                
                {/* Inner Mobile page scroll */}
                <div className="h-full bg-stone-950 pt-6 px-3.5 pb-4 overflow-y-auto space-y-3.5 text-left font-sans">
                  <div className="flex justify-between items-center pt-2 text-[10px]">
                    <span className="font-bold text-stone-300">📱 Mobile SmartBite</span>
                    <span className="font-mono text-amber-500 font-bold">🔥 5 STREAKS</span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800/80 rounded-2xl p-3.5 space-y-1">
                    <span className="text-stone-500 text-[8px] font-bold font-mono tracking-wider">DAILY RADAR</span>
                    <p className="text-lg font-black text-emerald-400">1,480 kcal</p>
                    <span className="text-[10px] text-emerald-400/80 leading-snug">Within optimal insulin safety standards</span>
                  </div>

                  <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-2.5 text-white flex justify-between items-center border-b border-stone-800">
                      <div>
                        <span className="text-[8px] font-mono opacity-80 uppercase block">Plate Analysis</span>
                        <h4 className="font-bold text-xs truncate">Quinoa Fish Bowl</h4>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold border border-emerald-500/30">98 Score</span>
                    </div>
                    <div className="p-3 text-[10px] text-stone-400 space-y-1.5 leading-normal">
                      <p className="text-[9px] text-emerald-400 font-medium bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                        ⚡ Highly recommended fit. Features healthy organic unsaturated lipids and amino complex support structures.
                      </p>
                    </div>
                  </div>

                  <button onClick={onGetStarted} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl text-center shadow-lg shadow-emerald-600/10 transition-all font-mono">
                    📸 Launch AI Scanner
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* STOPPER INTERACTIVE SECTION: Interactive Live Playground Simulator */}
      <section className="py-16 bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950 border-y border-stone-800/80 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TEST-DRIVE APP ONLINE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive AI Scanner Sandboxed
            </h2>
            <p className="text-stone-400 font-medium leading-relaxed max-w-2xl mx-auto">
              No forms, no registration. Pick a sample breakfast, lunch, or sweet item below to run our visual neural engine simulation.
            </p>
          </div>

          {/* Interactive Core Simulator Component */}
          <div className="bg-stone-950/70 rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-xl grid md:grid-cols-12 gap-8 items-stretch relative">
            
            {/* Left Side: Selectors and simulated camera view */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold font-mono tracking-wider text-stone-500 block">STEP 1: SELECT PLATE OPTION</span>
                <div className="grid grid-cols-2 gap-3">
                  {SANDBOX_FOODS.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => setSelectedSandboxId(food.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center gap-2.5 ${
                        selectedSandboxId === food.id
                          ? "bg-stone-900 border-emerald-500 text-white shadow-md shadow-emerald-950/50"
                          : "bg-stone-900/30 border-stone-800 text-stone-400 hover:border-stone-700/80 hover:text-stone-200"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{food.emoji}</span>
                      <div className="truncate">
                        <span className="block text-xs font-bold leading-normal truncate">{food.name}</span>
                        <span className="block text-[10px] text-stone-500 font-mono mt-0.5">{food.calories} kcal</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated camera capture section */}
              <div className="bg-stone-900/50 rounded-2xl p-4 border border-stone-800/80 flex-1 flex flex-col justify-center items-center relative overflow-hidden min-h-[220px]">
                
                {/* Neon scanned effect overlay */}
                {isSandboxScanning && (
                  <>
                    {/* Glowing laser bar line */}
                    <motion.div 
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 1.5, 
                        ease: "easeInOut" 
                      }}
                      className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] z-20"
                    />
                    {/* Glowing green shade screen backdrop mask */}
                    <div className="absolute inset-0 bg-emerald-500/5 z-10 animate-pulse" />
                  </>
                )}

                {/* Simulated Plate Background Graphic Display */}
                <div className="text-center space-y-4 z-0 relative">
                  <span className="text-7xl block transition-transform duration-300 transform select-none hover:scale-110">
                    {activeSandboxFood.emoji}
                  </span>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                    MOCK_CAMERA_STREAM_#007
                  </div>
                </div>

                {/* Scanning telemetries on-screen absolute container */}
                {isSandboxScanning && (
                  <div className="absolute inset-0 bg-stone-950/85 flex flex-col items-center justify-center p-4 text-center z-30">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs font-bold text-emerald-400 font-mono mt-3 animate-pulse">{sandboxProgressText}</p>
                    {/* Progress slider visually */}
                    <div className="w-full bg-stone-850 h-1 rounded-full mt-4 overflow-hidden max-w-xs">
                      <div className="bg-emerald-400 h-full transition-all duration-100" style={{ width: `${sandboxProgressValue}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSandboxScan}
                disabled={isSandboxScanning}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/20 active:scale-95 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Simulate AI Analysis Scan</span>
              </button>
            </div>

            {/* Right Side: Analysis Display Case */}
            <div className="md:col-span-7 flex flex-col justify-between bg-stone-900/30 border border-stone-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <AnimatePresence mode="wait">
                {sandboxResult ? (
                  <motion.div
                    key={sandboxResult.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400 uppercase">ANALYSIS REPORT</span>
                          <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-tight">{sandboxResult.name}</h3>
                          <span className="text-[10px] text-stone-500 font-mono mt-1 block">Recognition Confidence: {sandboxResult.confidence}%</span>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-stone-400 font-mono tracking-wider font-semibold">HEALTH SCORE</span>
                          <span className={`text-2xl font-black ${
                            sandboxResult.healthScore >= 80 ? "text-emerald-400" :
                            sandboxResult.healthScore >= 50 ? "text-amber-500" : "text-rose-500"
                          }`}>{sandboxResult.healthScore}/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Card */}
                    <div className={`p-4 rounded-2xl border text-xs gap-3 flex flex-col sm:flex-row items-start sm:items-center ${
                      sandboxResult.recommendation === "EAT" ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-100" :
                      sandboxResult.recommendation === "MODERATE" ? "bg-amber-950/15 border-amber-800/45 text-amber-100" :
                      "bg-rose-950/25 border-rose-900/60 text-rose-100"
                    }`}>
                      <div className={`p-2 rounded-xl shrink-0 ${
                        sandboxResult.recommendation === "EAT" ? "bg-emerald-550/15 text-emerald-400" :
                        sandboxResult.recommendation === "MODERATE" ? "bg-amber-500/10 text-amber-400" :
                        "bg-rose-500/10 text-rose-400"
                      }`}>
                        {sandboxResult.recommendation === "EAT" ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-extrabold tracking-wider text-[10px] font-mono">REC: {sandboxResult.recommendation}</div>
                        <p className="text-xs font-semibold leading-relaxed mt-0.5 opacity-90">{sandboxResult.reason}</p>
                      </div>
                    </div>

                    {/* Macros Matrix Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "Calories", val: `${sandboxResult.calories} kcal`, color: "border-stone-800 text-stone-200" },
                        { label: "Protein", val: `${sandboxResult.protein}g`, color: "border-sky-950 text-sky-400 bg-sky-950/5" },
                        { label: "Carbohydrates", val: `${sandboxResult.carbs}g`, color: "border-amber-950 text-amber-400 bg-amber-950/5" },
                        { label: "Total Fats", val: `${sandboxResult.fats}g`, color: "border-purple-950 text-purple-400 bg-purple-950/5" }
                      ].map((item, id) => (
                        <div key={id} className={`p-2.5 rounded-xl border text-xs space-y-1 ${item.color}`}>
                          <span className="text-[9px] font-mono text-stone-500 block uppercase font-bold">{item.label}</span>
                          <span className="font-extrabold text-sm block">{item.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary paragraphs */}
                    <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-850 text-xs text-stone-400 leading-relaxed font-semibold">
                      <strong>AI Summary:</strong> {sandboxResult.summary}
                    </div>

                    {/* Micro ingredients chips */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-stone-500 uppercase font-black tracking-wider block">MICRONUTRIENT HIGHLIGHTS</span>
                      <div className="flex flex-wrap gap-1.5">
                        {sandboxResult.vitamins.concat(sandboxResult.minerals).map((chip, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-1 bg-stone-900 border border-stone-800 text-stone-300 font-semibold rounded-full block">
                            🧪 {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-stone-500 space-y-3 min-h-[350px]">
                    <div className="w-12 h-12 rounded-full border-2 border-stone-800 border-t-emerald-500 animate-spin" />
                    <p className="text-sm font-semibold">Scanning and parsing plate nutrition vectors...</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Call-to-action incentive footer banner */}
              <div className="mt-6 pt-5 border-t border-stone-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-[11px] text-stone-550 font-semibold">Log real visual plates now dynamically using our instant cloud storage database setup.</span>
                <button
                  onClick={onGetStarted}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer select-none"
                >
                  <span>Build cloud logs now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features-highlight" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-stone-800/70">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Fully Integrated Health Dashboard
            </h2>
            <p className="text-stone-400 font-medium">
              We leverage cloud-hosted storage databases and advanced models to understand nutrition synergy, suggest optimal substitutes, and incentivize health.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feat, idx) => (
              <div key={idx} className="bg-stone-900/40 p-6 rounded-2xl border border-stone-800 space-y-4 hover:border-emerald-500/20 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shadow-inner">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-white tracking-snug">{feat.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed font-semibold">{feat.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Gamification social motivation banner details */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>BEHAVIORAL HABITS DESIGN</span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Aesthetic Streak Systems &amp; Collectable Badges
            </h2>
            <p className="text-stone-400 font-medium leading-relaxed">
              Achieving long-term fat loss or muscle packing takes consistency over raw restriction. Real-time gamified metrics stimulate visual action loop triggers:
            </p>

            <ul className="space-y-4">
              {[
                { label: "Consecutive logging streaker", desc: "Multiply profile point allocations for daily food photographic logging." },
                { label: "Curated high-tier challenge badges", desc: "Gain visible cabinet awards for completing 30g+ protein levels, low carb keto plans, or clean eating schedules." },
                { label: "Adaptive AI health coach advice", desc: "Direct contextual reports to substitute ingredients smartly without skipping delicious treats." }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1">✓</div>
                  <div>
                    <strong className="text-white text-sm block font-bold leading-normal">{item.label}</strong>
                    <span className="text-xs text-stone-500 font-semibold leading-relaxed mt-0.5 block">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 bg-gradient-to-tr from-stone-900 via-neutral-900 to-indigo-950 p-8 rounded-3xl space-y-6 border border-stone-800 shadow-xl">
            <span className="text-amber-400 font-mono text-xs uppercase font-extrabold tracking-widest block">⭐ Gamified Community Cabinet</span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">Streaks, Collectables & Leaderboards</h3>
            <p className="text-stone-450 text-xs sm:text-sm font-semibold leading-relaxed">
              Participate in collaborative group health goals! Access our Friends list layout directly, log recipes, and share your premium formatted meal score summaries into group chat hub environments.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { title: "Flame Runner", desc: "5 Streaks Met", icon: "🔥", color: "text-amber-400" },
                { title: "Iron Titan", desc: "30g Protein", icon: "🛡️", color: "text-blue-400" },
                { title: "Green Guard", desc: "90+ Score plate", icon: "⭐", color: "text-emerald-400" }
              ].map((badge, idx) => (
                <div key={idx} className="bg-stone-950/70 p-4 rounded-xl text-center space-y-2 border border-stone-800">
                  <span className="text-3.5xl block select-none">{badge.icon}</span>
                  <div className="font-extrabold text-[10px] truncate text-white">{badge.title}</div>
                  <div className="text-[9px] text-stone-500 font-medium font-mono">{badge.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-stone-950/40 rounded-2xl flex items-center gap-4 border border-stone-850">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left text-xs">
                <strong className="text-stone-200 block text-xs">Share results with Friends and Family</strong>
                <span className="text-[11px] text-stone-550 leading-normal block mt-0.5">Push direct posts containing nutritional stats, calorie balance achievements and beautiful reports securely.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-stone-950 text-stone-550 text-xs py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-900 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow shadow-emerald-600/30">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <span className="text-stone-300 font-bold text-xs tracking-tight">SmartBite AI — Modern Food Analyzer Hub</span>
          </div>
          <div>
            <span>© 2026 SmartBite AI Assistant. Integrated with Google Gemini &amp; Firebase. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
