import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomePage() {
  const [helmetSecured, setHelmetSecured] = useState(true);
  const color = helmetSecured ? "#00ffff" : "#ff4444";
  const toggle = () => setHelmetSecured((v) => !v);

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === "ios" ? ["top"] : ["top", "bottom"]}
    >
      <Text style={styles.dateText}>Saturday, Jan 31, 2026 14:24 IST</Text>

      <View style={styles.center}>
        <TouchableOpacity onPress={toggle} activeOpacity={0.85}>
          <View
            style={[
              styles.statusRing,
              { borderColor: color, shadowColor: color },
            ]}
          >
            <Ionicons name="shield" size={60} color={color} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.statusText, { color }]}>
          {helmetSecured ? "SECURED" : "UNSECURED"}
        </Text>
      </View>

      <View
        style={[styles.iconRow, Platform.OS === "ios" && styles.iconRowIOS]}
      >
        <TouchableOpacity onPress={toggle} activeOpacity={0.7}>
          <Ionicons
            name={helmetSecured ? "lock-closed" : "lock-open"}
            size={40}
            color={color}
          />
        </TouchableOpacity>
        <Ionicons name="notifications" size={40} color="#00ffff" />
        <Ionicons name="location" size={40} color="#00ffff" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  dateText: { color: "#666", fontSize: 15, marginTop: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  statusRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  statusText: { fontSize: 26, fontWeight: "bold", letterSpacing: 2 },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  iconRowIOS: { paddingBottom: 100 },
});
