import { useColorScheme } from "react-native";

export interface Theme {
  mode: "light" | "dark";
  bg: string;
  bgElevated: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  danger: string;
  warning: string;
  success: string;
  overlay: string;
}

const light: Theme = {
  mode: "light",
  bg: "#F7F7F8",
  bgElevated: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#E5E5EA",
  text: "#0B0B0F",
  textMuted: "#6B6B70",
  accent: "#2F6BF6",
  accentText: "#FFFFFF",
  danger: "#D14B4B",
  warning: "#B4691A",
  success: "#1E8E4A",
  overlay: "rgba(0,0,0,0.35)",
};

const dark: Theme = {
  mode: "dark",
  bg: "#0B0B0F",
  bgElevated: "#141419",
  surface: "#1B1B22",
  border: "#2A2A31",
  text: "#F2F2F5",
  textMuted: "#9A9AA1",
  accent: "#5E90FF",
  accentText: "#0B0B0F",
  danger: "#F0736C",
  warning: "#D9A24A",
  success: "#4CC276",
  overlay: "rgba(0,0,0,0.55)",
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? dark : light;
}

export const themes = { light, dark };
