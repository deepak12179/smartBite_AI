import { UserProfile, FoodLog, Challenge, InAppNotification } from "../types";

const PROFILE_KEY = "smartbite_profile_v1";
const LOGS_KEY = "smartbite_logs_v1";
const NOTIFICATION_KEY = "smartbite_notifs_v1";

const DEFAULT_PROFILE: UserProfile = {
  uid: "local_user_1",
  displayName: "Nihal",
  email: "nihal20maurya05@gmail.com",
  age: 24,
  weight: 72,
  height: 175,
  dailyCalorieGoal: 2200,
  healthGoals: "Lose weight",
  dietPlan: "Balanced",
  streakCount: 3,
  lastLoggedDate: "2026-06-09",
  points: 120,
  badges: ["first_bite"],
  gender: "Male",
  activityLevel: "Moderate",
  targetWeight: 68
};

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "streak_challenge",
    title: "5-Day Streak Runner",
    description: "Maintain a logging streak for 5 consecutive days",
    durationDays: 5,
    pointsValue: 150,
    progress: 3,
    completed: false,
    type: "streak",
    icon: "Wheat"
  },
  {
    id: "protein_pack",
    title: "Muscle Maker",
    description: "Log a meals containing 30g+ proteins",
    durationDays: 1,
    pointsValue: 100,
    progress: 0,
    completed: false,
    type: "protein",
    icon: "Activity"
  },
  {
    id: "clean_champion",
    title: "Eco Eater Grid",
    description: "Scan and log 3 foods with 85+ Health Score",
    durationDays: 3,
    pointsValue: 200,
    progress: 1,
    completed: false,
    type: "clean-eating",
    icon: "Apple"
  }
];

export const BADGES_LIST = [
  { id: "first_bite", title: "First Bite", description: "Logged your first food scan item", icon: "Utensils", color: "from-blue-400 to-indigo-500" },
  { id: "streak_3", title: "Flame Runner", description: "Achieved a 3-day meal logging streak", icon: "Flame", color: "from-amber-400 to-red-500" },
  { id: "streak_5", title: "Golden Flame", description: "Incredible! Achieved a 5-day active streak", icon: "Award", color: "from-yellow-400 to-orange-500" },
  { id: "gold_rating", title: "Green Guard", description: "Ate a meal scored 90+ Wellness Quality", icon: "Zap", color: "from-emerald-400 to-teal-500" },
  { id: "protein_buff", title: "Iron Titan", description: "Logged a massive 30g+ protein health meal", icon: "ShieldAlert", color: "from-violet-500 to-purple-600" },
  { id: "recipe_connoisseur", title: "Diet Apprentice", description: "Generated delicious curated diet recipes", icon: "Sparkles", color: "from-pink-400 to-rose-500" }
];

