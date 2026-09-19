import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import type { Breed } from "@/types/breed";
import { useTheme } from "@/theme/theme";
import { SIZE_BAND_LABEL } from "@/utils/sizeBand";

interface Props {
  breed: Breed;
  onPress: (id: string, name: string) => void;
}

const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

function BreedRowInner({ breed, onPress }: Props) {
  const theme = useTheme();
  const thumb = breed.images[0]?.thumb ?? breed.images[0]?.medium;
  return (
    <Pressable
      onPress={() => onPress(breed.id, breed.name)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${breed.name}, ${SIZE_BAND_LABEL[breed.size_band]}`}
    >
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={styles.thumb}
          contentFit="cover"
          transition={150}
          placeholder={{ blurhash: BLURHASH }}
          cachePolicy="disk"
          recyclingKey={breed.id}
        />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.thumbPlaceholder,
            { backgroundColor: theme.border },
          ]}
        >
          <Text style={{ color: theme.textMuted, fontSize: 10 }}>No image</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {breed.name}
        </Text>
        <Text
          style={[styles.meta, { color: theme.textMuted }]}
          numberOfLines={1}
        >
          {SIZE_BAND_LABEL[breed.size_band]}
          {breed.coat.length ? ` · ${breed.coat.length} coat` : ""}
          {breed.hypoallergenic ? " · hypoallergenic" : ""}
        </Text>
        {breed.traits.temperament.length > 0 ? (
          <Text
            style={[styles.meta, { color: theme.textMuted }]}
            numberOfLines={1}
          >
            {breed.traits.temperament.slice(0, 3).join(" · ")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const BreedRow = memo(BreedRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    padding: 10,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    alignItems: "center",
  },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12 },
});
