import React, { createContext, useContext, useState, useEffect } from "react";
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  writeBatch 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { UserProfile, FoodLog, Challenge, InAppNotification } from "../types";
import { BADGES_LIST } from "./storage";

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  foodLogs: FoodLog[];
  challenges: Challenge[];
  notifications: InAppNotification[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfile: (updated: UserProfile) => Promise<void>;
  addLog: (log: Omit<FoodLog, "id" | "userId" | "timestamp" | "date">) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  addNotification: (notif: Omit<InAppNotification, "id" | "timestamp" | "read">) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "streak_challenge",
    title: "5-Day Streak Runner",
    description: "Maintain a logging streak for 5 consecutive days",
    durationDays: 5,
    pointsValue: 150,
    progress: 0,
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
    progress: 0,
    completed: false,
    type: "clean-eating",
    icon: "Apple"
  }
];

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Authenticate & trigger real-time subscriptions
  useEffect(() => {
    let unsubLogs: (() => void) | null = null;
    let unsubChallenges: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Proactively clean up any previous subcollection listeners immediately on auth change
      if (unsubLogs) { unsubLogs(); unsubLogs = null; }
      if (unsubChallenges) { unsubChallenges(); unsubChallenges = null; }
      if (unsubNotifs) { unsubNotifs(); unsubNotifs = null; }

      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setFoodLogs([]);
        setChallenges([]);
        setNotifications([]);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      const userPath = `users/${currentUser.uid}`;

      try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Initialize user profile for onboarding
          const initialProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "Nutrient Scout",
            email: currentUser.email || "scout@domain.com",
            age: 24,
            weight: 72,
            height: 175,
            dailyCalorieGoal: 2200,
            healthGoals: "Stay healthy",
            dietPlan: "Balanced",
            streakCount: 0,
            lastLoggedDate: null,
            points: 0,
            badges: [],
            gender: "Male",
            activityLevel: "Moderate",
            targetWeight: 72
          };

          // Use atomic batch write to setup UserProfile, initial challenges, and initial greeting notification
          const batch = writeBatch(db);
          batch.set(userDocRef, initialProfile);

          DEFAULT_CHALLENGES.forEach((challenge) => {
            const chRef = doc(db, "users", currentUser.uid, "challenges", challenge.id);
            batch.set(chRef, challenge);
          });

          const welcomeNotif: InAppNotification = {
            id: "welcome_notif",
            title: "👋 Welcome to AI Food Analyzer!",
            message: "Upload visual meals, monitor goals, get AI-powered scores, and complete fitness levels smoothly.",
            timestamp: new Date().toISOString(),
            read: false,
            type: "goal"
          };
          const notifRef = doc(db, "users", currentUser.uid, "notifications", welcomeNotif.id);
          batch.set(notifRef, welcomeNotif);

          await batch.commit();
          setProfile(initialProfile);
        } else {
          setProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.GET, userPath);
        }
      }

      // Check if user hasn't logged out or switched while the async operations were pending
      if (!auth.currentUser || auth.currentUser.uid !== currentUser.uid) {
        return;
      }

      // Attach subcollection listeners and assign them to the cleanup variables
      unsubLogs = onSnapshot(
        collection(db, "users", currentUser.uid, "foodLogs"),
        (snapshot) => {
          const logsList = snapshot.docs.map(doc => doc.data() as FoodLog);
          // Sort descending
          logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setFoodLogs(logsList);
        },
        (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.LIST, `${userPath}/foodLogs`);
          }
        }
      );

      unsubChallenges = onSnapshot(
        collection(db, "users", currentUser.uid, "challenges"),
        (snapshot) => {
          const chList = snapshot.docs.map(doc => doc.data() as Challenge);
          setChallenges(chList.length > 0 ? chList : DEFAULT_CHALLENGES);
        },
        (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.LIST, `${userPath}/challenges`);
          }
        }
      );

      unsubNotifs = onSnapshot(
        collection(db, "users", currentUser.uid, "notifications"),
        (snapshot) => {
          const notifList = snapshot.docs.map(doc => doc.data() as InAppNotification);
          notifList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(notifList);
        },
        (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.LIST, `${userPath}/notifications`);
          }
        }
      );

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubLogs) unsubLogs();
      if (unsubChallenges) unsubChallenges();
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Popup Authentication failed:", error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Signout operation failed:", error);
    }
  };

  const updateProfile = async (updated: UserProfile) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, "users", user.uid), updated);
      setProfile(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const addNotification = async (notif: Omit<InAppNotification, "id" | "timestamp" | "read">) => {
    if (!user) return;
    const notifId = "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const path = `users/${user.uid}/notifications/${notifId}`;
    const newNotif: InAppNotification = {
      ...notif,
      id: notifId,
      timestamp: new Date().toISOString(),
      read: false
    };
    try {
      await setDoc(doc(db, "users", user.uid, "notifications", notifId), newNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const markNotificationsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      if (!notif.read) {
        const notifRef = doc(db, "users", user.uid, "notifications", notif.id);
        batch.update(notifRef, { read: true });
      }
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/notifications`);
    }
  };

  const addLog = async (logData: Omit<FoodLog, "id" | "userId" | "timestamp" | "date">) => {
    if (!user || !profile) return;

    const logId = "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const todayStr = new Date().toISOString().split("T")[0];

    const mealLog: FoodLog = {
      ...logData,
      id: logId,
      userId: user.uid,
      timestamp: new Date().toISOString(),
      date: todayStr
    };

    const batch = writeBatch(db);

    // 1. Add Food Log document
    const logRef = doc(db, "users", user.uid, "foodLogs", logId);
    batch.set(logRef, mealLog);

    // 2. Adjust streak, logging profile metadata points
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

    const updatedProfile = { ...profile };
    updatedProfile.streakCount = newStreak;
    updatedProfile.lastLoggedDate = todayStr;
    updatedProfile.points += earnedPoints;

    // Badge Unlocks Checks
    const newlyEarnedBadges: string[] = [];
    if (!updatedProfile.badges.includes("first_bite")) {
      updatedProfile.badges.push("first_bite");
      newlyEarnedBadges.push("first_bite");
    }
    if (newStreak >= 3 && !updatedProfile.badges.includes("streak_3")) {
      updatedProfile.badges.push("streak_3");
      newlyEarnedBadges.push("streak_3");
      updatedProfile.points += 50;
    }
    if (newStreak >= 5 && !updatedProfile.badges.includes("streak_5")) {
      updatedProfile.badges.push("streak_5");
      newlyEarnedBadges.push("streak_5");
      updatedProfile.points += 100;
    }
    if (mealLog.healthScore >= 90 && !updatedProfile.badges.includes("gold_rating")) {
      updatedProfile.badges.push("gold_rating");
      newlyEarnedBadges.push("gold_rating");
      updatedProfile.points += 40;
    }
    if (mealLog.protein >= 30 && !updatedProfile.badges.includes("protein_buff")) {
      updatedProfile.badges.push("protein_buff");
      newlyEarnedBadges.push("protein_buff");
      updatedProfile.points += 40;
    }

    // 3. Challenge Stats Logic Updates
    challenges.forEach((challenge) => {
      if (challenge.completed) return;

      let progress = challenge.progress;
      let completed = false;

      if (challenge.type === "streak") {
        progress = newStreak;
      } else if (challenge.type === "protein" && mealLog.protein >= 30) {
        progress = 1;
      } else if (challenge.type === "clean-eating" && mealLog.healthScore >= 85) {
        progress = Math.min(challenge.durationDays, progress + 1);
      }

      if (progress >= challenge.durationDays) {
        completed = true;
        updatedProfile.points += challenge.pointsValue;

        // Challenge Complete alert
        const challengeNotifId = "ch_notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        const challengeNotif: InAppNotification = {
          id: challengeNotifId,
          title: `🌟 Challenge Complete: ${challenge.title}!`,
          message: `Nice active tracking! You pocketed +${challenge.pointsValue} rewards experience.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: "streak"
        };
        batch.set(doc(db, "users", user.uid, "notifications", challengeNotifId), challengeNotif);
      }

      // Update challenge document
      const chDocRef = doc(db, "users", user.uid, "challenges", challenge.id);
      batch.update(chDocRef, { progress, completed });
    });

    // Save profile metadata update
    batch.set(doc(db, "users", user.uid), updatedProfile);

    // Batch Badge notifications
    newlyEarnedBadges.forEach((badgeId) => {
      const badgeObj = BADGES_LIST.find((b) => b.id === badgeId);
      if (badgeObj) {
        const badgeNotifId = "badge_notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        const badgeNotif: InAppNotification = {
          id: badgeNotifId,
          title: `🏆 Badge Unlocked: ${badgeObj.title}`,
          message: badgeObj.description,
          timestamp: new Date().toISOString(),
          read: false,
          type: "badge"
        };
        batch.set(doc(db, "users", user.uid, "notifications", badgeNotifId), badgeNotif);
      }
    });

    // Milestone meal logged notification
    const mealNotifId = "meal_notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const mealNotif: InAppNotification = {
      id: mealNotifId,
      title: `🍽️ Meal Logged!`,
      message: `You successfully tracked "${mealLog.foodName}" (+${earnedPoints} pts).`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "goal"
    };
    batch.set(doc(db, "users", user.uid, "notifications", mealNotifId), mealNotif);

    try {
      await batch.commit();
      setProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/batch_meal_log`);
    }
  };

  const deleteLog = async (logId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "foodLogs", logId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/foodLogs/${logId}`);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        profile,
        foodLogs,
        challenges,
        notifications,
        loading,
        signInWithGoogle,
        signOutUser,
        updateProfile,
        addLog,
        deleteLog,
        addNotification,
        markNotificationsRead
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
