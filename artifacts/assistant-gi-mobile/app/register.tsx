import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { registerUser, verifyEmailCode, resendCode } from "@/lib/api";

type Step = "register" | "verify";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleRegister = async () => {
    const trimEmail = email.trim();
    const trimPass = password.trim();
    if (!trimEmail || !trimPass) {
      Alert.alert("Champs requis", "Veuillez remplir email et mot de passe.");
      return;
    }
    setLoading(true);
    try {
      await registerUser(trimEmail, trimPass, fullName.trim() || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("verify");
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : "Erreur d'inscription";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const trimCode = code.trim();
    if (!trimCode) {
      Alert.alert("Code requis", "Entrez le code reçu par email.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailCode(email.trim(), trimCode);
      await signIn(res.access_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/chat");
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : "Code invalide";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendCode(email.trim());
      Alert.alert("Code envoyé", "Un nouveau code a été envoyé à votre email.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du renvoi";
      Alert.alert("Erreur", message);
    } finally {
      setResending(false);
    }
  };

  if (step === "verify") {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        bottomOffset={60}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Vérification
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Un code à 8 chiffres a été envoyé à{"\n"}
            <Text style={{ color: colors.primary }}>{email.trim()}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.muted }]}>
            Code de vérification
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="12345678"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            maxLength={8}
            style={[
              styles.input,
              styles.codeInput,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />

          <Pressable
            onPress={handleVerify}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || loading ? 0.75 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Valider</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleResend}
            disabled={resending}
            style={({ pressed }) => [styles.resendBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.resendText, { color: colors.muted }]}>
              {resending ? "Envoi en cours..." : "Renvoyer le code"}
            </Text>
          </Pressable>

          <Pressable onPress={() => setStep("register")} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              ← Retour
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
      ]}
      bottomOffset={60}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerArea}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Créer un compte
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Rejoignez l'assistant pédagogique GI
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.muted }]}>
          Nom complet (optionnel)
        </Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Votre nom"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="words"
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.muted }]}>
          Mot de passe
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          autoComplete="new-password"
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || loading ? 0.75 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>S'inscrire</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Déjà un compte ?{" "}
          </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Se connecter
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  headerArea: { marginBottom: 32 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6, lineHeight: 20 },
  form: { gap: 4 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resendBtn: { alignItems: "center", marginTop: 12 },
  resendText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  backBtn: { alignItems: "center", marginTop: 8 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
