const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

export function validateAvatarFile(file) {
  if (!(file instanceof Blob)) {
    throw new Error("Choose a valid image file.");
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile pictures must be smaller than 8 MB.");
  }
}
