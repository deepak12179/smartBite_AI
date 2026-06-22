import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Scanner from "./components/Scanner";
import Challenges from "./components/Challenges";
import Recipes from "./components/Recipes";
import SocialHub from "./components/SocialHub";
import { useFirebase } from "./lib/FirebaseProvider";
import { UserProfile, FoodLog, Challenge, InAppNotification, MealType } from "./types";
import { 
  Apple, 
  Activity, 
  Award, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Bell, 
  Settings, 
  Flame, 
  Heart, 
  Clock, 
  ChevronRight, 
  LogOut, 
  Sliders, 
  CheckCircle2, 
  X,
  PlusCircle,
  HelpCircle,
  ChefHat
} from "lucide-react";

export const calculateRecommendedCalories = (
  age: number,
  weight: number,
  height: number,
  gender: 'Male' | 'Female',
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active',
  healthGoals: 'Lose weight' | 'Build muscle' | 'Stay healthy' | 'Increase athletic performance',
  targetWeight?: number
) => {
  if (!age || !weight || !height) {
    return {
      maintenance: 2200,
      recommended: 2200,
      isDeficit: false,
      isSurplus: false,
      difference: 0
    };
  }

  // 1. Calculate BMR (Mifflin-St Jeor)
  let bmr = 0;
  if (gender === 'Female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // 2. TDEE Activity multiplier
  let multiplier = 1.375;
  if (activityLevel === 'Sedentary') multiplier = 1.2;
  else if (activityLevel === 'Light') multiplier = 1.375;
  else if (activityLevel === 'Moderate') multiplier = 1.55;
  else if (activityLevel === 'Active') multiplier = 1.725;

  const maintenance = Math.round(bmr * multiplier);

  // 3. Goal Adjustment & Target Weight Consideration
  const target = targetWeight !== undefined && targetWeight > 0 ? targetWeight : weight;
  let finalCalorie = maintenance;

  if (healthGoals === 'Lose weight' || target < weight) {
    const weightDiff = weight - target;
    const deficit = weightDiff > 0 ? Math.min(750, Math.max(350, Math.round(weightDiff * 100))) : 500;
    finalCalorie = maintenance - deficit;
    // Safe limits
    const limit = gender === 'Female' ? 1200 : 1500;
    if (finalCalorie < limit) finalCalorie = limit;
  } else if (healthGoals === 'Build muscle' || target > weight) {
    const weightDiff = target - weight;
    const surplus = weightDiff > 0 ? Math.min(500, Math.max(250, Math.round(weightDiff * 75))) : 400;
    finalCalorie = maintenance + surplus;
  } else if (healthGoals === 'Increase athletic performance') {
    finalCalorie = maintenance + 200;
  }

  return {
    maintenance,
    recommended: finalCalorie,
    isDeficit: finalCalorie < maintenance,
    isSurplus: finalCalorie > maintenance,
    difference: Math.abs(finalCalorie - maintenance)
  };
};

export default function App() {
  const {
    user,
    profile,
    foodLogs,
    challenges,
    notifications,
    loading,
    signInWithGoogle,
    signInGuest,
    signOutUser,
    updateProfile,
    addLog,
    deleteLog,
    addNotification,
    markNotificationsRead
  } = useFirebase();

  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "challenges" | "recipes" | "social">("landing");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showProfileConfig, setShowProfileConfig] = useState(false);
  
  // Virtual account helper states for sandboxed browser iframes
  const [showIframeGoogleLogin, setShowIframeGoogleLogin] = useState(false);
  const [iframeEmail, setIframeEmail] = useState("nihal20maurya05@gmail.com");
  const [iframeName, setIframeName] = useState("Nihal Maurya");

  // Profile Form state helper inputs
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formAge, setFormAge] = useState(24);
  const [formWeight, setFormWeight] = useState(72);
  const [formHeight, setFormHeight] = useState(175);
  const [formDailyCalorieGoal, setFormDailyCalorieGoal] = useState(2200);
  const [formHealthGoals, setFormHealthGoals] = useState("Stay healthy");
  const [formDietPlan, setFormDietPlan] = useState("Balanced");
  const [formGender, setFormGender] = useState<"Male" | "Female">("Male");
  const [formActivityLevel, setFormActivityLevel] = useState<"Sedentary" | "Light" | "Moderate" | "Active">("Moderate");
  const [formTargetWeight, setFormTargetWeight] = useState<number>(72);
  const [formAutoCalcCalories, setFormAutoCalcCalories] = useState(true);

  // Handle high-fidelity simulated google oauth triggers inside sandboxed preview frames
  useEffect(() => {
    const handleShowIframeAuth = () => {
      setShowIframeGoogleLogin(true);
    };
    window.addEventListener("show-iframe-google-auth", handleShowIframeAuth);
    return () => {
      window.removeEventListener("show-iframe-google-auth", handleShowIframeAuth);
    };
  }, []);

  // Synchronize form draft when active profile changes
  useEffect(() => {
    if (profile) {
      setFormDisplayName(profile.displayName);
      setFormAge(profile.age);
      setFormWeight(profile.weight);
      setFormHeight(profile.height);
      setFormDailyCalorieGoal(profile.dailyCalorieGoal);
      setFormHealthGoals(profile.healthGoals);
      setFormDietPlan(profile.dietPlan);
      setFormGender(profile.gender || "Male");
      setFormActivityLevel(profile.activityLevel || "Moderate");
      setFormTargetWeight(profile.targetWeight || profile.weight || 72);
      setFormAutoCalcCalories(true);
    }
  }, [profile]);

  // Live Auto-estimation runner
  useEffect(() => {
    if (formAutoCalcCalories) {
      const calcResult = calculateRecommendedCalories(
        Number(formAge),
        Number(formWeight),
        Number(formHeight),
        formGender,
        formActivityLevel,
        formHealthGoals as any,
        Number(formTargetWeight)
      );
      setFormDailyCalorieGoal(calcResult.recommended);
    }
  }, [formAge, formWeight, formHeight, formGender, formActivityLevel, formHealthGoals, formTargetWeight, formAutoCalcCalories]);

  // Quick reminder generator timer effect
  useEffect(() => {
    if (!user) return;
    const reminders = [
      { title: "⏰ Hydration Time!", message: "Drink a glass of water to stabilize nutrient transit speeds.", type: "reminder" },
      { title: "🥗 Goal Progress Alert", message: "Log vegetables or leafy plates to boost your Daily Quality average.", type: "goal" },
      { title: "🔥 Active Streak multiplier!", message: "Keep analyzing active meal logs to lock today's XP multiplier.", type: "streak" }
    ];

    const interval = setInterval(() => {
      const selected = reminders[Math.floor(Math.random() * reminders.length)];
      addNotification({
        title: selected.title,
        message: selected.message,
        type: selected.type as any
      });
    }, 120000); // Trigger notification every 2 minutes for interactive preview showcase

    return () => clearInterval(interval);
  }, [user]);

  const handleUpdateProfile = async (updated: UserProfile) => {
    await updateProfile(updated);
  };

  const handleLogMeal = async (newMeal: Omit<FoodLog, "id" | "userId" | "timestamp" | "date">) => {
    await addLog(newMeal);
  };

  const handleDeleteLog = async (id: string) => {
    await deleteLog(id);
  };

  const saveProfileConfigForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      displayName: formDisplayName,
      age: Number(formAge),
      weight: Number(formWeight),
      height: Number(formHeight),
      dailyCalorieGoal: Number(formDailyCalorieGoal),
      healthGoals: formHealthGoals as any,
      dietPlan: formDietPlan as any,
      gender: formGender,
      activityLevel: formActivityLevel,
      targetWeight: Number(formTargetWeight)
    };

    await handleUpdateProfile(updatedProfile);
    setShowProfileConfig(false);

    await addNotification({
      title: "⚙️ Profile Settings Updated!",
      message: `Your calorie budgets (${formDailyCalorieGoal} kcal) and target weight values have been updated successfully!`,
      type: "goal"
    });
  };

  const clearLoggedNotifications = async () => {
    await markNotificationsRead();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-600 font-bold text-sm">Synchronizing Cloud Nutrition Data...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <LandingPage 
          onGetStarted={async () => {
            if (!user) {
              await signInWithGoogle();
            } else {
              setCurrentView("dashboard");
            }
          }} 
          onContinueAsGuest={async () => {
            if (!user) {
              await signInGuest();
            }
            setCurrentView("dashboard");
          }}
        />

        {showIframeGoogleLogin && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-stone-100 text-left animate-in fade-in zoom-in-95 duration-250">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-250/60 shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-sans font-extrabold text-base text-stone-900 tracking-tight">Setup Google Account</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    You are in the AI Studio sandboxed preview frame (popups restricted). Please configure your virtual credentials below for custom persistent database cloud logs!
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 font-mono block">YOUR DISPLAY NAME</label>
                  <input
                    type="text"
                    value={iframeName}
                    onChange={(e) => setIframeName(e.target.value)}
                    placeholder="e.g. Nihal Maurya"
                    className="w-full bg-stone-50 border border-stone-200 hover:border-stone-400 p-2.5 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 font-mono block">GMAIL EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={iframeEmail}
                    onChange={(e) => setIframeEmail(e.target.value)}
                    placeholder="e.g. nihal20maurya05@gmail.com"
                    className="w-full bg-stone-50 border border-stone-200 hover:border-stone-400 p-2.5 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={async () => {
                    if (!iframeEmail.trim() || !iframeName.trim()) return;
                    setShowIframeGoogleLogin(false);
                    await signInWithGoogle({
                      displayName: iframeName.trim(),
                      email: iframeEmail.trim()
                    });
                    setCurrentView("dashboard");
                  }}
                  className="w-full bg-stone-900 hover:bg-stone-850 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                  </svg>
                  <span>Verify and Sign In</span>
                </button>
                
                <button
                  onClick={() => setShowIframeGoogleLogin(false)}
                  className="w-full bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-stone-700 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-100 min-h-screen text-stone-800 flex flex-col font-sans">
      
      {/* App Top navigation Bar bar */}
      <header className="border-b border-stone-200 bg-white/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shadow-emerald-600/30">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight text-stone-900 block">SmartBite AI</span>
              <span className="font-mono text-[9px] text-emerald-700 tracking-wider font-bold uppercase -mt-1 block">Nutrition Studio v1.0</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            <button
              onClick={() => { setCurrentView("dashboard"); setIsScannerOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentView === "dashboard" && !isScannerOpen ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setCurrentView("challenges"); setIsScannerOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                currentView === "challenges" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Challenges</span>
            </button>
            <button
              onClick={() => { setCurrentView("recipes"); setIsScannerOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                currentView === "recipes" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>AI Recipes</span>
            </button>
            <button
              onClick={() => { setCurrentView("social"); setIsScannerOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                currentView === "social" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>
          </nav>

          {/* Quick profile status and controls */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                setShowNotificationCenter(!showNotificationCenter);
                if (showNotificationCenter) clearLoggedNotifications();
              }}
              className="p-2 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition relative"
            >
              <Bell className="w-4 h-4 text-stone-600" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full animate-bounce"></span>
              )}
            </button>

            <button
              onClick={() => setShowProfileConfig(!showProfileConfig)}
              className="p-2 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition"
              title="Edit goals and profile"
            >
              <Settings className="w-4 h-4 text-stone-600" />
            </button>

            <div className="hidden sm:flex items-center gap-2.5 pl-3.5 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                {profile.displayName[0]}
              </div>
              <div className="text-left">
                <strong className="text-xs text-stone-900 block leading-none">{profile.displayName}</strong>
                <span className="text-[10px] text-stone-400 font-mono font-bold mt-0.5 block">🔥 {profile.streakCount} streaks</span>
              </div>
            </div>

            <button
              onClick={async () => {
                await signOutUser();
                setCurrentView("landing");
              }}
              className="p-2 text-stone-450 hover:text-rose-600 transition"
              title="Sign out of SmartBite"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid core body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">
        
        {/* Dynamic Scan Panel alert container */}
        {isScannerOpen ? (
          <Scanner 
            profile={profile}
            onLogMeal={(log) => {
              handleLogMeal(log);
              setIsScannerOpen(false);
            }} 
            onClose={() => setIsScannerOpen(false)}
          />
        ) : (
          (() => {
            switch (currentView) {
              case "dashboard":
                return (
                  <Dashboard 
                    logs={foodLogs} 
                    profile={profile}
                    onAddMeallClick={() => setIsScannerOpen(true)}
                    onDeleteLog={handleDeleteLog}
                    onUpdateProfile={handleUpdateProfile}
                  />
                );
              case "challenges":
                return (
                  <Challenges 
                    profile={profile} 
                    challenges={challenges} 
                  />
                );
              case "recipes":
                return (
                  <Recipes 
                    profile={profile} 
                  />
                );
              case "social":
                return (
                  <SocialHub 
                    profile={profile} 
                    logs={foodLogs} 
                  />
                );
              default:
                return null;
            }
          })()
        )}

        {/* Global floating action button (Fab) if scanner closed */}
        {!isScannerOpen && currentView !== "landing" && (
          <button
            onClick={() => setIsScannerOpen(true)}
            className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-4 rounded-full shadow-lg hover:shadow-emerald-600/35 transition duration-200 z-30 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Apple className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300">Scan Meal</span>
          </button>
        )}

        {/* Notifications and push simulator panel center drawer */}
        {showNotificationCenter && (
          <div className="absolute top-0 right-4 sm:right-8 bg-white border border-stone-200 rounded-3xl p-5 w-80 sm:w-96 shadow-2xl z-50 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h4 className="font-sans font-extrabold text-sm text-stone-900">Push &amp; Reminder Logs</h4>
              </div>
              <button 
                onClick={() => setShowNotificationCenter(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-stone-50 rounded-xl space-y-1 text-left border border-stone-100 transition">
                  <div className="flex justify-between items-start gap-1">
                    <strong className="text-xs text-stone-800 leading-tight">{notif.title}</strong>
                    <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-widest shrink-0">
                      {notif.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal font-semibold">{notif.message}</p>
                  <span className="text-[8px] text-stone-400 font-mono mt-1 block">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
              <button
                onClick={clearLoggedNotifications}
                className="text-[10px] text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer"
              >
                Mark all as read
              </button>
              <button
                onClick={() => {
                  addNotification({
                    title: "⏰ Meal Reminder Alert!",
                    message: "It's past your regular dinnertime. Scan snacks or logs to lock goals.",
                    type: "reminder"
                  });
                }}
                className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded font-bold"
              >
                Simulate Alarm
              </button>
            </div>
          </div>
        )}

        {/* Profile Onboarding configure wizard Modal */}
        {showProfileConfig && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 text-left shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-sans font-extrabold text-base text-stone-900">Demographics &amp; Health Goal Config</h4>
                </div>
                <button 
                  onClick={() => setShowProfileConfig(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={saveProfileConfigForm} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-stone-500 font-mono block">DISPLAY NAME</label>
                    <input 
                      type="text" 
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 hover:border-stone-450 p-2.5 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 font-mono block">BIOLOGICAL SEX</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      <option value="Male">👦 Male</option>
                      <option value="Female">👧 Female</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 font-mono block">AGE (YEARS)</label>
                    <input 
                      type="number"
                      value={formAge}
                      onChange={(e) => setFormAge(Number(e.target.value) || 24)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 hover:border-stone-450 p-2.5 rounded-xl text-xs font-bold text-stone-700 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 font-mono block">CURRENT WEIGHT (KG)</label>
                    <input 
                      type="number"
                      value={formWeight}
                      onChange={(e) => setFormWeight(Number(e.target.value) || 72)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 hover:border-stone-450 p-2.5 rounded-xl text-xs font-bold text-stone-700 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 font-mono block">HEIGHT (CM)</label>
                    <input 
                      type="number"
                      value={formHeight}
                      onChange={(e) => setFormHeight(Number(e.target.value) || 175)}
                      className="w-full bg-stone-50 border border-stone-200 hover:border-stone-450 p-2.5 rounded-xl text-xs font-bold text-stone-700 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-stone-500 font-mono block">ACTIVITY LEVEL</label>
                    <select
                      value={formActivityLevel}
                      onChange={(e) => setFormActivityLevel(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      <option value="Sedentary">Sedentary (No Exercise / Desk Job)</option>
                      <option value="Light">Lightly Active (Light exercise 1-3 days/wk)</option>
                      <option value="Moderate">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                      <option value="Active">Highly Active (Hard training 6-7 days/wk)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-stone-500 font-mono block text-emerald-700">🎯 TARGET WEIGHT TO ACHIEVE (KG)</label>
                    <input 
                      type="number"
                      value={formTargetWeight}
                      onChange={(e) => setFormTargetWeight(Number(e.target.value) || formWeight)}
                      required
                      placeholder="e.g. 68"
                      className="w-full bg-stone-50 border-2 border-emerald-200 hover:border-emerald-450 p-2.5 rounded-xl text-xs font-bold text-stone-900 font-mono focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-400 block font-semibold leading-normal">
                      Entering a target larger or smaller than your current weight will trigger our dynamic calorie surplus or deficit calculations automatically.
                    </span>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-stone-500 font-mono block">HEALTH STRATEGY TARGET</label>
                    <select
                      value={formHealthGoals}
                      onChange={(e) => setFormHealthGoals(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      <option value="Lose weight">Lose Weight (Caloric deficit and metabolism)</option>
                      <option value="Build muscle">Build Muscle (High caloric, hyper-protein)</option>
                      <option value="Stay healthy">Stay Healthy (Balanced maintenance)</option>
                      <option value="Increase athletic performance">Increase Athlete Performance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-stone-500 font-mono block">ACTIVE DIETARY STYLE</label>
                    <select
                      value={formDietPlan}
                      onChange={(e) => setFormDietPlan(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      <option value="Balanced">Balanced Mix (Recommended)</option>
                      <option value="Keto">Keto Lifestyle (Ultra-low Carbs)</option>
                      <option value="Low Carb">Low Carb Focus</option>
                      <option value="High Protein">High Bioavailable Protein</option>
                      <option value="Vegetarian">Pure Vegetarian Plates</option>
                    </select>
                  </div>

                  {/* Dynamic Calculation preview block */}
                  {(() => {
                    const calc = calculateRecommendedCalories(
                      Number(formAge),
                      Number(formWeight),
                      Number(formHeight),
                      formGender,
                      formActivityLevel,
                      formHealthGoals as any,
                      Number(formTargetWeight)
                    );
                    return (
                      <div className="col-span-2 bg-gradient-to-br from-emerald-50 to-indigo-50 border border-emerald-100 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                            <span>AI Calorie Forecast Engine</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                          Using the Mifflin-St Jeor equation, your baseline daily expenditure (TDEE) is <strong className="text-stone-850">{calc.maintenance} kcal</strong>. 
                          {calc.isDeficit && ` To achieve your target weight of ${formTargetWeight} kg safely, we generated a caloric deficit of -${calc.difference} kcal.`}
                          {calc.isSurplus && ` To achieve your target weight of ${formTargetWeight} kg safely, we generated a caloric surplus of +${calc.difference} kcal.`}
                          {!calc.isDeficit && !calc.isSurplus && ` To sustain your active lifestyle, we recommend your exact maintenance limit.`}
                        </p>
                        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                          <div className="text-stone-700 text-xs">
                            Calculated Target: <strong className="text-emerald-700 text-sm font-extrabold">{calc.recommended} kcal/day</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-stone-400 font-bold">Auto-sync budget:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormAutoCalcCalories(!formAutoCalcCalories);
                                if (!formAutoCalcCalories) {
                                  setFormDailyCalorieGoal(calc.recommended);
                                }
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                formAutoCalcCalories 
                                  ? "bg-emerald-600 text-white" 
                                  : "bg-stone-100 text-stone-500"
                              }`}
                            >
                              {formAutoCalcCalories ? "✓ Enabled" : "Disabled (Use custom)"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-stone-500 font-mono block">FINAL DAILY CALORIE LIMIT TARGET</label>
                    <input 
                      type="number"
                      value={formDailyCalorieGoal}
                      onChange={(e) => {
                        setFormDailyCalorieGoal(Number(e.target.value) || 2200);
                        setFormAutoCalcCalories(false); // Disable sync if user typed manually
                      }}
                      required
                      className="w-full bg-stone-50 border border-stone-200 hover:border-stone-450 p-2.5 rounded-xl text-xs font-bold text-stone-900 font-mono focus:outline-none"
                    />
                    <span className="text-[9px] text-stone-400 block font-semibold leading-normal">
                      Manual inputs here will lock in your custom value and override continuous auto-sync.
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setShowProfileConfig(false)}
                    className="bg-stone-50 hover:bg-stone-100 px-4 py-2 rounded-xl text-xs font-bold text-stone-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
