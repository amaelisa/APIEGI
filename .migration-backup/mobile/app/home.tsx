import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Matiere, fetchMatieres } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const NIVEAUX = ["Tous", "L1", "L2", "L3", "M1", "M2"];

const SUBJECT_ICONS: Record<string, string> = {
  default: "book",
  math: "hash",
  algo: "cpu",
  réseau: "wifi",
  base: "database",
  sys: "settings",
  prog: "code",
  web: "globe",
  ia: "zap",
  sécurité: "shield",
};

function getIcon(nom: string): string {
  const lower = nom.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return SUBJECT_ICONS.default;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [niveau, setNiveau] = useState("Tous");

  useEffect(() => {
    loadMatieres();
  }, [niveau]);

  const loadMatieres = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMatieres(niveau === "Tous" ? null : niveau);
      setMatieres(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  };

  const s = styles(colors);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[s.container, { paddingBottom: bottomPad }]}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={s.greeting}>Bonjour,</Text>
          <Text style={s.userName}>{user?.nom || "Étudiant"}</Text>
        </View>
        <Pressable onPress={handleLogout} style={s.logoutBtn}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterWrap}
      >
        {NIVEAUX.map((n) => (
          <Pressable
            key={n}
            onPress={() => {
              Haptics.selectionAsync();
              setNiveau(n);
            }}
            style={[s.filterChip, niveau === n && s.filterChipActive]}
          >
            <Text style={[s.filterText, niveau === n && s.filterTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.sectionTitle}>Matières</Text>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={s.errorText}>{error}</Text>
          <Pressable onPress={loadMatieres} style={s.retryBtn}>
            <Text style={s.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : matieres.length === 0 ? (
        <View style={s.center}>
          <Feather name="book-open" size={40} color={colors.mutedForeground} />
          <Text style={s.emptyText}>Aucune matière disponible</Text>
        </View>
      ) : (
        <FlatList
          data={matieres}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!matieres.length}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/chat/[matiereId]", params: { matiereId: item.id, matiereName: item.nom } });
              }}
              style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={s.iconBox}>
                <Feather name={getIcon(item.nom) as any} size={22} color={colors.primary} />
              </View>
              <View style={s.cardContent}>
                <Text style={s.cardTitle}>{item.nom}</Text>
                {item.description ? (
                  <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                {item.niveau ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{item.niveau}</Text>
                  </View>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    logoutBtn: { padding: 8 },
    filterWrap: { maxHeight: 52 },
    filterRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    filterTextActive: { color: "#fff" },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    errorText: { color: colors.destructive, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
    emptyText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.card, borderRadius: colors.radius },
    retryText: { color: colors.primary, fontSize: 14, fontFamily: "Inter_500Medium" },
    listContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.primary}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 18 },
    badge: {
      alignSelf: "flex-start",
      backgroundColor: `${colors.accent}33`,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.accent },
  });
