export const ROLES = {
  ADMIN: "admin",
  USER:  "user",
};

export function getRole() {
  try {
    const r = localStorage.getItem("userRole");
    return r === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;
  } catch {
    return ROLES.USER;
  }
}

export function setRole(role) {
  try {
    localStorage.setItem("userRole", role);
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}
