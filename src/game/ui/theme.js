export const COLORS = {
  background: 0xf3f7ef,
  surface: 0xffffff,
  surfaceAlt: 0xeaf3ed,
  ink: 0x20364a,
  muted: 0x637587,
  line: 0xd4e2dc,
  green: 0x358b72,
  greenHover: 0x28745e,
  greenPale: 0xd9eee4,
  coral: 0xe77966,
  coralPale: 0xffe9df,
  yellow: 0xf2c95d,
  yellowPale: 0xfff4cb,
  bluePale: 0xe0eef8,
  navy: 0x24445b,
  shadow: 0xdde8e1,
};

export const FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function money(amount) {
  return `NT$${Math.max(0, Math.round(amount))}`;
}

export function toCssColor(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}
