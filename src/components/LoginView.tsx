import React, { useState, useEffect } from "react";
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mail,
  HelpCircle,
  KeyRound,
  RefreshCw,
  Check,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { User } from "../types";

export const LoginView: React.FC = () => {
  const {
    login,
    users,
    activeBusiness,
    findUserForPasswordReset,
    resetPasswordViaEmail,
    resetPasswordViaSecurityQuestion,
  } = useFinance();

  // Mode: "login" or "forgot-password"
  const [viewMode, setViewMode] = useState<"login" | "forgot-password">("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password flow state
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [resetMethod, setResetMethod] = useState<"email" | "security_question">("email");
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("482915");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(180);

  // Regenerate simulated OTP when user requests resend or identifies account
  const generateNewOtp = () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(randomOtp);
    setCountdown(180);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewMode === "forgot-password" && matchedUser && resetMethod === "email" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewMode, matchedUser, resetMethod, countdown]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim()) {
      setErrorMessage("Fadlan geli magacaaga isticmaalaha ama email-kaaga.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Fadlan geli furahaaga sirta ah (password).");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password, rememberMe);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message || "Magaca ama furaha sirta ah waa khalad.");
      }
    }, 400);
  };

  const handleQuickFill = (uName: string, pWord: string) => {
    setUsername(uName);
    setPassword(pWord);
    setErrorMessage("");
  };

  // Open Forgot Password flow
  const handleOpenForgotPassword = () => {
    setViewMode("forgot-password");
    setResetError("");
    setResetSuccess(false);
    // If user already typed something in login, prefill it
    if (username.trim()) {
      setResetIdentifier(username.trim());
      const search = findUserForPasswordReset(username.trim());
      if (search.found && search.user) {
        setMatchedUser(search.user);
        generateNewOtp();
      }
    } else {
      setResetIdentifier("");
      setMatchedUser(null);
    }
    setOtpCode("");
    setSecurityAnswer("");
    setNewResetPassword("");
    setConfirmResetPassword("");
  };

  // Find User by username or email
  const handleSearchAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError("");

    if (!resetIdentifier.trim()) {
      setResetError("Fadlan geli username-ka ama email-ka aad ku diiwaangashan tahay.");
      setMatchedUser(null);
      return;
    }

    const res = findUserForPasswordReset(resetIdentifier.trim());
    if (res.found && res.user) {
      setMatchedUser(res.user);
      generateNewOtp();
      setResetError("");
    } else {
      setMatchedUser(null);
      setResetError(res.message || "Lama helin akoon wata xogtaas.");
    }
  };

  // Execute Password Reset
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!matchedUser) {
      setResetError("Fadlan marka hore xaqiiji akoonkaaga.");
      return;
    }

    if (!newResetPassword || newResetPassword.length < 3) {
      setResetError("Furaha cusub waa inuu ka koobnaadaa ugu yaraan 3 xaraf ama lambar.");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setResetError("Furaha cusub iyo xaqiijintiisu isma laha!");
      return;
    }

    setIsResetting(true);

    setTimeout(() => {
      if (resetMethod === "email") {
        if (!otpCode.trim()) {
          setResetError("Fadlan geli koodhka 6-da god ah ee xaqiijinta (OTP).");
          setIsResetting(false);
          return;
        }

        if (otpCode.trim() !== simulatedOtp) {
          setResetError("Koodhka xaqiijinta (OTP) ma saxna. Fadlan hubi koodhka laguu soo diray.");
          setIsResetting(false);
          return;
        }

        const res = resetPasswordViaEmail(matchedUser.username, newResetPassword);
        setIsResetting(false);
        if (res.success) {
          setResetSuccess(true);
        } else {
          setResetError(res.message);
        }
      } else {
        // Security Question method
        if (!securityAnswer.trim()) {
          setResetError("Fadlan qor jawaabta su'aasha amniga.");
          setIsResetting(false);
          return;
        }

        const res = resetPasswordViaSecurityQuestion(
          matchedUser.username,
          securityAnswer,
          newResetPassword
        );
        setIsResetting(false);
        if (res.success) {
          setResetSuccess(true);
        } else {
          setResetError(res.message);
        }
      }
    }, 450);
  };

  // Helper to mask email e.g. qaadinotary@gmail.com -> q***y@gmail.com
  const maskEmail = (emailStr?: string) => {
    if (!emailStr || !emailStr.includes("@")) return "email@example.com";
    const [local, domain] = emailStr.split("@");
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-x-hidden bg-[#24130B] p-4 sm:p-6 font-sans text-slate-100 selection:bg-[#543324] selection:text-white">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#543324]/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#C59B27]/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Top Branding Card */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-1.5 shadow-2xl ring-4 ring-[#C59B27]/40">
            <img
              src="/qaaddi-logo.png"
              alt="Qaaddi Notary Public"
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8F5EE]">
            Qaaddi Notary Public
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-[#D4AF37]">
            Khibrad 23+ Years • Legal & Notary Services
          </p>
        </div>

        {/* =========================================================
            VIEW MODE: LOGIN VIEW
           ========================================================= */}
        {viewMode === "login" && (
          <div className="rounded-3xl border border-[#C59B27]/30 bg-[#2D180F]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in">
            <div className="mb-6 flex items-center justify-between border-b border-[#4A2C20] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#C59B27]" />
                  Gal Nidaamka (Sign In)
                </h2>
                <p className="text-xs text-amber-100/70 mt-0.5">
                  Geli username iyo password si aad u gasho
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-[#C59B27]/40 bg-[#C59B27]/10 px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Aamin ah
              </span>
            </div>

            {/* Error message alert */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label
                  htmlFor="input-username"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Magaca Isticmaalaha ama Email-ka (Username / Email) *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="input-username"
                    type="text"
                    autoFocus
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin ama qaadinotary@gmail.com"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-password"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Furaha Sirta ah (Password) *
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    id="btn-forgot-password"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>Ma illowday furaha?</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Geli furahaaga sirta ah..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 pl-9 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    aria-label={showPassword ? "Qari furaha" : "Muuji furaha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Note */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs text-slate-300 font-medium">I xasuuso qalabkan</span>
                </label>
                <span className="text-[11px] text-slate-400">Offline & Cloud</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                id="btn-login-submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#543324] py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#543324]/40 transition hover:bg-[#3D2216] active:scale-98 disabled:opacity-70 cursor-pointer ring-1 ring-[#C59B27]/40"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Fadlan sug, waa la xaqiijinayaa...</span>
                  </>
                ) : (
                  <>
                    <span>Gal Nidaamka</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Akoonnada Diyaarka ah (Guji si aad u gasho):</span>
              </div>
              <div className="space-y-1.5">
                {users.slice(0, 5).map((u) => {
                  const uName = u.username || "admin";
                  const pWord = u.password || (u.id === "usr-1" ? "admin" : "123");
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickFill(uName, pWord)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 px-2.5 py-1.5 text-left text-xs transition hover:border-indigo-500/60 hover:bg-slate-800 cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-indigo-300">
                          {u.name} ({u.role})
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono">
                          User: <strong className="text-slate-200">{uName}</strong> | Pass:{" "}
                          <strong className="text-slate-200">{pWord}</strong>
                        </p>
                      </div>
                      <span className="text-[10px] rounded-md bg-indigo-500/20 px-2 py-0.5 font-bold text-indigo-300">
                        Geli
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-500">
                Haddii aad furaha illowdo, guji badhanka &quot;Ma illowday furaha?&quot; ee sare.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW MODE: FORGOT PASSWORD FLOW
           ========================================================= */}
        {viewMode === "forgot-password" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in">
            {/* Top Navigation */}
            <div className="mb-5 flex items-center justify-between border-b border-slate-800/80 pb-4">
              <button
                type="button"
                onClick={() => setViewMode("login")}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Ku noqo Gelitaanka</span>
              </button>
              <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400">
                <KeyRound className="h-3.5 w-3.5" />
                Dib-u-dejinta Furaha
              </span>
            </div>

            {/* If reset was successful */}
            {resetSuccess ? (
              <div className="py-4 text-center space-y-4 animate-in zoom-in-95">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/10">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Furaha Sirta ah waa la Beddelay!</h3>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    Furahaaga sirta ah ee akoonka{" "}
                    <strong className="text-indigo-400">@{matchedUser?.username}</strong> si guul leh
                    ayaa loo cusboonaysiiyay. Hadda waxaad ku geli kartaa furahaaga cusub.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-left text-xs text-emerald-300 font-mono space-y-1">
                  <div>
                    Username: <strong className="text-white">{matchedUser?.username}</strong>
                  </div>
                  <div>
                    Furaha Cusub: <strong className="text-white">{newResetPassword}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (matchedUser) {
                      setUsername(matchedUser.username);
                      setPassword(newResetPassword);
                    }
                    setViewMode("login");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98 cursor-pointer"
                >
                  <span>Gal Nidaamka Hadda (Login Now)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Dib u Deji Furaha Sirta ah
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Dooro inaad furahaaga dib ugu hesho Email ama Su&apos;aashaada Amniga.
                  </p>
                </div>

                {/* Reset Error Alert */}
                {resetError && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="flex-1 font-medium leading-relaxed">{resetError}</div>
                  </div>
                )}

                {/* Step 1: Find/Identify Account */}
                {!matchedUser ? (
                  <form onSubmit={handleSearchAccount} className="space-y-4">
                    <div>
                      <label
                        htmlFor="input-reset-identifier"
                        className="block text-xs font-semibold text-slate-300 mb-1.5"
                      >
                        Geli Username-ka ama Email-ka Akoonkaaga *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <input
                          id="input-reset-identifier"
                          type="text"
                          autoFocus
                          required
                          value={resetIdentifier}
                          onChange={(e) => setResetIdentifier(e.target.value)}
                          placeholder="e.g. admin ama qaadinotary@gmail.com"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-98 cursor-pointer"
                    >
                      <span>Raadi oo Xaqiiji Akoonka</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    {/* Quick helper selector */}
                    <div className="pt-2">
                      <p className="text-[11px] text-slate-400 mb-2 font-medium">
                        Ama dooro akoon tijaabo ah si aad u tijaabiso:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {users.slice(0, 4).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setResetIdentifier(u.username);
                              setMatchedUser(u);
                              generateNewOtp();
                              setResetError("");
                            }}
                            className="rounded-xl border border-slate-800 bg-slate-850 p-2 text-left text-[11px] transition hover:border-indigo-500/50 hover:bg-slate-800 cursor-pointer"
                          >
                            <span className="font-bold text-indigo-300 block truncate">
                              @{u.username}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {u.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Choose Method and Reset */
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    {/* Active User Found Card */}
                    <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
                          {matchedUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {matchedUser.name}
                          </p>
                          <p className="text-[11px] text-indigo-300 font-mono truncate">
                            @{matchedUser.username} • {maskEmail(matchedUser.email)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMatchedUser(null);
                          setResetError("");
                        }}
                        className="text-[11px] text-slate-400 hover:text-white underline shrink-0 cursor-pointer ml-2"
                      >
                        Beddel
                      </button>
                    </div>

                    {/* Method Selector Tabs */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        Dooro Habka Dib-u-dejinta (Reset Method):
                      </label>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/60 p-1 border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setResetMethod("email");
                            setResetError("");
                          }}
                          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition cursor-pointer ${
                            resetMethod === "email"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email (OTP)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetMethod("security_question");
                            setResetError("");
                          }}
                          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition cursor-pointer ${
                            resetMethod === "security_question"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Su&apos;aasha Amniga</span>
                        </button>
                      </div>
                    </div>

                    {/* METHOD A: EMAIL OTP */}
                    {resetMethod === "email" && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-200 block">
                              Koodhka Xaqiijinta (OTP)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Waxaa loo diray {maskEmail(matchedUser.email)}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-indigo-400">
                            {formatTimer(countdown)}
                          </span>
                        </div>

                        {/* Simulated Test Code Chip */}
                        <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-indigo-300">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Koodhka Tijaabada:</span>
                            <strong className="font-mono text-white tracking-wider">
                              {simulatedOtp}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOtpCode(simulatedOtp)}
                            className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer bg-indigo-500/20 px-2 py-0.5 rounded-md"
                          >
                            Buuxi
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Geli 6-da god (e.g. 482915)"
                            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-center text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button
                            type="button"
                            onClick={generateNewOtp}
                            title="Dib u dir koodh cusub"
                            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Dib u dir</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* METHOD B: SECURITY QUESTION */}
                    {resetMethod === "security_question" && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                            Su&apos;aasha Amniga ee Diiwaangashan:
                          </span>
                          <p className="text-xs font-bold text-white bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 leading-relaxed">
                            &ldquo;{matchedUser.securityQuestion || "Waa kuwee magaalada aad ku dhalatay?"}&rdquo;
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-300">
                              Jawaabtaada *
                            </label>
                            {/* Demo Hint */}
                            <button
                              type="button"
                              onClick={() =>
                                setSecurityAnswer(matchedUser.securityAnswer || "Hargeysa")
                              }
                              className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Tusaale: {matchedUser.securityAnswer || "Hargeysa"}</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            placeholder="Geli jawaabta saxda ah..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    )}

                    {/* New Password Inputs */}
                    <div className="space-y-3 pt-1 border-t border-slate-800">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-300">
                            Furaha Sirta ah ee Cusub (New Password) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowResetPassword(!showResetPassword)}
                            className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                          >
                            {showResetPassword ? "Qari" : "Muuji"}
                          </button>
                        </div>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                          <input
                            type={showResetPassword ? "text" : "password"}
                            required
                            value={newResetPassword}
                            onChange={(e) => setNewResetPassword(e.target.value)}
                            placeholder="Geli ugu yaraan 3 xaraf ama lambar..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Xaqiiji Furaha Cusub (Confirm Password) *
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                          <input
                            type={showResetPassword ? "text" : "password"}
                            required
                            value={confirmResetPassword}
                            onChange={(e) => setConfirmResetPassword(e.target.value)}
                            placeholder="Mar labaad qor furaha cusub..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Reset Button */}
                    <button
                      type="submit"
                      disabled={isResetting}
                      id="btn-confirm-password-reset"
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-98 disabled:opacity-70 cursor-pointer"
                    >
                      {isResetting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Fadlan sug, waa la beddelayaa...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Cusboonaysii Furaha Sirta ah</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Dakhliga & Kharashka — Xogtaada waa mid ammaan ah.</p>
        </div>
      </div>
    </div>
  );
};
