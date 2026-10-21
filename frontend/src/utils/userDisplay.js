import { hasAdminPrivileges } from "./adminConfig.js";

const PLACEHOLDER_NAMES = new Set(["", "user", "john doe", "there"]);

function toTitleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function emailToName(email) {
  const localPart = String(email || "").split("@")[0]?.trim();
  if (!localPart) return "";

  const spaced = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return "";

  return toTitleCase(spaced);
}

export function getDisplayName(user) {
  const rawName = normalizeName(user?.name);

  if (rawName && !PLACEHOLDER_NAMES.has(rawName.toLowerCase())) {
    return rawName;
  }

  const emailName = emailToName(user?.email);
  if (emailName) return emailName;

  return "QDCA User";
}

export function getDisplayRole(user) {
  if (hasAdminPrivileges(user)) return "Administrator";
  return "Student Account";
}

export function getDisplayMeta(user) {
  return user?.email?.trim() || getDisplayRole(user);
}
