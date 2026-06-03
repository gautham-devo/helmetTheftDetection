import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackPage() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Helmet Location</Text>
        <Text style={styles.sub}>Map coming soon in dev build</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  sub: { fontSize: 14, color: "#888" },
});
