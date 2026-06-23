import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Chrome, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  isDarkMode,
  showToast
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const thCard = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const thInput = isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500" : "bg-slate-50 border-slate-300 text-slate-850 placeholder-slate-400";

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("Google ile başarıyla giriş yapıldı!  ", "success");
      onClose();
    } catch (err: any) {
      console.error(err);
      let friendlyError = "Google ile giriş yapılırken bir hata oluştu.";
      if (err.code === "auth/popup-closed-by-user") {
        friendlyError = "Giriş penceresi kapatıldı veya tarayıcı/iframe tarafından engellendi. Uygulamayı sağ üstteki butonla yeni sekmede açarak veya E-posta/Şifre oluşturarak giriş yapabilirsiniz.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyError = "Google Girişi projenizde henüz aktif değil! Lütfen Firebase Console -> Authentication -> Sign-in method sekmesinden 'Google' özelliğini aktif hale getirin.";
      } else if (err.message && err.message.includes("closed-by-user")) {
        friendlyError = "Giriş penceresi kapatıldı veya iframe tarafından engellendi. Lütfen yeni sekmede deneyin veya aşağıdaki formla kaydolun.";
      }
      setErrorMsg(friendlyError);
      showToast("Giriş başarısız oldu.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Lütfen tüm alanları doldurun.");
      return;
    }
    if (isSignUp && !displayName) {
      setErrorMsg("Lütfen isminizi girin.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        showToast("Hesabınız oluşturuldu ve giriş yapıldı! 🍏", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Başarıyla giriş yapıldı!", "success");
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let turkishError = "Giriş işlemi başarısız oldu. Bilgilerinizi kontrol edin.";
      if (err.code === "auth/email-already-in-use") {
        turkishError = "Bu e-posta adresi zaten kullanımda.";
      } else if (err.code === "auth/weak-password") {
        turkishError = "Şifre en az 6 karakterden oluşmalıdır.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        turkishError = "E-posta adresi veya şifre geçersiz.";
      } else if (err.code === "auth/operation-not-allowed") {
        turkishError = "E-posta/Şifre ile Giriş projenizde henüz aktif değil! Lütfen Firebase Console -> Authentication -> Sign-in method altından 'Email/Password' özelliğini etkinleştirin.";
      } else if (err.message) {
        turkishError = err.message;
      }
      setErrorMsg(turkishError);
      showToast("İşlem başarısız oldu.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" id="auth-modal">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`max-w-md w-full rounded-3xl p-6 md:p-8 border flex flex-col gap-5 relative shadow-2xl ${thCard}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full w-fit mx-auto mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-black tracking-tight uppercase leading-none">
            {isSignUp ? "Yeni Hesap Oluştur" : "Aramıza Katılın"}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 font-medium leading-normal">
            {isSignUp 
              ? "Kişiselleştirilmiş kalori planınızı bulutta güvenle saklayın." 
              : "FittyCal hesabınıza giriş yaparak raporlarınızı bulutta senkronize tutun."}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-3.5 flex flex-col gap-1.5 text-xs font-semibold leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {(errorMsg.includes("aktif") || errorMsg.includes("etkinleştir") || errorMsg.includes("operation-not-allowed")) && (
              <div className="mt-1 p-3 bg-slate-950/20 rounded-xl text-[11px] font-mono text-slate-400 border border-slate-500/10 space-y-2">
                <p className="font-bold text-slate-300">💡 Firebase Kimlik Doğrulama Etkinleştirme Adımları:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400 font-sans">
                  <li>
                    Aşağıdaki bağlantıya tıklayarak Firebase Konsolu'na gidin:
                    <a 
                      href="https://console.firebase.google.com/project/gen-lang-client-0234984028/authentication/providers" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-0.5 text-emerald-400 font-bold hover:underline mx-1"
                    >
                      Firebase Console ↗
                    </a>
                  </li>
                  <li><strong>"Get started" (Başlayın)</strong> butonuna tıklayın.</li>
                  <li><strong>Email/Password</strong> ve <strong>Google</strong> sağlayıcılarını etkinleştirin ve kaydedin.</li>
                  <li>Sayfayı yenileyip girişi tekrar deneyin!</li>
                </ol>
              </div>
            )}
            {(errorMsg.includes("kapatıldı") || errorMsg.includes("iframe") || errorMsg.includes("Script error")) && (
              <div className="mt-1 p-3 bg-slate-950/20 rounded-xl text-[11px] font-mono text-slate-400 border border-slate-500/10 space-y-2">
                <p className="font-bold text-slate-300">🛰️ Tarayıcı Güvenlik Engeli Uyarısı:</p>
                <p className="font-sans text-slate-450 leading-relaxed">
                  Google Giriş penceresi (Popup) tarayıcınızın pop-up engelleyicisi veya AI Studio'nun sanal pencere güvenlik duvarı (sandbox iframe) tarafından engellenmiş olabilir. 
                  Bu sorunu aşmak için:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 font-sans">
                  <li>Sağ üst köşedeki <strong>"Open in New Tab" (Yeni Sekmede Aç)</strong> butonuna basarak uygulamayı geniş ekranda açın ve tekrar deneyin.</li>
                  <li>Veya hızlıca <strong>E-posta ve Şifre</strong> ile yeni bir hesap oluşturup giriş yapın!</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
                <User className="w-3 h-3" /> Adınız Soyadınız
              </span>
              <input
                type="text"
                placeholder="Örn. Bora Çelik"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all ${thInput}`}
                required={isSignUp}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
              <Mail className="w-3 h-3" /> E-posta Adresi
            </span>
            <input
              type="email"
              placeholder="isim@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all ${thInput}`}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" /> Şifre
            </span>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition-all ${thInput}`}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isLoading ? "İşlem yapılıyor..." : (isSignUp ? "Hesap Oluştur" : "Giriş Yap")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center my-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-500">
          <div className={`border-t absolute w-full z-0 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}></div>
          <span className={`px-3 z-10 transition-colors ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>VEYA</span>
        </div>

        {/* Google auth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={`w-full py-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            isDarkMode 
              ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900" 
              : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm"
          }`}
        >
          <Chrome className="w-4 h-4 text-emerald-400" />
          Google ile Devam Et
        </button>

        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer uppercase tracking-wider"
          >
            {isSignUp ? "Zaten bir hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Hemen ücretsiz kayıt olun"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
