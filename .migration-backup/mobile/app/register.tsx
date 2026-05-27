import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { registerUser } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!nom.trim() || !email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError("");
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

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : 0, paddingBottom: Platform.OS === "web" ? 34 : 0 }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>Créer un compte</Text>
          <Text style={s.subtitle}>Rejoignez l'assistant pédagogique GI</Text>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Nom complet</Text>
              <TextInput
                style={s.input}
                placeholder="Votre nom"
                placeholderTextColor={colors.mutedForeground}
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="etudiant@univ.fr"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [s.btnWrap, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={["#3b82f6", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>S'inscrire</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => router.back()} style={s.link}>
              <Text style={s.linkText}>
                Déjà un compte ?{" "}
                <Text style={{ color: colors.primary }}>Se connecter</Text>
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
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 40, textAlign: "center" },
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
    error: { color: colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    btnWrap: { marginTop: 8, borderRadius: colors.radius, overflow: "hidden" },
    btn: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    link: { alignItems: "center", marginTop: 4 },
    linkText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
  });
