import { formatRelativeTime } from "../../../utils/time.js";

export function formatAdminDate(value, options = {}) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: options.withTime === false ? undefined : "2-digit",
    minute: options.withTime === false ? undefined : "2-digit",
  }).format(new Date(value));
}

export function formatAdminRelative(value) {
  return formatRelativeTime(value);
}

export function toInitials(value = "") {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AD";
}

export function downloadAdminFile(filename, data) {
  const blob = new Blob([typeof data === "string" ? data : JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function normalizeTrendRange(value, fallback = "week") {
  if (["day", "week", "month"].includes(value)) return value;
  return fallback;
}
