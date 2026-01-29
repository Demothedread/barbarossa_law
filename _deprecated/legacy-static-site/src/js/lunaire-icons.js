/**
 * LUNAIRE COUNTRY CLUB - HAND-DRAWN SVG ICON SYSTEM
 * "Where the stars align for swashbuckling scholars"
 *
 * Crude, childlike, wobbly illustrations that look like they were
 * drawn by a 5-year-old with crayons. Intentionally imperfect.
 *
 * NO EMOJIS - Only these custom SVGs should be used throughout the site.
 */

// Icon configuration
const ICON_DEFAULTS = {
  size: 24,
  strokeWidth: 2,
  strokeColor: "#3E2723",
  fillColor: "none",
};

/**
 * Creates an SVG element with the given content
 */
function createSVG(
  content,
  size = ICON_DEFAULTS.size,
  viewBox = "0 0 32 32",
  className = "",
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("fill", "none");
  svg.setAttribute("class", `lunaire-icon ${className}`.trim());
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = content;
  return svg;
}

/**
 * Returns SVG string for inline use
 */
function getSVGString(
  content,
  size = ICON_DEFAULTS.size,
  viewBox = "0 0 32 32",
) {
  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="none" class="lunaire-icon" aria-hidden="true">${content}</svg>`;
}

// =============================================================================
// NAVIGATION ICONS
// =============================================================================

export const icons = {
  // Clubhouse/Home - Crude house with flag
  clubhouse: `
    <path d="M5 28 L5 15 Q5 14 6 13 L14 6 Q16 4 18 6 L26 13 Q27 14 27 15 L27 28" 
          stroke="#3E2723" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="#F5F5DC"/>
    <rect x="12" y="18" width="8" height="10" rx="1" fill="#8B4513" stroke="#3E2723" stroke-width="1.5"/>
    <circle cx="18" cy="23" r="1" fill="#DA9100"/>
    <path d="M22 8 L22 4 L26 4" stroke="#CC5500" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 4 Q28 5 26 6 Q24 7 26 8" stroke="#CC5500" stroke-width="1.5" fill="#CC5500"/>
  `,

  // Golf Club - Wobbly driver
  golfClub: `
    <path d="M8 28 Q9 20 12 12 Q14 6 18 4" stroke="#8B4513" stroke-width="3" stroke-linecap="round" fill="none"/>
    <ellipse cx="20" cy="4" rx="6" ry="3" fill="#3E2723" stroke="#3E2723" stroke-width="1" transform="rotate(15 20 4)"/>
    <path d="M6 29 Q8 30 10 29" stroke="#568203" stroke-width="2" stroke-linecap="round"/>
  `,

  // Golf Ball - Dimpled sphere
  golfBall: `
    <circle cx="16" cy="16" r="10" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <circle cx="12" cy="13" r="1.5" fill="#9E9E9E"/>
    <circle cx="18" cy="11" r="1.5" fill="#9E9E9E"/>
    <circle cx="15" cy="18" r="1.5" fill="#9E9E9E"/>
    <circle cx="20" cy="16" r="1.5" fill="#9E9E9E"/>
    <circle cx="11" cy="19" r="1.5" fill="#9E9E9E"/>
  `,

  // Flag/Pin - Golf hole flag
  flagPin: `
    <line x1="22" y1="28" x2="22" y2="6" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
    <path d="M22 6 L22 14 L10 10 Z" fill="#CC5500" stroke="#3E2723" stroke-width="1.5"/>
    <ellipse cx="22" cy="28" rx="6" ry="2" fill="#568203" stroke="#3E2723" stroke-width="1"/>
  `,

  // Moon/Lunar - Crescent with craters
  moon: `
    <circle cx="16" cy="16" r="12" fill="#C4C4B7" stroke="#3E2723" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="#8A8A7D" opacity="0.6"/>
    <circle cx="20" cy="18" r="4" fill="#8A8A7D" opacity="0.5"/>
    <circle cx="14" cy="21" r="2" fill="#8A8A7D" opacity="0.4"/>
    <circle cx="8" cy="17" r="1.5" fill="#8A8A7D" opacity="0.5"/>
  `,

  // Earth - Blue marble
  earth: `
    <circle cx="16" cy="16" r="11" fill="#4A90C4" stroke="#3E2723" stroke-width="2"/>
    <path d="M8 12 Q12 10 14 14 Q16 18 12 22 Q8 20 8 12" fill="#5C8A4A" opacity="0.8"/>
    <path d="M18 8 Q22 10 24 14 Q22 16 20 14 Q18 12 18 8" fill="#5C8A4A" opacity="0.8"/>
    <path d="M16 20 Q20 22 22 26" fill="none" stroke="#F5F5DC" stroke-width="1" opacity="0.3"/>
  `,

  // Astronaut - Stick figure in suit
  astronaut: `
    <ellipse cx="16" cy="10" rx="7" ry="8" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <ellipse cx="16" cy="10" rx="5" ry="6" fill="#367588" stroke="#3E2723" stroke-width="1.5" opacity="0.8"/>
    <rect x="11" y="17" width="10" height="10" rx="2" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <line x1="8" y1="20" x2="4" y2="24" stroke="#F5F5DC" stroke-width="3" stroke-linecap="round"/>
    <line x1="24" y1="20" x2="28" y2="24" stroke="#F5F5DC" stroke-width="3" stroke-linecap="round"/>
    <line x1="13" y1="27" x2="11" y2="32" stroke="#F5F5DC" stroke-width="3" stroke-linecap="round"/>
    <line x1="19" y1="27" x2="21" y2="32" stroke="#F5F5DC" stroke-width="3" stroke-linecap="round"/>
    <rect x="14" y="21" width="4" height="4" fill="#DA9100" stroke="#3E2723" stroke-width="1"/>
  `,

  // Pirate Skull - Jolly Roger style
  pirateSkull: `
    <ellipse cx="16" cy="12" rx="10" ry="9" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <ellipse cx="12" cy="11" rx="3" ry="3.5" fill="#0A0A0F"/>
    <ellipse cx="20" cy="11" rx="3" ry="3.5" fill="#0A0A0F"/>
    <path d="M12 18 Q16 20 20 18" stroke="#3E2723" stroke-width="2" fill="none"/>
    <line x1="13" y1="18" x2="13" y2="20" stroke="#3E2723" stroke-width="1.5"/>
    <line x1="16" y1="18" x2="16" y2="21" stroke="#3E2723" stroke-width="1.5"/>
    <line x1="19" y1="18" x2="19" y2="20" stroke="#3E2723" stroke-width="1.5"/>
    <path d="M6 24 L10 20 L16 26 L22 20 L26 24" stroke="#F5F5DC" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M6 24 L10 20 L16 26 L22 20 L26 24" stroke="#3E2723" stroke-width="2" stroke-linecap="round" fill="none"/>
  `,

  // Treasure Chest - For achievements
  treasure: `
    <rect x="4" y="14" width="24" height="14" rx="2" fill="#8B4513" stroke="#3E2723" stroke-width="2"/>
    <path d="M4 14 Q4 8 16 8 Q28 8 28 14" fill="#A0522D" stroke="#3E2723" stroke-width="2"/>
    <rect x="14" y="12" width="4" height="6" rx="1" fill="#DA9100" stroke="#3E2723" stroke-width="1.5"/>
    <circle cx="16" cy="15" r="1" fill="#3E2723"/>
    <line x1="4" y1="20" x2="28" y2="20" stroke="#3E2723" stroke-width="1"/>
  `,

  // Chart/Stats - Hand-drawn bar graph
  chart: `
    <line x1="6" y1="26" x2="26" y2="26" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
    <line x1="6" y1="26" x2="6" y2="6" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>
    <rect x="9" y="18" width="4" height="8" fill="#568203" stroke="#3E2723" stroke-width="1.5" rx="1"/>
    <rect x="14" y="12" width="4" height="14" fill="#DA9100" stroke="#3E2723" stroke-width="1.5" rx="1"/>
    <rect x="19" y="8" width="4" height="18" fill="#CC5500" stroke="#3E2723" stroke-width="1.5" rx="1"/>
  `,

  // Book/Study - Open book
  book: `
    <path d="M16 8 L16 26" stroke="#3E2723" stroke-width="2"/>
    <path d="M4 10 Q4 8 8 8 L16 8 L16 26 L8 26 Q4 26 4 24 Z" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <path d="M28 10 Q28 8 24 8 L16 8 L16 26 L24 26 Q28 26 28 24 Z" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <line x1="7" y1="12" x2="14" y2="12" stroke="#3E2723" stroke-width="1" opacity="0.5"/>
    <line x1="7" y1="16" x2="14" y2="16" stroke="#3E2723" stroke-width="1" opacity="0.5"/>
    <line x1="7" y1="20" x2="12" y2="20" stroke="#3E2723" stroke-width="1" opacity="0.5"/>
    <line x1="18" y1="12" x2="25" y2="12" stroke="#3E2723" stroke-width="1" opacity="0.5"/>
    <line x1="18" y1="16" x2="25" y2="16" stroke="#3E2723" stroke-width="1" opacity="0.5"/>
  `,

  // Compass/Map - Navigation
  compass: `
    <circle cx="16" cy="16" r="12" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="#3E2723" stroke-width="1"/>
    <path d="M16 6 L18 16 L16 26 L14 16 Z" fill="#CC5500" stroke="#3E2723" stroke-width="1"/>
    <path d="M16 6 L14 16 L16 26" fill="#3E2723"/>
    <circle cx="16" cy="16" r="2" fill="#DA9100" stroke="#3E2723" stroke-width="1"/>
    <text x="16" y="5" text-anchor="middle" font-size="4" fill="#3E2723" font-family="serif">N</text>
  `,

  // Lightning/Generator - Power
  lightning: `
    <path d="M18 4 L10 16 L15 16 L12 28 L24 14 L18 14 L22 4 Z" 
          fill="#DA9100" stroke="#3E2723" stroke-width="2" stroke-linejoin="round"/>
  `,

  // Gear/Settings
  gear: `
    <circle cx="16" cy="16" r="5" fill="#9E9E9E" stroke="#3E2723" stroke-width="2"/>
    <path d="M16 4 L18 8 L14 8 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M16 28 L14 24 L18 24 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M4 16 L8 14 L8 18 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M28 16 L24 18 L24 14 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M7 7 L11 10 L9 12 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M25 25 L21 22 L23 20 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M7 25 L10 21 L12 23 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
    <path d="M25 7 L22 11 L20 9 Z" fill="#9E9E9E" stroke="#3E2723" stroke-width="1"/>
  `,

  // Person/User - Stick figure
  user: `
    <circle cx="16" cy="10" r="6" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <path d="M8 28 Q8 18 16 18 Q24 18 24 28" fill="#568203" stroke="#3E2723" stroke-width="2"/>
    <circle cx="14" cy="9" r="1" fill="#3E2723"/>
    <circle cx="18" cy="9" r="1" fill="#3E2723"/>
    <path d="M14 12 Q16 14 18 12" stroke="#3E2723" stroke-width="1" fill="none"/>
  `,

  // Logout/Exit - Door with arrow
  logout: `
    <rect x="8" y="4" width="14" height="24" rx="2" fill="none" stroke="#3E2723" stroke-width="2"/>
    <line x1="15" y1="16" x2="28" y2="16" stroke="#CC5500" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 12 L28 16 L24 20" stroke="#CC5500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="12" cy="16" r="1.5" fill="#DA9100"/>
  `,

  // Check/Correct - Wobbly checkmark
  check: `
    <path d="M6 16 Q10 20 14 24 Q20 14 28 6" stroke="#568203" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // X/Wrong - Wobbly X
  wrong: `
    <path d="M8 8 Q16 16 24 24" stroke="#E10600" stroke-width="4" stroke-linecap="round"/>
    <path d="M24 8 Q16 16 8 24" stroke="#E10600" stroke-width="4" stroke-linecap="round"/>
  `,

  // Star - Achievement star
  star: `
    <path d="M16 4 L19 12 L28 12 L21 18 L24 28 L16 22 L8 28 L11 18 L4 12 L13 12 Z" 
          fill="#DA9100" stroke="#3E2723" stroke-width="2" stroke-linejoin="round"/>
  `,

  // Trophy - Winner cup
  trophy: `
    <path d="M10 6 L22 6 L22 14 Q22 22 16 24 Q10 22 10 14 Z" fill="#DA9100" stroke="#3E2723" stroke-width="2"/>
    <rect x="13" y="24" width="6" height="4" fill="#DA9100" stroke="#3E2723" stroke-width="1.5"/>
    <rect x="10" y="28" width="12" height="2" rx="1" fill="#8B4513" stroke="#3E2723" stroke-width="1"/>
    <path d="M10 8 Q4 8 4 14 Q4 18 10 18" fill="none" stroke="#3E2723" stroke-width="2"/>
    <path d="M22 8 Q28 8 28 14 Q28 18 22 18" fill="none" stroke="#3E2723" stroke-width="2"/>
    <path d="M14 10 L15 13 L18 13 L16 15 L17 18 L14 16 L11 18 L12 15 L10 13 L13 13 Z" fill="#F5F5DC" stroke="none"/>
  `,

  // Clock/Timer
  clock: `
    <circle cx="16" cy="16" r="12" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <line x1="16" y1="16" x2="16" y2="8" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="16" x2="22" y2="18" stroke="#CC5500" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="2" fill="#3E2723"/>
    <circle cx="16" cy="5" r="1" fill="#3E2723"/>
    <circle cx="16" cy="27" r="1" fill="#3E2723"/>
    <circle cx="5" cy="16" r="1" fill="#3E2723"/>
    <circle cx="27" cy="16" r="1" fill="#3E2723"/>
  `,

  // Play - Start button
  play: `
    <circle cx="16" cy="16" r="12" fill="#568203" stroke="#3E2723" stroke-width="2"/>
    <path d="M12 10 L24 16 L12 22 Z" fill="#F5F5DC" stroke="#3E2723" stroke-width="1.5"/>
  `,

  // Pause
  pause: `
    <circle cx="16" cy="16" r="12" fill="#DA9100" stroke="#3E2723" stroke-width="2"/>
    <rect x="11" y="10" width="4" height="12" rx="1" fill="#F5F5DC" stroke="#3E2723" stroke-width="1"/>
    <rect x="17" y="10" width="4" height="12" rx="1" fill="#F5F5DC" stroke="#3E2723" stroke-width="1"/>
  `,

  // Arrow Left
  arrowLeft: `
    <line x1="26" y1="16" x2="6" y2="16" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 10 L6 16 L12 22" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // Arrow Right
  arrowRight: `
    <line x1="6" y1="16" x2="26" y2="16" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M20 10 L26 16 L20 22" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // Menu/Hamburger
  menu: `
    <line x1="6" y1="10" x2="26" y2="10" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="6" y1="16" x2="26" y2="16" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="6" y1="22" x2="26" y2="22" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
  `,

  // Close/X
  close: `
    <line x1="8" y1="8" x2="24" y2="24" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="24" y1="8" x2="8" y2="24" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
  `,

  // Pencil/Edit
  pencil: `
    <path d="M6 26 L8 20 L24 4 Q26 2 28 4 L28 8 Q28 10 26 8 L10 24 Z" fill="#DA9100" stroke="#3E2723" stroke-width="2"/>
    <line x1="20" y1="8" x2="24" y2="12" stroke="#3E2723" stroke-width="1.5"/>
    <path d="M6 26 L8 20 L12 24 Z" fill="#CC5500" stroke="#3E2723" stroke-width="1"/>
  `,

  // Telescope/Search
  telescope: `
    <ellipse cx="10" cy="10" rx="7" ry="7" fill="none" stroke="#3E2723" stroke-width="2"/>
    <ellipse cx="10" cy="10" rx="4" ry="4" fill="#367588" stroke="#3E2723" stroke-width="1" opacity="0.5"/>
    <line x1="15" y1="15" x2="26" y2="26" stroke="#3E2723" stroke-width="3" stroke-linecap="round"/>
    <line x1="15" y1="15" x2="26" y2="26" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
  `,

  // Ship/Rocket - Space vessel
  rocket: `
    <path d="M16 4 Q20 8 20 16 L20 24 L16 28 L12 24 L12 16 Q12 8 16 4" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <ellipse cx="16" cy="12" rx="3" ry="4" fill="#367588" stroke="#3E2723" stroke-width="1"/>
    <path d="M12 20 L8 24 L12 24" fill="#CC5500" stroke="#3E2723" stroke-width="1"/>
    <path d="M20 20 L24 24 L20 24" fill="#CC5500" stroke="#3E2723" stroke-width="1"/>
    <path d="M14 28 L16 32 L18 28" fill="#DA9100" stroke="#CC5500" stroke-width="1"/>
  `,

  // HAL Eye - 2001 reference
  hal: `
    <circle cx="16" cy="16" r="12" fill="#1A1A1D" stroke="#3E2723" stroke-width="2"/>
    <circle cx="16" cy="16" r="8" fill="#990000" stroke="#660000" stroke-width="1"/>
    <circle cx="16" cy="16" r="5" fill="#E10600"/>
    <circle cx="16" cy="16" r="2" fill="#FF6B6B"/>
    <ellipse cx="14" cy="14" rx="2" ry="1" fill="rgba(255,255,255,0.3)" transform="rotate(-30 14 14)"/>
  `,

  // Contrast toggle
  contrast: `
    <circle cx="16" cy="16" r="12" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <path d="M16 4 A12 12 0 0 1 16 28 Z" fill="#3E2723"/>
  `,

  // Info
  info: `
    <circle cx="16" cy="16" r="12" fill="#367588" stroke="#3E2723" stroke-width="2"/>
    <circle cx="16" cy="10" r="2" fill="#F5F5DC"/>
    <rect x="14" y="14" width="4" height="10" rx="1" fill="#F5F5DC"/>
  `,

  // Warning
  warning: `
    <path d="M16 4 L28 26 L4 26 Z" fill="#DA9100" stroke="#3E2723" stroke-width="2" stroke-linejoin="round"/>
    <line x1="16" y1="12" x2="16" y2="18" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="16" cy="22" r="1.5" fill="#3E2723"/>
  `,

  // Essay/Document
  document: `
    <rect x="6" y="4" width="20" height="24" rx="2" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <line x1="10" y1="10" x2="22" y2="10" stroke="#3E2723" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10" y1="14" x2="22" y2="14" stroke="#3E2723" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10" y1="18" x2="22" y2="18" stroke="#3E2723" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10" y1="22" x2="18" y2="22" stroke="#3E2723" stroke-width="1.5" stroke-linecap="round"/>
  `,

  // Dropdown arrow
  chevronDown: `
    <path d="M8 12 L16 20 L24 12" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // Scorecard
  scorecard: `
    <rect x="4" y="6" width="24" height="20" rx="2" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <line x1="4" y1="12" x2="28" y2="12" stroke="#3E2723" stroke-width="1"/>
    <line x1="12" y1="6" x2="12" y2="26" stroke="#3E2723" stroke-width="1"/>
    <line x1="20" y1="6" x2="20" y2="26" stroke="#3E2723" stroke-width="1"/>
    <text x="8" y="10" font-size="4" fill="#3E2723" font-family="monospace">1</text>
    <text x="16" y="10" font-size="4" fill="#3E2723" font-family="monospace">2</text>
    <text x="24" y="10" font-size="4" fill="#3E2723" font-family="monospace">3</text>
    <circle cx="8" cy="18" r="2" fill="#568203"/>
    <circle cx="16" cy="18" r="2" fill="#DA9100"/>
    <circle cx="24" cy="18" r="2" fill="#CC5500"/>
  `,

  // Baseball
  baseball: `
    <circle cx="16" cy="16" r="12" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <path d="M10 4 Q18 16 10 28" fill="none" stroke="#CC5500" stroke-width="2" stroke-dasharray="2 2"/>
    <path d="M22 4 Q14 16 22 28" fill="none" stroke="#CC5500" stroke-width="2" stroke-dasharray="2 2"/>
  `,

  // Stadium
  stadium: `
    <path d="M4 20 Q16 28 28 20 L28 12 Q16 4 4 12 Z" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <path d="M8 14 L8 22" stroke="#3E2723" stroke-width="1.5"/>
    <path d="M24 14 L24 22" stroke="#3E2723" stroke-width="1.5"/>
    <path d="M4 12 L4 20" stroke="#3E2723" stroke-width="2"/>
    <path d="M28 12 L28 20" stroke="#3E2723" stroke-width="2"/>
    <path d="M10 24 L10 18 L22 18 L22 24" fill="#568203" stroke="#3E2723" stroke-width="1.5"/>
  `,

  // Bat
  bat: `
    <path d="M6 26 L26 6 Q28 4 26 2 Q24 0 22 2 L2 22 Q0 24 2 26 Q4 28 6 26" fill="#8B4513" stroke="#3E2723" stroke-width="2"/>
    <line x1="8" y1="24" x2="10" y2="22" stroke="#3E2723" stroke-width="1"/>
  `,

  // Dice
  dice: `
    <rect x="8" y="8" width="16" height="16" rx="2" fill="#F5F5DC" stroke="#3E2723" stroke-width="2"/>
    <circle cx="12" cy="12" r="1.5" fill="#3E2723"/>
    <circle cx="20" cy="12" r="1.5" fill="#3E2723"/>
    <circle cx="16" cy="16" r="1.5" fill="#3E2723"/>
    <circle cx="12" cy="20" r="1.5" fill="#3E2723"/>
    <circle cx="20" cy="20" r="1.5" fill="#3E2723"/>
  `,
};

// =============================================================================
// ICON RENDERING FUNCTIONS
// =============================================================================

/**
 * Get an icon as a DOM element
 * @param {string} name - Icon name from the icons object
 * @param {number} size - Size in pixels (default 24)
 * @param {string} className - Additional CSS class
 * @returns {SVGElement} The SVG element
 */
export function getIcon(name, size = 24, className = "") {
  const iconContent = icons[name];
  if (!iconContent) {
    console.warn(`Icon "${name}" not found`);
    return createSVG("", size, "0 0 32 32", className);
  }
  return createSVG(iconContent, size, "0 0 32 32", className);
}

/**
 * Get an icon as an HTML string for innerHTML usage
 * @param {string} name - Icon name
 * @param {number} size - Size in pixels
 * @returns {string} SVG markup string
 */
export function getIconString(name, size = 24) {
  const iconContent = icons[name];
  if (!iconContent) {
    console.warn(`Icon "${name}" not found`);
    return "";
  }
  return getSVGString(iconContent, size, "0 0 32 32");
}

/**
 * Replace all emoji placeholders with icons in a container
 * Maps common emojis to icon names
 * @param {HTMLElement} container - Container to search within
 */
export function replaceEmojisWithIcons(container) {
  const emojiMap = {
    "🏴‍☠️": "pirateSkull",
    "☠️": "pirateSkull",
    "🏠": "clubhouse",
    "⚡": "lightning",
    "📊": "chart",
    "🗺️": "compass",
    "👤": "user",
    "⚙️": "gear",
    "📈": "chart",
    "🚪": "logout",
    "✅": "check",
    "❌": "wrong",
    "⭐": "star",
    "🏆": "trophy",
    "⏱️": "clock",
    "▶️": "play",
    "⏸️": "pause",
    "◀️": "arrowLeft",
    "▶": "arrowRight",
    "✏️": "pencil",
    "🔍": "telescope",
    "🚀": "rocket",
    "📜": "document",
    "📋": "document",
    "▼": "chevronDown",
    "⚠️": "warning",
    ℹ️: "info",
    "🌙": "moon",
    "🌍": "earth",
    "🌎": "earth",
    "👨‍🚀": "astronaut",
    "⛳": "flagPin",
    "🏌️": "golfClub",
    "📖": "book",
    "💰": "treasure",
    "🎯": "flagPin",
  };

  // Find all text nodes and elements with emoji content
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null,
    false,
  );

  const nodesToReplace = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      for (const [emoji, iconName] of Object.entries(emojiMap)) {
        if (text.includes(emoji)) {
          nodesToReplace.push({ node, emoji, iconName });
        }
      }
    }
  }

  // Replace emojis with icons
  for (const { node, emoji, iconName } of nodesToReplace) {
    const parts = node.textContent.split(emoji);
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      parts.forEach((part, index) => {
        if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
        if (index < parts.length - 1) {
          fragment.appendChild(getIcon(iconName, 20, "inline-icon"));
        }
      });
      node.parentNode.replaceChild(fragment, node);
    }
  }
}

/**
 * Initialize icon replacement on DOM load
 */
export function initIcons() {
  document.addEventListener("DOMContentLoaded", () => {
    // Add CSS for inline icons
    const style = document.createElement("style");
    style.textContent = `
      .lunaire-icon {
        display: inline-block;
        vertical-align: middle;
        flex-shrink: 0;
      }
      .lunaire-icon.inline-icon {
        width: 1.2em;
        height: 1.2em;
        margin: 0 0.1em;
      }
    `;
    document.head.appendChild(style);
  });
}

// Export default icons object for direct access
export default icons;
