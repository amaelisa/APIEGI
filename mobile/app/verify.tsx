import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { useAuth } from "@/context/AuthContext";
import { resendConfirmationCode, verifyEmailCode } from "@/lib/api";

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

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { email, nom } = useLocalSearchParams<{ email: string; nom: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focused, setFocused] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Veuillez saisir le code reçu par email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await verifyEmailCode({ email: email || "", code: code.trim(), nom: nom || "" });
      if (data.access_token) {
        await login(data.access_token);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/home");
      } else {
        setError("Vérification réussie mais connexion impossible. Essayez de vous connecter.");
      }
    } catch (e: any) {
      setError(e.message || "Code invalide.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await resendConfirmationCode(email || "");
      setSuccess(
        "Si un nouvel email est autorisé, il arrivera dans quelques minutes. " +
          "Limite gratuite : ~4 emails/heure — attendez 1 h si bloqué."
      );
    } catch (e: any) {
      setError(e.message || "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={s.page}>
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
              <Text style={s.title}>Vérification email</Text>
              <Text style={s.subtitle}>
                Code envoyé à{" "}
                <Text style={{ color: C.accent }}>{email}</Text>
              </Text>
              <Text style={s.hint}>
                Consultez votre email : cherchez un code à 8 chiffres (pas seulement le lien).
              </Text>
            </View>

            <View style={s.form}>
              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View style={s.infoBox}>
                  <Text style={s.infoText}>{success}</Text>
                </View>
              ) : null}

              <View style={s.field}>
                <Text style={s.label}>Code de confirmation (8 chiffres)</Text>
                <TextInput
                  style={[s.input, s.codeInput, focused && s.inputFocused]}
                  placeholder="12345678"
                  placeholderTextColor={C.muted}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 8))}
                  keyboardType="number-pad"
                  maxLength={8}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                  textAlign="center"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <Pressable
                onPress={handleVerify}
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
                    <Text style={s.btnText}>Confirmer mon compte</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable onPress={handleResend} disabled={resending} style={s.linkBtn}>
                {resending ? (
                  <ActivityIndicator size="small" color={C.accent} />
                ) : (
                  <Text style={s.linkText}>
                    Renvoyer le code (attendre 1 h si limite atteinte)
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.back()} style={s.linkBtn}>
                <Text style={s.linkText}>Modifier mon email</Text>
              </Pressable>
            </View>

            <View style={s.footer}>
              <Text style={s.footerText}>Déjà inscrit ? </Text>
              <Pressable onPress={() => router.replace("/login")}>
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
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#93c5fd",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
    opacity: 0.8,
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
  codeInput: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    paddingVertical: 18,
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
  linkBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.accent,
    textDecorationLine: "underline",
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
