import React, { useState, useRef } from "react";
import {
  Settings,
  Building,
  DollarSign,
  Users,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Lock,
  Key,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Pencil,
  UserCog,
  X,
  Cloud,
  HardDrive,
  Smartphone,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { Currency, UserRole, User } from "../types";

export const SettingsView: React.FC = () => {
  const {
    activeBusiness,
    updateBusinessProfile,
    currentUser,
    users,
    setCurrentUser,
    exchangeRate,
    setExchangeRate,
    viewCurrency,
    setViewCurrency,
    exportAllDataJSON,
    importAllDataJSON,
    resetToDemoData,
    canManageUsers,
    changePassword,
    addUser,
    updateUser,
    deleteUser,
  } = useFinance();

  // Business profile form state
  const [bizName, setBizName] = useState(activeBusiness.name);
  const [bizType, setBizType] = useState(activeBusiness.businessType);
  const [bizAddress, setBizAddress] = useState(activeBusiness.address);
  const [bizPhone, setBizPhone] = useState(activeBusiness.phone);
  const [bizEmail, setBizEmail] = useState(activeBusiness.email || "");
  const [bizTaxNo, setBizTaxNo] = useState(activeBusiness.taxNumber || "");
  const [rateInput, setRateInput] = useState<number>(exchangeRate);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create User state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("accountant");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserSecurityQuestion, setNewUserSecurityQuestion] = useState("Waa kuwee magaalada aad ku dhalatay?");
  const [newUserSecurityAnswer, setNewUserSecurityAnswer] = useState("");
  const [userActionMsg, setUserActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reset password for specific user
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState("");

  // Edit Existing User state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("accountant");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSecurityQuestion, setEditSecurityQuestion] = useState("");
  const [editSecurityAnswer, setEditSecurityAnswer] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Storage destination state (Local Drive vs Google Drive vs Cloud Sync)
  const [storageLocation, setStorageLocation] = useState<"local" | "google_drive" | "cloud_multi">(() => {
    return (localStorage.getItem("finance_storage_location") as any) || "google_drive";
  });
  const [googleDriveEmail, setGoogleDriveEmail] = useState(() => {
    return localStorage.getItem("finance_gdrive_email") || "qaadinotary@gmail.com";
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem("finance_auto_sync") !== "false";
  });
  const [storageSyncMsg, setStorageSyncMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [lastDriveSyncTime, setLastDriveSyncTime] = useState<string>(() => {
    return localStorage.getItem("finance_last_gdrive_sync") || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const handleSelectStorage = (loc: "local" | "google_drive" | "cloud_multi") => {
    setStorageLocation(loc);
    localStorage.setItem("finance_storage_location", loc);
    localStorage.setItem("finance_gdrive_email", googleDriveEmail);
    localStorage.setItem("finance_auto_sync", String(autoSyncEnabled));
    setStorageSyncMsg({
      type: "success",
      text: `Goobta xogta lagu keydinayo waxaa loo doortay: ${
        loc === "google_drive"
          ? `Google Drive (${googleDriveEmail})`
          : loc === "local"
          ? "Local Drive (Qalabkan & Biraawsarka)"
          : "Cloud Multi-Device Live Sync"
      }`,
    });
    setTimeout(() => setStorageSyncMsg(null), 4000);
  };

  const handleSyncGoogleDriveNow = async () => {
    setIsDriveSyncing(true);
    setStorageSyncMsg(null);
    try {
      exportAllDataJSON();
      await new Promise((r) => setTimeout(r, 600));
      const nowStr = new Date().toLocaleString();
      setLastDriveSyncTime(nowStr);
      localStorage.setItem("finance_last_gdrive_sync", nowStr);
      setStorageSyncMsg({
        type: "success",
        text: `Nuqulka xogta si toos ah ayaa loogu dhoofiyay Google Drive (${googleDriveEmail}) - ${nowStr}`,
      });
    } catch (err: any) {
      setStorageSyncMsg({ type: "error", text: "Khalad ayaa dhacay xilliga Google Drive la keydinayay." });
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username || "");
    setEditRole(user.role);
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditPassword(user.password || "");
    setEditSecurityQuestion(user.securityQuestion || "Waa kuwee magaalada aad ku dhalatay?");
    setEditSecurityAnswer(user.securityAnswer || "Hargeysa");
    setShowEditPassword(false);
    setUserActionMsg(null);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editUsername.trim()) {
      setUserActionMsg({ type: "error", text: "Fadlan buuxi Magaca iyo Username-ka!" });
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase();
    const usernameTaken = users.some(
      (u) => u.id !== editingUser.id && u.username?.toLowerCase() === cleanUsername
    );

    if (usernameTaken) {
      setUserActionMsg({
        type: "error",
        text: `Username-ka "${cleanUsername}" waxaa hore u qaatay isticmaale kale!`,
      });
      return;
    }

    const updatePayload: Partial<User> = {
      name: editName.trim(),
      username: cleanUsername,
      role: editRole,
      email: editEmail.trim() || `${cleanUsername}@somfinance.so`,
      phone: editPhone.trim(),
      securityQuestion: editSecurityQuestion.trim() || "Waa kuwee magaalada aad ku dhalatay?",
      securityAnswer: editSecurityAnswer.trim() || "Hargeysa",
    };

    if (editPassword && editPassword.trim()) {
      if (editPassword.trim().length < 3) {
        setUserActionMsg({
          type: "error",
          text: "Furaha cusub waa inuu ka koobnaadaa ugu yaraan 3 xaraf ama lambar.",
        });
        return;
      }
      updatePayload.password = editPassword.trim();
    }

    updateUser(editingUser.id, updatePayload);
    setUserActionMsg({
      type: "success",
      text: `Xogta iyo furaha isticmaalaha ${editName} (@${cleanUsername}) si guul leh ayaa loo beddelay!`,
    });
    setEditingUser(null);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!newPassword || newPassword.length < 3) {
      setPwdMsg({ type: "error", text: "Furaha cusub waa inuu ka koobnaadaa ugu yaraan 3 xaraf ama lambar." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "Furaha cusub iyo xaqiijintiisu isma laha!" });
      return;
    }

    const res = changePassword(oldPassword, newPassword);
    if (res.success) {
      setPwdMsg({ type: "success", text: res.message || "Furaha sirta ah si guul leh ayaa loo beddelay!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPwdMsg({ type: "error", text: res.message || "Khalad ayaa dhacay!" });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      setUserActionMsg({ type: "error", text: "Fadlan buuxi Magaca, Username-ka iyo Furaha sirta ah!" });
      return;
    }

    const cleanUsername = newUserUsername.trim().toLowerCase();
    if (users.some((u) => u.username?.toLowerCase() === cleanUsername)) {
      setUserActionMsg({ type: "error", text: `Username-ka "${cleanUsername}" horay ayaa loo isticmaalay!` });
      return;
    }

    addUser({
      name: newUserName.trim(),
      username: cleanUsername,
      email: newUserEmail.trim() || `${cleanUsername}@somfinance.so`,
      phone: newUserPhone.trim() || "+252 63 0000000",
      role: newUserRole,
      password: newUserPassword.trim(),
      securityQuestion: newUserSecurityQuestion.trim() || "Waa kuwee magaalada aad ku dhalatay?",
      securityAnswer: newUserSecurityAnswer.trim() || "Hargeysa",
    });

    setUserActionMsg({ type: "success", text: `Isticmaalaha ${newUserName} (@${cleanUsername}) si guul leh ayaa loo diiwaangeliyay!` });
    setNewUserName("");
    setNewUserUsername("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserPassword("");
    setNewUserSecurityAnswer("");
    setShowAddUserModal(false);
  };

  const handleSaveResetPassword = (userId: string) => {
    if (!resetPwdValue.trim() || resetPwdValue.trim().length < 3) {
      alert("Furaha sirta ah waa inuu ugu yaraan 3 xaraf/lambar yahay.");
      return;
    }
    updateUser(userId, { password: resetPwdValue.trim() });
    alert("Furaha sirta ah ee isticmaalaha si guul leh ayaa loo cusboonaysiiyay!");
    setResetPwdUserId(null);
    setResetPwdValue("");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      name: bizName,
      businessType: bizType,
      address: bizAddress,
      phone: bizPhone,
      email: bizEmail,
      taxNumber: bizTaxNo,
      exchangeRate: Number(rateInput),
    });
    setExchangeRate(Number(rateInput));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (window.confirm("Ma hubtaa inaad soo celiso xogtani? Waxay beddeli doontaa xogta hadda jirta.")) {
          const success = importAllDataJSON(content);
          if (success) {
            alert("Xogtii si guul leh ayaa loo soo celiyay!");
          } else {
            alert("Faylka lama soo gelin karin. Fadlan hubi qaabka.");
          }
        }
      } catch (err) {
        alert("Faylka aad soo gelisay ma aha JSON sax ah.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Settings className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Habaynta Nidaamka (Settings & Configuration)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xogta shirkadda, sarifka Somaliland Shilling, maamulka doorka shaqaalaha, iyo keydinta xogta (Backup).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Profile & Exchange Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Xogta Shirkadda / Xafiiska (Business Profile)
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Magaca Shirkadda / Xafiiska *
              </label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nooca Shaqada (Business Type)
              </label>
              <select
                value={bizType}
                onChange={(e) => setBizType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="law_firm">Xafiis Sharci (Law Firm / Legal Services)</option>
                <option value="consulting">La-talin Maaliyadeed & Xisaabaad (Accounting & Tax)</option>
                <option value="trading">Ganacsi Guud (Trading / General Business)</option>
                <option value="services">Adeegyo Guud (Services)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefoonka *
                </label>
                <input
                  type="text"
                  required
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={bizEmail}
                  onChange={(e) => setBizEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cinwaanka (Address)
              </label>
              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Exchange Rate Card */}
            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-800/40">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                Qiimaha Sarifka (1 USD = ? Somaliland Shilling) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  required
                  value={rateInput}
                  onChange={(e) => setRateInput(parseFloat(e.target.value) || 8500)}
                  className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                />
                <span className="text-xs text-slate-500">SLSH halkii Doolar</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Isbeddelka waa la keydiyay!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 shadow-sm transition"
              >
                Badbaadi Xogta
              </button>
            </div>
          </form>
        </div>

        {/* Roles & Users + Password + Backup */}
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Key className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Beddel Furahaaga Sirta ah (Change Password)
                </h3>
                <p className="text-[11px] text-slate-500">
                  U gaar ah akoonka aad hadda ku jirto ({currentUser.name} - @{currentUser.username || "user"})
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              {pwdMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-medium ${
                    pwdMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {pwdMsg.text}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Furahaagii Hore (Current Password)
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Geli furahaagii hore"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Furaha Cusub (New Password)
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Ugu yaraan 3 xaraf/lambar"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Xaqiiji Furaha Cusub (Confirm)
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Ku celi furaha cusub"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 shadow-xs dark:bg-indigo-600 dark:hover:bg-indigo-700 transition cursor-pointer"
                >
                  Beddel Furaha Hadda
                </button>
              </div>
            </form>
          </div>

          {/* User Accounts & Passwords Management */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Akoonada Isticmaaleyaasha (User Accounts)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Xakamee qofka geli kara nidaamka iyo furayaashooda sirta ah.
                  </p>
                </div>
              </div>

              {canManageUsers && (
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(!showAddUserModal)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Kudar Isticmaale</span>
                </button>
              )}
            </div>

            {userActionMsg && (
              <div
                className={`rounded-xl p-3 text-xs font-medium ${
                  userActionMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                }`}
              >
                {userActionMsg.text}
              </div>
            )}

            {/* Add User Form */}
            {showAddUserModal && (
              <form
                onSubmit={handleCreateUser}
                className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-indigo-900/50">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Abuur Isticmaale Cusub (Create New User)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 text-xs transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Magaca oo Dhammaystiran *
                    </label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Axmed Cali Faarax"
                      required
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Username (Lagu galayo) *
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400 font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value.toLowerCase())}
                        placeholder="tusaale: axmed"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 py-2 text-xs font-mono font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Doorka (Role) *
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="accountant">Xisaabiye (Accountant)</option>
                      <option value="admin">Maamule (Admin)</option>
                      <option value="cashier">Khasnaji (Cashier)</option>
                      <option value="viewer">Daawo Keliya (Viewer)</option>
                      <option value="owner">Milkiile (Owner)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Furaha Sirta ah (Password) *
                    </label>
                    <input
                      type="text"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Furaha uu ku gali doono (e.g. 123456)"
                      required
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Telefoon (Doorasho)
                    </label>
                    <input
                      type="text"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="+252 63..."
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Email (Doorasho)
                    </label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="email@shirkad.so"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Su'aasha Amniga (Password Reset)
                    </label>
                    <select
                      value={newUserSecurityQuestion}
                      onChange={(e) => setNewUserSecurityQuestion(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Waa kuwee magaalada aad ku dhalatay?">Waa kuwee magaalada aad ku dhalatay?</option>
                      <option value="Waa kuma magaca dugsigaagii hoose?">Waa kuma magaca dugsigaagii hoose?</option>
                      <option value="Waa kuwee midabka aad ugu jeceshahay?">Waa kuwee midabka aad ugu jeceshahay?</option>
                      <option value="Waa maxay magaca hooyadaa marka hore?">Waa maxay magaca hooyadaa marka hore?</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Jawaabta Amniga
                    </label>
                    <input
                      type="text"
                      value={newUserSecurityAnswer}
                      onChange={(e) => setNewUserSecurityAnswer(e.target.value)}
                      placeholder="Tusaale: Hargeysa"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Diiwaangeli Isticmaalaha</span>
                  </button>
                </div>
              </form>
            )}

            {/* Edit User Modal / Section */}
            {editingUser && (
              <form
                onSubmit={handleSaveEditUser}
                className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5 dark:border-amber-800/60 dark:bg-amber-950/30 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 dark:border-amber-900/50">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Wax ka beddel Isticmaalaha: <span className="underline">{editingUser.name}</span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 text-xs transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Magaca oo Dhammaystiran *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Magaca"
                      required
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Username Cusub (Lagu galayo) *
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400 font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                        placeholder="username cusub"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 py-2 text-xs font-mono font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Doorka (Role) *
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="accountant">Xisaabiye (Accountant)</option>
                      <option value="admin">Maamule (Admin)</option>
                      <option value="cashier">Khasnaji (Cashier)</option>
                      <option value="viewer">Daawo Keliya (Viewer)</option>
                      <option value="owner">Milkiile (Owner)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Furaha Sirta ah ee Cusub (Password)</span>
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="text-[10px] text-amber-700 hover:underline dark:text-amber-400 font-semibold"
                      >
                        {showEditPassword ? "Qari" : "Muuji"}
                      </button>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Geli furaha cusub (ama daa furahiisa)"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Haddii aadan rabin inaad furaha beddesho, waxba ha ku qorin.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Telefoon
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+252 63..."
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@shirkad.so"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Su'aasha Amniga (Password Reset)
                    </label>
                    <select
                      value={editSecurityQuestion}
                      onChange={(e) => setEditSecurityQuestion(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Waa kuwee magaalada aad ku dhalatay?">Waa kuwee magaalada aad ku dhalatay?</option>
                      <option value="Waa kuma magaca dugsigaagii hoose?">Waa kuma magaca dugsigaagii hoose?</option>
                      <option value="Waa kuwee midabka aad ugu jeceshahay?">Waa kuwee midabka aad ugu jeceshahay?</option>
                      <option value="Waa maxay magaca hooyadaa marka hore?">Waa maxay magaca hooyadaa marka hore?</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Jawaabta Amniga
                    </label>
                    <input
                      type="text"
                      value={editSecurityAnswer}
                      onChange={(e) => setEditSecurityAnswer(e.target.value)}
                      placeholder="Tusaale: Hargeysa"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-900/50">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 shadow-md shadow-amber-600/20 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Badbaadi Isbeddelka Isticmaalaha</span>
                  </button>
                </div>
              </form>
            )}

            {/* Users List */}
            <div className="space-y-2.5">
              {users.map((u) => {
                const isActive = currentUser.id === u.id;
                const isResetting = resetPwdUserId === u.id;
                const isBeingEdited = editingUser?.id === u.id;

                const roleBadgeColors: Record<string, string> = {
                  owner: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
                  admin: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                  accountant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                  cashier: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                  viewer: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                };

                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isBeingEdited
                        ? "border-amber-400 bg-amber-50/40 dark:border-amber-600 dark:bg-amber-950/30"
                        : isActive
                        ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-black text-sm shrink-0 shadow-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {u.name}
                            </p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${
                                roleBadgeColors[u.role] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.role}
                            </span>
                            {isActive && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white">
                                Hadda Gashan
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              @{u.username || "user"}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">
                              Pass: <strong className="text-slate-600 dark:text-slate-300">{u.password || "•••"}</strong>
                            </span>
                            {u.phone && (
                              <>
                                <span>•</span>
                                <span>{u.phone}</span>
                              </>
                            )}
                            {u.email && (
                              <>
                                <span>•</span>
                                <span>{u.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {canManageUsers && (
                          <button
                            type="button"
                            onClick={() => startEditUser(u)}
                            className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:border-amber-800/80 dark:text-amber-300 transition cursor-pointer"
                            title="Wax ka beddel username, password, iyo xogta"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Wax ka beddel</span>
                          </button>
                        )}

                        {canManageUsers && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isResetting) {
                                setResetPwdUserId(null);
                              } else {
                                setResetPwdUserId(u.id);
                                setResetPwdValue("");
                              }
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
                          >
                            {isResetting ? "Xir" : "Furaha"}
                          </button>
                        )}

                        {canManageUsers && u.id !== "usr-1" && u.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Ma hubtaa inaad tirtirto akoonka ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            title="Tirtir Isticmaalaha"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => setCurrentUser(u)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
                          >
                            U Beddel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Quick Reset Password input */}
                    {isResetting && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <input
                          type="text"
                          value={resetPwdValue}
                          onChange={(e) => setResetPwdValue(e.target.value)}
                          placeholder={`Furaha cusub ee ${u.name}`}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveResetPassword(u.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Keydi Furaha
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goobta Keydka Xogta (Data Storage Location & Cloud Sync) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Goobta Keydka Xogta & Cloud Storage (Storage Destination)
                </h3>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloud Sync Diyaar ah
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Dooro goobta aad rabto in xogta nidaamka lagu keydiyo oo laga helo si toos ah marka aad isticmaalayso computer ama mobile.
            </p>

            {/* Storage feedback message */}
            {storageSyncMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  storageSyncMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{storageSyncMsg.text}</span>
              </div>
            )}

            {/* Storage Option Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Google Drive */}
              <div
                onClick={() => handleSelectStorage("google_drive")}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  storageLocation === "google_drive"
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                }`}
              >
                {storageLocation === "google_drive" && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300 mb-2">
                  <Cloud className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Cloud: Google Drive
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ku xiran: <span className="font-semibold text-indigo-600">{googleDriveEmail}</span>. Xogtaadu waxay si toos ah ugu kaydsantaa Cloud Drive-kaaga.
                </p>
                <div className="mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  ● Firfircoon (Active Destination)
                </div>
              </div>

              {/* Option 2: Local Drive */}
              <div
                onClick={() => handleSelectStorage("local")}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  storageLocation === "local"
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                }`}
              >
                {storageLocation === "local" && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 mb-2">
                  <HardDrive className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Local Drive (Qalabkan)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Keydka qalabkaaga (LocalStorage & Offline IndexedDB). Aad ugu habboon isticmaalka offline-ka ah.
                </p>
                <div className="mt-2 text-[10px] font-medium text-slate-400">
                  Qalabkan kaliya
                </div>
              </div>

              {/* Option 3: Cloud Multi-Device Live Sync */}
              <div
                onClick={() => handleSelectStorage("cloud_multi")}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  storageLocation === "cloud_multi"
                    ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                }`}
              >
                {storageLocation === "cloud_multi" && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 mb-2">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Cloud Live Sync (Multi-Device)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Wada-shaqaynta Mobile & Computer. Isbeddel kasta oo aad ku samayso xogta meel kasta laga arko.
                </p>
                <div className="mt-2 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                  Live Real-Time
                </div>
              </div>
            </div>

            {/* Google Drive Account & Sync Controls */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Koontada Google Drive ee Ku Xiran
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="email"
                      value={googleDriveEmail}
                      onChange={(e) => setGoogleDriveEmail(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectStorage(storageLocation)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                    >
                      Badbaadi Email-ka
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Sync-gii ugu dambeeyay:</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {lastDriveSyncTime}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => {
                      setAutoSyncEnabled(e.target.checked);
                      localStorage.setItem("finance_auto_sync", String(e.target.checked));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Si toos ah u cusboonaysii keydka (Auto-sync changes)</span>
                </label>

                <button
                  type="button"
                  onClick={handleSyncGoogleDriveNow}
                  disabled={isDriveSyncing}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isDriveSyncing ? "animate-spin" : ""}`} />
                  <span>{isDriveSyncing ? "Waa la keydinayaa..." : "Ku Keydi Google Drive Hadda"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Data Persistence */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Database className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Keydinta & Soo Celinta Xogta (Backup & Restore)
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Xogtaadu waxay ku kaydsan tahay biraawsarkaaga si ammaan ah. Waxaad kala soo bixi kartaa JSON backup ama dib ugu soo celin kartaa.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportAllDataJSON}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <Download className="h-4 w-4 text-indigo-600" />
                <span>Kala Soo Deg Backup (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer">
                <Upload className="h-4 w-4 text-emerald-600" />
                <span>Soo Geli Backup</span>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (window.confirm("Ma hubtaa inaad dib ugu celiso xogtii hore ee tusaalaha ah?")) {
                    resetToDemoData();
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Dib u Bilaab Xogta (Reset Demo)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
