import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserSession } from "../lib/session";
import { SupabaseService } from "../lib/supabaseService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    const user = await SupabaseService.login(email, password);
    setLoading(false);
    if (user) {
      UserSession.setUser(user as any);
      router.replace("/(tabs)/home");
    } else {
      Alert.alert("Error", "Invalid login credentials");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.glassCard}>
          <Ionicons name="shield" size={60} color="#00ffff" />
          <Text style={styles.title}>Helmet UI</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.neonBtn, loading && styles.disabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.neonBtnText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Alert.alert("Info", "UI only")}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.socialBtnText}>Sign in with Google</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => Alert.alert("Info", "UI only")}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.socialBtnText}>Sign in with Apple</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.3)",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#00ffff",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  neonBtn: {
    width: "100%",
    backgroundColor: "#00ffff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  neonBtnText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  socialBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 12,
    padding: 12,
  },
  socialBtnText: { color: "#fff", fontSize: 15 },
  linkText: { color: "#00ffff", marginTop: 4, fontSize: 14 },
});
