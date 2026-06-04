// Custom SVG icons for storage locations

export function LedniceSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fridge body */}
      <rect x="6" y="2" width="20" height="28" rx="3" fill="#E8F5E9" stroke="#6B8F5E" strokeWidth="1.5"/>
      {/* Freezer section top */}
      <rect x="6" y="2" width="20" height="10" rx="3" fill="#C8E6C9" stroke="#6B8F5E" strokeWidth="1.5"/>
      {/* Divider line */}
      <line x1="6" y1="12" x2="26" y2="12" stroke="#6B8F5E" strokeWidth="1.5"/>
      {/* Fridge door handle top */}
      <rect x="22" y="5" width="2.5" height="5" rx="1.2" fill="#6B8F5E"/>
      {/* Fridge door handle bottom */}
      <rect x="22" y="15" width="2.5" height="7" rx="1.2" fill="#6B8F5E"/>
      {/* Food items inside fridge */}
      {/* Milk bottle */}
      <rect x="10" y="16" width="4" height="7" rx="1" fill="#fff" stroke="#6B8F5E" strokeWidth="1"/>
      <rect x="10.5" y="14.5" width="3" height="2" rx="0.8" fill="#fff" stroke="#6B8F5E" strokeWidth="1"/>
      {/* Veggie */}
      <ellipse cx="20" cy="20" rx="2.5" ry="1.5" fill="#81C784"/>
      <line x1="20" y1="18.5" x2="20" y2="16" stroke="#81C784" strokeWidth="1.2"/>
    </svg>
  );
}

export function MrazakSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Box body */}
      <rect x="3" y="10" width="26" height="18" rx="3" fill="#E3F2FD" stroke="#5B8FB9" strokeWidth="1.5"/>
      {/* Lid */}
      <rect x="3" y="6" width="26" height="6" rx="3" fill="#BBDEFB" stroke="#5B8FB9" strokeWidth="1.5"/>
      {/* Handle */}
      <rect x="12" y="4" width="8" height="3" rx="1.5" fill="#5B8FB9"/>
      {/* Snowflake center */}
      <line x1="16" y1="15" x2="16" y2="23" stroke="#5B8FB9" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="20" y2="19" stroke="#5B8FB9" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13.2" y1="16.2" x2="18.8" y2="21.8" stroke="#5B8FB9" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18.8" y1="16.2" x2="13.2" y2="21.8" stroke="#5B8FB9" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Snowflake tips */}
      <circle cx="16" cy="15" r="1" fill="#5B8FB9"/>
      <circle cx="16" cy="23" r="1" fill="#5B8FB9"/>
      <circle cx="12" cy="19" r="1" fill="#5B8FB9"/>
      <circle cx="20" cy="19" r="1" fill="#5B8FB9"/>
    </svg>
  );
}

export function SpizSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back wall */}
      <rect x="2" y="4" width="28" height="26" rx="2" fill="#FFF8E1" stroke="#A57C52" strokeWidth="1.2"/>
      {/* Top shelf */}
      <rect x="2" y="12" width="28" height="2" rx="1" fill="#A57C52"/>
      {/* Middle shelf */}
      <rect x="2" y="21" width="28" height="2" rx="1" fill="#A57C52"/>
      {/* Shelf supports */}
      <rect x="4" y="4" width="1.5" height="26" rx="0.75" fill="#A57C52" opacity="0.4"/>
      <rect x="26.5" y="4" width="1.5" height="26" rx="0.75" fill="#A57C52" opacity="0.4"/>
      {/* Top shelf items - kompoty */}
      <rect x="7" y="6" width="5" height="6" rx="1.5" fill="#EF9A9A" stroke="#C62828" strokeWidth="0.8"/>
      <ellipse cx="9.5" cy="6" rx="2" ry="0.8" fill="#C62828"/>
      <rect x="14" y="6" width="5" height="6" rx="1.5" fill="#FFB74D" stroke="#E65100" strokeWidth="0.8"/>
      <ellipse cx="16.5" cy="6" rx="2" ry="0.8" fill="#E65100"/>
      <rect x="21" y="6.5" width="4" height="5.5" rx="1.5" fill="#A5D6A7" stroke="#2E7D32" strokeWidth="0.8"/>
      <ellipse cx="23" cy="6.5" rx="1.8" ry="0.8" fill="#2E7D32"/>
      {/* Middle shelf - cereals box + oil */}
      <rect x="6" y="14" width="6" height="7" rx="1" fill="#FFE082" stroke="#F9A825" strokeWidth="0.8"/>
      <rect x="7" y="15" width="4" height="2" rx="0.5" fill="#F9A825" opacity="0.5"/>
      {/* Oil bottle */}
      <rect x="15" y="15" width="3.5" height="6" rx="1" fill="#FFF176" stroke="#F57F17" strokeWidth="0.8"/>
      <rect x="15.5" y="13.5" width="2.5" height="2" rx="0.8" fill="#FFF176" stroke="#F57F17" strokeWidth="0.8"/>
      {/* Bottom - pasta bag */}
      <rect x="5" y="23.5" width="7" height="5.5" rx="1.2" fill="#E1BEE7" stroke="#7B1FA2" strokeWidth="0.8"/>
      <rect x="16" y="23.5" width="6" height="5.5" rx="1.2" fill="#FFCCBC" stroke="#BF360C" strokeWidth="0.8"/>
    </svg>
  );
}

