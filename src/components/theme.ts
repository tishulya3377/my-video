// Shared design tokens for the overlay system.
// Warm coffee/amber tones are used instead of pure black for any
// translucent panels so the broadcast-green chroma key doesn't eat
// into text/panel edges during keying.

export const COLORS = {
  chromaGreen: "#00FF00",
  gold: "#F5A623",
  deepGold: "#C8860A",
  orange: "#E8650A",
  white: "#FFFFFF",
  cream: "#FBF3E7",
  coffeeDark: "#3B1F08",
  coffeeMed: "#5C3010",
  coffeeLight: "#8B5A2B",
};

export const FONT_STACK =
  "'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const SHADOW_SOFT = "0 20px 60px -20px rgba(59, 31, 8, 0.55)";
export const SHADOW_GLOW_GOLD = "0 0 40px rgba(245, 166, 35, 0.28)";
