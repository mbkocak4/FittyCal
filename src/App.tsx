import React, { useState, useEffect } from "react";
import {
  Flame,
  Droplet,
  Sparkles,
  Settings,
  Bell,
  TrendingUp,
  X,
  User,
  Check,
  ChevronRight,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Cloud
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FoodItem, UserDailyGoals, UserProfile } from "./types";
import ReportTab from "./components/ReportTab";
import MealAnalysisTab from "./components/MealAnalysisTab";
import ProfileTab from "./components/ProfileTab";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signOut, 
  doc, 
  getDoc, 
  setDoc,
  User as FirebaseUser,
  handleFirestoreError,
  OperationType
} from "./lib/firebase";
import AuthModal from "./components/AuthModal";

// Standard daily goals for default users
const DEFAULT_GOALS: UserDailyGoals = {
  calories: 2000,
  protein: 120,
  carbs: 230,
  fat: 60
};

const DEFAULT_PROFILE: UserProfile = {
  height: 175,
  weight: 70,
  age: 26,
  gender: "male",
  activityLevel: "moderate",
  goal: "maintain",
  isCompleted: false
};

// Safe localStorage wrapper to prevent SecurityError inside sandboxed iframes
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage access denied:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
    }
  }
};

export default function App() {
  // Navigation tabs: tracker, analysis, profile
  const [activeTab, setActiveTab] = useState<"tracker" | "analysis" | "profile">("tracker");

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Dark Mode support state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return safeStorage.getItem("nutrition_tracker_dark_mode") === "true";
  });

  // Config states
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Clear confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Water notification modal state
  const [showWaterNotification, setShowWaterNotification] = useState<boolean>(false);

  // Core Goal and Profile States
  const [dailyGoals, setDailyGoals] = useState<UserDailyGoals>(DEFAULT_GOALS);
  const [loggedItems, setLoggedItems] = useState<FoodItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [waterIntake, setWaterIntake] = useState<number>(0);

  // Onboarding / Profile form calibration inputs
  const [profileHeight, setProfileHeight] = useState<number>(175);
  const [profileWeight, setProfileWeight] = useState<number>(70);
  const [profileAge, setProfileAge] = useState<number>(26);
  const [profileGender, setProfileGender] = useState<"male" | "female">("male");
  const [profileActivity, setProfileActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "very_active">("moderate");
  const [profileGoal, setProfileGoal] = useState<"lose" | "maintain" | "gain" | "track">("maintain");

  // Meal Analysis specific states (routed to tab)
  const [inputText, setInputText] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");

  // Audio & Timer states for water
  const [waterReminderEnabled, setWaterReminderEnabled] = useState<boolean>(false);
  const [waterReminderInterval, setWaterReminderInterval] = useState<number>(60);
  const [timeUntilNextReminder, setTimeUntilNextReminder] = useState<number>(0);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => {
        if (prev?.message === message) return null;
        return prev;
      });
    }, 4000);
  };

  const getLocalWaterLogs = () => {
    const logs: Record<string, number> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("water_log_")) {
          logs[key] = Number(localStorage.getItem(key) || 0);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return logs;
  };

  const syncToFirebase = async (uid: string, fields: any) => {
    try {
      await setDoc(doc(db, "users", uid), fields, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
    }
  };

  // On Mount: load API config status, load initial storage and bind Firebase Auth
  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.hasKey);
        if (!data.hasKey) {
          setUseDemoFallback(true);
        }
      })
      .catch((err) => {
        console.error("API status check issue:", err);
        setUseDemoFallback(true);
      });

    // Sub-loaders from localStorage (instant rendering)
    const storedGoals = safeStorage.getItem("nutrition_tracker_goals");
    if (storedGoals) {
      try { setDailyGoals(JSON.parse(storedGoals)); } catch (e) { setDailyGoals(DEFAULT_GOALS); }
    }

    const storedItems = safeStorage.getItem("nutrition_tracker_logged_items");
    if (storedItems) {
      try { setLoggedItems(JSON.parse(storedItems)); } catch (e) { setLoggedItems([]); }
    }

    const storedProfile = safeStorage.getItem("nutrition_tracker_user_profile");
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setUserProfile(parsed);
        setProfileHeight(parsed.height || 175);
        setProfileWeight(parsed.weight || 70);
        setProfileAge(parsed.age || 26);
        setProfileGender(parsed.gender || "male");
        setProfileActivity(parsed.activityLevel || "moderate");
        setProfileGoal(parsed.goal || "maintain");
      } catch (e) {
        setUserProfile(DEFAULT_PROFILE);
      }
    }

    const storedWater = safeStorage.getItem("nutrition_tracker_water_intake");
    if (storedWater) {
      setWaterIntake(Number(storedWater));
    }

    const storedRemEnabled = safeStorage.getItem("nutrition_tracker_water_reminder_enabled");
    if (storedRemEnabled) {
      setWaterReminderEnabled(storedRemEnabled === "true");
    }
    const storedInterval = safeStorage.getItem("nutrition_tracker_water_reminder_interval");
    if (storedInterval) {
      setWaterReminderInterval(Number(storedInterval));
    }

    const storedNextRem = safeStorage.getItem("nutrition_tracker_next_reminder_timestamp");
    if (storedNextRem) {
      const remaining = Math.max(0, Math.ceil((Number(storedNextRem) - Date.now()) / 1000));
      setTimeUntilNextReminder(remaining);
    }

    // Attach Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docRef = doc(db, "users", user.uid);
          let docSnap;
          try {
            docSnap = await getDoc(docRef);
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
            return;
          }

          if (docSnap.exists()) {
            const dbData = docSnap.data();
            
            if (dbData.dailyGoals) {
              setDailyGoals(dbData.dailyGoals);
              safeStorage.setItem("nutrition_tracker_goals", JSON.stringify(dbData.dailyGoals));
            }
            if (dbData.loggedItems) {
              setLoggedItems(dbData.loggedItems);
              safeStorage.setItem("nutrition_tracker_logged_items", JSON.stringify(dbData.loggedItems));
            }
            if (dbData.userProfile) {
              setUserProfile(dbData.userProfile);
              safeStorage.setItem("nutrition_tracker_user_profile", JSON.stringify(dbData.userProfile));
              
              setProfileHeight(dbData.userProfile.height || 175);
              setProfileWeight(dbData.userProfile.weight || 70);
              setProfileAge(dbData.userProfile.age || 26);
              setProfileGender(dbData.userProfile.gender || "male");
              setProfileActivity(dbData.userProfile.activityLevel || "moderate");
              setProfileGoal(dbData.userProfile.goal || "maintain");
            }
            if (dbData.waterIntake !== undefined) {
              setWaterIntake(dbData.waterIntake);
              safeStorage.setItem("nutrition_tracker_water_intake", String(dbData.waterIntake));
            }
            if (dbData.historicalWater) {
              Object.entries(dbData.historicalWater).forEach(([key, val]) => {
                safeStorage.setItem(key, String(val));
              });
            }
          } else {
            // Document does not exist: Save initial local state values to Firestore cloud doc so they persist
            const waterLogs = getLocalWaterLogs();
            const dateKey = new Date().toDateString();
            const currentWater = Number(safeStorage.getItem("nutrition_tracker_water_intake") || "0");
            if (currentWater > 0) {
              waterLogs[`water_log_${dateKey}`] = currentWater;
            }

            // Syncing initial set
            const localGoals = storedGoals ? JSON.parse(storedGoals) : DEFAULT_GOALS;
            const localItems = storedItems ? JSON.parse(storedItems) : [];
            const localProfile = storedProfile ? JSON.parse(storedProfile) : DEFAULT_PROFILE;

            try {
              await setDoc(docRef, {
                userProfile: localProfile,
                dailyGoals: localGoals,
                loggedItems: localItems,
                waterIntake: currentWater,
                historicalWater: waterLogs
              });
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
            }
          }
        } catch (err) {
          console.error("Firebase state synchronization error:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [userProfile.isCompleted]);

  const saveLoggedItems = (items: FoodItem[]) => {
    setLoggedItems(items);
    safeStorage.setItem("nutrition_tracker_logged_items", JSON.stringify(items));
    if (auth.currentUser) {
      syncToFirebase(auth.currentUser.uid, { loggedItems: items });
    }
  };

  const saveGoals = (goals: UserDailyGoals) => {
    setDailyGoals(goals);
    safeStorage.setItem("nutrition_tracker_goals", JSON.stringify(goals));
    if (auth.currentUser) {
      syncToFirebase(auth.currentUser.uid, { dailyGoals: goals });
    }
  };

  const saveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    safeStorage.setItem("nutrition_tracker_user_profile", JSON.stringify(profile));
    if (auth.currentUser) {
      syncToFirebase(auth.currentUser.uid, { userProfile: profile });
    }
  };

  const saveWaterIntake = (amount: number) => {
    const nextVal = Math.max(0, amount);
    setWaterIntake(nextVal);
    safeStorage.setItem("nutrition_tracker_water_intake", String(nextVal));

    // Persist as a historical water log row inside storage for charts
    const dateKey = new Date().toDateString();
    safeStorage.setItem(`water_log_${dateKey}`, String(nextVal));

    if (auth.currentUser) {
      const waterLogs = getLocalWaterLogs();
      waterLogs[`water_log_${dateKey}`] = nextVal;
      syncToFirebase(auth.currentUser.uid, { 
        waterIntake: nextVal,
        historicalWater: waterLogs
      });
    }
  };


  // Water reminders syncing effect
  useEffect(() => {
    if (waterReminderEnabled) {
      const storedNext = safeStorage.getItem("nutrition_tracker_next_reminder_timestamp");
      if (!storedNext || Number(storedNext) <= Date.now()) {
        const nextTime = Date.now() + waterReminderInterval * 60 * 1000;
        safeStorage.setItem("nutrition_tracker_next_reminder_timestamp", String(nextTime));
        setTimeUntilNextReminder(waterReminderInterval * 60);
      }
    } else {
      safeStorage.removeItem("nutrition_tracker_next_reminder_timestamp");
      setTimeUntilNextReminder(0);
    }
    safeStorage.setItem("nutrition_tracker_water_reminder_enabled", String(waterReminderEnabled));
    safeStorage.setItem("nutrition_tracker_water_reminder_interval", String(waterReminderInterval));
  }, [waterReminderEnabled, waterReminderInterval]);

  // Handle water countdown decrement loop
  useEffect(() => {
    if (!waterReminderEnabled) return;

    const interval = setInterval(() => {
      const storedNext = safeStorage.getItem("nutrition_tracker_next_reminder_timestamp");
      if (storedNext) {
        const nextTime = Number(storedNext);
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((nextTime - now) / 1000));
        setTimeUntilNextReminder(diff);

        if (diff === 0) {
          playWaterDropSound();
          setShowWaterNotification(true);

          const newNextTime = Date.now() + waterReminderInterval * 60 * 1000;
          safeStorage.setItem("nutrition_tracker_next_reminder_timestamp", String(newNextTime));
          setTimeUntilNextReminder(waterReminderInterval * 60);
        }
      } else {
        const nextTime = Date.now() + waterReminderInterval * 60 * 1000;
        safeStorage.setItem("nutrition_tracker_next_reminder_timestamp", String(nextTime));
        setTimeUntilNextReminder(waterReminderInterval * 60);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [waterReminderEnabled, waterReminderInterval]);

  const playWaterDropSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio Context failed:", e);
    }
  };

  const formatCountdownTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Confirm check date is today
  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Clear food items
  const handleClearLoggedItems = () => {
    const todayStr = new Date().toDateString();
    const olderItems = loggedItems.filter((item) => {
      return item.loggedAt ? !isToday(item.loggedAt) : false;
    });

    saveLoggedItems(olderItems);
    saveWaterIntake(0);
    setShowClearConfirm(false);
    showToast("Bugünkü yemek ve su loglarınız başarıyla sıfırlandı.", "info");
  };

  const removeLoggedItem = (id: string) => {
    const updated = loggedItems.filter((item) => item.id !== id);
    saveLoggedItems(updated);
    showToast("Porsiyon başarıyla silindi.", "info");
  };

  // Darkmode toggler
  const toggleDarkMode = () => {
    const val = !isDarkMode;
    setIsDarkMode(val);
    safeStorage.setItem("nutrition_tracker_dark_mode", String(val));
    showToast(val ? "Koyu tema aktif edildi!  " : "Aydınlık tema aktif edildi! ☀️", "info");
  };

  // Mifflin-St Jeor Equation calculator
  const calculateAndSaveProfileAndGoals = (profileFields: Omit<UserProfile, "isCompleted">) => {
    const { height, weight, age, gender, activityLevel, goal } = profileFields;

    // Basal Metabolic Rate (BMR)
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Daily Energy Expenditure (TDEE) factors
    const actModifiers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const modifier = actModifiers[activityLevel] || 1.375;
    let targetCal = Math.round(bmr * modifier);

    if (goal === "lose") {
      targetCal -= 500;
    } else if (goal === "gain") {
      targetCal += 400;
    }

    // Avoid dangerously low calorie thresholds
    targetCal = Math.max(1200, targetCal);

    // Calculate elegant macros: 30% Protein, 45% Carbs, 25% Fat of calorie intake
    // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
    const targetProt = Math.round((targetCal * 0.30) / 4);
    const targetCarbs = Math.round((targetCal * 0.45) / 4);
    const targetFat = Math.round((targetCal * 0.25) / 9);

    // Recommended daily water intake depending on weight coefficients: 35ml per kg of body mass
    const recommendedWater = Math.round(weight * 35);

    const calculatedGoals: UserDailyGoals = {
      calories: targetCal,
      protein: targetProt,
      carbs: targetCarbs,
      fat: targetFat
    };

    const nextProfile: UserProfile = {
      ...profileFields,
      waterGoal: recommendedWater,
      isCompleted: true
    };

    saveGoals(calculatedGoals);
    saveUserProfile(nextProfile);
  };

  // Demo reports loader backfiller (14 calendar days)
  const fillDemoHistory = () => {
    const sampleMeals = [
      { food_name: "Yulaf ezmesi ve Çilek", calories: 340, protein: 12, carbs: 54, fat: 6, amount: "1 porsiyon" },
      { food_name: "Izgara Somon ve Brokoli", calories: 510, protein: 42, carbs: 12, fat: 22, amount: "200 gram" },
      { food_name: "Mercimek Çorbası", calories: 180, protein: 9, carbs: 28, fat: 3, amount: "1 kase" },
      { food_name: "Haşlanmış Yumurta", calories: 150, protein: 13, carbs: 1, fat: 10, amount: "2 adet" },
      { food_name: "Protein Bar", calories: 220, protein: 20, carbs: 15, fat: 7, amount: "1 adet" },
      { food_name: "Muz ve Fıstık Ezmesi", calories: 280, protein: 7, carbs: 32, fat: 14, amount: "1 orta boy" },
      { food_name: "Süzme Peynir", calories: 120, protein: 14, carbs: 4, fat: 4, amount: "100 gr" },
      { food_name: "Karışık Kuruyemiş", calories: 190, protein: 5, carbs: 6, fat: 17, amount: "30 gr" }
    ];

    const generatedLogs: FoodItem[] = [];
    const today = new Date();

    for (let d = 0; d < 14; d++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - d);
      const dayKey = targetDate.toDateString();

      const numMeals = 2 + Math.floor(Math.random() * 3);
      for (let m = 0; m < numMeals; m++) {
        const randomMeal = sampleMeals[Math.floor(Math.random() * sampleMeals.length)];
        generatedLogs.push({
          ...randomMeal,
          id: `logged-sim-${Date.now()}-${d}-${m}-${Math.random()}`,
          mealType: (["breakfast", "lunch", "dinner", "snack"] as any)[Math.floor(Math.random() * 4)],
          loggedAt: targetDate.toISOString()
        });
      }

      const randomWater = 1500 + Math.floor(Math.random() * 6) * 250;
      safeStorage.setItem(`water_log_${dayKey}`, String(randomWater));
      if (d === 0) {
        setWaterIntake(randomWater);
        safeStorage.setItem("nutrition_tracker_water_intake", String(randomWater));
      }
    }

    saveLoggedItems(generatedLogs);
    showToast("14 günlük demo rapor verileri başarıyla sisteme aktarıldı!", "success");
  };

  if (isLoadingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-800"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-emerald-500 text-slate-950 p-3.5 rounded-2xl shadow-lg relative animate-bounce">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">FittyCal Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const currentThemeBg = isDarkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-800";
  const currentHeaderBorder = isDarkMode ? "border-slate-900 bg-slate-950/80" : "border-slate-200/60 bg-white/80";

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-300 ${currentThemeBg}`} id="main-frame-root">
      
      {/* Onboarding Overlay Modal */}
      {!userProfile.isCompleted && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 max-w-lg w-full rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-white border border-slate-800"
          >
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                ⚖️ FittyCal Akıllı Kalibrasyon
              </span>
              <h1 className="text-2xl font-black mt-3 tracking-tight text-white">Adım Adım Hoş Geldiniz!</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-[340px] mx-auto">
                Profilinizi kurgulayarak yapay zekanın günlük makro ve hidrasyon katsayılarınızı sizin yerinize belirlemesine izin verin.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Boy (cm)</span>
                  <input
                    type="number"
                    value={profileHeight}
                    onChange={(e) => setProfileHeight(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 text-center"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Kilo (kg)</span>
                  <input
                    type="number"
                    value={profileWeight}
                    onChange={(e) => setProfileWeight(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 text-center"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Yaş</span>
                  <input
                    type="number"
                    value={profileAge}
                    onChange={(e) => setProfileAge(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cinsiyet</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileGender("male")}
                      className={`rounded-xl py-2 text-xs font-bold ${profileGender === "male" ? "bg-emerald-500 text-slate-950" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                    >
                      Erkek
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileGender("female")}
                      className={`rounded-xl py-2 text-xs font-bold ${profileGender === "female" ? "bg-emerald-500 text-slate-950" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                    >
                      Kadın
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Kullanım Amacı</span>
                  <select
                    value={profileGoal}
                    onChange={(e) => setProfileGoal(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  >
                    <option value="lose">Zayıflamak (Defisit)</option>
                    <option value="maintain">Form Koruma</option>
                    <option value="gain">Kilo Almak (Sürpriz)</option>
                    <option value="track">Kalori Takibi</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Egzersiz / Aktivite Temponuz</span>
                <select
                  value={profileActivity}
                  onChange={(e) => setProfileActivity(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 w-full"
                >
                  <option value="sedentary">Hareketsiz yaşam (BMR x 1.2)</option>
                  <option value="light">Yapay sporlar / Hafif hareket (BMR x 1.375)</option>
                  <option value="moderate">Düzenli fitness / aktif spor (BMR x 1.55)</option>
                  <option value="active">Çok ağır sporlar / hiperaktif (BMR x 1.725)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (!profileHeight || !profileWeight || !profileAge) {
                  showToast("Lütfen fiziksel değerlerinizi tam olarak doldurun!", "error");
                  return;
                }
                calculateAndSaveProfileAndGoals({
                  height: profileHeight,
                  weight: profileWeight,
                  age: profileAge,
                  gender: profileGender,
                  activityLevel: profileActivity,
                  goal: profileGoal
                });
                showToast("FittyCal başarıyla kalibre edildi! Şahane bir gün dileriz. 🍏", "success");
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all text-center cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              Uygulamayı Başlat
            </button>
          </motion.div>
        </div>
      )}

      {/* Header element */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${currentHeaderBorder}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-md flex items-center justify-center">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none uppercase">FittyCal</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">AI Kalori & Nutrisyon</span>
            </div>
          </div>

          {/* Tab buttons */}
          <nav className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("tracker")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "tracker" ? (isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900") : "text-slate-400 hover:text-slate-200"}`}
            >
              Bugün & Raporlar
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "analysis" ? (isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900") : "text-slate-400 hover:text-slate-200"}`}
            >
              Yapay Zeka Öğün Analizi
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "profile" ? (isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900") : "text-slate-400 hover:text-slate-200"}`}
            >
              Profil & Ayarlar
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-1.5 p-1 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span className="hidden md:inline truncate max-w-[80px]">
                  {currentUser.displayName || "Aktif"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 p-1.5 px-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/15 text-slate-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 border border-slate-500/10"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Giriş Yap</span>
              </button>
            )}

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all hover:bg-slate-900 cursor-pointer ${isDarkMode ? "text-yellow-400" : "text-slate-500"}`}
              title="Koyu Tema Toggled"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "tracker" && (
              <ReportTab
                loggedItems={loggedItems}
                dailyGoals={dailyGoals}
                userProfile={userProfile}
                waterIntake={waterIntake}
                saveWaterIntake={saveWaterIntake}
                removeLoggedItem={removeLoggedItem}
                clearAllLogs={() => setShowClearConfirm(true)}
                isDarkMode={isDarkMode}
                playWaterDropSound={playWaterDropSound}
                waterReminderEnabled={waterReminderEnabled}
                setWaterReminderEnabled={setWaterReminderEnabled}
                waterReminderInterval={waterReminderInterval}
                setWaterReminderInterval={setWaterReminderInterval}
                timeUntilNextReminder={timeUntilNextReminder}
                formatCountdownTime={formatCountdownTime}
                showToast={showToast}
                isToday={isToday}
                safeStorage={safeStorage}
              />
            )}

            {activeTab === "analysis" && (
              <MealAnalysisTab
                inputText={inputText}
                setInputText={setInputText}
                previewImage={previewImage}
                setPreviewImage={setPreviewImage}
                imageMimeType={imageMimeType}
                setImageMimeType={setImageMimeType}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
                loadingStep={loadingStep}
                setLoadingStep={setLoadingStep}
                analysisError={analysisError}
                setAnalysisError={setAnalysisError}
                extractedItems={extractedItems}
                setExtractedItems={setExtractedItems}
                selectedMealType={selectedMealType}
                setSelectedMealType={setSelectedMealType}
                hasApiKey={hasApiKey}
                useDemoFallback={useDemoFallback}
                setUseDemoFallback={setUseDemoFallback}
                showToast={showToast}
                loggedItems={loggedItems}
                saveLoggedItems={saveLoggedItems}
                playWaterDropSound={playWaterDropSound}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === "profile" && (
              <ProfileTab
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                dailyGoals={dailyGoals}
                saveGoals={saveGoals}
                calculateAndSaveProfileAndGoals={calculateAndSaveProfileAndGoals}
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                fillDemoHistory={fillDemoHistory}
                showToast={showToast}
                profileHeight={profileHeight}
                setProfileHeight={setProfileHeight}
                profileWeight={profileWeight}
                setProfileWeight={setProfileWeight}
                profileAge={profileAge}
                setProfileAge={setProfileAge}
                profileGender={profileGender}
                setProfileGender={setProfileGender}
                profileActivity={profileActivity}
                setProfileActivity={setProfileActivity}
                profileGoal={profileGoal}
                setProfileGoal={setProfileGoal}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onSignOut={async () => {
                  try {
                    await signOut(auth);
                    showToast("Başarıyla çıkış yapıldı.", "success");
                  } catch (e) {
                    showToast("Çıkış yapılırken hata oluştu.", "error");
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Bottom Tab Rail */}
      <footer className={`sm:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 z-40 transition-colors ${isDarkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"}`}>
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeTab === "tracker" ? "text-emerald-500 font-extrabold" : "text-slate-500"}`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Raporlar</span>
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeTab === "analysis" ? "text-emerald-500 font-extrabold" : "text-slate-500"}`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">AI Analiz</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeTab === "profile" ? "text-emerald-500 font-extrabold" : "text-slate-500"}`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Ayarlar</span>
        </button>
      </footer>

      {/* Toast popup alerts in screen corner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 pointer-events-none"
          >
            <div className={`p-4 rounded-2xl flex items-center gap-2.5 shadow-2xl border text-xs font-bold ${
              toast.type === "success"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/10"
                : toast.type === "error"
                ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/10"
                : isDarkMode
                ? "bg-slate-900 text-slate-100 border-slate-800"
                : "bg-white text-slate-800 border-slate-200 shadow-md"
            }`}>
              <Check className="w-4 h-4 stroke-[3] animate-bounce" />
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Logs Dialogue Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-sm w-full rounded-2xl p-6 border flex flex-col gap-4 ${isDarkMode ? "bg-slate-900 border-slate-850 text-white" : "bg-white border-slate-200 text-slate-800"}`}
            >
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  ⚠️ Verileri Sıfırla
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                  Bugün kaydettiğiniz tüm yemek porsiyonlarını ve içtiğiniz su katsayısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${isDarkMode ? "bg-slate-800 text-slate-350" : "bg-slate-100 text-slate-600"}`}
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleClearLoggedItems}
                  className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Temizle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sound active Water droplet timer Notification Alert dialog */}
      <AnimatePresence>
        {showWaterNotification && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-sm w-full rounded-3xl p-6 border flex flex-col items-center text-center gap-4 ${isDarkMode ? "bg-slate-900 border-slate-850 text-white" : "bg-white border-slate-200 text-slate-850"}`}
            >
              <div className="bg-blue-500/10 p-3.5 rounded-full text-blue-500 animate-bounce">
                <Droplet className="w-8 h-8 fill-current" />
              </div>
              <div>
                <h4 className="font-black text-base tracking-tight text-blue-500 uppercase">💦 SU SAATİ GELDİ!</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-[260px] mx-auto">
                  Vücudunuzun nem seviyesini korumak için şimdi 1 bardak (250 ml) tazeleyici su içme zamanınız. Şerefe!
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
                <button
                  onClick={() => setShowWaterNotification(false)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-750" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Sonra Hatırlat
                </button>
                <button
                  onClick={() => {
                    saveWaterIntake(waterIntake + 250);
                    setShowWaterNotification(false);
                    showToast("Su günlüğe eklendi! Harikasınız. 💧", "success");
                  }}
                  className="bg-blue-500 hover:bg-blue-400 text-white py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  İçtim (+250 ml)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Firebase authentication setup modal dialog */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        isDarkMode={isDarkMode}
        showToast={showToast}
      />
    </div>
  );
}
