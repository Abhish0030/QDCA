/**
 * Single source of truth for the admin credentials check.
 * Only a user whose email matches ADMIN_EMAIL (and who knows the password)
 * will be allowed into the /admin/* routes.
 *
 * Password enforcement happens at the better-auth sign-in layer —
 * we only check the email here because the session only exists after
 * a successful authentication.
 */
export const ADMIN_EMAIL    = "admin123@gmail.com";
export const ADMIN_PASSWORD = "Admin@123"; // referenced for documentation only — never used client-side

export function isConfiguredAdminEmail(email) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function hasAdminPrivileges(user) {
  return user?.role === "admin" || isConfiguredAdminEmail(user?.email);
}