export const StorageService = {
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  getLogs(): FoodLog[] {
    try {
      const data = localStorage.getItem(LOGS_KEY);
      if (data) {
        const logs = JSON.parse(data);
        // Sort descending
        return logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      return [];
    } catch {
      return [];
    }
  },

  addLog(log: FoodLog): { logged: FoodLog; profileUpdated: UserProfile } {
    const logs = this.getLogs();
    logs.push(log);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

    // Update streak and lastlogged information
    const profile = this.getProfile();
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Auto-update stats and streaks
    let newStreak = profile.streakCount;
    let earnedPoints = 15; // base point for logging food

    if (profile.lastLoggedDate === null) {
      newStreak = 1;
    } else {
      const lastDate = new Date(profile.lastLoggedDate);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
        earnedPoints += 20; // streak points
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    profile.streakCount = newStreak;
    profile.lastLoggedDate = todayStr;
    profile.points += earnedPoints;

    // Check Badge Unlocks
    const newlyEarnedBadges: string[] = [];
    if (!profile.badges.includes("first_bite")) {
      profile.badges.push("first_bite");
      newlyEarnedBadges.push("first_bite");
    }
    if (newStreak >= 3 && !profile.badges.includes("streak_3")) {
      profile.badges.push("streak_3");
      newlyEarnedBadges.push("streak_3");
      profile.points += 50;
    }
    if (newStreak >= 5 && !profile.badges.includes("streak_5")) {
      profile.badges.push("streak_5");
      newlyEarnedBadges.push("streak_5");
      profile.points += 100;
    }
    if (log.healthScore >= 90 && !profile.badges.includes("gold_rating")) {
      profile.badges.push("gold_rating");
      newlyEarnedBadges.push("gold_rating");
      profile.points += 40;
    }
    if (log.protein >= 30 && !profile.badges.includes("protein_buff")) {
      profile.badges.push("protein_buff");
      newlyEarnedBadges.push("protein_buff");
      profile.points += 40;
    }

    this.saveProfile(profile);

    // Build notifications for badge unlocks or milestones
    newlyEarnedBadges.forEach(badgeId => {
      const badgeObj = BADGES_LIST.find(b => b.id === badgeId);
      if (badgeObj) {
        this.addNotification({
          title: `🏆 Badge Unlocked: ${badgeObj.title}`,
          message: badgeObj.description,
          type: "badge"
        });
      }
    });

    // Also build a milestone notification
    this.addNotification({
      title: `🍽️ Meal Logged!`,
      message: `You successfully tracked "${log.foodName}" (+${earnedPoints} pts).`,
      type: "goal"
    });

    return { logged: log, profileUpdated: profile };
  },

  deleteLog(id: string): void {
    const logs = this.getLogs();
    const filtered = logs.filter(item => item.id !== id);
    localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
  },

  getChallenges(): Challenge[] {
    const key = "smartbite_challenges_v1";
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      localStorage.setItem(key, JSON.stringify(DEFAULT_CHALLENGES));
      return DEFAULT_CHALLENGES;
    } catch {
      return DEFAULT_CHALLENGES;
    }
  },

  saveChallenges(challenges: Challenge[]): void {
    localStorage.setItem("smartbite_challenges_v1", JSON.stringify(challenges));
  },

  updateChallengeStats(latestLog: FoodLog): void {
    const challenges = this.getChallenges();
    const profile = this.getProfile();
    let profileUpdatedObj = { ...profile };

    const updated = challenges.map((challenge) => {
      if (challenge.completed) return challenge;

      let progress = challenge.progress;
      let completed = false;

      if (challenge.type === "streak") {
        progress = profile.streakCount;
      } else if (challenge.type === "protein" && latestLog.protein >= 30) {
        progress = 1;
      } else if (challenge.type === "clean-eating" && latestLog.healthScore >= 85) {
        progress = Math.min(challenge.durationDays, progress + 1);
      }

      if (progress >= challenge.durationDays) {
        completed = true;
        profileUpdatedObj.points += challenge.pointsValue;
        this.addNotification({
          title: `🌟 Challenge Complete: ${challenge.title}!`,
          message: `Nice active tracking! You pocketed +${challenge.pointsValue} rewards experience.`,
          type: "streak"
        });
      }

      return {
        ...challenge,
        progress,
        completed
      };
    });

    this.saveChallenges(updated);
    this.saveProfile(profileUpdatedObj);
  },

  getNotifications(): InAppNotification[] {
    try {
      const data = localStorage.getItem(NOTIFICATION_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Populate first greetings
      const initial: InAppNotification[] = [
        {
          id: "welcome_notif",
          title: "👋 Welcome to AI Food Analyzer!",
          message: "Upload visual meals, monitor goals, get AI-powered scores, and complete fitness levels smoothly.",
          timestamp: new Date().toISOString(),
          read: false,
          type: "goal"
        }
      ];
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  },

  addNotification(notif: Omit<InAppNotification, "id" | "timestamp" | "read">): void {
    const notifs = this.getNotifications();
    const newNotif: InAppNotification = {
      ...notif,
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      read: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifs.slice(0, 30))); // cap at 30
  },

  markNotificationsRead(): void {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updated));
  }
};
