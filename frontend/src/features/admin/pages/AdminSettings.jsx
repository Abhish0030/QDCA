import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Globe, ShieldCheck } from "lucide-react";
import { toast } from "../../../lib/toast.js";
import ToggleSwitch from "../components/ToggleSwitch.jsx";
import AdminAlert from "../components/AdminAlert.jsx";
import { AdminPageLoading } from "../components/AdminPageState.jsx";
import { fetchAdminSettings, updateAdminSettings } from "../../../api/adminApi.js";

const TABS = ["General", "AI Model", "Platform Controls"];
const INITIAL_SETTINGS = {
  siteName: "QDCA",
  supportEmail: "",
  aiModel: "gemma3:1b",
  confidenceThreshold: 92,
  maintenanceMode: false,
  signupsEnabled: true,
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("General");
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saveError, setSaveError] = useState("");

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [savedSettings, settings],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setFetchError("");

    try {
      const response = await fetchAdminSettings();
      const normalized = {
        siteName: "QDCA",
        supportEmail: "",
        aiModel: response?.aiModel || "gemma3:1b",
        confidenceThreshold: Math.round(Number(response?.confidenceThreshold ?? 0.92) * 100),
        maintenanceMode: Boolean(response?.maintenanceMode),
        signupsEnabled: Boolean(response?.signupsEnabled),
      };

      setSettings(normalized);
      setSavedSettings(normalized);
    } catch (error) {
      setFetchError(error.message || "Could not load admin settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function saveChanges() {
    setSaveError("");

    try {
      const response = await updateAdminSettings({
        aiModel: settings.aiModel,
        confidenceThreshold: Number(settings.confidenceThreshold) / 100,
        maintenanceMode: settings.maintenanceMode,
        signupsEnabled: settings.signupsEnabled,
      });

      const normalized = {
        ...settings,
        aiModel: response?.settings?.aiModel || settings.aiModel,
        confidenceThreshold: Math.round(Number(response?.settings?.confidenceThreshold ?? settings.confidenceThreshold / 100) * 100),
        maintenanceMode: Boolean(response?.settings?.maintenanceMode ?? settings.maintenanceMode),
        signupsEnabled: Boolean(response?.settings?.signupsEnabled ?? settings.signupsEnabled),
      };

      setSettings(normalized);
      setSavedSettings(normalized);
      toast.success("Admin settings saved.");
    } catch (error) {
      setSaveError(error.message || "Could not save admin settings.");
    }
  }

  function discardChanges() {
    setSettings(savedSettings);
  }

  function renderTab() {
    switch (activeTab) {
      case "General":
        return (
          <Section title="General Settings" icon={Globe}>
            <Field label="Site Name">
              <input value={settings.siteName} disabled className={`${inputCls} cursor-not-allowed bg-gray-50 text-gray-400`} />
            </Field>
            <Field label="Support Email">
              <input
                value={settings.supportEmail}
                disabled
                placeholder="No admin support email is currently exposed by the backend."
                className={`${inputCls} cursor-not-allowed bg-gray-50 text-gray-400`}
              />
            </Field>
            <p className="rounded-2xl border border-[#FFE0E6] bg-[#FFF7F9] px-4 py-3 text-sm text-gray-500">
              General platform metadata is not editable yet because the current backend admin settings contract only persists model and platform-control values.
            </p>
          </Section>
        );
      case "AI Model":
        return (
          <Section title="AI Model Settings" icon={Brain}>
            <Field label="Active Model">
              <select
                value={settings.aiModel}
                onChange={(event) => setSettings((current) => ({ ...current, aiModel: event.target.value }))}
                className={inputCls}
              >
                <option value="gemma3:1b">Gemma 3 1B</option>
                <option value="llama3.2">Llama 3.2</option>
                <option value="nemotron">Llama 3.3 70B Instruct (OpenRouter)</option>
              </select>
            </Field>
            <Field label="Confidence Threshold">
              <div className="space-y-3">
                <input
                  type="range"
                  min={70}
                  max={99}
                  value={settings.confidenceThreshold}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, confidenceThreshold: Number(event.target.value) }))
                  }
                  className="w-full cursor-pointer accent-[#FF385C]"
                />
                <p className="text-sm font-semibold text-[#FF385C]">{settings.confidenceThreshold}%</p>
              </div>
            </Field>
          </Section>
        );
      case "Platform Controls":
        return (
          <Section title="Platform Controls" icon={ShieldCheck}>
            <ToggleRow
              label="New Signups Enabled"
              checked={settings.signupsEnabled}
              onChange={(value) => setSettings((current) => ({ ...current, signupsEnabled: value }))}
            />
            <ToggleRow
              label="Maintenance Mode"
              checked={settings.maintenanceMode}
              onChange={(value) => setSettings((current) => ({ ...current, maintenanceMode: value }))}
            />
          </Section>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return <AdminPageLoading label="Loading admin settings..." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Admin Settings</h2>
        <p className="mt-1 text-sm text-gray-400">Manage high-level platform configuration from a single admin workspace.</p>
      </div>

      {fetchError ? <AdminAlert title="We could not load admin settings." message={fetchError} onRetry={loadSettings} /> : null}
      {saveError ? <AdminAlert title="The last settings update failed." message={saveError} /> : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab ? "bg-[#FF385C] text-white" : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderTab()}

      {dirty ? (
        <div className="flex items-center justify-between rounded-2xl border border-[#FFD7DE] bg-[#FFF4F6] px-5 py-3">
          <p className="text-sm font-medium text-[#A01A36]">You have unsaved settings changes.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={discardChanges}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={saveChanges}
              className="rounded-xl bg-[#FF385C] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#FFB9C7] hover:bg-[#E63152]"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
          <Icon className="h-4 w-4 text-[#FF385C]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 sm:items-center">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]";
