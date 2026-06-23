import React, { useState } from "react";
import {
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Coffee,
  Sun,
  Moon,
  Trash2,
  Plus,
  Minus,
  Check,
  ChevronUp,
  ChevronDown,
  Bell,
  Utensils,
  X,
  Calendar,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FoodItem, UserDailyGoals, UserProfile } from "../types";

interface ReportTabProps {
  loggedItems: FoodItem[];
  dailyGoals: UserDailyGoals;
  userProfile: UserProfile;
  waterIntake: number;
  saveWaterIntake: (amount: number) => void;
  removeLoggedItem: (id: string) => void;
  clearAllLogs: () => void;
  isDarkMode: boolean;
  playWaterDropSound: () => void;
  waterReminderEnabled: boolean;
  setWaterReminderEnabled: (enabled: boolean) => void;
  waterReminderInterval: number;
  setWaterReminderInterval: (interval: number) => void;
  timeUntilNextReminder: number;
  formatCountdownTime: (secs: number) => string;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  isToday: (dateString: string) => boolean;
  safeStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
}

export default function ReportTab({
  loggedItems,
  dailyGoals,
  userProfile,
  waterIntake,
  saveWaterIntake,
  removeLoggedItem,
  clearAllLogs,
  isDarkMode,
  playWaterDropSound,
  waterReminderEnabled,
  setWaterReminderEnabled,
  waterReminderInterval,
  setWaterReminderInterval,
  timeUntilNextReminder,
  formatCountdownTime,
  showToast,
  isToday,
  safeStorage
}: ReportTabProps) {
  const [reportInterval, setReportInterval] = useState<"daily" | "weekly" | "monthly">("daily");
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: true
  });

  // Calculate stats for today
  const todayLoggedItems = loggedItems.filter((item) => {
    return item.loggedAt ? isToday(item.loggedAt) : false;
  });

  const totalCalories = todayLoggedItems.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalProtein = todayLoggedItems.reduce((acc, curr) => acc + (curr.protein || 0), 0);
  const totalCarbs = todayLoggedItems.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const totalFat = todayLoggedItems.reduce((acc, curr) => acc + (curr.fat || 0), 0);

  const calPercent = Math.min(Math.round((totalCalories / dailyGoals.calories) * 100), 100);
  const protPercent = Math.min(Math.round((totalProtein / dailyGoals.protein) * 100), 100);
  const carbsPercent = Math.min(Math.round((totalCarbs / dailyGoals.carbs) * 100), 100);
  const fatPercent = Math.min(Math.round((totalFat / dailyGoals.fat) * 100), 100);

  // Weekly data aggregation (Last 7 Days)
  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString("tr-TR", { weekday: "short" });
      const dayKey = d.toDateString();

      const dayCalories = loggedItems
        .filter((item) => {
          const itemDate = new Date(item.loggedAt || "");
          return itemDate.toDateString() === dayKey;
        })
        .reduce((sum, item) => sum + (item.calories || 0), 0);

      const storedDayWater = safeStorage.getItem(`water_log_${dayKey}`);
      const dayWater = storedDayWater ? Number(storedDayWater) : (i === 0 ? waterIntake : 0);

      data.push({
        dayName,
        dateString: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
        calories: dayCalories,
        water: dayWater,
        dayKey
      });
    }
    return data;
  };

  const weeklyData = getLast7DaysData();
  const weeklyTotalCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0);
  const weeklyTotalWater = weeklyData.reduce((sum, d) => sum + d.water, 0);
  const weeklyAvgCalories = Math.round(weeklyTotalCalories / 7);
  const weeklyAvgWater = Math.round(weeklyTotalWater / 7);

  // Monthly data aggregation (Last 30 Days)
  const getLast30DaysData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayKey = d.toDateString();

      const dayCalories = loggedItems
        .filter((item) => {
          const itemDate = new Date(item.loggedAt || "");
          return itemDate.toDateString() === dayKey;
        })
        .reduce((sum, item) => sum + (item.calories || 0), 0);

      const storedDayWater = safeStorage.getItem(`water_log_${dayKey}`);
      const dayWater = storedDayWater ? Number(storedDayWater) : (i === 0 ? waterIntake : 0);

      data.push({
        dayKey,
        dayNum: d.getDate(),
        dateFormatted: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
        calories: dayCalories,
        water: dayWater
      });
    }
    return data;
  };

  const monthlyData = getLast30DaysData();
  const monthlyTotalCalories = monthlyData.reduce((sum, d) => sum + d.calories, 0);
  const monthlyTotalWater = monthlyData.reduce((sum, d) => sum + d.water, 0);
  const activeDaysCount = monthlyData.filter(d => d.calories > 0 || d.water > 0).length;

  // Render Theme helpers
  const thCard = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/85 text-slate-800";
  const thSub = isDarkMode ? "bg-slate-950/65 border border-slate-800" : "bg-slate-50 border border-slate-200/60";
  const thMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const thHeading = isDarkMode ? "text-slate-100" : "text-slate-900";

  return (
    <div className="flex flex-col gap-6" id="report-tab-root">
      {/* Interval Selector Segmented Control */}
      <div className={`p-1.5 rounded-2xl flex items-center justify-between ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-250/60 shadow-xs"}`}>
        <span className="text-xs font-black uppercase tracking-widest pl-3.5 text-emerald-500 hidden sm:inline flex-1">
          Rapor Zaman Dilimi
        </span>
        <div className="grid grid-cols-3 gap-1 w-full sm:w-auto shrink-0">
          {(["daily", "weekly", "monthly"] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setReportInterval(interval)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl cursor-copy transition-all ${
                reportInterval === interval
                  ? isDarkMode
                    ? "bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/10"
                    : "bg-slate-900 text-white font-extrabold shadow-md shadow-slate-900/15"
                  : isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {interval === "daily" ? "Bugün" : interval === "weekly" ? "Haftalık" : "Aylık"}
            </button>
          ))}
        </div>
      </div>

      {reportInterval === "daily" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calorie Macro Ring Gauge Card (LHS) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section className={`rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center ${isDarkMode ? "bg-slate-900 border border-slate-800/80" : "bg-white border border-slate-200"}`}>
              <h2 className={`text-xs font-extrabold uppercase tracking-widest mb-6 ${thMuted}`}>BUGÜNÜN MAKROLARI</h2>

              <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="88" cy="88" r="74" stroke="currentColor" strokeWidth="14" fill="transparent" className={isDarkMode ? "text-slate-800" : "text-slate-150"} />
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray="465"
                    strokeDashoffset={465 * (1 - calPercent / 100)}
                    className="text-emerald-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono tracking-tight">{totalCalories}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${thMuted}`}>KCAL ALINDI</span>
                  <span className="text-[10px] text-slate-400 uppercase mt-0.5 font-semibold">Hedef: {dailyGoals.calories}</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                {/* Protein */}
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-500 flex items-center gap-1.5 uppercase">
                      <Dumbbell className="w-3.5 h-3.5" />
                      Protein ({totalProtein}g)
                    </span>
                    <span className="font-mono">%{protPercent}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-150"}`}>
                    <div style={{ width: `${protPercent}%` }} className="bg-emerald-500 h-full transition-all duration-500 rounded-full"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Hedef: {dailyGoals.protein}g</span>
                </div>

                {/* Carbohydrates */}
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-500 flex items-center gap-1.5 uppercase">
                      <Wheat className="w-3.5 h-3.5" />
                      Karbonhidrat ({totalCarbs}g)
                    </span>
                    <span className="font-mono">%{carbsPercent}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-150"}`}>
                    <div style={{ width: `${carbsPercent}%` }} className="bg-blue-500 h-full transition-all duration-500 rounded-full"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Hedef: {dailyGoals.carbs}g</span>
                </div>

                {/* Fat */}
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-orange-400 flex items-center gap-1.5 uppercase">
                      <Droplet className="w-3.5 h-3.5" />
                      Yağ ({totalFat}g)
                    </span>
                    <span className="font-mono">%{fatPercent}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-150"}`}>
                    <div style={{ width: `${fatPercent}%` }} className="bg-orange-500 h-full transition-all duration-500 rounded-full"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Hedef: {dailyGoals.fat}g</span>
                </div>
              </div>
            </section>

            {/* Daily Water */}
            <section className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-500 animate-bounce" />
                  Günlük Su Tüketimi
                </h3>
                <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg font-mono">
                  HEDEF: {userProfile.waterGoal || 2500} ml
                </span>
              </div>

              <div className={`rounded-2xl p-4 flex flex-col items-center gap-2 ${isDarkMode ? "bg-slate-950/70 border border-slate-800" : "bg-slate-50 border border-slate-100"}`}>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono tracking-tight text-blue-500">{waterIntake}</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">/ {userProfile.waterGoal || 2500} ML</span>
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div
                    style={{ width: `${Math.min(100, (waterIntake / (userProfile.waterGoal || 2500)) * 100)}%` }}
                    className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-wide mt-1">
                  {waterIntake >= (userProfile.waterGoal || 2500) ? "🎉 Tebrikler! Su hedefine ulaştınız." : `Kalan miktar: ${Math.max(0, (userProfile.waterGoal || 2500) - waterIntake)} ml`}
                </span>
              </div>

              {/* Water +/- controls */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => saveWaterIntake(waterIntake + 250)}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold py-2 px-1 rounded-xl text-xs transition-all flex flex-col items-center justify-center cursor-pointer border border-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5 mb-0.5" />
                  <span>+250 ml</span>
                </button>
                <button
                  type="button"
                  onClick={() => saveWaterIntake(waterIntake + 500)}
                  className="bg-blue-600 text-white hover:bg-blue-500 font-extrabold py-2 px-1 rounded-xl text-xs transition-all flex flex-col items-center justify-center cursor-pointer shadow-blue-500/10 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mb-0.5" />
                  <span>+500 ml</span>
                </button>
                <button
                  type="button"
                  onClick={() => saveWaterIntake(waterIntake - 250)}
                  disabled={waterIntake <= 0}
                  className="bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 font-semibold py-2 px-1 rounded-xl text-xs transition-all flex flex-col items-center justify-center cursor-pointer border border-slate-800 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5 mb-0.5" />
                  <span>-250 ml</span>
                </button>
              </div>

              {/* Water Timer Notification inside Card */}
              <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                    <Bell className={`w-3.5 h-3.5 ${waterReminderEnabled ? 'text-blue-500 animate-pulse' : 'text-slate-500'}`} />
                    Su Hatırlatıcı (Sesli)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waterReminderEnabled}
                      onChange={(e) => setWaterReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                {waterReminderEnabled && (
                  <div className={`rounded-xl p-2.5 flex flex-col gap-2 ${isDarkMode ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-150"}`}>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">Kalan Süre:</span>
                      <span className="font-mono font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        {formatCountdownTime(timeUntilNextReminder)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={waterReminderInterval}
                        onChange={(e) => setWaterReminderInterval(Number(e.target.value))}
                        className={`text-[10px] font-bold rounded-lg p-1 px-1.5 outline-none ${isDarkMode ? "bg-slate-900 text-slate-200 border border-slate-800" : "bg-white text-slate-700 border border-slate-200"}`}
                      >
                        <option value="15">15 dk bir</option>
                        <option value="30">30 dk bir</option>
                        <option value="45">45 dk bir</option>
                        <option value="60">1 saatte bir</option>
                        <option value="120">2 saatte bir</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          playWaterDropSound();
                          showToast("Damla sesi çalındı! 💧 Bildirimler tarayıcıda sesli olarak simüle edilir.", "success");
                        }}
                        className={`text-[9px] font-bold py-1 px-1 rounded-lg flex items-center justify-center gap-1 border ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-250 text-slate-600 hover:bg-slate-50"}`}
                      >
                        <Bell className="w-3 h-3 text-slate-400" />
                        <span>Sesi Test Et</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Consumed history logs container (RHS) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${isDarkMode ? "bg-slate-900 border border-slate-800/80 text-white" : "bg-white border border-slate-200/80 text-slate-850"}`}>
              <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  Bugün Tüketilenler
                </h3>
                {todayLoggedItems.length > 0 && (
                  <button
                    onClick={clearAllLogs}
                    className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-all cursor-pointer hover:underline flex items-center gap-0.5"
                  >
                    Temizle
                  </button>
                )}
              </div>

              {todayLoggedItems.length === 0 ? (
                <div className={`py-12 flex flex-col items-center justify-center gap-3 border border-dashed rounded-2xl ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`p-3 rounded-full ${isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-center px-4">
                    <p className={`text-sm font-bold ${thHeading}`}>Henüz bir öğün kaydedilmedi</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      "Yapay Zeka Analizi" sekmesini kullanarak porsiyonlarınızı pürüzsüzce sesli veya yazılı aktarın!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {["breakfast", "lunch", "dinner", "snack"].map((mType) => {
                    const groupItems = todayLoggedItems.filter((item) => item.mealType === mType);
                    if (groupItems.length === 0) return null;

                    const mNames: Record<string, string> = {
                      breakfast: "Kahvaltı",
                      lunch: "Öğle Yemeği",
                      dinner: "Akşam Yemeği",
                      snack: "Atıştırmalık"
                    };

                    const mIcons: Record<string, React.ReactNode> = {
                      breakfast: <Coffee className="w-4 h-4 text-amber-500" />,
                      lunch: <Sun className="w-4 h-4 text-emerald-500" />,
                      dinner: <Moon className="w-4 h-4 text-indigo-500" />,
                      snack: <AppleIcon className="w-4 h-4 text-rose-500" />
                    };

                    const groupCal = groupItems.reduce((sum, curr) => sum + (curr.calories || 0), 0);
                    const isExpanded = expandedMeals[mType] !== false;

                    return (
                      <div key={mType} className={`p-4 rounded-2xl flex flex-col gap-2 ${thSub}`}>
                        <div
                          onClick={() => setExpandedMeals({ ...expandedMeals, [mType]: !isExpanded })}
                          className="flex justify-between items-center cursor-pointer select-none group"
                        >
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-all">
                            {mIcons[mType]}
                            <span className={isDarkMode ? "text-slate-100 font-extrabold" : "text-slate-700 font-extrabold"}>{mNames[mType]}</span>
                            <span className="text-[10px] text-slate-400 font-bold">({groupItems.length} Besin)</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg ${isDarkMode ? "bg-slate-900 text-emerald-400" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                              {groupCal} kcal
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="flex flex-col gap-2 border-t border-slate-750/30 pt-3 mt-1.5">
                            {groupItems.map((item) => (
                              <div key={item.id} className={`flex justify-between items-center text-xs p-3 rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                                <div>
                                  <span className={`font-bold block ${thHeading}`}>{item.food_name}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">{item.amount}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right font-mono">
                                    <span className={`font-bold text-xs block ${thHeading}`}>{item.calories} <span className="text-[9px] font-sans font-normal text-slate-400">kcal</span></span>
                                    <span className="text-[9px] text-slate-400 block tracking-tight mt-0.5 font-semibold">
                                      P:{item.protein}g • C:{item.carbs}g • Y:{item.fat}g
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => removeLoggedItem(item.id)}
                                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 rounded-lg cursor-pointer transition-colors"
                                    title="Sil"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {reportInterval === "weekly" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="weekly-report-tab animate-fade-in">
          {/* Visual SVG column heights (Left 7 Columns) */}
          <div className="md:col-span-8 flex flex-col gap-6">
            <section className={`rounded-3xl p-6 shadow-xs flex flex-col gap-6 ${thCard}`}>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Haftalık Kalori Grafiği
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Son 7 gündeki günlük kalori porsiyon değişimleriniz. Hedef çizgisi: {dailyGoals.calories} kcal
                </p>
              </div>

              {/* Responsive SVG Column chart bar charts */}
              <div className="w-full h-56 flex items-end justify-between px-2 pt-6 relative border-b border-slate-755/40">
                {/* Horizontal target dashed guide lines */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-emerald-500/40 z-0 pointer-events-none"
                  style={{ bottom: `${Math.min(95, (dailyGoals.calories / 3500) * 100)}%` }}
                >
                  <span className="absolute -top-4 right-2 text-[8px] font-bold text-emerald-400 font-mono uppercase bg-slate-900/60 shadow-xs rounded px-1 flex items-center gap-0.5">
                    HEDEF: {dailyGoals.calories} kcal
                  </span>
                </div>

                {weeklyData.map((d, idx) => {
                  const valPct = Math.min(100, Math.round((d.calories / 3500) * 100));
                  const isCurrentGoalMet = d.calories >= dailyGoals.calories;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10 px-1">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-950 text-white rounded-lg p-1 px-2 text-[9px] font-mono whitespace-nowrap z-50 pointer-events-none text-center shadow-2xl border border-slate-800">
                        <span className="font-bold block">{d.dateString}</span>
                        <span className="font-extrabold text-emerald-400">{d.calories} kcal</span>
                      </div>

                      {/* Bar body */}
                      <div className="w-full max-w-[28px] bg-slate-755/35 h-44 rounded-t-lg overflow-hidden flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${valPct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className={`w-full rounded-t-lg transition-all ${
                            d.calories === 0
                              ? "bg-slate-650"
                              : isCurrentGoalMet
                              ? "bg-emerald-500 shadow-md shadow-emerald-500/10"
                              : "bg-teal-400"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase font-sans mt-1">
                        {d.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Water consumption weekly SVG graph too! */}
              <div className="mt-4">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-1 text-blue-500 mb-6">
                  <Droplet className="w-3.5 h-3.5" />
                  Haftalık Su Grafiği (Litre)
                </h4>
                <div className="w-full h-40 flex items-end justify-between px-2 pt-6 relative border-b border-slate-755/40">
                  {/* Water guide line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-blue-500/40 z-0 pointer-events-none"
                    style={{ bottom: `${Math.min(95, ((userProfile.waterGoal || 2500) / 4000) * 100)}%` }}
                  >
                    <span className="absolute -top-4 right-2 text-[8px] font-bold text-blue-400 font-mono uppercase bg-slate-900/60 shadow-xs rounded px-1">
                      SU HEDEFİ: {userProfile.waterGoal || 2500} ml
                    </span>
                  </div>

                  {weeklyData.map((d, idx) => {
                    const waterPct = Math.min(100, Math.round((d.water / 4000) * 100));
                    const isWaterGoalMet = d.water >= (userProfile.waterGoal || 2500);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10 px-1">
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-950 text-white rounded-lg p-1 px-2 text-[9px] font-mono whitespace-nowrap z-50 pointer-events-none text-center shadow-lg border border-slate-800">
                          <span className="font-bold block">{d.dateString}</span>
                          <span className="font-extrabold text-blue-400">{(d.water / 1000).toFixed(2)} Litre</span>
                        </div>

                        <div className="w-full max-w-[28px] bg-slate-755/35 h-32 rounded-t-lg overflow-hidden flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${waterPct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className={`w-full rounded-t-lg transition-all ${
                              d.water === 0 ? "bg-slate-650" : isWaterGoalMet ? "bg-blue-500" : "bg-blue-300"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase font-sans mt-0.5">
                          {d.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Metrics summary widget card (Right Columns) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <section className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${thCard}`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">HAFTALIK ÖZET</h3>

              <div className={`p-4 rounded-2xl flex flex-col gap-1 ${thSub}`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase">HAFTALIK TOPLAM BESİN</span>
                <span className="text-2xl font-black font-mono tracking-tight text-white">{weeklyTotalCalories} kcal</span>
                <span className="text-[10px] text-slate-400 mt-1">Son 7 gün boyunca alınan tüm kalori.</span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col gap-1 ${thSub}`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase">GÜNLÜK ORTALAMA BESİN</span>
                <span className="text-2xl font-black font-mono tracking-tight text-white">{weeklyAvgCalories} kcal / gün</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${weeklyAvgCalories >= dailyGoals.calories ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {weeklyAvgCalories >= dailyGoals.calories ? "Hedef Değer Sınırında" : "Hafif Kalori Açığı"}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col gap-1 ${thSub}`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase">ORTALAMA SU TÜKETİMİ</span>
                <span className="text-2xl font-black font-mono tracking-tight text-blue-500">{weeklyAvgWater} ml / gün</span>
                <span className="text-[10px] text-slate-400 mt-1">Hedefinizin %{Math.round((weeklyAvgWater / (userProfile.waterGoal || 2500)) * 100)} kadarı karşılandı.</span>
              </div>

              <div className="text-center py-4">
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-[180px] mx-auto uppercase tracking-wide font-bold">
                  *Raporlar tarayıcınızda kayıtlı geçmişlerden anlık derlenmektedir.
                </p>
              </div>
            </section>
          </div>
        </div>
      )}

      {reportInterval === "monthly" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="monthly-report-tab animate-fade-in">
          {/* Calendar style thermal heat map representing 30 days grid (Left 12 Columns) */}
          <div className="md:col-span-12">
            <section className={`rounded-3xl p-6 shadow-xs flex flex-col gap-6 ${thCard}`}>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Kaydedilen Aylık Isı Haritası (30 Günlük)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Son 30 günlük kalori ve su tüketiminizin hedefinize uyum haritası. Hücreler hedefe ulaşma yüzdenize göre renklendirilir.
                </p>
              </div>

              {/* Grid 30 squares for Calibration / achievement index */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  KALORİ HEDEFİNE UYLUK (%{calPercent}+)
                </h4>
                <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2 px-1">
                  {monthlyData.map((d, idx) => {
                    const percent = d.calories === 0 ? 0 : Math.round((d.calories / dailyGoals.calories) * 100);
                    // Decide color scheme
                    let bgCol = "bg-slate-800 text-slate-500";
                    if (percent > 0 && percent <= 50) bgCol = "bg-emerald-900/40 text-emerald-300 border border-emerald-900/30";
                    if (percent > 50 && percent <= 85) bgCol = "bg-emerald-750 text-emerald-100";
                    if (percent > 85 && percent <= 110) bgCol = "bg-emerald-500 text-slate-950 font-bold";
                    if (percent > 110) bgCol = "bg-amber-500 text-slate-950 font-bold";

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl p-2 flex flex-col justify-between hover:scale-105 transition-all cursor-crosshair group relative ${bgCol}`}
                      >
                        {/* Hover modal tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-950 text-white rounded-lg p-1 px-1.5 text-[8.5px] font-mono whitespace-nowrap z-50 pointer-events-none text-center shadow-lg border border-slate-800">
                          <span className="font-bold">{d.dateFormatted}</span>
                          <span className="block font-black text-emerald-400">{d.calories} kcal | %{percent}</span>
                        </div>

                        <span className="text-[10px] font-bold block">{d.dayNum}</span>
                        <span className="text-[9px] font-mono font-bold tracking-tight text-right block">
                          {percent > 0 ? `%${percent}` : "Ø"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Water Heatmap grid too! */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5" />
                  SU HEDEFİNE UYLUK (ML)
                </h4>
                <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2 px-1">
                  {monthlyData.map((d, idx) => {
                    const wGoal = userProfile.waterGoal || 2500;
                    const percent = d.water === 0 ? 0 : Math.round((d.water / wGoal) * 100);
                    // azul colors
                    let bgCol = "bg-slate-800 text-slate-500";
                    if (percent > 0 && percent <= 50) bgCol = "bg-blue-900/40 text-blue-300 border border-blue-900/30";
                    if (percent > 50 && percent < 100) bgCol = "bg-blue-800 text-blue-100";
                    if (percent >= 100) bgCol = "bg-blue-500 text-slate-950 font-bold";

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl p-2 flex flex-col justify-between hover:scale-105 transition-all cursor-crosshair group relative ${bgCol}`}
                      >
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-950 text-white rounded-lg p-1 px-1.5 text-[8.5px] font-mono whitespace-nowrap z-50 pointer-events-none text-center shadow-lg border border-slate-800">
                          <span className="font-bold">{d.dateFormatted}</span>
                          <span className="block font-black text-blue-400">{d.water} ml | %{percent}</span>
                        </div>

                        <span className="text-[10px] font-bold block">{d.dayNum}</span>
                        <span className="text-[9px] font-mono font-bold tracking-tight text-right block">
                          {percent > 0 ? `${(d.water / 1000).toFixed(1)}L` : "Ø"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className={`p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 mt-2 ${thSub}`}>
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-[9px] font-black uppercase text-slate-400">Kalori Renk Açıklaması:</span>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-800 rounded"></div> Ø Kayıt Yok</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-900/40 rounded"></div> &lt;%50 Az</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-750 rounded"></div> %50-%85 Orta</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded"></div> %85-%110 Dengeli</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded"></div> &gt;%110 Surplus</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-extrabold uppercase">
                  AY BOYU ETKİN GÜN SAYISI: {activeDaysCount} / 30 GÜN
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline fallback customized icon for snacks
function AppleIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      crossOrigin="anonymous"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      style={{ width: "1.02rem", height: "1.02rem" }}
    >
      <path d="M12 22c-3.1 0-6-3.1-6-7s2.9-7 6-7 6 3.1 6 7-2.9 7-6 7Z" />
      <path d="M12 8c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1s1 .4 1 1v2c0 .6-.4 1-1 1Z" />
      <path d="M12 4c1-1 2.5-1.5 4-1" />
    </svg>
  );
}
