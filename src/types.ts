export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  dailyCalorieGoal: number; // active target
  healthGoals: 'Lose weight' | 'Build muscle' | 'Stay healthy' | 'Increase athletic performance';
  dietPlan: 'Balanced' | 'Keto' | 'Low Carb' | 'High Protein' | 'Vegetarian';
  streakCount: number;
  lastLoggedDate: string | null; // YYYY-MM-DD
  points: number;
  badges: string[]; // List of unlocked badge IDs
  gender?: 'Male' | 'Female';
  activityLevel?: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
  targetWeight?: number; // target weight to achieve in kg
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface FoodLog {
  id: string;
  userId: string;
  timestamp: string; // ISO format
  date: string; // local date YYYY-MM-DD
  foodName: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  dietaryFiber?: number;
  vitamins: string[];
  minerals: string[];
  healthScore: number; // 0 - 100
  summary: string;
  recommendation: 'EAT' | 'MODERATE' | 'AVOID';
  reason: string;
  imageBase64?: string; // base64 representation of scanned image for offline/offline preview sync
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  pointsValue: number;
  progress: number; // current streak / match count
  completed: boolean;
  type: 'streak' | 'protein' | 'calories' | 'clean-eating';
  icon: string;
}

export interface SuggestionRecipe {
  name: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  instructions: string[];
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'goal' | 'reminder' | 'streak' | 'badge';
}
