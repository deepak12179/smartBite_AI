import React, { useState } from "react";
import { Sparkles, Clock, RefreshCw, ChevronRight, ChevronDown, CheckCircle2, Apple, ChefHat } from "lucide-react";
import { SuggestionRecipe, UserProfile } from "../types";

interface RecipesProps {
  profile: UserProfile;
}

export default function Recipes({ profile }: RecipesProps) {
  const [recipesList, setRecipesList] = useState<SuggestionRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dietPref, setDietPref] = useState<string>(profile.dietPlan);
  const [calcBudget, setCalcBudget] = useState<number>(profile.dailyCalorieGoal);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState<number | null>(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  const triggerGenerateRecipes = async () => {
    setIsLoading(true);
    setErrorText(null);
    setFallbackWarning(null);
    try {
      const response = await fetch("/api/suggest-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyGoal: calcBudget,
          preference: dietPref
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Recipe request failed");
      }

      const data = await response.json();
      if (data.recipes) {
        setRecipesList(data.recipes);
        setFallbackWarning(data.warning || null);
        setActiveRecipeIndex(0);
        // Award badge points for recipe search (add mock activity tracker alert)
      } else {
        throw new Error("Invalid recipes response payload format");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Recipes AI generation is temporarily unavailable. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="recipes_ai_engine" className="space-y-8 text-left text-stone-800">
      
      {/* Recipe Header banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-emerald-200 text-[10px] font-bold font-mono uppercase tracking-wide">
            🍳 Culinary Suggestion Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans">Curated Goal-Based AI Recipes</h2>
          <p className="text-emerald-100 text-xs sm:text-sm font-semibold max-w-xl">
            Input your nutrition specifications (Keto, Veg, etc.) and our Gemini engine will generate a customized 3-recipe menu calibrated to your target daily calories limit.
          </p>
        </div>

        <button
          onClick={triggerGenerateRecipes}
          disabled={isLoading}
          className="bg-white hover:bg-emerald-50 text-emerald-800 disabled:opacity-75 font-bold px-5 py-3 rounded-xl transition duration-200 text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow shrink-0 self-stretch md:self-auto justify-center"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scoring Ingredient Combinations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Analyze &amp; Suggest Recipes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Recipe preferences parameters */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="font-sans font-bold text-sm text-stone-900 border-b border-stone-100 pb-3">Recipe Customizer</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 font-mono block">DIET PREFERENCE</label>
            <select
              value={dietPref}
              onChange={(e) => setDietPref(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs font-bold text-stone-700 font-mono cursor-pointer"
            >
              <option value="Balanced">Balanced Mix</option>
              <option value="Keto">Keto Diet (High Fats / Low Carbs)</option>
              <option value="Low Carb">Low Carb Diet</option>
              <option value="High Protein">High Protein Build</option>
              <option value="Vegetarian">Vegetarian Plates</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 font-mono block">DAILY CALORIE BUDGET LIMIT</label>
            <div className="flex gap-2">
              <input 
                type="number"
                value={calcBudget}
                onChange={(e) => setCalcBudget(parseInt(e.target.value, 10) || 2000)}
                className="flex-1 bg-stone-100 border border-stone-200 p-2.5 rounded-xl text-xs font-bold text-stone-700 font-mono"
              />
              <span className="bg-stone-50 text-stone-400 p-2.5 border border-stone-200 rounded-xl text-xs font-mono font-bold">kcal</span>
            </div>
            <p className="text-[10px] text-stone-400 font-mono leading-normal">
              Gemini will suggest three distinct recipes designed to collectively satisfy or guide within your calorie targets.
            </p>
          </div>

          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              {errorText}
            </div>
          )}
        </div>

        {/* Right Side: Showcase recipes results */}
        <div className="lg:col-span-8 space-y-4">
          {recipesList.length === 0 ? (
            <div className="bg-stone-50 rounded-3xl p-12 text-center border border-stone-200/60 flex flex-col justify-center items-center space-y-4 h-full">
              <ChefHat className="w-12 h-12 text-stone-300" />
              <div className="max-w-md">
                <span className="font-bold text-sm text-stone-600 block">No Recipes Curated Yet</span>
                <span className="text-xs text-stone-400 font-semibold leading-normal block mt-1">
                  Adjust your diet preferences on the left config sidebar, and click &quot;Analyze &amp; Suggest Recipes&quot; to prompt Gemini for a fully broken-down healthy menu plan!
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {fallbackWarning && (
                <div className="p-3.5 bg-amber-50/85 border border-amber-200/80 text-stone-800 rounded-xl text-xs font-semibold flex gap-2.5 items-start shadow-sm transition-all duration-300">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <span className="text-amber-800 font-bold block">Smart Fallback Enabled</span>
                    <span className="text-stone-600 block leading-relaxed font-normal">{fallbackWarning}</span>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-12 gap-6 items-start">
                
                {/* Recipe list selectors */}
                <div className="sm:col-span-4 space-y-2.5">
                  <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wider block">CHOOSE RECIPE:</span>
                  {recipesList.map((recipe, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveRecipeIndex(index)}
                      className={`w-full text-left p-3.5 rounded-xl border transition ${
                        activeRecipeIndex === index 
                          ? "bg-emerald-50 border-emerald-500/70 text-emerald-900 font-bold" 
                          : "bg-white border-stone-200 text-stone-700 hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="text-xs truncate">{recipe.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">🔥 {recipe.calories} kcal • {recipe.prepTime}</div>
                    </button>
                  ))}
                </div>

                {/* Recipe full details view */}
                <div className="sm:col-span-8 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5">
                  {activeRecipeIndex !== null && recipesList[activeRecipeIndex] && (
                    (() => {
                      const r = recipesList[activeRecipeIndex];
                      return (
                        <div className="space-y-5">
                          
                          {/* Recipe Header */}
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-extrabold text-base text-stone-900 leading-tight">{r.name}</h4>
                              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                <span>{r.prepTime}</span>
                              </span>
                            </div>
                            
                            {/* Recipe macros */}
                            <div className="flex gap-3 text-[10px] font-bold font-mono text-stone-400 mt-2">
                              <span>🔥 {r.calories} kcal</span>
                              <span>•</span>
                              <span>P: {r.protein}g</span>
                              <span>•</span>
                              <span>C: {r.carbs}g</span>
                              <span>•</span>
                              <span>F: {r.fats}g</span>
                            </div>
                          </div>

                          {/* Ingredients */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold font-mono tracking-wider text-stone-400 uppercase block">Required Ingredients</span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-600 font-medium">
                              {r.ingredients.map((item, idx) => (
                                <li key={idx} className="flex gap-2 items-center">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                                  <span className="truncate" title={item}>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Instructions */}
                          <div className="space-y-2.5 pt-2 border-t border-stone-100">
                            <span className="text-[10px] font-extrabold font-mono tracking-wider text-stone-400 uppercase block">Step-By-Step Cook Guidelines</span>
                            <ol className="space-y-3 text-xs text-stone-600 font-semibold leading-relaxed">
                              {r.instructions.map((step, idx) => (
                                <li key={idx} className="flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-[10px] font-black text-stone-500 font-mono mt-0.5">{idx + 1}</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                        </div>
                      );
                    })()
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
