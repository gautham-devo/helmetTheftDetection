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
import { SupabaseService } from "../lib/supabaseService";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [helmetCode, setHelmetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !helmetCode) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    const err = await SupabaseService.signup(email, password, helmetCode);
    setLoading(false);
    if (err === null) {
      Alert.alert("Success", "Signup successful! Check your email to verify.");
      router.back();
    } else {
      Alert.alert("Error", err);
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
          <Text style={styles.title}>Create Account</Text>

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
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Helmet Code"
            placeholderTextColor="#888"
            value={helmetCode}
            onChangeText={setHelmetCode}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />

          <TouchableOpacity
            style={[styles.neonBtn, loading && styles.disabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.neonBtnText}>SIGN UP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
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
  linkText: { color: "#00ffff", marginTop: 4, fontSize: 14 },
});