export function SkrinskaSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabinet body */}
      <rect x="3" y="6" width="26" height="24" rx="2.5" fill="#EFEBE9" stroke="#795548" strokeWidth="1.5"/>
      {/* Left door (open/ajar) */}
      <rect x="3" y="6" width="11" height="24" rx="2" fill="#D7CCC8" stroke="#795548" strokeWidth="1.2"/>
      {/* Right door */}
      <rect x="18" y="6" width="11" height="24" rx="2" fill="#EFEBE9" stroke="#795548" strokeWidth="1.2"/>
      {/* Door handles */}
      <circle cx="15.5" cy="18" r="1.2" fill="#795548"/>
      <circle cx="17.5" cy="18" r="1.2" fill="#795548"/>
      {/* Top bar */}
      <rect x="3" y="6" width="26" height="3" rx="2" fill="#795548"/>
      {/* Inside items - visible through open left door */}
      {/* Salt shaker */}
      <rect x="5" y="14" width="3.5" height="7" rx="1.5" fill="white" stroke="#9E9E9E" strokeWidth="0.8"/>
      <ellipse cx="6.75" cy="14" rx="1.5" ry="0.7" fill="#BDBDBD"/>
      <circle cx="6.75" cy="12.5" r="1" fill="#BDBDBD"/>
      {/* Pepper */}
      <rect x="10" y="15" width="3" height="6" rx="1.2" fill="#424242" stroke="#212121" strokeWidth="0.7"/>
      <ellipse cx="11.5" cy="15" rx="1.2" ry="0.6" fill="#616161"/>
      {/* Pasta box on right door shelf */}
      <rect x="20" y="16" width="7" height="9" rx="1" fill="#FFF9C4" stroke="#F9A825" strokeWidth="0.8"/>
      <line x1="23.5" y1="17" x2="23.5" y2="24" stroke="#F9A825" strokeWidth="0.6" strokeDasharray="1 1"/>
    </svg>
  );
}

export function VseSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="12" height="12" rx="2.5" fill="#E8F5E9" stroke="#6B8F5E" strokeWidth="1.4"/>
      <rect x="17" y="3" width="12" height="12" rx="2.5" fill="#FFF8E1" stroke="#A57C52" strokeWidth="1.4"/>
      <rect x="3" y="17" width="12" height="12" rx="2.5" fill="#E3F2FD" stroke="#5B8FB9" strokeWidth="1.4"/>
      <rect x="17" y="17" width="12" height="12" rx="2.5" fill="#EFEBE9" stroke="#795548" strokeWidth="1.4"/>
      <text x="9" y="13" textAnchor="middle" fontSize="7" fill="#6B8F5E">🥦</text>
      <text x="23" y="13" textAnchor="middle" fontSize="7" fill="#A57C52">🫙</text>
      <text x="9" y="27" textAnchor="middle" fontSize="7" fill="#5B8FB9">❄</text>
      <text x="23" y="27" textAnchor="middle" fontSize="7" fill="#795548">🧂</text>
    </svg>
  );
}
