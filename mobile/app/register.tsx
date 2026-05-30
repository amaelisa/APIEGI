import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientText } from "@/components/GradientText";
import { registerUser } from "@/lib/api";

const C = {
  bg: "#0d0e10",
  bgElevated: "#111315",
  bgInput: "#1e293b",
  border: "#2d3238",
  text: "#f1f5f9",
  muted: "#94a3b8",
  accent: "#93c5fd",
  infoBg: "rgba(59,130,246,0.12)",
  infoBorder: "rgba(59,130,246,0.3)",
  infoText: "#93c5fd",
  errorBg: "rgba(239,68,68,0.12)",
  errorBorder: "rgba(239,68,68,0.35)",
  errorText: "#fca5a5",
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [nomFocused, setNomFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleRegister = async () => {
    if (!nom.trim() || !email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await registerUser({ nom: nom.trim(), email: email.trim(), mot_de_passe: password });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/verify", params: { email: email.trim(), nom: nom.trim() } });
    } catch (e: any) {
      setError(e.message || "Inscription impossible.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.page}>
      {/* Blue glow at top */}
      <View style={s.glowTop} pointerEvents="none">
        <LinearGradient
          colors={["rgba(59,130,246,0.18)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      {/* Purple glow at bottom-right */}
      <View style={s.glowBottom} pointerEvents="none">
        <LinearGradient
          colors={["transparent", "rgba(168,85,247,0.12)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <View style={s.header}>
              <View style={s.logoWrap}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={s.logo}
                  resizeMode="contain"
                />
              </View>
              <GradientText text="Inscription" fontSize={22} />
              <Text style={s.subtitle}>Compte étudiant GI — confirmation par email</Text>
            </View>

            <View style={s.form}>
              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}
              {info ? (
                <View style={s.infoBox}>
                  <Text style={s.infoText}>{info}</Text>
                </View>
              ) : null}

              <View style={s.field}>
                <Text style={s.label}>Nom complet</Text>
                <TextInput
                  style={[s.input, nomFocused && s.inputFocused]}
                  placeholder="Jean Dupont"
                  placeholderTextColor={C.muted}
                  value={nom}
                  onChangeText={setNom}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onFocus={() => setNomFocused(true)}
                  onBlur={() => setNomFocused(false)}
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={[s.input, emailFocused && s.inputFocused]}
                  placeholder="etudiant@univ.fr"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>Mot de passe</Text>
                <TextInput
                  style={[s.input, passFocused && s.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor={C.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={({ pressed }) => [s.btnWrap, { opacity: pressed || loading ? 0.5 : 1 }]}
              >
                <LinearGradient
                  colors={["#2563eb", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.btnText}>Créer mon compte</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <View style={s.footer}>
              <Text style={s.footerText}>Déjà inscrit ? </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={s.footerLink}>Se connecter</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
  },
  glowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: 0,
  },
  glowBottom: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    height: 240,
    zIndex: 0,
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(17,19,21,0.92)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  logo: {
    width: 52,
    height: 52,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    textAlign: "center",
    marginTop: 6,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.muted,
  },
  input: {
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  inputFocused: {
    borderColor: "#3b82f6",
  },
  errorBox: {
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: C.errorText,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  infoBox: {
    backgroundColor: C.infoBg,
    borderWidth: 1,
    borderColor: C.infoBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: {
    color: C.infoText,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  btnWrap: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  btn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.muted,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.accent,
  },
});
