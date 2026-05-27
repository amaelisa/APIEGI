import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { resendConfirmationCode, verifyEmailCode } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function VerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email, nom } = useLocalSearchParams<{ email: string; nom: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Veuillez entrer le code reçu par email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyEmailCode({ email: email || "", code: code.trim(), nom: nom || "" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/login");
    } catch (e: any) {
      setError(e.message || "Code invalide.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await resendConfirmationCode(email);
      setSuccess("Code renvoyé ! Vérifiez votre email.");
    } catch (e: any) {
      setError(e.message || "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : 0, paddingBottom: Platform.OS === "web" ? 34 : 0 }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.title}>Vérification</Text>
          <Text style={s.subtitle}>
            Un code a été envoyé à{"\n"}
            <Text style={{ color: colors.primary }}>{email}</Text>
          </Text>

          <View style={s.form}>
            <TextInput
              style={s.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
              textAlign="center"
            />

            {error ? <Text style={s.error}>{error}</Text> : null}
            {success ? <Text style={s.successText}>{success}</Text> : null}

            <Pressable
              onPress={handleVerify}
              disabled={loading}
              style={({ pressed }) => [s.btnWrap, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={["#3b82f6", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Confirmer</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleResend} disabled={resending} style={s.link}>
              {resending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={s.linkText}>
                  Pas reçu ?{" "}
                  <Text style={{ color: colors.primary }}>Renvoyer le code</Text>
                </Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace("/login")} style={s.link}>
              <Text style={s.linkText}>
                <Text style={{ color: colors.mutedForeground }}>Retour à la </Text>
                <Text style={{ color: colors.primary }}>connexion</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24 },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.primary, marginBottom: 10 },
    subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginBottom: 40, lineHeight: 22 },
    form: { width: "100%", maxWidth: 380, gap: 16, alignItems: "center" },
    codeInput: {
      width: "100%",
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingVertical: 18,
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: 8,
    },
    error: { color: colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    successText: { color: "#22c55e", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    btnWrap: { width: "100%", borderRadius: colors.radius, overflow: "hidden" },
    btn: { paddingVertical: 16, alignItems: "center" },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    link: { marginTop: 4 },
    linkText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
  });
