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
import { useAuth } from "@/context/AuthContext";
import { resendConfirmationCode, verifyEmailCode } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function VerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { email, nom } = useLocalSearchParams<{ email: string; nom: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setSuccess("Un nouveau code a été envoyé à votre email.");
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
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>Vérification email</Text>
          <Text style={s.subtitle}>
            Un code de confirmation a été envoyé à{"\n"}
            <Text style={{ color: colors.primary }}>{email}</Text>
          </Text>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Code de confirmation</Text>
              <TextInput
                style={[s.input, s.codeInput]}
                placeholder="12345678"
                placeholderTextColor={colors.mutedForeground}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={8}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                textAlign="center"
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}
            {success ? <Text style={s.success}>{success}</Text> : null}

            <Pressable
              onPress={handleVerify}
              disabled={loading}
              style={({ pressed }) => [s.btnWrap, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={["#3b82f6", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Vérifier</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleResend} disabled={resending} style={s.link}>
              {resending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={s.linkText}>
                  Pas reçu le code ?{" "}
                  <Text style={{ color: colors.primary }}>Renvoyer</Text>
                </Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={s.link}>
              <Text style={s.linkText}>
                <Text style={{ color: colors.primary }}>← Retour</Text>
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
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.primary, marginBottom: 6 },
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 40, textAlign: "center", lineHeight: 22 },
    form: { width: "100%", maxWidth: 380, gap: 16 },
    field: { gap: 8 },
    label: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    codeInput: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      letterSpacing: 8,
      paddingVertical: 18,
    },
    error: { color: colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    success: { color: "#22c55e", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    btnWrap: { marginTop: 8, borderRadius: colors.radius, overflow: "hidden" },
    btn: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    link: { alignItems: "center", marginTop: 4 },
    linkText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
  });
