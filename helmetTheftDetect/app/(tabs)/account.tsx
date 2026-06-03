import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserSession } from "../../lib/session";
import { SupabaseService } from "../../lib/supabaseService";

export default function AccountPage() {
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [helmetCode, setHelmetCode] = useState("");
  const [role, setRole] = useState("");

  // Re-read session every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      setEmail(UserSession.email || "user@example.com");
      setHelmetCode(UserSession.helmetCode || "N/A");
      setRole(UserSession.role || "OWNER");
    }, []),
  );

  const handleLogout = async () => {
    await SupabaseService.signOut();
    UserSession.clear();
    router.replace("/login");
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === "ios" ? ["top"] : ["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          Platform.OS === "ios" && styles.scrollIOS,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>My Account</Text>

        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={35} color="#000" />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.emailText} numberOfLines={1}>
              {email}
            </Text>
            <Text style={styles.helmetText}>Helmet: {helmetCode}</Text>
          </View>
        </View>

        <GlassSection title="Profile Information">
          <InfoRow icon="mail" text={email} />
          <InfoRow icon="shield-checkmark" text={helmetCode} />
          <InfoRow icon="key" text={role} />
        </GlassSection>

        <GlassSection title="My Devices">
          <InfoRow
            icon="shield"
            text="Helmet (Active)"
            trailing={
              <Ionicons name="battery-full" size={20} color="#00cc44" />
            }
          />
        </GlassSection>

        <GlassSection title="App Preferences">
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Notification Preferences</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              thumbColor={
                Platform.OS === "android"
                  ? notifEnabled
                    ? "#00ffff"
                    : "#888"
                  : undefined
              }
              trackColor={{ true: "rgba(0,255,255,0.35)", false: "#333" }}
              ios_backgroundColor="#333"
            />
          </View>
        </GlassSection>

        {Platform.OS === "ios" && <View style={{ height: 20 }} />}
      </ScrollView>

      <View
        style={[
          styles.logoutWrapper,
          Platform.OS === "ios" && styles.logoutWrapperIOS,
        ]}
      >
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function GlassSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  text,
  trailing,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.row}>
      <Ionicons name={icon} size={20} color="#00ffff" />
      <Text style={sectionStyles.rowText} numberOfLines={1}>
        {text}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { padding: 16, paddingBottom: 8 },
  scrollIOS: { paddingBottom: 120 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#00ffff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInfo: { flex: 1, gap: 4 },
  emailText: { color: "#fff", fontSize: 16 },
  helmetText: { color: "#888", fontSize: 14 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  switchLabel: { color: "#fff", fontSize: 15 },
  logoutWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "#000",
  },
  logoutWrapperIOS: {
    paddingBottom: 100,
  },
  logoutBtn: {
    backgroundColor: "#cc0000",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  rowText: { color: "#ddd", flex: 1, fontSize: 14 },
});
