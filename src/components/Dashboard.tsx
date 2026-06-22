import React, { useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";
import { 
  Flame, 
  Plus, 
  TrendingUp, 
  Award, 
  Utensils, 
  Heart, 
  CheckCircle,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  PlusCircle,
  ThumbsUp,
  Sparkles,
  Droplet,
  Image as ImageIcon,
  Maximize2
} from "lucide-react";
import { FoodLog, UserProfile, MealType } from "../types";

interface DashboardProps {
  logs: FoodLog[];
  profile: UserProfile;
  onAddMeallClick: () => void;
  onDeleteLog: (id: string) => void;
  onUpdateProfile: (p: UserProfile) => void;
}

export default function Dashboard({ logs, profile, onAddMeallClick, onDeleteLog, onUpdateProfile }: DashboardProps) {
  const [hydrationUnites, setHydrationUnites] = useState<number>(4); // default 4 glasses of water
  const [chartMounted, setChartMounted] = useState(false);

  React.useEffect(() => {
    setChartMounted(true);
  }, []);
  const [quickWeight, setQuickWeight] = useState<string>(profile.weight.toString());
  const [quickTargetWeight, setQuickTargetWeight] = useState<string>((profile.targetWeight || profile.weight || 72).toString());
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [selectedMealFilter, setSelectedMealFilter] = useState<"All" | MealType>("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState<"Today" | "Yesterday" | "All-Time History">("Today");
  const [selectedMealForModal, setSelectedMealForModal] = useState<FoodLog | null>(null);

  React.useEffect(() => {
    setQuickWeight(profile.weight.toString());
    setQuickTargetWeight((profile.targetWeight || profile.weight || 72).toString());
  }, [profile]);

  // Group nutrients logged today
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(log => log.date === todayStr);

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const displayedLogs = logs.filter(log => {
    if (selectedDateFilter === "Today") {
      return log.date === todayStr;
    } else if (selectedDateFilter === "Yesterday") {
      return log.date === yesterdayStr;
    }
    return true; // All-time history
  });

  const sortedDisplayedLogs = [...displayedLogs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0);
  const totalCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0);
  const totalFats = todayLogs.reduce((sum, log) => sum + log.fats, 0);

  // Calorie progress percentage
  const caloriePercent = Math.min(100, Math.round((totalCalories / profile.dailyCalorieGoal) * 100));

  // Determine standard macros distribution targets
  // E.g. Lose weight budget goals: Balanced: Carbs: 50%, Protein: 20%, Fats: 30%
  // Keto: Carbs 5%, Protein 25%, Fats 70%
  // Low Carb: Carbs 25%, Protein 35%, Fats 40%
  // High Protein: Carbs 40%, Protein 40%, Fats 20%
  let targetProtein = 80;
  let targetCarbs = 200;
  let targetFats = 70;

  if (profile.dietPlan === "Keto") {
    targetProtein = 100;
    targetCarbs = 30;
    targetFats = 140;
  } else if (profile.dietPlan === "Low Carb") {
    targetProtein = 120;
    targetCarbs = 80;
    targetFats = 80;
  } else if (profile.dietPlan === "High Protein") {
    targetProtein = 150;
    targetCarbs = 150;
    targetFats = 50;
  }

  // Pre-aggregate history for the charts (representing previous 7 days)
  const previousDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const historyData = previousDays.map(dayDateStr => {
    const dayLogs = logs.filter(log => log.date === dayDateStr);
    const dayCals = dayLogs.reduce((sum, l) => sum + l.calories, 0);
    const dayPro = dayLogs.reduce((sum, l) => sum + l.protein, 0);
    
    // Label as short month/day
    const dateObj = new Date(dayDateStr);
    const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    return {
      name: label,
      calories: dayCals,
      goal: profile.dailyCalorieGoal,
      protein: dayPro,
    };
  });

  const hScoreAverage = todayLogs.length > 0 
    ? Math.round(todayLogs.reduce((sum, l) => sum + l.healthScore, 0) / todayLogs.length)
    : 0;

  const handleLoggedWeight = () => {
    const parsed = parseInt(quickWeight, 10);
    if (!isNaN(parsed) && parsed > 20) {
      onUpdateProfile({
        ...profile,
        weight: parsed
      });
      setIsWeightModalOpen(false);
    }
  };

  // Suitability guideline coach
  const getDailyCoachInsight = () => {
    if (todayLogs.length === 0) {
      return {
        title: "Ready for your first scan?",
        text: `Log your breakfast! Based on your target plan (${profile.dietPlan}), try starting today with a high-protein, nutrient-dense meal items.`,
        status: "info"
      };
    }

    if (totalCalories > profile.dailyCalorieGoal) {
      return {
        title: "Calorie target exceeded",
        text: "You have crossed your daily intake target. Consider physical exercises (e.g., walking, jogging) to balance the metabolic overhead for today.",
        status: "avoid"
      };
    }

    if (caloriePercent > 80) {
      return {
        title: "Approaching intake limits",
        text: "Excellent tracking! You've reached 80% of your daily calorie goal. Keep snacks brief and focus on water hydration.",
        status: "moderate"
      };
    }

    if (hScoreAverage >= 80) {
      return {
        title: "Splendid eating quality!",
        text: `Your average Meal Health Score is a solid ${hScoreAverage}/100. This highly supports cellular rejuvenation and long-term energy.`,
        status: "eat"
      };
    }

    return {
      title: "Keep it up!",
      text: "Every log improves precision. Try adding mineral-rich green plates to raise your fiber scores.",
      status: "info"
    };
  };

  const insight = getDailyCoachInsight();

  return (
    <div id="dashboard_panel" className="space-y-8 text-stone-800">
      
      {/* Target Status bar */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Main Rings and Stats meters */}
        <div className="md:col-span-8 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-[10px] tracking-wider font-bold text-stone-400 uppercase font-mono">TODAY`S CALORIE OVERVIEW</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans tracking-tight">
                {totalCalories} <span className="text-stone-400 font-normal text-lg">/ {profile.dailyCalorieGoal} kcal</span>
              </h2>
            </div>
            <button
              onClick={onAddMeallClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl transition duration-200 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Scan / Add Food</span>
            </button>
          </div>

          {/* Calorie Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-stone-500 font-mono">
              <span>{caloriePercent}% CONSUMED</span>
              <span>{profile.dailyCalorieGoal - totalCalories > 0 ? `${profile.dailyCalorieGoal - totalCalories} kcal left` : 'Goal finished!'}</span>
            </div>
            <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden flex">
              <div 
                className={`transition-all duration-550 h-full ${
                  totalCalories > profile.dailyCalorieGoal ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${caloriePercent}%` }}
              ></div>
            </div>
          </div>

          {/* Macronutrients Grid logs */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-100">
            <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200/50">
              <div className="flex justify-between items-center text-stone-500 text-[10px] font-bold font-mono">
                <span>PROTEIN</span>
                <span className="text-emerald-700 font-black">{targetProtein}g Target</span>
              </div>
              <div className="text-md sm:text-lg font-extrabold text-stone-900 font-sans">
                {totalProtein} <span className="text-stone-400 text-xs font-normal font-mono">g</span>
              </div>
              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200/50">
              <div className="flex justify-between items-center text-stone-500 text-[10px] font-bold font-mono">
                <span>CARBS</span>
                <span className="text-blue-700 font-black">{targetCarbs}g Target</span>
              </div>
              <div className="text-md sm:text-lg font-extrabold text-stone-900 font-sans">
                {totalCarbs} <span className="text-stone-400 text-xs font-normal font-mono">g</span>
              </div>
              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200/50">
              <div className="flex justify-between items-center text-stone-500 text-[10px] font-bold font-mono">
                <span>FATS</span>
                <span className="text-amber-700 font-black">{targetFats}g Target</span>
              </div>
              <div className="text-md sm:text-lg font-extrabold text-stone-900 font-sans">
                {totalFats} <span className="text-stone-400 text-xs font-normal font-mono">g</span>
              </div>
              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (totalFats / targetFats) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Box Profile / Hydration tracker */}
        <div className="md:col-span-4 space-y-6">
          {/* Streak Indicator Widget */}
          <div className="bg-gradient-to-tr from-stone-900 to-emerald-950 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
              <Flame className="w-36 h-36" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-wider text-emerald-400 font-bold uppercase font-mono">ACTIVE HABITS</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">LEVEL 4</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">{profile.streakCount} Days</div>
                  <div className="text-[11px] text-stone-400 font-semibold uppercase font-mono mt-0.5">Meal Log Streak</div>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                <span className="text-stone-400 font-semibold">Total Points:</span>
                <span className="font-extrabold text-amber-400">{profile.points} XP</span>
              </div>
            </div>
          </div>

          {/* Quick Water hydration and quick weight actions */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-bold text-sm text-stone-900">Hydration Glass</h3>
              <span className="text-xs font-mono font-bold text-blue-600">{hydrationUnites * 250} ml</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHydrationUnites(idx + 1)}
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs transition-all ${
                      idx < hydrationUnites 
                        ? "bg-blue-600 text-white" 
                        : "bg-stone-200 hover:bg-stone-300 text-stone-500"
                    }`}
                  >
                    <Droplet className={`w-3.5 h-3.5 ${idx < hydrationUnites ? "fill-white" : ""}`} />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setHydrationUnites(prev => Math.min(10, prev + 1))}
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs cursor-pointer focus:outline-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Real-time Weight Tracker & BMI Analyzer */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <span>Weight & BMI Tracker</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                Active: {profile.weight} kg
              </span>
            </div>

            {/* Calculate BMI dynamically */}
            {(() => {
              const heightInMeters = profile.height / 100;
              const bmi = heightInMeters > 0 ? (profile.weight / (heightInMeters * heightInMeters)).toFixed(1) : "0";
              const bmiNum = Number(bmi);
              let statusText = "Normal";
              let statusColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
              if (bmiNum < 18.5) {
                statusText = "Underweight";
                statusColor = "text-amber-600 bg-amber-50 border-amber-100";
              } else if (bmiNum >= 18.5 && bmiNum < 25) {
                statusText = "Normal Weight";
                statusColor = "text-emerald-600 bg-emerald-50/70 border-emerald-100";
              } else if (bmiNum >= 25 && bmiNum < 30) {
                statusText = "Overweight";
                statusColor = "text-orange-600 bg-orange-50 border-orange-100";
              } else {
                statusText = "Obese";
                statusColor = "text-rose-600 bg-rose-50 border-rose-100";
              }

              // Local dynamic calculation
              const currentWeightNum = parseFloat(quickWeight) || profile.weight;
              const targetWeightNum = parseFloat(quickTargetWeight) || profile.targetWeight || profile.weight;

              // Helper for local calorie recommendation
              const bmrG = profile.gender || 'Male';
              const bmrAct = profile.activityLevel || 'Moderate';
              let bmr = 0;
              if (bmrG === 'Female') {
                bmr = 10 * currentWeightNum + 6.25 * profile.height - 5 * profile.age - 161;
              } else {
                bmr = 10 * currentWeightNum + 6.25 * profile.height - 5 * profile.age + 5;
              }

              let multiplier = 1.375;
              if (bmrAct === 'Sedentary') multiplier = 1.2;
              else if (bmrAct === 'Light') multiplier = 1.375;
              else if (bmrAct === 'Moderate') multiplier = 1.55;
              else if (bmrAct === 'Active') multiplier = 1.725;

              const maintenance = Math.round(bmr * multiplier);
              let recommended = maintenance;
              const goal = profile.healthGoals || 'Stay healthy';

              if (goal === 'Lose weight' || targetWeightNum < currentWeightNum) {
                const weightDiff = currentWeightNum - targetWeightNum;
                const deficit = weightDiff > 0 ? Math.min(750, Math.max(350, Math.round(weightDiff * 100))) : 500;
                recommended = maintenance - deficit;
                const limit = bmrG === 'Female' ? 1200 : 1500;
                if (recommended < limit) recommended = limit;
              } else if (goal === 'Build muscle' || targetWeightNum > currentWeightNum) {
                const weightDiff = targetWeightNum - currentWeightNum;
                const surplus = weightDiff > 0 ? Math.min(500, Math.max(250, Math.round(weightDiff * 75))) : 400;
                recommended = maintenance + surplus;
              } else if (goal === 'Increase athletic performance') {
                recommended = maintenance + 200;
              }

              return (
                <div className="space-y-4">
                  {/* BMI display row */}
                  <div className="flex justify-between items-center bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase font-mono block">Your BMI</span>
                      <span className="text-base font-black text-stone-900 font-sans leading-none">{bmi}</span>
                    </div>
                    <div className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border uppercase tracking-wider ${statusColor} font-mono`}>
                      {statusText}
                    </div>
                  </div>

                  {/* Weight Inputs section */}
                  <div className="space-y-3 pt-1 border-t border-stone-100">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold uppercase font-mono block">Current Weight (kg)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Current weight"
                          value={quickWeight}
                          onChange={(e) => setQuickWeight(e.target.value)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(quickWeight);
                            if (!isNaN(val) && val > 10) {
                              onUpdateProfile({
                                ...profile,
                                weight: val
                              });
                            }
                          }}
                          className="bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-extrabold px-3 py-1.5 rounded-xl transition text-xs shrink-0 cursor-pointer font-sans"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-700 font-bold uppercase font-mono block flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Target Weight to Achieve (kg)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Desired target weight"
                          value={quickTargetWeight}
                          onChange={(e) => setQuickTargetWeight(e.target.value)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(quickTargetWeight);
                            if (!isNaN(val) && val > 10) {
                              // Save weight target & auto-save the generated calorie requirement
                              onUpdateProfile({
                                ...profile,
                                targetWeight: val,
                                dailyCalorieGoal: recommended // Auto-updated calorie requirement
                              });
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-3 py-1.5 rounded-xl transition text-xs shrink-0 cursor-pointer font-sans shadow-sm"
                        >
                          Save & Plan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generated recommendation banner */}
                  <div className="bg-gradient-to-br from-indigo-50/60 to-emerald-50/60 border border-slate-100 p-3 rounded-2xl space-y-1.5 text-left">
                    <span className="text-[9px] font-extrabold text-indigo-800 uppercase font-mono tracking-wider block">
                      🔮 Live Calorie Recommendation
                    </span>
                    <p className="text-[10px] text-stone-600 font-medium leading-relaxed">
                      Maintenance target is <strong>{maintenance} kcal</strong>. 
                      {targetWeightNum < currentWeightNum && ` Calorie deficit calculated to safely hit your target: `}
                      {targetWeightNum > currentWeightNum && ` Calorie surplus calculated to safely hit your target: `}
                      <strong>{recommended} kcal/day</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateProfile({
                          ...profile,
                          dailyCalorieGoal: recommended
                        });
                      }}
                      className="w-full mt-1.5 bg-white hover:bg-stone-50 text-emerald-750 font-extrabold py-1 px-2.5 rounded-lg border border-emerald-100 text-[10px] tracking-wide text-center cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      Apply Recommended {recommended} kcal Goal
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* AI Daily Coach Coaching panel */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 items-start ${
        insight.status === "avoid" ? "bg-rose-50 border-rose-200/80 text-rose-900" :
        insight.status === "moderate" ? "bg-amber-50 border-amber-200/80 text-amber-900" :
        insight.status === "eat" ? "bg-emerald-50 border-emerald-200/80 text-emerald-900" :
        "bg-stone-50 border-stone-200 text-stone-800"
      }`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          insight.status === "avoid" ? "bg-rose-100 text-rose-700" :
          insight.status === "moderate" ? "bg-amber-100 text-amber-700" :
          insight.status === "eat" ? "bg-emerald-100 text-emerald-700" :
          "bg-stone-100 text-stone-700"
        }`}>
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm font-sans flex items-center gap-1.5">
            <span>{insight.title}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </h4>
          <p className="text-xs font-semibold leading-relaxed opacity-90">{insight.text}</p>
        </div>
      </div>

      {/* Progress and Calorie analytics trends */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-bold font-mono tracking-wider text-stone-400 uppercase">WEEKLY TRENDS & PROGRESS</span>
          <h3 className="font-sans font-bold text-lg text-stone-900">7-Day Progress Trends</h3>
        </div>
        <div className="h-64 sm:h-72 w-full min-h-[250px]">
          {chartMounted ? (
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={historyData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fontWeight: 500, fill: "#78716c" }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fontWeight: 500, fill: "#78716c" }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    backgroundColor: "#1c1917", 
                    color: "#fff", 
                    border: "none",
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 500 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: "#10b981", fill: "#ffffff" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                  name="Consumed Intake (kcal)"
                />
                <Line 
                  type="monotone" 
                  dataKey="goal" 
                  stroke="#ea580c" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                  name="Daily Calorie Goal (kcal)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 font-bold font-sans">
              Loading trends data...
            </div>
          )}
        </div>
      </div>

      {/* My Meals Gallery section */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-5">
          <div>
            <span className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-wider font-semibold">VISUAL HISTORY</span>
            <h3 className="text-xl font-extrabold text-stone-900 font-sans tracking-tight">My Meals Gallery</h3>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">Browse your visual log of previously scanned plates</p>
          </div>
          
          {/* Meal type filter pills */}
          <div className="flex flex-wrap gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200/50">
            {(["All", "Breakfast", "Lunch", "Dinner", "Snack"] as const).map((filter) => {
              const active = selectedMealFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedMealFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    active 
                      ? "bg-white text-emerald-700 shadow-sm border border-stone-200/50" 
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/50 cursor-pointer"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtered Meals photo logs */}
        {(() => {
          const photoLogs = logs.filter(log => !!log.imageBase64);
          const filteredPhotoLogs = selectedMealFilter === "All" 
            ? photoLogs 
            : photoLogs.filter(log => log.mealType === selectedMealFilter);

          if (photoLogs.length === 0) {
            return (
              <div className="text-center py-12 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-stone-400 border border-stone-100 shadow-sm">
                  <ImageIcon className="w-6 h-6 shrink-0 text-stone-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-stone-800">Your meal gallery is empty</p>
                  <p className="text-xs text-stone-400 font-semibold max-w-sm mx-auto leading-relaxed">
                    Once you snap a picture of your food using the scanner, your culinary history will populate here!
                  </p>
                </div>
                <button
                  onClick={onAddMeallClick}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Scan First Meal</span>
                </button>
              </div>
            );
          }

          if (filteredPhotoLogs.length === 0) {
            return (
              <div className="text-center py-10 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                <p className="text-stone-400 text-xs font-semibold">No {selectedMealFilter} meals with photos found.</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotoLogs.map((log) => (
                <div 
                  key={log.id}
                  onClick={() => setSelectedMealForModal(log)}
                  className="group bg-stone-50 border border-stone-200/60 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-0.5"
                >
                  {/* Photo container */}
                  <div className="relative h-44 bg-stone-200 overflow-hidden shrink-0">
                    <img 
                      src={`data:image/png;base64,${log.imageBase64}`} 
                      alt={log.foodName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badge Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center bg-transparent pointer-events-none">
                      <span className="bg-stone-900/80 backdrop-blur-md text-white text-[9px] font-mono px-2 py-1 rounded-md font-extrabold tracking-wider uppercase">
                        {log.mealType}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-1 rounded-md font-extrabold shadow-sm ${
                        log.recommendation === "EAT" ? "bg-emerald-500 text-white" :
                        log.recommendation === "MODERATE" ? "bg-amber-500 text-white" :
                        "bg-rose-500 text-white"
                      }`}>
                        {log.recommendation}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-md text-stone-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect plate</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-stone-900 font-sans tracking-tight truncate">
                        {log.foodName}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold font-mono">
                        {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-xs text-stone-950 font-extrabold font-sans">
                        {log.calories} <span className="text-[10px] text-stone-400 font-semibold font-mono">kcal</span>
                      </span>
                      <span className="text-xs text-emerald-600 font-bold font-mono">
                        Score: {log.healthScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Daily meal items list */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-stone-100 pb-4">
          <div>
            <span className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-wider">LOGGED ITEMS</span>
            <h3 className="text-lg font-bold text-stone-900">
              {selectedDateFilter === "Today" ? "Today`s Plates and Meals" :
               selectedDateFilter === "Yesterday" ? "Yesterday`s Plates and Meals" :
               "All-Time Saved Plates and Meals"}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            {(["Today", "Yesterday", "All-Time History"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedDateFilter(mode)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-extrabold transition-all duration-200 cursor-pointer ${
                  selectedDateFilter === mode
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {sortedDisplayedLogs.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Utensils className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-400 text-xs font-semibold">
              {selectedDateFilter === "Today" ? "No food logged yet today. Try scanning a dish now!" :
               selectedDateFilter === "Yesterday" ? "No food logged yesterday." :
               "No food logs saved yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sortedDisplayedLogs.map((log) => (
              <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {log.imageBase64 ? (
                    <img 
                      src={`data:image/png;base64,${log.imageBase64}`} 
                      alt={log.foodName} 
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold font-mono text-xs shrink-0 border border-emerald-100">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-sm text-stone-900 break-words">{log.foodName}</span>
                      {selectedDateFilter === "All-Time History" && (
                        <span className="text-[10px] text-stone-400 font-bold font-mono">({log.date})</span>
                      )}
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-extrabold shrink-0 ${
                        log.recommendation === "EAT" ? "bg-emerald-100 text-emerald-800" :
                        log.recommendation === "MODERATE" ? "bg-amber-100 text-amber-800" :
                        "bg-rose-100 text-rose-800"
                      }`}>{log.recommendation}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-semibold font-mono flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
                      <span>{log.mealType}</span>
                      <span>•</span>
                      <span>{log.calories} kcal</span>
                      <span>•</span>
                      <span className="text-emerald-700">Health Score: {log.healthScore}/100</span>
                    </div>
                    <p className="text-xs text-stone-500 leading-normal mt-1 max-w-lg font-medium">{log.summary}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 shrink-0">
                  <div className="text-left sm:text-right space-y-0.5 font-mono text-[10px] text-stone-500">
                    <div className="font-semibold">P: {log.protein}g | C: {log.carbs}g | F: {log.fats}g</div>
                    <div>{new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Inspect Meal Detail Modal --- */}
      {selectedMealForModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 shadow-2xl relative border border-stone-250 overflow-hidden animate-scale-up">
            
            {/* Top Close Button */}
            <button 
              onClick={() => setSelectedMealForModal(null)}
              className="absolute top-4 right-4 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full p-2 transition z-20 shadow cursor-pointer"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
            
            {/* Modal Photo Header */}
            <div className="relative h-56 sm:h-64 bg-stone-100">
              <img 
                src={`data:image/png;base64,${selectedMealForModal.imageBase64}`}
                alt={selectedMealForModal.foodName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6">
                <div className="space-y-1.5 text-white">
                  <span className="bg-white/25 text-white text-[9px] font-mono px-2 py-0.5 rounded-md font-extrabold tracking-wider uppercase backdrop-blur-xs">
                    {selectedMealForModal.mealType}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">{selectedMealForModal.foodName}</h3>
                  <p className="text-[11px] text-stone-300 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(selectedMealForModal.timestamp).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedMealForModal.timestamp).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Macros Breakdown row */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="text-[9px] font-bold text-stone-400 font-mono tracking-wider">CALORIES</div>
                  <div className="text-sm sm:text-base font-extrabold text-stone-900">{selectedMealForModal.calories} <span className="text-[10px] text-stone-400 font-normal">kcal</span></div>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="text-[9px] font-bold text-stone-400 font-mono tracking-wider">PROTEIN</div>
                  <div className="text-sm sm:text-base font-extrabold text-emerald-700">{selectedMealForModal.protein} <span className="text-[10px] text-stone-400 font-normal">g</span></div>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="text-[9px] font-bold text-stone-400 font-mono tracking-wider">CARBS</div>
                  <div className="text-sm sm:text-base font-extrabold text-blue-700">{selectedMealForModal.carbs} <span className="text-[10px] text-stone-400 font-normal">g</span></div>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="text-[9px] font-bold text-stone-400 font-mono tracking-wider">FATS</div>
                  <div className="text-sm sm:text-base font-extrabold text-amber-700">{selectedMealForModal.fats} <span className="text-[10px] text-stone-400 font-normal">g</span></div>
                </div>
              </div>

              {/* Health Score + Diet recommendation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 border border-stone-150 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-emerald-800 uppercase font-mono leading-none">SCORE</span>
                    <span className="text-sm font-black text-emerald-950">{selectedMealForModal.healthScore}</span>
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Aesthetic Nutrition Score</div>
                    <div className="text-[10px] text-stone-500 font-medium">Verified by AI analyzer constraints</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/50">
                  <span className="text-[10px] text-stone-400 font-bold uppercase font-mono">RECOMMENDED Action:</span>
                  <span className={`text-[11px] font-mono px-3 py-1 rounded-lg font-extrabold ${
                    selectedMealForModal.recommendation === "EAT" ? "bg-emerald-600 text-white" :
                    selectedMealForModal.recommendation === "MODERATE" ? "bg-amber-500 text-white" :
                    "bg-rose-500 text-white"
                  }`}>
                    {selectedMealForModal.recommendation}
                  </span>
                </div>
              </div>

              {/* AI Dietitian Breakdown */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>Dietitian Insight & Breakdown</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-semibold bg-stone-50/50 p-3.5 rounded-2xl border border-stone-100">
                  {selectedMealForModal.summary}
                </p>
              </div>

              {/* Detailed Reasons & Micronutrients */}
              <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                <div className="space-y-1">
                  <h5 className="font-bold text-[10px] text-stone-400 font-mono tracking-wider uppercase">Recommendation Reason</h5>
                  <p className="text-xs text-stone-500 leading-normal font-medium">{selectedMealForModal.reason}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h5 className="font-bold text-[10px] text-stone-400 font-mono tracking-wider uppercase">Vitamins Identified</h5>
                    {selectedMealForModal.vitamins && selectedMealForModal.vitamins.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedMealForModal.vitamins.map((vit, idx) => (
                          <span key={idx} className="bg-stone-100 text-stone-700 text-[9px] px-2 py-0.5 rounded-md font-bold">
                            {vit}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-stone-400 font-medium italic">None detected</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-[10px] text-stone-400 font-mono tracking-wider uppercase">Minerals Identified</h5>
                    {selectedMealForModal.minerals && selectedMealForModal.minerals.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedMealForModal.minerals.map((min, idx) => (
                          <span key={idx} className="bg-stone-100 text-stone-700 text-[9px] px-2 py-0.5 rounded-md font-bold">
                            {min}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-stone-400 font-medium italic">None detected</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal controls/footer */}
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <button
                  onClick={() => setSelectedMealForModal(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Close Details
                </button>
                
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this meal log from your history?")) {
                      await onDeleteLog(selectedMealForModal.id);
                      setSelectedMealForModal(null);
                    }
                  }}
                  className="px-3 py-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Log</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
