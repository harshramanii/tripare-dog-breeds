import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type Theme as NavTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useColorScheme } from "react-native";
import { BreedListScreen } from "@/screens/BreedListScreen";
import { BreedDetailsScreen } from "@/screens/BreedDetailsScreen";
import type { RootStackParamList } from "./types";
import { themes } from "@/theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

const buildNavTheme = (mode: "light" | "dark"): NavTheme => {
  const t = themes[mode];
  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: mode === "dark",
    colors: {
      ...base.colors,
      primary: t.accent,
      background: t.bg,
      card: t.bgElevated,
      text: t.text,
      border: t.border,
      notification: t.accent,
    },
  };
};

export function RootNavigator(): React.JSX.Element {
  const scheme = useColorScheme();
  const navTheme = buildNavTheme(scheme === "dark" ? "dark" : "light");
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="BreedList"
          component={BreedListScreen}
          options={{ title: "Dog Breeds", headerLargeTitle: false }}
        />
        <Stack.Screen
          name="BreedDetails"
          component={BreedDetailsScreen}
          options={({ route }) => ({ title: route.params.name })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
