import { useEffect, useRef, useState } from "react";
import { Camera, Lock, AlertTriangle, Check, Save, X } from "lucide-react";
import ConfirmModal from "../features/admin/components/ConfirmModal.jsx";
import AvatarCropModal from "../components/AvatarCropModal";
import UserAvatar from "../components/UserAvatar";
import { validateAvatarFile } from "../utils/avatar";

const ACHIEVEMENTS = [
  { icon: "🏆", label: "First Classification", earned: true  },
  { icon: "💯", label: "100 Questions",         earned: true  },
  { icon: "🚀", label: "1000 Questions",        earned: false },
  { icon: "📄", label: "PDF Explorer",          earned: true  },
  { icon: "🤖", label: "AI Power User",         earned: false },
  { icon: "🔥", label: "7-Day Streak",          earned: true  },
];



const LANGUAGES = ["English", "Hindi", "Spanish", "French"];
const TIMEZONES = ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"];

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white";

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {title && (
        <div className="mb-5">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
      <p className="text-sm font-medium text-gray-600 pt-2.5">{label}</p>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
      <span className="text-green-400">✓</span>{message}
      <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${checked ? "bg-purple-600" : "bg-gray-200"}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function UserProfilePage({ user = {}, onUpdateUser }) {
  const photoInputRef = useRef(null);
  const [form, setForm] = useState({
    name:       user.name       ?? "John Doe",
    email:      user.email      ?? "john@example.com",
    phone:      user.phone      ?? "+91 98765 43210",
    university: user.university ?? "Delhi Public University",
    department: user.department ?? "Computer Science Engineering",
    semester:   user.semester   ?? "6th Semester",
    studentId:  user.studentId  ?? "STU-2025-0042",
  });

  const [prefs, setPrefs] = useState({
    language: "English", timezone: "Asia/Kolkata",
    emailReports: true, notifications: true, autoSave: true,
  });

  const [twoFA,           setTwoFA]          = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [toast,           setToast]          = useState("");
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deleteModal,     setDeleteModal]    = useState(false);
  const [image,            setImage]           = useState(user.image || "");
  const [photoToCrop,      setPhotoToCrop]     = useState(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      university: user.university ?? "",
      department: user.department ?? "",
      semester: user.semester ?? "",
      studentId: user.studentId ?? current.studentId,
    }));
    setImage(user.image || "");
  }, [
    user.name,
    user.email,
    user.phone,
    user.university,
    user.department,
    user.semester,
    user.studentId,
    user.image,
  ]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      validateAvatarFile(file);
      setPhotoToCrop(file);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleCroppedPhoto(nextImage) {
    await onUpdateUser?.({ image: nextImage });
    setImage(nextImage);
    setPhotoToCrop(null);
    showToast("Profile picture updated");
  }

  async function handleSavePersonal(e) {
    e.preventDefault();
    try {
      await onUpdateUser?.({ name: form.name, email: form.email, phone: form.phone,
        university: form.university, department: form.department,
        semester: form.semester, studentId: form.studentId });
      setEditingPersonal(false);
      showToast("Profile updated successfully");
    } catch (error) {
      showToast(error.message || "Could not update your profile.");
    }
  }

  function handleSavePrefs(e) {
    e.preventDefault();
    showToast("Preferences saved");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your student account and preferences.</p>
      </div>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            <UserAvatar image={image} name={form.name} className="w-20 h-20 rounded-full" fallbackClassName="text-3xl" />
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
            <button type="button" title="Change profile picture" aria-label="Change profile picture" onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap mb-1">
              <h3 className="text-xl font-extrabold text-gray-900">{form.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700">Student</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700">Active</span>
            </div>
            <p className="text-sm text-gray-500">{form.email}</p>
            <p className="text-xs text-gray-400 mt-1">{form.university} · {form.department}</p>
            <p className="text-xs text-gray-400">Student ID: {form.studentId} · Member since Jan 2025</p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card title="Personal Information" subtitle="Your account and contact details.">
        {!editingPersonal ? (
          <div className="space-y-2.5">
            {[["Full Name",form.name],["Email",form.email],["Phone",form.phone],
              ["University",form.university],["Department",form.department],
              ["Semester",form.semester],["Student ID",form.studentId]].map(([label,value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
            <div className="pt-2">
              <button onClick={() => setEditingPersonal(true)}
                className="px-4 py-2 text-sm font-semibold border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors">
                Edit Information
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePersonal} className="space-y-4">
            <Field label="Full Name"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={inputCls} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className={inputCls} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className={inputCls} /></Field>
            <Field label="University"><input value={form.university} onChange={e=>setForm(f=>({...f,university:e.target.value}))} className={inputCls} /></Field>
            <Field label="Department"><input value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} className={inputCls} /></Field>
            <Field label="Semester"><input value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} className={inputCls} /></Field>
            <Field label="Student ID"><input value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))} className={inputCls} /></Field>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-purple-200">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button type="button" onClick={() => setEditingPersonal(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Account Security */}
      <Card title="Account Security" subtitle="Manage your password and authentication.">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Password</p>
              <p className="text-xs text-gray-400 mt-0.5">Last changed May 1, 2025</p>
            </div>
            <button onClick={() => showToast("Password change — connect to backend")}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              <Lock className="w-3.5 h-3.5 inline mr-1.5" />Change Password
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400 mt-0.5">{twoFA ? "Enabled" : "Disabled"}</p>
            </div>
            <Toggle checked={twoFA} onChange={setTwoFA} />
          </div>
          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Login Sessions</p>
              <p className="text-xs text-gray-400 mt-0.5">1 active session</p>
            </div>
            <button onClick={() => showToast("Sessions — connect to backend")}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              View Sessions
            </button>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title="Preferences" subtitle="Customise your experience.">
        <form onSubmit={handleSavePrefs} className="space-y-4">
          <Field label="Language">
            <select value={prefs.language} onChange={e=>setPrefs(p=>({...p,language:e.target.value}))} className={inputCls}>
              {LANGUAGES.map(l=><option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Timezone">
            <select value={prefs.timezone} onChange={e=>setPrefs(p=>({...p,timezone:e.target.value}))} className={inputCls}>
              {TIMEZONES.map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          {[{key:"notifications",label:"Push Notifications",sub:"In-app alerts"},
            {key:"emailReports",label:"Email Reports",sub:"Weekly summary"},
            {key:"autoSave",label:"Auto-save History",sub:"Save classified questions"}].map(({key,label,sub})=>(
            <div key={key} className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-700">{label}</p><p className="text-xs text-gray-400 mt-0.5">{sub}</p></div>
              <Toggle checked={prefs[key]} onChange={v=>setPrefs(p=>({...p,[key]:v}))} />
            </div>
          ))}
          <div className="pt-1">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-purple-200">
              <Check className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </form>
      </Card>

      {/* Achievements */}
      <Card title="Achievements" subtitle="Badges you have earned.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(a=>(
            <div key={a.label} className={`flex items-center gap-3 p-3 rounded-xl border ${a.earned ? "bg-purple-50 border-purple-100" : "bg-gray-50 border-gray-100 opacity-50"}`}>
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{a.label}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${a.earned ? "text-purple-500" : "text-gray-400"}`}>{a.earned ? "Earned" : "Locked"}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <div className="bg-red-50 border-l-4 border-red-400 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Danger Zone</span>
        </div>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-semibold text-gray-800">Deactivate Account</p><p className="text-xs text-gray-500 mt-0.5">Temporarily disable your account.</p></div>
          <button onClick={()=>setDeactivateModal(true)} className="px-4 py-2 text-sm font-semibold border border-red-300 text-red-500 rounded-xl hover:bg-red-100">Deactivate</button>
        </div>
        <div className="flex items-center justify-between border-t border-red-200 pt-4">
          <div><p className="text-sm font-semibold text-gray-800">Delete Account</p><p className="text-xs text-gray-500 mt-0.5">Permanently delete all your data.</p></div>
          <button onClick={()=>setDeleteModal(true)} className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md shadow-red-200">Delete</button>
        </div>
      </div>

      <ConfirmModal open={deactivateModal} title="Deactivate Account?"
        description="Your account will be temporarily disabled." confirmLabel="Deactivate" confirmVariant="danger"
        onConfirm={()=>{setDeactivateModal(false);showToast("Account deactivated (mock)");}} onCancel={()=>setDeactivateModal(false)} />
      <ConfirmModal open={deleteModal} title="Delete Account?"
        description="This will permanently delete your account and all data. This cannot be undone."
        confirmLabel="Delete Account" confirmVariant="danger"
        onConfirm={()=>{setDeleteModal(false);showToast("Account deleted (mock)");}} onCancel={()=>setDeleteModal(false)} />

      {photoToCrop && (
        <AvatarCropModal file={photoToCrop} onCancel={() => setPhotoToCrop(null)} onSave={handleCroppedPhoto} />
      )}

      <Toast message={toast} onDismiss={()=>setToast("")} />
    </div>
  );
}
