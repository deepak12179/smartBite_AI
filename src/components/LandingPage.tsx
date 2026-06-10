import React, { useState } from "react";
import { motion } from "motion/react";
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
  Dribbble, 
  UtensilsCrossed, 
  TrendingUp, 
  CheckCircle,
  Apple,
  Clock,
  Sparkle
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [devicePreviewMode, setDevicePreviewMode] = useState<"desktop" | "mobile">("desktop");

  const coreFeatures = [
    {
      icon: <Camera className="w-6 h-6 text-emerald-500" />,
      title: "Fast AI Image Recognition",
      description: "Snap a photo of your plate, and our Gemini-powered engine instantly identifies foods, sizes, and ingredients."
    },
    {
      icon: <Activity className="w-6 h-6 text-teal-500" />,
      title: "Macronutrient Breakdown",
      description: "Detailed analysis of calories, protein, carbs, fats, vitamins, and minerals with dynamic nutrient health quality scores."
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-500" />,
      title: "Goal-Based Suitable Analysis",
      description: "Guides whether to eat, limit, or avoid specific items based on your personal weight, age, diet plan, and health metrics."
    },
    {
      icon: <Award className="w-6 h-6 text-amber-500" />,
      title: "Gamified Challenges & Streaks",
      description: "Earn experience points, unlock glossy badges, build consistent streaks, and take on motivational nutrition challenges."
    }
  ];

  const sampleFoodScans = [
    {
      name: "Avocado Sourdough Toast",
      img: "🥑",
      cal: 290,
      score: 92,
      rec: "EAT",
      suitability: "Highly aligned with your 'Stay healthy' goal. Rich in healthy unsaturated fats and soluble fibers."
    },
    {
      name: "Double Pepperoni Pizza Slice",
      img: "🍕",
      cal: 380,
      score: 42,
      rec: "AVOID",
      suitability: "Exceeds desired sodium and saturated fats. Avoid during weight loss phase, or substitute with cauliflower crust."
    }
  ];

  return (
    <div id="landing_container" className="bg-gradient-to-b from-stone-50 via-emerald-50/20 to-white min-h-screen text-stone-800">
      {/* Dynamic Header */}
      <header className="border-b border-stone-200/60 backdrop-blur-md sticky top-0 bg-white/85 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shadow-emerald-600/30">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans font-bold text-xl tracking-tight text-stone-900 block">SmartBite AI</span>
              <span className="font-mono text-[9px] text-emerald-700 tracking-wider font-bold uppercase -mt-1 block">Nutrition Assistant</span>
            </div>
          </div>
          <button 
            id="start-button-header"
            onClick={onGetStarted}
            className="bg-stone-900 hover:bg-emerald-700 text-white font-sans text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition duration-250 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Scan My Plate</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/80 rounded-full text-emerald-800 text-xs font-semibold">
              <Sparkle className="w-3 h-3 text-emerald-600 animate-spin" />
              <span>Next-Gen Gemini 3.5 AI Core</span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-stone-900 leading-[1.1]">
              Snap, Analyze, and <span className="text-emerald-600 underline decoration-emerald-200 decoration-8 underline-offset-4">Eat Smarter</span>
            </h1>
            <p className="text-stone-600 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Scan any meal with your camera to instantly decode ingredients, check macro balances, track calorie targets, and unlock badges for healthy eating streaks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                id="start-tracking-cta"
                onClick={onGetStarted}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold px-7 py-4 rounded-xl transition shadow-lg shadow-emerald-600/30 duration-200 text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Premium Assistant</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
              <a
                href="#features-highlight"
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-sans font-bold px-7 py-4 rounded-xl transition duration-200 text-base flex justify-center items-center gap-2"
              >
                Learn More
              </a>
            </div>

            {/* Micro Stats Banner */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-200 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="block text-2xl font-black text-stone-900">99.4%</span>
                <span className="block text-xs text-stone-500 font-semibold font-mono">SCAN ACCURACY</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-stone-900">&lt; 2s</span>
                <span className="block text-xs text-stone-500 font-semibold font-mono">LATENCY SPEED</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-emerald-600">Free</span>
                <span className="block text-xs text-stone-500 font-semibold font-mono">STUDIO VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Interactive Screen Preview with Desktop/Mobile Views Simulators */}
          <div className="lg:col-span-6 relative">
            <div className="flex justify-center gap-3 mb-4 bg-stone-100 p-1.5 rounded-xl max-w-xs mx-auto">
              <button
                onClick={() => setDevicePreviewMode("desktop")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  devicePreviewMode === "desktop" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop view</span>
              </button>
              <button
                onClick={() => setDevicePreviewMode("mobile")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  devicePreviewMode === "mobile" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile view</span>
              </button>
            </div>

            {devicePreviewMode === "desktop" ? (
              /* Desktop Mockup */
              <motion.div 
                key="desktop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col"
              >
                {/* Window header */}
                <div className="bg-stone-900 text-stone-400 px-4 py-2.5 flex items-center gap-1.5 select-none text-xs border-b border-stone-800 font-mono">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="ml-4 text-[10px] text-stone-500">smartbite-analyzer.app/dashboard</span>
                </div>
                {/* Inner Desktop Page */}
                <div className="flex-1 bg-stone-50 p-4 grid grid-cols-12 gap-3 text-left overflow-y-auto">
                  
                  {/* Left Sidebar inside page mockup */}
                  <div className="col-span-3 bg-white border border-stone-200 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800">N</div>
                      <div className="font-bold text-stone-900 text-sm">Nihal M.</div>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold inline-block">🎯 Lose Weight Plan</span>
                      <div className="pt-2 border-t border-stone-100 text-stone-500 space-y-1">
                        <div className="flex justify-between font-mono font-semibold"><span>Current streak:</span> <span className="text-amber-600">🔥 3 days</span></div>
                        <div className="flex justify-between font-mono font-semibold"><span>Score points:</span> <span className="text-stone-900">120 XP</span></div>
                      </div>
                    </div>
                    <button className="w-full bg-emerald-600 text-white font-semibold py-1.5 rounded-lg text-center" onClick={onGetStarted}>Scan plate</button>
                  </div>

                  {/* Main screen area */}
                  <div className="col-span-9 space-y-3">
                    <div className="bg-white border border-stone-200 rounded-xl p-3 flex justify-between items-center gap-2">
                      <div>
                        <div className="text-stone-500 text-[10px] font-bold uppercase tracking-wider font-mono">CALORIE WORKLOAD</div>
                        <div className="font-bold text-stone-900 text-lg">1,340 / 2,200 kcal</div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mt-1">
                          <div className="bg-emerald-500 h-full w-[60%]"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-600 text-xs font-bold block">✓ Status Balanced</span>
                        <span className="text-[10px] text-stone-400">860 kcal remaining</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {sampleFoodScans.map((food, idx) => (
                        <div key={idx} className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl">{food.img}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                              food.rec === "EAT" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>{food.rec}</span>
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-xs truncate">{food.name}</div>
                            <div className="text-[10px] text-stone-500 font-mono flex gap-2">
                              <span>🔥 {food.cal} cal</span>
                              <span className="text-emerald-700 font-bold">⭐ quality: {food.score}/100</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-[10px] text-emerald-800 leading-relaxed font-semibold">
                      ⚡ <strong>AI Guide Recommendation:</strong> Ready for lunch? A fiber-dense salad or protein wrap is suggested to sustain high cellular energy and keep your macro balance.
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              /* Mobile Mockup representation */
              <motion.div
                key="mobile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-stone-900 rounded-[35px] border-8 border-stone-900 shadow-2xl overflow-hidden aspect-[9/18] max-w-xs mx-auto"
              >
                {/* Speaker indicator notch */}
                <div className="absolute top-0 inset-x-0 h-4 bg-stone-900 flex justify-center z-25">
                  <div className="w-16 h-3 bg-stone-900 rounded-b-md"></div>
                </div>
                {/* Inner mobile screen */}
                <div className="h-full bg-stone-50 pt-6 px-3 pb-4 overflow-y-auto space-y-3 text-left">
                  {/* Top Header info */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-stone-900 text-xs">📱 Mobile SmartBite</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-black">🔥 3 STREAKS</span>
                  </div>

                  <div className="bg-stone-900 text-white rounded-xl p-3 text-center space-y-2">
                    <div className="text-stone-400 text-[10px] font-mono">TODAY`S TARGET METERS</div>
                    <div className="text-xl font-black text-amber-300">1,340 kcal</div>
                    <div className="text-[10px] text-emerald-400">Under plan limits</div>
                  </div>

                  {/* Single detailed food analysis visualizer card */}
                  <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 text-white flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider opacity-90">SCAN NO: #405</span>
                        <div className="font-bold text-xs truncate">Avocado Sourdough</div>
                      </div>
                      <div className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                        ⭐ 92 Score
                      </div>
                    </div>
                    <div className="p-3 space-y-2 text-xs text-stone-700">
                      <div className="flex justify-between py-1 border-b border-stone-100 font-mono">
                        <span>Carbohydrates:</span> <span className="font-bold">22g</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100 font-mono">
                        <span>Proteins:</span> <span className="font-bold">14g</span>
                      </div>
                      <div className="flex justify-between py-1 font-mono">
                        <span>Total Fats:</span> <span className="font-bold">16g</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded block leading-normal mt-1 border border-emerald-100">
                        ⭐ <strong>AI Recommendation:</strong> Highly suitable. Good fats and dietary fibers that enhance cardiovascular and metabolic health.
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl text-center shadow" onClick={onGetStarted}>
                    📸 Launch Scanner Now
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Section Detailed highlights */}
      <section id="features-highlight" className="py-20 bg-stone-100/50 border-t border-b border-stone-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold font-sans tracking-tight text-stone-900">
              Complete Personalized Diet and Health Intelligence
            </h2>
            <p className="text-stone-600 font-medium">
              We leverage multi-modal models to understand your plate, calculate food synergy scores, suggest nutritious replacements, and make logging easy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-bold text-stone-900">{feat.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed font-semibold">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative space-y-6">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              Science-Backed Food Quality Scores
            </h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              Every food item you upload goes through our <strong>Wellness Scoring Algorithm</strong>. The algorithm analyzes:
            </p>
            <ul className="space-y-4">
              {[
                { label: "Nutrient-to-calorie density", desc: "Favoring elements rich in natural micronutrients." },
                { label: "Unsaturated healthy fat balances", desc: "Advocating omega-3s over saturated/trans-fats." },
                { label: "Soluble dietary fiber levels", desc: "Prioritizing stable glycogen rates and bowel wellness." },
                { label: "Demographic and medical suitability", desc: "Customized to your active weight, age, and lifestyle profiles." }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold mt-1 shrink-0">✓</div>
                  <div>
                    <strong className="text-stone-900 text-sm block">{item.label}</strong>
                    <span className="text-xs text-stone-500 font-semibold">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1"></div>

          {/* Social Proof & Badges Demo */}
          <div className="lg:col-span-6 bg-gradient-to-tr from-emerald-900 to-stone-900 text-stone-100 p-8 rounded-3xl space-y-6 shadow-xl">
            <span className="text-amber-400 font-mono text-xs uppercase font-extrabold tracking-widest block">🎰 RETENTION & HABITS</span>
            <h3 className="text-2xl font-bold tracking-tight">Streaks, Badges & Social Sharing</h3>
            <p className="text-stone-300 text-sm font-medium">
              We design daily triggers to help you maintain consistency. Earn milestone points, log weekly routines, and compete on the local scoreboard with your friends.
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { title: "Flame Runner", desc: "3 Log Streaks", icon: "🔥", color: "text-amber-400" },
                { title: "Iron Titan", desc: "30g+ Proteins", icon: "🛡️", color: "text-blue-400" },
                { title: "Green Guard", desc: "90+ Score Food", icon: "⭐", color: "text-emerald-400" }
              ].map((badge, idx) => (
                <div key={idx} className="bg-white/10 p-4 rounded-2xl text-center space-y-2 border border-white/5">
                  <span className="text-3xl block">{badge.icon}</span>
                  <div className="font-bold text-[11px] truncate text-white">{badge.title}</div>
                  <div className="text-[9px] text-stone-400">{badge.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <strong className="text-xs text-stone-200 block">Encourage Friends and Family</strong>
                <span className="text-[11px] text-stone-400 leading-normal block">Share logged plates directly to your socials with formatted diet summaries and nutritional insights.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold">
              <Apple className="w-4 h-4" />
            </div>
            <span className="text-stone-200 font-bold text-sm tracking-tight">SmartBite AI — Interactive Food Analysis & Health Coach</span>
          </div>
          <div>
            <span>© 2026 AI Food Analyzer & Health Tracker. Powered by Gemini Cloud Services.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
