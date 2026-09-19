import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import type { Breed, BreedImage } from "@/types/breed";
import { useTheme } from "@/theme/theme";

interface Props {
  breed: Breed;
}

export function GalleryTab({ breed }: Props): React.JSX.Element {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
    [],
  );

  const viewability = React.useRef({ itemVisiblePercentThreshold: 60 });

  if (breed.images.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={{ color: theme.textMuted }}>
          No images available for this breed.
        </Text>
      </View>
    );
  }

  const current = breed.images[index];

  return (
    <View style={{ flex: 1 }}>
      <FlatList<BreedImage>
        data={breed.images}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewability.current}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.large || item.medium || item.url }}
            style={{ width, aspectRatio: 4 / 3, backgroundColor: theme.border }}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
            recyclingKey={item.id}
          />
        )}
      />
      <View style={styles.footer}>
        <Text style={[styles.counter, { color: theme.textMuted }]}>
          {index + 1} / {breed.images.length}
        </Text>
        {current?.attribution ? (
          <Attribution image={current} theme={theme} />
        ) : null}
      </View>
    </View>
  );
}

function Attribution({
  image,
  theme,
}: {
  image: BreedImage;
  theme: ReturnType<typeof useTheme>;
}) {
  const a = image.attribution;
  if (!a) return null;
  return (
    <View style={styles.attr}>
      {a.author ? (
        <Text style={[styles.attrText, { color: theme.text }]}>
          © {a.author}
        </Text>
      ) : null}
      <Text style={[styles.attrText, { color: theme.textMuted }]}>
        {a.license ?? "Licensed"}
        {a.source ? ` · ${a.source.replace(/_/g, " ")}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  footer: { padding: 12, gap: 4 },
  counter: { fontSize: 12, textAlign: "center" },
  attr: { alignItems: "center", gap: 2 },
  attrText: { fontSize: 11, textAlign: "center" },
});
