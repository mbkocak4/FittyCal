import React, { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  PlusCircle,
  Clock,
  ArrowRight,
  Info,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FoodItem } from "../types";
import { resolveApiUrl } from "../lib/api-resolver";

interface MealAnalysisTabProps {
  inputText: string;
  setInputText: (text: string) => void;
  previewImage: string | null;
  setPreviewImage: (src: string | null) => void;
  imageMimeType: string | null;
  setImageMimeType: (mime: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  loadingStep: string;
  setLoadingStep: (step: string) => void;
  analysisError: string | null;
  setAnalysisError: (err: string | null) => void;
  extractedItems: FoodItem[];
  setExtractedItems: React.Dispatch<React.SetStateAction<FoodItem[]>>;
  selectedMealType: "breakfast" | "lunch" | "dinner" | "snack";
  setSelectedMealType: (type: "breakfast" | "lunch" | "dinner" | "snack") => void;
  hasApiKey: boolean;
  useDemoFallback: boolean;
  setUseDemoFallback: (fallback: boolean) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  loggedItems: FoodItem[];
  saveLoggedItems: (items: FoodItem[]) => void;
  playWaterDropSound: () => void;
  isDarkMode: boolean;
}

export default function MealAnalysisTab({
  inputText,
  setInputText,
  previewImage,
  setPreviewImage,
  imageMimeType,
  setImageMimeType,
  isAnalyzing,
  setIsAnalyzing,
  loadingStep,
  setLoadingStep,
  analysisError,
  setAnalysisError,
  extractedItems,
  setExtractedItems,
  selectedMealType,
  setSelectedMealType,
  hasApiKey,
  useDemoFallback,
  setUseDemoFallback,
  showToast,
  loggedItems,
  saveLoggedItems,
  playWaterDropSound,
  isDarkMode
}: MealAnalysisTabProps) {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Machine Learning Simulated Suggestions Engine (based on log frequencies)
  const getSmartSuggestions = () => {
    if (loggedItems.length === 0) {
      return [
        { food_name: "2 Haşlanmış Yumurta ve Süzme Peynir" },
        { food_name: "Yulaf Ezmesi, Çilek ve Fıstık Ezmesi" },
        { food_name: "Izgara Tavuk Göğsü, Pirinç Pilavı ve Salata" },
        { food_name: "Muzlu Sporcu Protein Shake" }
      ];
    }

    const counts: Record<string, number> = {};
    loggedItems.forEach((item) => {
      const name = item.food_name.trim();
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });

    const sorted = Object.keys(counts)
      .map((name) => ({ food_name: name, count: counts[name] }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length < 4) {
      const results = sorted.map((item) => ({ food_name: item.food_name }));
      const fallbacks = ["Yulaf Ezmesi ve Çilek", "Haşlanmış Yumurta", "Izgara Somon ve Brokoli", "Mercimek Çorbası"];
      for (const fb of fallbacks) {
        if (results.length >= 4) break;
        if (!results.some((r) => r.food_name === fb)) {
          results.push({ food_name: fb });
        }
      }
      return results;
    }

    return sorted.slice(0, 4).map((item) => ({ food_name: item.food_name }));
  };

  const smartSuggestions = getSmartSuggestions();

  // Past foods unique log history quick adding (no analysis needed!)
  const getPastFoodsUnique = () => {
    const seen = new Set<string>();
    const uniqueItems: FoodItem[] = [];

    const sortedHistory = [...loggedItems].sort((a, b) => {
      return new Date(b.loggedAt || 0).getTime() - new Date(a.loggedAt || 0).getTime();
    });

    for (const item of sortedHistory) {
      const identifier = `${item.food_name.toLowerCase().trim()}-${item.mealType}`;
      if (item.food_name && item.calories && !seen.has(identifier)) {
        seen.add(identifier);
        uniqueItems.push(item);
      }
      if (uniqueItems.length >= 6) break;
    }

    return uniqueItems;
  };

  const pastUniqueFoods = getPastFoodsUnique();

  const duplicateItemToToday = (item: FoodItem) => {
    const duplicated: FoodItem = {
      ...item,
      id: `logged-${Date.now()}-${Math.random()}`,
      loggedAt: new Date().toISOString()
    };

    const updated = [duplicated, ...loggedItems];
    saveLoggedItems(updated);
    playWaterDropSound();

    const mealNameTr: Record<string, string> = {
      breakfast: "Kahvaltıya",
      lunch: "Öğle Yemeğine",
      dinner: "Akşam Yemeğine",
      snack: "Atıştırmalıklara"
    };
    const targetMeal = mealNameTr[item.mealType || "breakfast"] || "Günlüğe";
    showToast(`"${item.food_name}" başarıyla ${targetMeal} eklendi! ✨ (${item.calories} kcal)`, "success");
  };

  // Form Submit Handler
  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText && !previewImage) {
      setAnalysisError("Lütfen yemeğinizi kısaca tarif edin veya bir fotoğraf seçin.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setExtractedItems([]);

    const steps = [
      "Veriler sunucuya gönderiliyor...",
      "Yüklenen bileşenler doğrulanıyor...",
      "Yapay zeka (Gemini) yemek tabağını analiz ediyor...",
      "Bileşen porsiyonları ve makro değerleri hesaplanıyor...",
      "Çıktı listesi asistan tarafından yapılandırılıyor..."
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);

    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 1200);

    try {
      let base64Data = null;
      if (previewImage) {
        base64Data = previewImage.split(",")[1];
      }

      const response = await fetch(resolveApiUrl("/api/extract-nutrition"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: inputText,
          image: base64Data,
          mimeType: imageMimeType,
          useDemoFallback: useDemoFallback
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        let errMsg = "Sunucu analizi tamamlayamadı.";
        try {
          const textRes = await response.text();
          try {
            const errJson = JSON.parse(textRes);
            errMsg = errJson.error || errMsg;
          } catch {
            if (textRes && textRes.length < 500) {
              errMsg = textRes;
            } else if (textRes && textRes.includes("<title>")) {
              const matchedTitle = textRes.match(/<title>([\s\S]*?)<\/title>/i);
              if (matchedTitle?.[1]) {
                errMsg = `Sunucu Hatası (${response.status}): ${matchedTitle[1].trim()}`;
              } else {
                errMsg = `Sunucu Hatası (${response.status}): Lütfen uygulamayı yeni sekmede açarak deneyin.`;
              }
            } else {
              errMsg = `Sunucu Hatası (${response.status})`;
            }
          }
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      let result;
      try {
        const textRes = await response.text();
        result = JSON.parse(textRes);
      } catch {
        throw new Error("Yapay zekanın yanıtı veya sunucu cevabı geçerli bir JSON formatında alınamadı.");
      }

      if (result.success && Array.isArray(result.data)) {
        const hydrated = result.data.map((item: any, idx: number) => ({
          ...item,
          id: `item-${Date.now()}-${idx}-${Math.random()}`
        }));
        setExtractedItems(hydrated);
        showToast("Hepsini buldum! Porsiyon pürüzsüzce kurgulandı.", "success");
      } else {
        throw new Error("Yapay zeka yanıtından geçerli bir besin tablosu okunamadı.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setAnalysisError(err?.message || "Servisle iletişim kurulurken bir internet veya erişim hatası oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Lütfen sadece resim dosyaları yükleyin.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800; // Optimized dimension for high macro analysis speed
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75); // Highly optimized JPEG compression quality
          setImageMimeType("image/jpeg");
          setPreviewImage(compressedBase64);
        } else {
          setImageMimeType(file.type);
          setPreviewImage(reader.result as string);
        }
      };

      img.onerror = () => {
        setImageMimeType(file.type);
        setPreviewImage(reader.result as string);
      };

      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const updateExtractedItem = (id: string, field: string, value: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "protein" || field === "carbs" || field === "fat") {
            const p = field === "protein" ? Number(value) : Number(item.protein);
            const c = field === "carbs" ? Number(value) : Number(item.carbs);
            const f = field === "fat" ? Number(value) : Number(item.fat);
            updated.calories = Math.round(p * 4 + c * 4 + f * 9);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeExtractedItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const commitItemsToLog = () => {
    if (extractedItems.length === 0) return;

    const itemsToCommit = extractedItems.map((item) => ({
      ...item,
      id: `logged-${Date.now()}-${Math.random()}`,
      mealType: selectedMealType,
      loggedAt: new Date().toISOString()
    }));

    const newLogs = [...itemsToCommit, ...loggedItems];
    saveLoggedItems(newLogs);
    setExtractedItems([]);
    setInputText("");
    setPreviewImage(null);
    showToast("Öğünler başarıyla günlük geçmişinize eklendi!  🍳", "success");
  };

  // theme classes
  const thCard = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800";
  const thSub = isDarkMode ? "bg-slate-950/70 border border-slate-800" : "bg-slate-50 border border-slate-200/60";
  const thInput = isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500" : "bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500 focus:bg-white";
  const thHeading = isDarkMode ? "text-slate-100" : "text-slate-900";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analysis-tab-root">
      {/* Forms column (LHS) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-5 ${thCard}`}>
          <div>
            <h2 className="text-base font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
              YÖNETMELİK ANALİZ MERKEZİ
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Öğününüzü doğal cümlelerle tarif edin veya fotoğrafını ekleyin. Yapay zeka kalori, protein ve makroları anında parçalayacaktır.
            </p>
          </div>

          {/* Smart Suggestions Based on Frequency Algorithms */}
          <div className={`p-4 rounded-2xl flex flex-col gap-2 ${thSub}`}>
            <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Sık Tercih Ettiğiniz Akıllı Şablonlar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
              {smartSuggestions.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(p.food_name)}
                  className={`text-left p-2.5 rounded-xl text-xs font-semibold cursor-copy transition-all border flex flex-col gap-0.5 ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800 hover:border-emerald-500 text-slate-200"
                      : "bg-white border-slate-200 hover:border-emerald-400 text-slate-700 shadow-xs hover:bg-emerald-50/10"
                  }`}
                >
                  <span className="text-emerald-500 font-extrabold text-[9.5px] uppercase tracking-wider">Akıllı Öneri</span>
                  <span className="leading-tight line-clamp-1">{p.food_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAnalyzeSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                Ne tükettiniz? (Öğün Tarifi)
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Örn: 2 haşlanmış yumurta, bir avuç fındık, 1 dilim siyez ekmeği ve süzme beyaz peynir..."
                className={`w-full rounded-2xl px-4 py-3 placeholder:text-slate-500 text-xs font-semibold outline-none focus:ring-4 focus:ring-emerald-500/15 border transition-all ${thInput}`}
              />
            </div>

            {/* Photo upload toggleable */}
            <div className="flex flex-col gap-2">
              <div className={`flex justify-between items-center p-2 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 pl-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-500" />
                  Yemek Fotoğrafı Detayı
                </span>
                <button
                  type="button"
                  onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                  className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  {showPhotoUpload ? "Alanları Kapat" : "+ Fotoğraf Seç / Çek"}
                </button>
              </div>

              {showPhotoUpload && (
                <div className="overflow-hidden mt-1">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      dragOver
                        ? "border-emerald-500 bg-emerald-500/10"
                        : isDarkMode
                        ? "border-slate-800 bg-slate-950 hover:bg-slate-900/60"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {previewImage ? (
                      <div className="relative w-full max-w-[280px] h-36 rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <img
                          src={previewImage}
                          alt="Önizleme"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            setImageMimeType(null);
                          }}
                          className="absolute top-2 right-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full p-1 shadow-lg transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={`p-2.5 rounded-full ${isDarkMode ? "bg-slate-900 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 text-center">
                          Resmi sürükleyin veya <strong className="text-emerald-500 hover:underline">dosya seçin</strong>
                        </span>
                        <span className="text-[9px] text-slate-500">Kamera anlık veya görsel yükleme</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Warn if demo mode fallback active */}
            {!hasApiKey && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-500">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-semibold">
                  <strong>Demo Analiz Modeli Devrede:</strong> Settings menüsünden bir API anahtarı girilene kadar porsiyon kurguları demo veri porsiyonlayıcı üzerinden anında tıkır tıkır çalışacaktır.
                </div>
              </div>
            )}

            {/* Error Message */}
            {analysisError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl p-4 flex gap-3 shadow-sm">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-semibold">
                  <strong className="font-extrabold">Analiz Problemi:</strong> {analysisError}
                </div>
              </div>
            )}

            {/* Analyze submit button */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-widest transition-all text-slate-950 flex justify-center items-center gap-2 cursor-pointer ${
                isAnalyzing
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                  : "bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{loadingStep || "Analiz Sürüyor..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Yapay Zekaya Analiz Ettir</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Extracted Review Items Display (Commitment Box) */}
        {extractedItems.length > 0 && (
          <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-5 ${thCard}`}>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                Öğün Analiz Değerlendirmesi
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Yapay zekanın çıkardığı porsiyonlar aşağıdadır. Değerleri dilediğiniz gibi sıfırlayabilir veya değiştirebilirsiniz.
              </p>
            </div>

            {/* Selected Meal classification tab */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 tracking-widest whitespace-nowrap">HEDEF ÖĞÜN TÜRÜ:</span>
              <div className={`grid grid-cols-4 gap-1 w-full p-1.5 rounded-xl ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
                {(["breakfast", "lunch", "dinner", "snack"] as const).map((m) => {
                  const labelTr: Record<string, string> = { breakfast: "Sabah", lunch: "Öğle", dinner: "Akşam", snack: "Ara" };
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMealType(m)}
                      className={`text-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedMealType === m
                          ? isDarkMode
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      {labelTr[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extracted items array mapping */}
            <div className="space-y-3">
              {extractedItems.map((item) => (
                <div key={item.id} className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 ${thSub}`}>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Besin Adı</span>
                      <input
                        type="text"
                        value={item.food_name}
                        onChange={(e) => updateExtractedItem(item.id, "food_name", e.target.value)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold outline-none ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"}`}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Porsiyon</span>
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) => updateExtractedItem(item.id, "amount", e.target.value)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 outline-none ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end flex-wrap border-t border-slate-750/30 pt-2 sm:pt-0 sm:border-0">
                    <div className="w-13">
                      <span className="text-[9px] block text-center text-slate-400 font-bold">Kcal</span>
                      <input
                        type="number"
                        value={item.calories}
                        onChange={(e) => updateExtractedItem(item.id, "calories", Number(e.target.value))}
                        className={`w-full text-center py-1 rounded-lg text-xs font-mono font-bold ${isDarkMode ? "bg-slate-900 border border-slate-850" : "bg-white border border-slate-150"}`}
                      />
                    </div>
                    <div className="w-11">
                      <span className="text-[9px] block text-center text-emerald-500 font-extrabold">Prot</span>
                      <input
                        type="number"
                        value={item.protein}
                        onChange={(e) => updateExtractedItem(item.id, "protein", Number(e.target.value))}
                        className={`w-full text-center py-1 rounded-lg text-xs font-mono font-bold text-emerald-500 ${isDarkMode ? "bg-slate-900 border border-slate-850" : "bg-white border border-slate-150"}`}
                      />
                    </div>
                    <div className="w-11">
                      <span className="text-[9px] block text-center text-blue-500 font-extrabold">Karb</span>
                      <input
                        type="number"
                        value={item.carbs}
                        onChange={(e) => updateExtractedItem(item.id, "carbs", Number(e.target.value))}
                        className={`w-full text-center py-1 rounded-lg text-xs font-mono font-bold text-blue-500 ${isDarkMode ? "bg-slate-900 border border-slate-850" : "bg-white border border-slate-150"}`}
                      />
                    </div>
                    <div className="w-11">
                      <span className="text-[9px] block text-center text-orange-500 font-extrabold">Yağ</span>
                      <input
                        type="number"
                        value={item.fat}
                        onChange={(e) => updateExtractedItem(item.id, "fat", Number(e.target.value))}
                        className={`w-full text-center py-1 rounded-lg text-xs font-mono font-bold text-orange-500 ${isDarkMode ? "bg-slate-900 border border-slate-850" : "bg-white border border-slate-150"}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExtractedItem(item.id)}
                      className="p-1 px-2.5 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 transition-all rounded-lg scroll-m-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 justify-end mt-2 pt-4 border-t border-slate-755/20">
              <button
                type="button"
                onClick={() => setExtractedItems([])}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${isDarkMode ? "bg-slate-800 text-slate-350 hover:bg-slate-750" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={commitItemsToLog}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Günlüğüme Kaydet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unique logs past history quick add column (RHS) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className={`rounded-3xl p-6 shadow-xs flex flex-col gap-4 ${thCard}`}>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Geriye Dönük Pratik Ekle
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Her sabah veya gün içinde aynı şeyleri yiyenler için eşsiz tek tıkla kopyalama merkezi. Listeden bir öğüne dokunup anında bugüne kaydedin!
            </p>
          </div>

          {pastUniqueFoods.length === 0 ? (
            <div className={`py-12 flex flex-col items-center justify-center gap-3 border border-dashed rounded-2xl ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className={`p-2.5 rounded-full ${isDarkMode ? "bg-slate-900 text-indigo-400/40" : "bg-indigo-50 text-indigo-400/80"}`}>
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 text-center font-bold px-4 leading-relaxed">
                Henüz geçmiş kayıt bulunamadı. Yapay zeka ile yemek kaydettikçe burada listelenecektir!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {pastUniqueFoods.map((item) => {
                const mealTr: Record<string, string> = { breakfast: "Sabah", lunch: "Öğle", dinner: "Akşam", snack: "Ara" };
                const mType = item.mealType || "breakfast";
                return (
                  <div
                    key={item.id}
                    onClick={() => duplicateItemToToday(item)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left group cursor-pointer transition-all ${
                      isDarkMode
                        ? "bg-slate-950/40 border-slate-800 hover:bg-slate-900 hover:border-indigo-500/50"
                        : "bg-slate-50 border-slate-205 hover:bg-indigo-50/20 hover:border-indigo-400/50"
                    }`}
                    title="Bugüne Ekle"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                          mType === "breakfast"
                            ? "bg-amber-500/10 text-amber-400"
                            : mType === "lunch"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : mType === "dinner"
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {mealTr[mType] || "Öğün"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">{item.amount || "1 porsiyon"}</span>
                      </div>
                      <span className={`font-bold text-xs block truncate ${thHeading} group-hover:text-indigo-400 transition-colors`}>
                        {item.food_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right font-mono">
                        <span className={`font-black text-xs block ${thHeading}`}>{item.calories} <span className="text-[9px] font-sans font-normal text-slate-400">kcal</span></span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight block">P:{item.protein} • C:{item.carbs} • Y:{item.fat}</span>
                      </div>
                      <div className={`p-1.5 rounded-xl transition-all ${isDarkMode ? "bg-slate-900 text-slate-400 group-hover:bg-indigo-500 group-hover:text-slate-950" : "bg-white text-slate-500 border border-slate-200 group-hover:bg-indigo-500 group-hover:text-white"}`}>
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
