import React, { useState, useEffect } from 'react';

/**
 * UserAvatar Component
 * 
 * Displays the user's profile image if available and valid.
 * Falls back to the first character of the user's name with a gradient background
 * if the image is missing or fails to load.
 */
const UserAvatar = ({ photoURL, name, className = "h-full w-full", style = {}, textClassName = "" }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if photoURL changes
  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  // Enhanced validation for photoURL
  const isValidPhotoURL = photoURL && 
                         typeof photoURL === 'string' &&
                         photoURL.trim().length > 0 && 
                         photoURL !== "null" && 
                         photoURL !== "undefined" &&
                         !photoURL.startsWith('data:image/png;base64,null');

  const initials = (name || "U").charAt(0).toUpperCase();

  if (isValidPhotoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={name || "Avatar"}
        className={`${className} object-cover`}
        style={style}
        onError={() => {
            console.log("Avatar image failed to load, falling back to initials");
            setImgError(true);
        }}
      />
    );
  }

  return (
    <div 
      className={`flex items-center justify-center text-white font-bold select-none ${className}`}
      style={{ 
        background: "linear-gradient(135deg, #dc2626, #d4a017)",
        ...style 
      }}
    >
      <span className={textClassName}>{initials}</span>
    </div>
  );
};

export default UserAvatar;
