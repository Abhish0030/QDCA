import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  History,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCcw,
  RotateCw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserCircle2,
  X,
  ZoomIn,
} from "lucide-react";
import ConfirmModal from "../features/admin/components/ConfirmModal.jsx";
import UserAvatar from "../components/UserAvatar";
import { authClient, clearAuthenticatedSessionCache } from "../lib/authClient.js";
import { toast } from "../lib/toast.js";
import {
  changeSettingsPassword,
  clearSettingsData,
  deactivateCurrentAccount,
  deleteCurrentAccount,
  deleteSettingsAvatar,
  exportSettingsData,
  fetchSecuritySessions,
  fetchSettings,
  logoutOtherDevices,
  updateAiPreferences,
  updateNotificationSettings,
  updatePrivacySettings,
  updateRecoveryOptions,
  updateSettingsProfile,
  uploadSettingsAvatar,
} from "../api";
import { validateAvatarFile } from "../utils/avatar";

const TABS = [
  { key: "General", icon: UserCircle2, description: "Profile, avatar, and personal details." },
  { key: "AI Preferences", icon: Bot, description: "Default AI behavior and study defaults." },
  { key: "Notifications", icon: Bell, description: "Email and in-app alerts." },
  { key: "Privacy", icon: Shield, description: "Visibility, analytics, and data controls." },
  { key: "Security", icon: Lock, description: "Password, sessions, and recovery options." },
  { key: "Account", icon: AlertTriangle, description: "Export, logout, deactivate, or delete." },
];

const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Japanese"];
const AI_MODELS = [
  { value: "auto", label: "Auto Select" },
  { value: "llama", label: "Llama 3.2" },
  { value: "gemma", label: "Gemma 4 26B (OpenRouter Free)" },
  { value: "nemotron", label: "Tencent HY3 (OpenRouter)" },
  { value: "groq", label: "Groq GPT OSS 120B" },
];
const RESPONSE_LENGTHS = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];
const EXPLANATION_LEVELS = ["Simple", "Detailed", "Exam-Oriented", "Concept-Based"];
const DIFFICULTY_STYLES = ["Adaptive", "Strict", "Lenient", "Exam Aligned"];
const STUDY_MODES = ["Smart", "Revision", "Practice", "Interview", "Research"];
const PROFILE_VISIBILITY = [
  { value: "private", label: "Private" },
  { value: "contacts", label: "Contacts Only" },
  { value: "public", label: "Public" },
];
const FIELD_BASE =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-50";
const TEXTAREA_BASE = `${FIELD_BASE} min-h-[112px] resize-y`;
const EMPTY_SETTINGS = {
  profile: {
    name: "",
    username: "",
    email: "",
    phone: "",
    university: "",
    department: "",
    degree: "",
    semester: "",
    bio: "",
    country: "",
    timezone: "Asia/Kolkata",
    language: "English",
    image: "",
  },
  aiPreferences: {
    defaultAiModel: "auto",
    responseLength: "balanced",
    temperature: 0.2,
    explanationLevel: "Detailed",
    difficultyStyle: "Adaptive",
    markdownOutput: true,
    codeOutput: true,
    studyMode: "Smart",
    language: "English",
    autoSaveHistory: true,
  },
  notifications: {
    email: true,
    push: true,
    weeklyReports: true,
    analysisCompletion: true,
    studyReminders: false,
    leaderboardUpdates: true,
    securityAlerts: true,
    productUpdates: false,
  },
  privacy: {
    profileVisibility: "private",
    analytics: true,
    recommendations: true,
    activityVisibility: "private",
  },
  security: {
    twoFactorEnabled: false,
    recoveryEmail: "",
    recoveryPhone: "",
    lastPasswordChangeAt: null,
    recentSessions: [],
  },
  account: {
    id: "",
    role: "user",
    status: "active",
    joinedAt: null,
    questionCount: 0,
    uploadCount: 0,
  },
};

