import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
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
  signInWithGoogle: (simulatedUser?: { displayName: string; email: string }) => Promise<void>;
  signInGuest: () => Promise<void>;
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

  const unsubLogsRef = useRef<(() => void) | null>(null);
  const unsubChallengesRef = useRef<(() => void) | null>(null);
  const unsubNotifsRef = useRef<(() => void) | null>(null);

  const cleanUpSubscriptions = () => {
    if (unsubLogsRef.current) { unsubLogsRef.current(); unsubLogsRef.current = null; }
    if (unsubChallengesRef.current) { unsubChallengesRef.current(); unsubChallengesRef.current = null; }
    if (unsubNotifsRef.current) { unsubNotifsRef.current(); unsubNotifsRef.current = null; }
  };

  const setupSubscriptions = (uid: string) => {
    cleanUpSubscriptions();

    unsubLogsRef.current = onSnapshot(
      collection(db, "users", uid, "foodLogs"),
      (snapshot) => {
        const logsList = snapshot.docs.map(doc => doc.data() as FoodLog);
        logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setFoodLogs(logsList);
        console.log(`[FirebaseProvider] Subscribed to foodLogs for user ${uid}. Found ${logsList.length} items.`);
      },
      (error) => {
        if (auth.currentUser || localStorage.getItem("mock_google_active") === "true") {
          handleFirestoreError(error, OperationType.LIST, `users/${uid}/foodLogs`);
        }
      }
    );

    unsubChallengesRef.current = onSnapshot(
      collection(db, "users", uid, "challenges"),
      (snapshot) => {
        const chList = snapshot.docs.map(doc => doc.data() as Challenge);
        setChallenges(chList.length > 0 ? chList : DEFAULT_CHALLENGES);
      },
      (error) => {
        if (auth.currentUser || localStorage.getItem("mock_google_active") === "true") {
          handleFirestoreError(error, OperationType.LIST, `users/${uid}/challenges`);
        }
      }
    );

    unsubNotifsRef.current = onSnapshot(
      collection(db, "users", uid, "notifications"),
      (snapshot) => {
        const notifList = snapshot.docs.map(doc => doc.data() as InAppNotification);
        notifList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(notifList);
      },
      (error) => {
        if (auth.currentUser || localStorage.getItem("mock_google_active") === "true") {
          handleFirestoreError(error, OperationType.LIST, `users/${uid}/notifications`);
        }
      }
    );
  };

  // Authenticate & trigger real-time subscriptions
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Proactively clean up any previous subcollection listeners immediately on auth change
      cleanUpSubscriptions();

      if (!currentUser) {
        const isMockGoogleActive = localStorage.getItem("mock_google_active") === "true";
        if (isMockGoogleActive) {
          try {
            const storedUser = localStorage.getItem("mock_google_user");
            if (storedUser) {
              const googleUser = JSON.parse(storedUser);
              setUser(googleUser);
              console.log("[Mock User Boot] Initializing mock google user:", googleUser.uid);
              
              const userDocRef = doc(db, "users", googleUser.uid);
              const userPath = `users/${googleUser.uid}`;
              let userDoc;
              try {
                userDoc = await getDoc(userDocRef);
                console.log("[Mock User Boot] getDoc succeeded, exists:", userDoc.exists());
              } catch (getDocErr: any) {
                console.error("[Mock User Boot] getDoc failed with error:", getDocErr);
                throw getDocErr;
              }
              
              if (userDoc.exists()) {
                setProfile(userDoc.data() as UserProfile);
              } else {
                const initialProfile: UserProfile = {
                  uid: googleUser.uid,
                  displayName: googleUser.displayName || "Nutrient Scout",
                  email: googleUser.email || "scout@domain.com",
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
                
                const batch = writeBatch(db);
                batch.set(userDocRef, initialProfile);
                DEFAULT_CHALLENGES.forEach((challenge) => {
                  const chRef = doc(db, "users", googleUser.uid, "challenges", challenge.id);
                  batch.set(chRef, challenge);
                });
                
                const welcomeNotif: InAppNotification = {
                  id: "welcome_notif",
                  title: "👋 Welcome to SmartBite, " + googleUser.displayName + "!",
                  message: "Cloud connection established. Logged in persistently (Iframe Sandbox mode).",
                  timestamp: new Date().toISOString(),
                  read: false,
                  type: "goal"
                };
                const notifRef = doc(db, "users", googleUser.uid, "notifications", welcomeNotif.id);
                batch.set(notifRef, welcomeNotif);
                
                try {
                  console.log("[Mock User Boot] Committing initial creation batch for mock user...");
                  await batch.commit();
                  console.log("[Mock User Boot] batch.commit succeeded!");
                } catch (batchErr: any) {
                  console.error("[Mock User Boot] batch.commit failed with error:", batchErr);
                  throw batchErr;
                }
                setProfile(initialProfile);
              }

              // Setup real-time listeners for mock google user on boot
              setupSubscriptions(googleUser.uid);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error setting up mock google user on boot:", e);
          }
        }

        const isGuestActive = localStorage.getItem("guest_active") === "true";
        if (isGuestActive) {
          const guestObj = { 
            uid: "guest_user_id", 
            displayName: "Guest Scout", 
            email: "guest@nutrientscout.com", 
            isAnonymous: true 
          } as any;
          setUser(guestObj);
          
          try {
            const lp = localStorage.getItem("guest_profile");
            if (lp) setProfile(JSON.parse(lp));
            const lf = localStorage.getItem("guest_foodLogs");
            if (lf) {
              const parsedLogs = JSON.parse(lf);
              parsedLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              setFoodLogs(parsedLogs);
            }
            const lc = localStorage.getItem("guest_challenges");
            if (lc) setChallenges(JSON.parse(lc));
            const ln = localStorage.getItem("guest_notifications");
            if (ln) {
              const parsedNotifs = JSON.parse(ln);
              parsedNotifs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              setNotifications(parsedNotifs);
            }
          } catch (e) {
            console.error("Error re-hydrating guest data:", e);
          }
          setLoading(false);
          return;
        }

        setUser(null);
        setProfile(null);
        setFoodLogs([]);
        setChallenges([]);
        setNotifications([]);
        setLoading(false);
        return;
      }

      // If a real Firebase user logs in, deactivate Guest and Mock Google modes
      localStorage.removeItem("guest_active");
      localStorage.removeItem("mock_google_active");
      localStorage.removeItem("mock_google_user");
      setUser(currentUser);
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

      // Setup real-time listeners for Google active users
      setupSubscriptions(currentUser.uid);

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      cleanUpSubscriptions();
    };
  }, []);

  const signInWithGoogle = async (simulatedUser?: { displayName: string; email: string }) => {
    const isIframe = typeof window !== "undefined" && window.self !== window.top;
    
    if (simulatedUser) {
      localStorage.removeItem("guest_active");
      localStorage.setItem("mock_google_active", "true");
      
      const uid = "mock_google_" + simulatedUser.email.toLowerCase().replace(/[@.]/g, "_");
      const userObj = {
        uid,
        displayName: simulatedUser.displayName,
        email: simulatedUser.email.toLowerCase(),
        isAnonymous: false
      } as any;
      
      localStorage.setItem("mock_google_user", JSON.stringify(userObj));
      setUser(userObj);
      setLoading(true);

      const userDocRef = doc(db, "users", uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const initialProfile: UserProfile = {
            uid,
            displayName: simulatedUser.displayName,
            email: simulatedUser.email.toLowerCase(),
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
          const batch = writeBatch(db);
          batch.set(userDocRef, initialProfile);
          DEFAULT_CHALLENGES.forEach((challenge) => {
            const chRef = doc(db, "users", uid, "challenges", challenge.id);
            batch.set(chRef, challenge);
          });
          const welcomeNotif: InAppNotification = {
            id: "welcome_notif",
            title: `👋 Welcome to SmartBite AI, ${simulatedUser.displayName}!`,
            message: `Cloud connection established. Logged in persistently as ${simulatedUser.email} (Iframe Sandbox mode).`,
            timestamp: new Date().toISOString(),
            read: false,
            type: "goal"
          };
          const notifRef = doc(db, "users", uid, "notifications", welcomeNotif.id);
          batch.set(notifRef, welcomeNotif);
          await batch.commit();
          setProfile(initialProfile);
        } else {
          setProfile(userDoc.data() as UserProfile);
        }

        // Subscriptions are set up immediately upon mock signIn!
        setupSubscriptions(uid);
      } catch (err) {
        console.error("Firestore setup error during mock Google sign-in:", err);
      }
      setLoading(false);
      return;
    }

    if (isIframe) {
      console.warn("Running inside sandboxed preview frame. Dispatching show-iframe-google-auth event to trigger simulated Google login workflow.");
      window.dispatchEvent(new CustomEvent("show-iframe-google-auth"));
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code;
      const message = error?.message || "";
      const isCancelled = 
        code === "auth/cancelled-popup-request" || 
        code === "auth/user-cancelled" || 
        message.includes("cancelled-popup-request") || 
        message.includes("user-cancelled");

      if (isCancelled) {
        console.warn("Popup Authentication was cancelled gracefully by the user or an overlapping request:", message);
      } else {
        console.warn("Popup Authentication failed (blocked or disabled/unsupported). Falling back to Local Guest mode:", error);
        await signInGuest(); // Safe fallback under iframe issues
      }
    }
  };

  const signInGuest = async () => {
    try {
      localStorage.setItem("guest_active", "true");
      
      const guestObj = { 
        uid: "guest_user_id", 
        displayName: "Guest Scout", 
        email: "guest@nutrientscout.com", 
        isAnonymous: true 
      } as any;
      setUser(guestObj);

      // Re-hydrate or initialize from localStorage
      const lp = localStorage.getItem("guest_profile");
      let initializedProfile: UserProfile;
      if (lp) {
        initializedProfile = JSON.parse(lp);
      } else {
        initializedProfile = {
          uid: "guest_user_id",
          displayName: "Guest Scout",
          email: "guest@nutrientscout.com",
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
        localStorage.setItem("guest_profile", JSON.stringify(initializedProfile));
      }
      setProfile(initializedProfile);

      const lf = localStorage.getItem("guest_foodLogs");
      if (lf) {
        setFoodLogs(JSON.parse(lf));
      } else {
        setFoodLogs([]);
        localStorage.setItem("guest_foodLogs", JSON.stringify([]));
      }

      const lc = localStorage.getItem("guest_challenges");
      if (lc) {
        setChallenges(JSON.parse(lc));
      } else {
        setChallenges(DEFAULT_CHALLENGES);
        localStorage.setItem("guest_challenges", JSON.stringify(DEFAULT_CHALLENGES));
      }

      const ln = localStorage.getItem("guest_notifications");
      let initializedNotifs: InAppNotification[];
      if (ln) {
        initializedNotifs = JSON.parse(ln);
      } else {
        initializedNotifs = [
          {
            id: "welcome_notif",
            title: "👋 Welcome to Guest Mode!",
            message: "Running in offline guest mode. You can scan plates, log meals, track nutrient targets and achievements locally without popups or cloud logins.",
            timestamp: new Date().toISOString(),
            read: false,
            type: "goal"
          }
        ];
        localStorage.setItem("guest_notifications", JSON.stringify(initializedNotifs));
      }
      setNotifications(initializedNotifs);
      setLoading(false);
    } catch (error: any) {
      console.error("Local guest login initialization failed:", error);
    }
  };

  const signOutUser = async () => {
    localStorage.removeItem("guest_active");
    localStorage.removeItem("mock_google_active");
    localStorage.removeItem("mock_google_user");
    cleanUpSubscriptions();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Signout operation failed:", error);
    }
    // Explicit clean-up for responsive transition
    setUser(null);
    setProfile(null);
    setFoodLogs([]);
    setChallenges([]);
    setNotifications([]);
  };

  const updateProfile = async (updated: UserProfile) => {
    if (!user) return;
    if (user.uid === "guest_user_id") {
      localStorage.setItem("guest_profile", JSON.stringify(updated));
      setProfile(updated);
      return;
    }
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
    const newNotif: InAppNotification = {
      ...notif,
      id: notifId,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (user.uid === "guest_user_id") {
      const updatedNotifs = [newNotif, ...notifications];
      localStorage.setItem("guest_notifications", JSON.stringify(updatedNotifs));
      setNotifications(updatedNotifs);
      return;
    }

    const path = `users/${user.uid}/notifications/${notifId}`;
    try {
      await setDoc(doc(db, "users", user.uid, "notifications", notifId), newNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const markNotificationsRead = async () => {
    if (!user) return;

    if (user.uid === "guest_user_id") {
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem("guest_notifications", JSON.stringify(updated));
      setNotifications(updated);
      return;
    }

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

    if (user.uid === "guest_user_id") {
      const logId = "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const todayStr = new Date().toISOString().split("T")[0];

      const mealLog: FoodLog = {
        ...logData,
        id: logId,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        date: todayStr
      };

      const updatedLogs = [mealLog, ...foodLogs];
      localStorage.setItem("guest_foodLogs", JSON.stringify(updatedLogs));
      setFoodLogs(updatedLogs);

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

      const runningNotifications = [...notifications];

      const updatedChallenges = challenges.map((challenge) => {
        if (challenge.completed) return challenge;

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
          const challengeNotif: InAppNotification = {
            id: "ch_notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            title: `🌟 Challenge Complete: ${challenge.title}!`,
            message: `Nice active tracking! You pocketed +${challenge.pointsValue} rewards experience.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: "streak"
          };
          runningNotifications.unshift(challengeNotif);
        }

        return { ...challenge, progress, completed };
      });

      localStorage.setItem("guest_challenges", JSON.stringify(updatedChallenges));
      setChallenges(updatedChallenges);

      // Batch Badge notifications
      newlyEarnedBadges.forEach((badgeId) => {
        const badgeObj = BADGES_LIST.find((b) => b.id === badgeId);
        if (badgeObj) {
          const badgeNotif: InAppNotification = {
            id: "badge_notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            title: `🏆 Badge Unlocked: ${badgeObj.title}`,
            message: badgeObj.description,
            timestamp: new Date().toISOString(),
            read: false,
            type: "badge"
          };
          runningNotifications.unshift(badgeNotif);
        }
      });

      // Milestone meal logged notification
      const mealNotif: InAppNotification = {
        id: "meal_notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        title: `🍽️ Meal Logged!`,
        message: `You successfully tracked "${mealLog.foodName}" (+${earnedPoints} pts).`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "goal"
      };
      runningNotifications.unshift(mealNotif);

      localStorage.setItem("guest_notifications", JSON.stringify(runningNotifications));
      setNotifications(runningNotifications);

      localStorage.setItem("guest_profile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      return;
    }

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

    if (user.uid === "guest_user_id") {
      const updated = foodLogs.filter(log => log.id !== logId);
      localStorage.setItem("guest_foodLogs", JSON.stringify(updated));
      setFoodLogs(updated);
      return;
    }

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
        signInGuest,
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
