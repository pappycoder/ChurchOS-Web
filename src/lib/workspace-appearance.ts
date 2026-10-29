export const DEFAULT_ACCENT = "#0f766e";
export const ACCENT_PRESETS = [
  { name: "Teal", color: DEFAULT_ACCENT },
  { name: "Blue", color: "#2563eb" },
  { name: "Violet", color: "#7c3aed" },
  { name: "Rose", color: "#e11d48" },
  { name: "Amber", color: "#d97706" },
  { name: "Graphite", color: "#52525b" },
];
export const appearanceKey = (profileId: string, churchId: string) =>
  `churchos:appearance:v1:${profileId}:${churchId}`;
export function normalizeAccent(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : null;
}
export function readAccent(value: string | null): string {
  try {
    return (
      normalizeAccent(JSON.parse(value ?? "null")?.accent) ?? DEFAULT_ACCENT
    );
  } catch {
    return DEFAULT_ACCENT;
  }
}
function rgb(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((value) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function readableColor(
  accent: string,
  background: string,
  minimum: number,
): string {
  if (contrast(accent, background) >= minimum) return accent;
  const target =
    contrast("#000000", background) > contrast("#ffffff", background)
      ? "#000000"
      : "#ffffff";
  const from = rgb(accent),
    to = rgb(target);
  for (let step = 1; step <= 100; step++) {
    const mixed =
      "#" +
      from
        .map((v, i) =>
          Math.round(v + ((to[i] - v) * step) / 100)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    if (contrast(mixed, background) >= minimum) return mixed;
  }
  return target;
}
export function accentTokens(
  accent: string,
  dark: boolean,
): Record<string, string> {
  const background = dark ? "#202024" : "#fafafa";
  return {
    "--workspace-accent": accent,
    "--workspace-accent-foreground":
      contrast(accent, "#ffffff") >= contrast(accent, "#000000")
        ? "#ffffff"
        : "#000000",
    "--workspace-focus": readableColor(accent, background, 3),
    "--workspace-accent-readable": readableColor(accent, background, 4.5),
    "--workspace-accent-border": readableColor(accent, background, 3),
  };
}