function cloneSettings(value) {
  return JSON.parse(JSON.stringify(value));
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {(title || subtitle || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Field({ label, hint, error, required = false, children }) {
  return (
    <label className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
        {hint && <p className="mt-1 text-xs leading-5 text-gray-400">{hint}</p>}
      </div>
      <div>
        {children}
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      </div>
    </label>
  );
}

function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
      <div className="pr-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="mt-1 text-xs leading-5 text-gray-400">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-purple-100 ${
          checked ? "bg-purple-600" : "bg-gray-300"
        } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function SelectPillGroup({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              selected
                ? "border-transparent bg-purple-600 text-white shadow-md shadow-purple-200"
                : "border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:text-purple-700"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function TooltipText({ text }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-purple-500"
      title={text}
      aria-label={text}
    >
      <Info className="h-3.5 w-3.5" />
    </span>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-16 animate-pulse rounded-2xl bg-white/80" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-100" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div key={rowIndex} className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionBar({
  dirty,
  saving,
  onSave,
  onCancel,
  onReset,
  saveLabel = "Save Changes",
}) {
  if (!dirty) return null;

  return (
    <div className="sticky bottom-5 z-30 mt-6">
      <div className="rounded-[26px] border border-gray-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">You have unsaved changes</p>
            <p className="text-xs text-gray-400">Save, discard, or reset this section before leaving.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ open, title, subtitle, onClose, children, width = "max-w-lg" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-950/55 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className={`relative w-full ${width} overflow-hidden rounded-[30px] bg-white shadow-2xl animate-fade-in`}>
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const score = getPasswordStrength(password);
  const bars = [0, 1, 2, 3];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {bars.map((bar) => (
          <div
            key={bar}
            className={`h-2 flex-1 rounded-full ${
              bar < score ? colors[Math.min(score - 1, colors.length - 1)] : "bg-gray-100"
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-gray-500">
        Password strength: {password ? labels[Math.max(score - 1, 0)] : "Not set"}
      </p>
    </div>
  );
}

function AvatarEditorModal({ file, onCancel, onSave }) {
  const [source, setSource] = useState("");
  const [imageSize, setImageSize] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const frameSize = 300;
  const outputSize = 480;

  useEffect(() => {
    if (!(file instanceof Blob)) {
      setSource("");
      setImageSize(null);
      setPosition({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      return undefined;
    }

    const nextSource = URL.createObjectURL(file);
    setSource(nextSource);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      URL.revokeObjectURL(nextSource);
    };
  }, [file]);

  if (!(file instanceof Blob) || !source) return null;

  const baseScale = imageSize
    ? Math.max(frameSize / imageSize.width, frameSize / imageSize.height)
    : 1;

  function clampPosition(nextPosition, nextZoom = zoom) {
    if (!imageSize) return nextPosition;
    const width = imageSize.width * baseScale * nextZoom;
    const height = imageSize.height * baseScale * nextZoom;
    return {
      x: Math.min(Math.max(nextPosition.x, -(width - frameSize) / 2 - 60), (width - frameSize) / 2 + 60),
      y: Math.min(Math.max(nextPosition.y, -(height - frameSize) / 2 - 60), (height - frameSize) / 2 + 60),
    };
  }

  async function handleSave() {
    if (!imageRef.current || !imageSize) return;
    setSaving(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image editor is unavailable right now.");

      const viewportScale = outputSize / frameSize;
      context.clearRect(0, 0, outputSize, outputSize);
      context.save();
      context.beginPath();
      context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.translate(
        outputSize / 2 + position.x * viewportScale,
        outputSize / 2 + position.y * viewportScale,
      );
      context.rotate((rotation * Math.PI) / 180);
      context.scale(baseScale * zoom * viewportScale, baseScale * zoom * viewportScale);
      context.drawImage(
        imageRef.current,
        -imageSize.width / 2,
        -imageSize.height / 2,
        imageSize.width,
        imageSize.height,
      );
      context.restore();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      if (!(blob instanceof Blob)) throw new Error("Could not export that image.");
      await onSave(new File([blob], "avatar.png", { type: "image/png" }));
    } catch (saveError) {
      setError(saveError.message || "Could not save this photo.");
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open={Boolean(file)}
      onClose={saving ? undefined : onCancel}
      title="Adjust profile picture"
      subtitle="Drag, zoom, and rotate until the image fits the circular frame."
      width="max-w-2xl"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-[28px] bg-gradient-to-br from-purple-50 via-white to-pink-50 p-5">
          <div
            className="relative mx-auto h-[300px] w-[300px] max-w-full cursor-grab overflow-hidden rounded-full bg-gray-100 shadow-[0_0_0_5px_white,0_20px_60px_rgba(124,58,237,0.22)] active:cursor-grabbing"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                x: position.x,
                y: position.y,
              };
            }}
            onPointerMove={(event) => {
              if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
              setPosition(
                clampPosition({
                  x: dragRef.current.x + event.clientX - dragRef.current.startX,
                  y: dragRef.current.y + event.clientY - dragRef.current.startY,
                }),
              );
            }}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
            }}
            onPointerCancel={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
            }}
          >
            <img
              ref={imageRef}
              src={source}
              alt="Profile crop preview"
              draggable="false"
              onLoad={(event) => {
                setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: imageSize ? imageSize.width * baseScale * zoom : frameSize,
                height: imageSize ? imageSize.height * baseScale * zoom : frameSize,
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
            {!imageSize && <div className="absolute inset-0 animate-pulse rounded-full bg-gray-100" />}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
            <Upload className="h-3.5 w-3.5" />
            Drag to reposition inside the circle
          </div>
        </div>

        <div className="space-y-5 rounded-[28px] border border-gray-100 bg-gray-50/70 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => {
                  const nextZoom = Number(event.target.value);
                  setZoom(nextZoom);
                  setPosition((current) => clampPosition(current, nextZoom));
                }}
                className="w-full accent-purple-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              <span>Rotation</span>
              <span>{rotation}&deg;</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCw className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPosition({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
            >
              Reset Adjustments
            </button>
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="grid gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving..." : "Use Photo"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteAccountModal({ open, onClose, onConfirm, loading }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmation("");
    }
  }, [open]);

  return (
    <ModalShell
      open={open}
      onClose={loading ? undefined : onClose}
      title="Delete account permanently"
      subtitle="This removes your profile, settings, history, uploads, and related data."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          This action cannot be undone. Enter your password and type <span className="font-bold">DELETE</span> to continue.
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Current password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={FIELD_BASE}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Type DELETE</span>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className={FIELD_BASE}
            />
          </label>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || confirmation !== "DELETE" || password.length < 8}
            onClick={() => onConfirm({ password, confirmation })}
            className="flex-1 rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DataClearModal({ open, onClose, onConfirm, label, loading }) {
  return (
    <ModalShell
      open={open}
      onClose={loading ? undefined : onClose}
      title={`Clear ${label}`}
      subtitle="Please confirm this data action."
    >
      <div className="space-y-5">
        <p className="text-sm leading-6 text-gray-600">
          This will clear your selected data from QDCA. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Clearing..." : `Clear ${label}`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function sanitizeProfileValue(key, value) {
  if (typeof value !== "string") return value;
  const compact = value.replace(/\s+/g, " ");
  if (["bio"].includes(key)) return compact.trimStart();
  return compact.trimStart();
}

function buildTimezoneOptions() {
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }

  return [
    "Asia/Kolkata",
    "UTC",
    "Europe/London",
    "America/New_York",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
}

function validateProfile(profile) {
  const errors = {};
  if (!profile.name.trim() || profile.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(profile.username.trim())) {
    errors.username = "Username must be 3-32 characters using letters, numbers, dot, dash, or underscore.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) errors.email = "Enter a valid email address.";
  if (profile.phone && !/^[0-9+\-\s()]{7,32}$/.test(profile.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (profile.bio.trim().length > 320) errors.bio = "Bio must stay under 320 characters.";
  return errors;
}

function validateSecurityForm(form) {
  const errors = {};
  const changingPassword = form.currentPassword || form.newPassword || form.confirmPassword;
  if (changingPassword) {
    if (!form.currentPassword) errors.currentPassword = "Current password is required.";
    if (form.newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters.";
    if (form.newPassword !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (getPasswordStrength(form.newPassword) < 3) errors.newPassword = "Use a stronger password.";
  }
  if (form.recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recoveryEmail.trim())) {
    errors.recoveryEmail = "Enter a valid recovery email.";
  }
  if (form.recoveryPhone && !/^[0-9+\-\s()]{7,32}$/.test(form.recoveryPhone.trim())) {
    errors.recoveryPhone = "Enter a valid recovery phone number.";
  }
  return errors;
}

function getPasswordStrength(value) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1;
  return score;
}

function formatDate(value, options = {}) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: options.withTime ? "short" : undefined,
  }).format(new Date(value));
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage({ onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("General");
  const [draft, setDraft] = useState(cloneSettings(EMPTY_SETTINGS));
  const [saved, setSaved] = useState(cloneSettings(EMPTY_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [savingTab, setSavingTab] = useState("");
  const [errors, setErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    revokeOtherSessions: true,
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [avatarModalFile, setAvatarModalFile] = useState(null);
  const [avatarDraftFile, setAvatarDraftFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [clearTarget, setClearTarget] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [sessionRefreshLoading, setSessionRefreshLoading] = useState(false);
  const fileInputRef = useRef(null);
  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchSettings();
        if (!mounted) return;
        const next = normalizeFetchedSettings(data);
        setDraft(cloneSettings(next));
        setSaved(cloneSettings(next));
      } catch (error) {
        toast.error(error.message || "Could not load your settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    const hasUnsavedChanges =
      getDirtyTabs(draft, saved, avatarDraftFile, avatarRemoved).length > 0 ||
      Boolean(passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword);
    const beforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [draft, saved, avatarDraftFile, avatarRemoved, passwordForm]);

  const dirtyTabs = getDirtyTabs(draft, saved, avatarDraftFile, avatarRemoved);
  const currentTabDirty =
    dirtyTabs.includes(activeTab) ||
    (activeTab === "Security" &&
      Boolean(passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword));

  function updateSection(section, key, value) {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: section === "profile" ? sanitizeProfileValue(key, value) : value,
      },
    }));
  }

  function restoreCurrentTab() {
    setErrors({});
    setPasswordErrors({});
    setDraft((current) => ({
      ...current,
      [tabSectionKey(activeTab)]: cloneSettings(saved)[tabSectionKey(activeTab)],
    }));

    if (activeTab === "General") {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarDraftFile(null);
      setAvatarPreview("");
      setAvatarRemoved(false);
    }
    if (activeTab === "Security") {
      setPasswordForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
  }

  function resetCurrentTab() {
    const emptyRecovery = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    };

    switch (activeTab) {
      case "General":
        setDraft((current) => ({
          ...current,
          profile: cloneSettings(EMPTY_SETTINGS).profile,
        }));
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarDraftFile(null);
        setAvatarPreview("");
        setAvatarRemoved(true);
        break;
      case "AI Preferences":
        setDraft((current) => ({
          ...current,
          aiPreferences: cloneSettings(EMPTY_SETTINGS).aiPreferences,
        }));
        break;
      case "Notifications":
        setDraft((current) => ({
          ...current,
          notifications: cloneSettings(EMPTY_SETTINGS).notifications,
        }));
        break;
      case "Privacy":
        setDraft((current) => ({
          ...current,
          privacy: cloneSettings(EMPTY_SETTINGS).privacy,
        }));
        break;
      case "Security":
        setPasswordForm(emptyRecovery);
        setDraft((current) => ({
          ...current,
          security: {
            ...current.security,
            recoveryEmail: "",
            recoveryPhone: "",
            twoFactorEnabled: false,
          },
        }));
        break;
      default:
        break;
    }
  }

  async function handleSaveCurrentTab() {
    setErrors({});
    setPasswordErrors({});
    setSavingTab(activeTab);

    try {
      if (activeTab === "General") {
        const validationErrors = validateProfile(draft.profile);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }

        let image = draft.profile.image;
        if (avatarRemoved) {
          await deleteSettingsAvatar();
          image = "";
        } else if (avatarDraftFile) {
          const avatarResponse = await uploadSettingsAvatar(avatarDraftFile);
          image = avatarResponse.image || "";
        }

        const response = await updateSettingsProfile({
          name: draft.profile.name,
          username: draft.profile.username,
          email: draft.profile.email,
          phone: draft.profile.phone,
          university: draft.profile.university,
          department: draft.profile.department,
          degree: draft.profile.degree,
          semester: draft.profile.semester,
          bio: draft.profile.bio,
          country: draft.profile.country,
          timezone: draft.profile.timezone,
          language: draft.profile.language,
        });

        const next = cloneSettings(draft);
        next.profile = { ...next.profile, ...response, image };
        setDraft(next);
        setSaved((current) => ({
          ...current,
          profile: cloneSettings(next.profile),
        }));

        const syncPayload = {
          name: next.profile.name,
          email: next.profile.email,
          phone: next.profile.phone,
          university: next.profile.university,
          department: next.profile.department,
          semester: next.profile.semester,
          image,
          __localOnly: true,
        };
        await onUpdateUser?.(syncPayload);

        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarDraftFile(null);
        setAvatarPreview("");
        setAvatarRemoved(false);
        toast.success("Profile settings saved.");
        return;
      }

      if (activeTab === "AI Preferences") {
        const response = await updateAiPreferences(draft.aiPreferences);
        setSaved((current) => ({
          ...current,
          aiPreferences: cloneSettings(response),
        }));
        setDraft((current) => ({
          ...current,
          aiPreferences: cloneSettings(response),
        }));
        toast.success("AI preferences updated.");
        return;
      }

      if (activeTab === "Notifications") {
        const response = await updateNotificationSettings(draft.notifications);
        setSaved((current) => ({
          ...current,
          notifications: cloneSettings(response),
        }));
        setDraft((current) => ({
          ...current,
          notifications: cloneSettings(response),
        }));
        toast.success("Notification preferences updated.");
        return;
      }

      if (activeTab === "Privacy") {
        const response = await updatePrivacySettings(draft.privacy);
        setSaved((current) => ({
          ...current,
          privacy: cloneSettings(response),
        }));
        setDraft((current) => ({
          ...current,
          privacy: cloneSettings(response),
        }));
        toast.success("Privacy controls updated.");
        return;
      }

      if (activeTab === "Security") {
        const changingPassword =
          passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword;
        const nextErrors = validateSecurityForm({
          ...passwordForm,
          recoveryEmail: draft.security.recoveryEmail,
          recoveryPhone: draft.security.recoveryPhone,
        });
        if (
          nextErrors.recoveryEmail ||
          nextErrors.recoveryPhone ||
          (changingPassword && Object.keys(nextErrors).length > 0)
        ) {
          setPasswordErrors(nextErrors);
          return;
        }

        if (changingPassword) {
          await changeSettingsPassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
            revokeOtherSessions: passwordForm.revokeOtherSessions,
          });
        }
        const recoveryResponse = await updateRecoveryOptions({
          recoveryEmail: draft.security.recoveryEmail,
          recoveryPhone: draft.security.recoveryPhone,
        });
        const sessions = await fetchSecuritySessions();

        setDraft((current) => ({
          ...current,
          security: {
            ...current.security,
            recoveryEmail: recoveryResponse.recoveryEmail,
            recoveryPhone: recoveryResponse.recoveryPhone,
            recentSessions: sessions,
            lastPasswordChangeAt: changingPassword
              ? new Date().toISOString()
              : current.security.lastPasswordChangeAt,
          },
        }));
        setSaved((current) => ({
          ...current,
          security: {
            ...current.security,
            recoveryEmail: recoveryResponse.recoveryEmail,
            recoveryPhone: recoveryResponse.recoveryPhone,
            recentSessions: sessions,
            lastPasswordChangeAt: changingPassword
              ? new Date().toISOString()
              : current.security.lastPasswordChangeAt,
          },
        }));
        setPasswordForm((current) => ({
          ...current,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        toast.success(changingPassword ? "Security settings updated." : "Recovery options updated.");
      }
    } catch (error) {
      toast.error(error.message || "Could not save this section.");
    } finally {
      setSavingTab("");
    }
  }

  async function handleSelectAvatar(file) {
    try {
      validateAvatarFile(file);
      setAvatarModalFile(file);
    } catch (error) {
      toast.error(error.message || "Invalid avatar file.");
    }
  }

  async function handleAvatarPrepared(file) {
    if (!(file instanceof Blob)) {
      toast.error("Could not prepare that image.");
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const nextPreview = URL.createObjectURL(file);
    setAvatarDraftFile(file);
    setAvatarPreview(nextPreview);
    setAvatarRemoved(false);
    setDraft((current) => ({
      ...current,
      profile: {
        ...current.profile,
        image: nextPreview,
      },
    }));
    setAvatarModalFile(null);
  }

  async function refreshSessions() {
    setSessionRefreshLoading(true);
    try {
      const sessions = await fetchSecuritySessions();
      setDraft((current) => ({
        ...current,
        security: { ...current.security, recentSessions: sessions },
      }));
      setSaved((current) => ({
        ...current,
        security: { ...current.security, recentSessions: sessions },
      }));
    } catch (error) {
      toast.error(error.message || "Could not refresh sessions.");
    } finally {
      setSessionRefreshLoading(false);
    }
  }

  async function handleExport(label = "qdca-settings-export.json") {
    try {
      const data = await exportSettingsData();
      downloadJsonFile(label, data);
      toast.success("Your account data export is ready.");
    } catch (error) {
      toast.error(error.message || "Could not export your data.");
    }
  }

  async function handleClearData() {
    if (!clearTarget) return;
    setClearLoading(true);
    try {
      await clearSettingsData(clearTarget);
      if (clearTarget === "analysis" || clearTarget === "history" || clearTarget === "all") {
        const next = cloneSettings(draft);
        next.account.questionCount = 0;
        setDraft(next);
        setSaved((current) => ({
          ...current,
          account: { ...current.account, questionCount: 0 },
        }));
      }
      toast.success(`${capitalize(clearTarget)} data cleared.`);
      setClearTarget("");
    } catch (error) {
      toast.error(error.message || "Could not clear that data.");
    } finally {
      setClearLoading(false);
    }
  }

  async function handleLogoutOtherDevices() {
    setSessionRefreshLoading(true);
    try {
      await logoutOtherDevices();
      const sessions = await fetchSecuritySessions();
      setDraft((current) => ({
        ...current,
        security: { ...current.security, recentSessions: sessions },
      }));
      setSaved((current) => ({
        ...current,
        security: { ...current.security, recentSessions: sessions },
      }));
      toast.success("Signed out from other devices.");
    } catch (error) {
      toast.error(error.message || "Could not log out other devices.");
    } finally {
      setSessionRefreshLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await authClient.signOut();
    } catch {
      // Best-effort sign-out before redirect.
    } finally {
      clearAuthenticatedSessionCache();
      window.location.href = "/login";
    }
  }

  async function handleDeactivate() {
    try {
      await deactivateCurrentAccount();
      toast.success("Your account has been deactivated.");
      await handleLogout();
    } catch (error) {
      toast.error(error.message || "Could not deactivate your account.");
    } finally {
      setDeactivateOpen(false);
    }
  }

  async function handleDeleteAccount(payload) {
    setDeleteLoading(true);
    try {
      await deleteCurrentAccount(payload);
      toast.success("Your account has been deleted.");
      window.location.href = "/login";
    } catch (error) {
      toast.error(error.message || "Could not delete your account.");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 pb-24">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your account, AI preferences, and privacy controls.</p>
        </div>
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your account, AI preferences, and privacy controls.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700">
          <Sparkles className="h-3.5 w-3.5" />
          Enterprise-ready controls with persistent storage
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-gray-100 bg-white p-3 shadow-sm">
          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.key;
              const dirty = dirtyTabs.includes(tab.key);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    selected
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? "text-white" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{tab.key}</span>
                      {dirty && <span className="h-2 w-2 rounded-full bg-amber-400" aria-label="Unsaved changes" />}
                    </div>
                    <p className={`mt-1 text-xs leading-5 ${selected ? "text-purple-100" : "text-gray-400"}`}>
                      {tab.description}
                    </p>
                  </div>
                  <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-white" : "text-gray-300"}`} />
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-5">
          {activeTab === "General" && (
            <>
              <Card
                title="Profile Picture"
                subtitle="Upload a JPG, PNG, or WebP image up to 8 MB. Changes are previewed locally until you save."
              >
                <div className="grid gap-5 lg:grid-cols-[132px_minmax(0,1fr)] lg:items-center">
                  <div className="flex justify-center lg:justify-start">
                    <UserAvatar
                      image={draft.profile.image}
                      name={draft.profile.name || draft.profile.username}
                      className="h-28 w-28 rounded-full ring-4 ring-purple-50"
                      fallbackClassName="text-3xl"
                    />
                  </div>
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const file = event.dataTransfer.files?.[0];
                        if (file) void handleSelectAvatar(file);
                      }}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-purple-200 bg-purple-50/70 px-5 py-7 text-center transition hover:border-purple-300 hover:bg-purple-50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-purple-600 shadow-sm">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Drag and drop a new avatar</p>
                        <p className="mt-1 text-xs text-gray-500">or click to browse your files</p>
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleSelectAvatar(file);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-600 transition hover:bg-purple-50"
                      >
                        <Upload className="h-4 w-4" />
                        {draft.profile.image ? "Change Photo" : "Upload Photo"}
                      </button>
                      <button
                        type="button"
                        disabled={!draft.profile.image}
                        onClick={() => {
                          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                          setAvatarDraftFile(null);
                          setAvatarPreview("");
                          setAvatarRemoved(true);
                          setDraft((current) => ({
                            ...current,
                            profile: { ...current.profile, image: "" },
                          }));
                        }}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                      {(avatarDraftFile || avatarRemoved) && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                          Avatar changes pending save
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Personal Information" subtitle="Update the details shown in your account profile and AI personalization.">
                <div className="space-y-4">
                  <Field label="Full Name" required error={errors.name}>
                    <input
                      value={draft.profile.name}
                      onChange={(event) => updateSection("profile", "name", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Username" required hint="Used in exported reports and future public profile links." error={errors.username}>
                    <input
                      value={draft.profile.username}
                      onChange={(event) => updateSection("profile", "username", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input
                      type="email"
                      value={draft.profile.email}
                      onChange={(event) => updateSection("profile", "email", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Phone" error={errors.phone}>
                    <input
                      value={draft.profile.phone}
                      onChange={(event) => updateSection("profile", "phone", event.target.value)}
                      className={FIELD_BASE}
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                  <Field label="University">
                    <input
                      value={draft.profile.university}
                      onChange={(event) => updateSection("profile", "university", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Department">
                    <input
                      value={draft.profile.department}
                      onChange={(event) => updateSection("profile", "department", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Degree">
                    <input
                      value={draft.profile.degree}
                      onChange={(event) => updateSection("profile", "degree", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Semester">
                    <input
                      value={draft.profile.semester}
                      onChange={(event) => updateSection("profile", "semester", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      value={draft.profile.country}
                      onChange={(event) => updateSection("profile", "country", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Timezone">
                    <select
                      value={draft.profile.timezone}
                      onChange={(event) => updateSection("profile", "timezone", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {timezoneOptions.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Language">
                    <select
                      value={draft.profile.language}
                      onChange={(event) => updateSection("profile", "language", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bio" hint="Short profile summary used in exports and future collaboration features." error={errors.bio}>
                    <textarea
                      value={draft.profile.bio}
                      onChange={(event) => updateSection("profile", "bio", event.target.value)}
                      className={TEXTAREA_BASE}
                      maxLength={320}
                    />
                    <p className="mt-2 text-right text-xs text-gray-400">{draft.profile.bio.length}/320</p>
                  </Field>
                </div>
              </Card>
            </>
          )}

          {activeTab === "AI Preferences" && (
            <>
              <Card title="AI Defaults" subtitle="Choose how QDCA should respond when you classify questions or ask for help.">
                <div className="space-y-4">
                  <Field label="Default AI Model">
                    <select
                      value={draft.aiPreferences.defaultAiModel}
                      onChange={(event) => updateSection("aiPreferences", "defaultAiModel", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {AI_MODELS.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Response Length">
                    <SelectPillGroup
                      value={draft.aiPreferences.responseLength}
                      options={RESPONSE_LENGTHS}
                      onChange={(value) => updateSection("aiPreferences", "responseLength", value)}
                    />
                  </Field>
                  <Field label="Temperature" hint="Higher values encourage more varied output.">
                    <div className="rounded-[24px] border border-gray-100 bg-gray-50/70 px-4 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Creativity</span>
                        <span className="text-lg font-bold text-purple-600">
                          {draft.aiPreferences.temperature.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={draft.aiPreferences.temperature}
                        onChange={(event) =>
                          updateSection("aiPreferences", "temperature", Number(event.target.value))
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </Field>
                  <Field label="Explanation Level">
                    <select
                      value={draft.aiPreferences.explanationLevel}
                      onChange={(event) => updateSection("aiPreferences", "explanationLevel", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {EXPLANATION_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Difficulty Style">
                    <select
                      value={draft.aiPreferences.difficultyStyle}
                      onChange={(event) => updateSection("aiPreferences", "difficultyStyle", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {DIFFICULTY_STYLES.map((style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Study Mode">
                    <select
                      value={draft.aiPreferences.studyMode}
                      onChange={(event) => updateSection("aiPreferences", "studyMode", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {STUDY_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Response Language">
                    <select
                      value={draft.aiPreferences.language}
                      onChange={(event) => updateSection("aiPreferences", "language", event.target.value)}
                      className={FIELD_BASE}
                    >
                      {LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Card>

              <Card title="Output Options" subtitle="Fine-tune how explanations and study outputs are formatted.">
                <div className="space-y-3">
                  <Toggle
                    checked={draft.aiPreferences.markdownOutput}
                    onChange={(value) => updateSection("aiPreferences", "markdownOutput", value)}
                    label="Enable markdown output"
                    description="Use headings, bullets, and structured formatting in responses."
                  />
                  <Toggle
                    checked={draft.aiPreferences.codeOutput}
                    onChange={(value) => updateSection("aiPreferences", "codeOutput", value)}
                    label="Allow code blocks"
                    description="Return syntax-formatted code snippets when explanations need them."
                  />
                  <Toggle
                    checked={draft.aiPreferences.autoSaveHistory}
                    onChange={(value) => updateSection("aiPreferences", "autoSaveHistory", value)}
                    label="Auto-save history"
                    description="Store classifications and AI responses for later review."
                  />
                </div>
              </Card>
            </>
          )}

          {activeTab === "Notifications" && (
            <Card title="Notification Preferences" subtitle="Choose which updates should reach you by email or in the app.">
              <div className="space-y-3">
                <Toggle checked={draft.notifications.email} onChange={(value) => updateSection("notifications", "email", value)} label="Email notifications" description="Receive account and study updates by email." />
                <Toggle checked={draft.notifications.push} onChange={(value) => updateSection("notifications", "push", value)} label="Push notifications" description="Show real-time in-app alerts while you use QDCA." />
                <Toggle checked={draft.notifications.weeklyReports} onChange={(value) => updateSection("notifications", "weeklyReports", value)} label="Weekly reports" description="Summaries of your activity, progress, and streaks." />
                <Toggle checked={draft.notifications.analysisCompletion} onChange={(value) => updateSection("notifications", "analysisCompletion", value)} label="Analysis completion" description="Alerts when classification or PDF analysis finishes." />
                <Toggle checked={draft.notifications.studyReminders} onChange={(value) => updateSection("notifications", "studyReminders", value)} label="Study reminders" description="Gentle nudges to keep your roadmap and streak moving." />
                <Toggle checked={draft.notifications.leaderboardUpdates} onChange={(value) => updateSection("notifications", "leaderboardUpdates", value)} label="Leaderboard updates" description="Let me know when my ranking changes." />
                <Toggle checked={draft.notifications.securityAlerts} onChange={(value) => updateSection("notifications", "securityAlerts", value)} label="Security alerts" description="Important account access and password notices." />
                <Toggle checked={draft.notifications.productUpdates} onChange={(value) => updateSection("notifications", "productUpdates", value)} label="Product updates" description="New features, releases, and improvements." />
              </div>
            </Card>
          )}

          {activeTab === "Privacy" && (
            <>
              <Card title="Visibility" subtitle="Control how your profile and activity appear in QDCA.">
                <div className="space-y-4">
                  <Field label="Profile Visibility">
                    <SelectPillGroup
                      value={draft.privacy.profileVisibility}
                      options={PROFILE_VISIBILITY}
                      onChange={(value) => updateSection("privacy", "profileVisibility", value)}
                    />
                  </Field>
                  <Field label="Activity Visibility">
                    <SelectPillGroup
                      value={draft.privacy.activityVisibility}
                      options={PROFILE_VISIBILITY}
                      onChange={(value) => updateSection("privacy", "activityVisibility", value)}
                    />
                  </Field>
                </div>
              </Card>

              <Card title="Data Controls" subtitle="Decide how QDCA uses your data for analytics and recommendations.">
                <div className="space-y-3">
                  <Toggle checked={draft.privacy.analytics} onChange={(value) => updateSection("privacy", "analytics", value)} label="Analytics" description="Allow anonymous product analytics to improve platform reliability." />
                  <Toggle checked={draft.privacy.recommendations} onChange={(value) => updateSection("privacy", "recommendations", value)} label="Recommendations" description="Use your activity to personalize suggestions and roadmap tips." />
                </div>
              </Card>

              <Card title="Export & Clear Data" subtitle="Download a JSON copy of your data or remove selected history.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleExport("qdca-account-export.json")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    <Mail className="h-4 w-4" />
                    Export account data
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearTarget("chat")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear chat history
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearTarget("analysis")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear analysis data
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearTarget("history")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <History className="h-4 w-4" />
                    Clear question history
                  </button>
                </div>
              </Card>
            </>
          )}

          {activeTab === "Security" && (
            <>
              <Card
                title="Password & Authentication"
                subtitle="Update your password and maintain secure recovery options."
                action={<TooltipText text="Changing your password can revoke other active sessions." />}
              >
                <div className="space-y-4">
                  <Field label="Current Password" error={passwordErrors.currentPassword}>
                    <PasswordInput
                      value={passwordForm.currentPassword}
                      onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                      visible={showPassword.current}
                      onToggle={() => setShowPassword((current) => ({ ...current, current: !current.current }))}
                    />
                  </Field>
                  <Field label="New Password" error={passwordErrors.newPassword}>
                    <div className="space-y-3">
                      <PasswordInput
                        value={passwordForm.newPassword}
                        onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                        visible={showPassword.next}
                        onToggle={() => setShowPassword((current) => ({ ...current, next: !current.next }))}
                      />
                      <PasswordStrength password={passwordForm.newPassword} />
                    </div>
                  </Field>
                  <Field label="Confirm Password" error={passwordErrors.confirmPassword}>
                    <PasswordInput
                      value={passwordForm.confirmPassword}
                      onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
                      visible={showPassword.confirm}
                      onToggle={() => setShowPassword((current) => ({ ...current, confirm: !current.confirm }))}
                    />
                  </Field>
                  <Toggle
                    checked={passwordForm.revokeOtherSessions}
                    onChange={(value) => setPasswordForm((current) => ({ ...current, revokeOtherSessions: value }))}
                    label="Log out other devices after password change"
                    description="Recommended if you think another session may still be signed in."
                  />
                </div>
              </Card>

              <Card title="Recovery & 2FA" subtitle="Set recovery options now while two-factor authentication is still in preview.">
                <div className="space-y-4">
                  <Toggle
                    checked={draft.security.twoFactorEnabled}
                    onChange={(value) => updateSection("security", "twoFactorEnabled", value)}
                    label="Two-factor authentication"
                    description="Placeholder only for now. Recovery methods are already saved and ready for future rollout."
                    disabled
                  />
                  <Field label="Recovery Email" error={passwordErrors.recoveryEmail}>
                    <input
                      type="email"
                      value={draft.security.recoveryEmail}
                      onChange={(event) => updateSection("security", "recoveryEmail", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <Field label="Recovery Phone" error={passwordErrors.recoveryPhone}>
                    <input
                      value={draft.security.recoveryPhone}
                      onChange={(event) => updateSection("security", "recoveryPhone", event.target.value)}
                      className={FIELD_BASE}
                    />
                  </Field>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-gray-600">
                    Last password change: <span className="font-semibold text-gray-800">{formatDate(saved.security.lastPasswordChangeAt, { withTime: true })}</span>
                  </div>
                </div>
              </Card>

              <Card
                title="Recent Sessions"
                subtitle="Review active devices and end other sessions if needed."
                action={
                  <button
                    type="button"
                    onClick={() => void refreshSessions()}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                  >
                    {sessionRefreshLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                    Refresh
                  </button>
                }
              >
                <div className="space-y-3">
                  {draft.security.recentSessions.map((session) => (
                    <div key={session.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {session.userAgent || "Unknown device"}
                          </span>
                          {session.current && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          IP {session.ipAddress || "Unknown"} · Last active {formatDate(session.lastActiveAt, { withTime: true })}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        Expires {formatDate(session.expiresAt, { withTime: true })}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => void handleLogoutOtherDevices()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    Log Out Other Devices
                  </button>
                </div>
              </Card>
            </>
          )}

          {activeTab === "Account" && (
            <>
              <Card title="Account Overview" subtitle="High-level account metadata and usage.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Account Status" value={capitalize(draft.account.status)} icon={Shield} />
                  <MetricCard label="Role" value={capitalize(draft.account.role)} icon={UserCircle2} />
                  <MetricCard label="Joined" value={formatDate(draft.account.joinedAt)} icon={Globe} />
                  <MetricCard label="Questions Classified" value={String(draft.account.questionCount)} icon={History} />
                  <MetricCard label="Uploads Indexed" value={String(draft.account.uploadCount)} icon={Upload} />
                  <MetricCard label="Account ID" value={draft.account.id || "Unknown"} icon={Mail} />
                </div>
              </Card>

              <Card title="Secure Account Actions" subtitle="Use these actions when you need to export, sign out, or close your account.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleExport("qdca-profile-export.json")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    <Upload className="h-4 w-4" />
                    Export Profile & Data
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <LogOutIcon />
                    Log Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeactivateOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Deactivate Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </Card>

              <div className="rounded-[28px] border border-red-100 bg-red-50 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-white p-2 text-red-500 shadow-sm">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Danger zone</p>
                    <p className="mt-1 text-sm leading-6 text-red-600">
                      Deactivation signs you out and suspends access until the account is re-enabled. Deletion permanently removes your profile, settings, history, uploads, and saved preferences.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <ActionBar
            dirty={currentTabDirty}
            saving={savingTab === activeTab}
            onSave={() => void handleSaveCurrentTab()}
            onCancel={restoreCurrentTab}
            onReset={resetCurrentTab}
            saveLabel={activeTab === "Security" ? "Save Security Changes" : "Save Changes"}
          />
        </div>
      </div>

      <AvatarEditorModal
        file={avatarModalFile}
        onCancel={() => setAvatarModalFile(null)}
        onSave={handleAvatarPrepared}
      />

      <DataClearModal
        open={Boolean(clearTarget)}
        onClose={() => setClearTarget("")}
        onConfirm={() => void handleClearData()}
        label={clearTarget}
        loading={clearLoading}
      />

      <ConfirmModal
        open={deactivateOpen}
        title="Deactivate account?"
        description="Your account will be suspended and all sessions will be closed immediately."
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onCancel={() => setDeactivateOpen(false)}
        onConfirm={() => void handleDeactivate()}
      />

      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(payload) => void handleDeleteAccount(payload)}
        loading={deleteLoading}
      />
    </div>
  );
}

function normalizeFetchedSettings(data) {
  const next = cloneSettings(EMPTY_SETTINGS);
  return {
    ...next,
    ...data,
    profile: {
      ...next.profile,
      ...data.profile,
      image: data.profile?.image || "",
    },
    aiPreferences: {
      ...next.aiPreferences,
      ...data.aiPreferences,
    },
    notifications: {
      ...next.notifications,
      ...data.notifications,
    },
    privacy: {
      ...next.privacy,
      ...data.privacy,
    },
    security: {
      ...next.security,
      ...data.security,
      recentSessions: Array.isArray(data.security?.recentSessions) ? data.security.recentSessions : [],
    },
    account: {
      ...next.account,
      ...data.account,
    },
  };
}

function PasswordInput({ value, onChange, visible, onToggle }) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD_BASE} pr-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function getDirtyTabs(draft, saved, avatarDraftFile, avatarRemoved) {
  const dirtyTabs = [];
  if (JSON.stringify(draft.profile) !== JSON.stringify(saved.profile) || avatarDraftFile || avatarRemoved) dirtyTabs.push("General");
  if (JSON.stringify(draft.aiPreferences) !== JSON.stringify(saved.aiPreferences)) dirtyTabs.push("AI Preferences");
  if (JSON.stringify(draft.notifications) !== JSON.stringify(saved.notifications)) dirtyTabs.push("Notifications");
  if (JSON.stringify(draft.privacy) !== JSON.stringify(saved.privacy)) dirtyTabs.push("Privacy");
  if (
    draft.security.recoveryEmail !== saved.security.recoveryEmail ||
    draft.security.recoveryPhone !== saved.security.recoveryPhone ||
    draft.security.twoFactorEnabled !== saved.security.twoFactorEnabled
  ) {
    dirtyTabs.push("Security");
  }
  return dirtyTabs;
}

function tabSectionKey(tab) {
  switch (tab) {
    case "General":
      return "profile";
    case "AI Preferences":
      return "aiPreferences";
    case "Notifications":
      return "notifications";
    case "Privacy":
      return "privacy";
    case "Security":
      return "security";
    default:
      return "profile";
  }
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function LogOutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
