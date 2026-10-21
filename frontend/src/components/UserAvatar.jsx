import { useEffect, useState } from "react";

export default function UserAvatar({ image, name, className = "", fallbackClassName = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (name || "User").trim().charAt(0).toUpperCase() || "U";

  useEffect(() => setImageFailed(false), [image]);

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={`${name || "User"}'s profile`}
        className={`object-cover ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`bg-purple-600 flex items-center justify-center text-white font-bold ${className} ${fallbackClassName}`} aria-label={`${name || "User"}'s profile`}>
      {initial}
    </div>
  );
}
