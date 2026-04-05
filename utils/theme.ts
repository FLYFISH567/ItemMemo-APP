export type ThemeMode = "light" | "dark";

const THEME_KEY = "writedown_mobile_theme";
const THEME_CHANGED_EVENT = "theme:changed";

export function getThemeMode(): ThemeMode {
  const value = uni.getStorageSync(THEME_KEY);
  return value === "dark" ? "dark" : "light";
}

export function isDarkTheme(): boolean {
  return getThemeMode() === "dark";
}

export function setThemeMode(mode: ThemeMode): void {
  uni.setStorageSync(THEME_KEY, mode);
  uni.$emit(THEME_CHANGED_EVENT, mode);
}

export function toggleThemeMode(): ThemeMode {
  const next: ThemeMode = isDarkTheme() ? "light" : "dark";
  setThemeMode(next);
  return next;
}

export const themeChangedEvent = THEME_CHANGED_EVENT;
