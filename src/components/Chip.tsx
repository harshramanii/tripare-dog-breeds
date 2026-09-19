import React from "react";
import { Pressable, Text, StyleSheet, type PressableProps } from "react-native";
import { useTheme } from "@/theme/theme";

interface Props extends PressableProps {
  label: string;
  selected: boolean;
}

export function Chip({ label, selected, ...rest }: Props): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      {...rest}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? theme.accentText : theme.text,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
});
