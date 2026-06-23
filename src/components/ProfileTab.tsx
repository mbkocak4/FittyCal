import React from "react";
import {
  Settings,
  Target,
  Dumbbell,
  Shield,
  Moon,
  Sun,
  Target as TargetIcon,
  Check,
  Droplet,
  User,
  Coffee,
  Sparkles,
  CloudLightning
} from "lucide-react";
import { UserDailyGoals, UserProfile } from "../types";
import { User as FirebaseUser } from "../lib/firebase";

interface ProfileTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  dailyGoals: UserDailyGoals;
  saveGoals: (goals: UserDailyGoals) => void;
  calculateAndSaveProfileAndGoals: (profile: Omit<UserProfile, "isCompleted">) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  fillDemoHistory: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  profileHeight: number;
  setProfileHeight: (h: number) => void;
  profileWeight: number;
  setProfileWeight: (w: number) => void;
  profileAge: number;
  setProfileAge: (a: number) => void;
  profileGender: "male" | "female";
  setProfileGender: (g: "male" | "female") => void;
  profileActivity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  setProfileActivity: (a: "sedentary" | "light" | "moderate" | "active" | "very_active") => void;
  profileGoal: "lose" | "maintain" | "gain" | "track";
  setProfileGoal: (g: "lose" | "maintain" | "gain" | "track") => void;
  currentUser: FirebaseUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function ProfileTab({
  userProfile,
  setUserProfile,
  dailyGoals,
  saveGoals,
  calculateAndSaveProfileAndGoals,
  isDarkMode,
  toggleDarkMode,
  fillDemoHistory,
  showToast,
  profileHeight,
  setProfileHeight,
  profileWeight,
  setProfileWeight,
  profileAge,
  setProfileAge,
  profileGender,
  setProfileGender,
  profileActivity,
  setProfileActivity,
  profileGoal,
  setProfileGoal,
  currentUser,
  onOpenAuth,
  onSignOut
}: ProfileTabProps) {
  // theme classes
  const thCard = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800";
  const thSub = isDarkMode ? "bg-slate-950/75 border border-slate-800" : "bg-slate-50 border border-slate-200/60";
  const thInput = isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500" : "bg-slate-50 border-slate-300 text-slate-850 focus:border-emerald-500 focus:bg-white";
  const thHeading = isDarkMode ? "text-slate-100" : "text-slate-900";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="profile-tab-root">
      {/* Settings inputs (LHS) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-5 ${thCard}`}>
          <div>
            <h2 className="text-base font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <User className="w-5 h-5 text-emerald-500" />
              PROFİL & HEDEF AYARLARI
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Fiziksel verilerinizi düzenleyerek Mifflin-St Jeor denkleminize göre günlük kalori ve su emilim katsayılarını her an otomatik optimize edebilirsiniz.
            </p>
          </div>

          {/* Mifflin inputs form section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Boyunuz (cm)</span>
              <input
                type="number"
                value={profileHeight}
                onChange={(e) => setProfileHeight(Number(e.target.value))}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all ${thInput}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kilonuz (kg)</span>
              <input
                type="number"
                value={profileWeight}
                onChange={(e) => setProfileWeight(Number(e.target.value))}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all ${thInput}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Yaşınız</span>
              <input
                type="number"
                value={profileAge}
                onChange={(e) => setProfileAge(Number(e.target.value))}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all ${thInput}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cinsiyet</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setProfileGender("male")}
                  className={`rounded-xl py-2.5 text-xs font-extrabold cursor-pointer transition-all ${
                    profileGender === "male"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                      : isDarkMode
                      ? "bg-slate-950 text-slate-400 border border-slate-800"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  Erkek
                </button>
                <button
                  type="button"
                  onClick={() => setProfileGender("female")}
                  className={`rounded-xl py-2.5 text-xs font-extrabold cursor-pointer transition-all ${
                    profileGender === "female"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                      : isDarkMode
                      ? "bg-slate-950 text-slate-400 border border-slate-800"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  Kadın
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Uygulama Hedefiniz</span>
              <select
                value={profileGoal}
                onChange={(e) => setProfileGoal(e.target.value as any)}
                className={`border rounded-xl px-3 py-2.5 text-xs font-bold transition-all outline-none ${thInput}`}
              >
                <option value="lose">Zayıflamak (Defisit -500 kcal)</option>
                <option value="maintain">Form Koruma (TDEE Dengesi)</option>
                <option value="gain">Kilo Almak (Sürpriz +400 kcal)</option>
                <option value="track">Kalori Takibi (Sadece Kontrol)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Egzersiz / Aktivite Katsayınız</span>
            <div className="flex flex-col gap-2">
              {[
                { id: "sedentary", label: "Hareketsiz", desc: "Masa başı iş veya az hareketli ofis yaşamı (BMR x 1.2)" },
                { id: "light", label: "Az Hareketli Egzersiz", desc: "Haftada 1-2 gün hafif tempolu yürüyüş veya hafif spor (BMR x 1.375)" },
                { id: "moderate", label: "Düzenli Egzersiz", desc: "Haftada 3-5 gün orta tempolu antrenman veya fitness aktif (BMR x 1.55)" },
                { id: "active", label: "Hiperaktif Sporcu", desc: "Haftada 6-7 gün ağır idman yapan spor temposu (BMR x 1.725)" }
              ].map((act) => (
                <button
                  type="button"
                  key={act.id}
                  onClick={() => setProfileActivity(act.id as any)}
                  className={`w-full text-left p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-0.5 ${
                    profileActivity === act.id
                      ? "bg-slate-950 text-white border-emerald-500 ring-2 ring-emerald-500/15"
                      : isDarkMode
                      ? "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="text-xs font-extrabold flex items-center gap-1 justify-between w-full">
                    <span>{act.label}</span>
                    {profileActivity === act.id && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">{act.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
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
              showToast("Vücut katsayılarınız başarıyla yeniden ölçülmüştür! ⚖️", "success");
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10"
          >
            Mifflin-St Jeor Denklemine Göre Optimize Et
          </button>
        </div>
      </div>

      {/* Manual thresholds and theme toggles (RHS) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Cloud Sync Status Card */}
        <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${thCard}`}>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">BULUT SENKRONİZASYONU</h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Veri Yedekleme & Giriş</p>
          </div>

          {currentUser ? (
            <div className="flex flex-col gap-3">
              <div className={`p-4 rounded-2xl flex flex-col gap-2 ${thSub}`}>
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User Avatar" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : "U")}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="text-xs font-black block truncate">{currentUser.displayName || "FittyCal Kullanıcısı"}</span>
                    <span className="text-[10px] text-slate-400 block truncate font-mono">{currentUser.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <span>Giriş Yapıldı & Bulut Aktif</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="w-full bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-500 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Oturumu Kapat
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl flex flex-col gap-3 ${thSub}`}>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                Kalori, su ve öğün günlüklerinizi kaybetmemek ve tüm cihazlarınızdan erişlemek için ücretsiz oturum açın!
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all text-center shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Giriş Yap / Üye Ol
              </button>
            </div>
          )}
        </div>

        <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${thCard}`}>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">GÜNLÜK HEDEF ÖLÇEKLERİ</h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Manuel Özelleştirme</p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Hedef Kalori (kcal)</span>
              <input
                type="number"
                value={dailyGoals.calories}
                onChange={(e) => saveGoals({ ...dailyGoals, calories: Number(e.target.value) })}
                className={`px-3 py-2 rounded-xl font-mono text-center text-xs font-black outline-none ${isDarkMode ? "bg-slate-950 text-white border border-slate-800" : "bg-white text-slate-800 border border-slate-200"}`}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Protein (g)</span>
              <input
                type="number"
                value={dailyGoals.protein}
                onChange={(e) => saveGoals({ ...dailyGoals, protein: Number(e.target.value) })}
                className={`px-3 py-2 rounded-xl font-mono text-center text-xs font-black outline-none ${isDarkMode ? "bg-slate-950 text-white border border-slate-800" : "bg-white text-slate-800 border border-slate-200"}`}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Karbonhidrat (g)</span>
              <input
                type="number"
                value={dailyGoals.carbs}
                onChange={(e) => saveGoals({ ...dailyGoals, carbs: Number(e.target.value) })}
                className={`px-3 py-2 rounded-xl font-mono text-center text-xs font-black outline-none ${isDarkMode ? "bg-slate-950 text-white border border-slate-800" : "bg-white text-slate-800 border border-slate-200"}`}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Yağ (g)</span>
              <input
                type="number"
                value={dailyGoals.fat}
                onChange={(e) => saveGoals({ ...dailyGoals, fat: Number(e.target.value) })}
                className={`px-3 py-2 rounded-xl font-mono text-center text-xs font-black outline-none ${isDarkMode ? "bg-slate-950 text-white border border-slate-800" : "bg-white text-slate-800 border border-slate-200"}`}
              />
            </div>
          </div>
        </div>

        {/* Dark mode & Demo Simulator tools */}
        <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${thCard}`}>
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">ARAYÜZ AYARLARI</h3>

          {/* Dark mode switch button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-xs uppercase cursor-pointer border transition-all ${
              isDarkMode
                ? "bg-slate-950 border-slate-850 text-yellow-400 hover:bg-slate-900"
                : "bg-slate-50 border-slate-200 text-indigo-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-slate-100 dark:text-slate-300">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDarkMode ? "GÜNDÜZ MODUNU AÇ" : "KOYU MODUNU ETKİNLEŞTİR"}
            </span>
            <span className="text-[9px] font-black tracking-widest text-slate-400">Toggle</span>
          </button>

          {/* Demo Backfiller tool */}
          <div className={`p-4 rounded-2xl border ${thSub} flex flex-col gap-2`}>
            <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "8s" }} />
              Test & Demo Rapor Araçları
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
              Uygulamayı sıfırdan test ediyorsanız, son 14 günün grafik ve ısı haritalarını anında görmek için demo verilerini tek tıkla yükleyebilirsiniz:
            </p>
            <button
              type="button"
              onClick={fillDemoHistory}
              className={`w-full mt-1.5 py-2 px-3 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer border ${
                isDarkMode
                  ? "bg-slate-950 hover:bg-slate-900 border-indigo-500/30 text-indigo-400"
                  : "bg-white hover:bg-slate-50 border-indigo-300 text-indigo-700 shadow-xs"
              }`}
            >
              📊 Örnek 14 Günlük Rapor Verisi Yükle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
