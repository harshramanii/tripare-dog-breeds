import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // In a production build this would ship to Sentry/Bugsnag/etc.
    if (__DEV__) console.error("[ErrorBoundary]", error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {this.props.fallbackTitle ?? "Something went wrong"}
        </Text>
        <Text style={styles.body}>{this.state.error.message}</Text>
        <Pressable style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  body: { fontSize: 14, textAlign: "center", opacity: 0.8, marginBottom: 16 },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2F6BF6",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
