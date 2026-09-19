import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import type { Breed } from "@/types/breed";
import { useTheme } from "@/theme/theme";
import { TraitBar } from "@/components/TraitBar";

interface Props {
  breed: Breed;
}

const SCORED: Array<{ key: keyof Breed["traits"]; label: string }> = [
  { key: "energy", label: "Energy" },
  { key: "trainability", label: "Trainability" },
  { key: "good_with_children", label: "Good with children" },
  { key: "good_with_dogs", label: "Good with dogs" },
  { key: "good_with_strangers", label: "Good with strangers" },
  { key: "apartment_friendly", label: "Apartment friendly" },
  { key: "barking", label: "Barking" },
  { key: "drooling", label: "Drooling" },
  { key: "grooming", label: "Grooming needs" },
  { key: "shedding", label: "Shedding" },
];

export function TraitsTab({ breed }: Props): React.JSX.Element {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.body}>
      {breed.traits.temperament.length ? (
        <View style={styles.tags}>
          {breed.traits.temperament.map((t) => (
            <View
              key={t}
              style={[
                styles.tag,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: theme.text, fontSize: 12 }}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {SCORED.map(({ key, label }) => (
          <TraitBar
            key={key}
            label={label}
            value={breed.traits[key] as number}
            max={5}
          />
        ))}
        <TraitBar
          label="Daily exercise"
          value={breed.traits.exercise_minutes}
          max={Math.max(60, breed.traits.exercise_minutes)}
          suffix="min"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
