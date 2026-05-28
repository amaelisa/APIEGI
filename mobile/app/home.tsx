import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Matiere, fetchMatieres } from "@/lib/api";

const C = {
  bg: "#0d0e10",
  bgElevated: "#111315",
  bgHover: "#1a1d21",
  border: "#2d3238",
  text: "#f1f5f9",
  muted: "#94a3b8",
  primary: "#3b82f6",
  accent: "#93c5fd",
  accentSoft: "rgba(59,130,246,0.18)",
};

const NIVEAUX = ["L1", "L2", "L3"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [niveau, setNiveau] = useState("L1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-320)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMatieres();
  }, [niveau]);

  const loadMatieres = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMatieres(niveau);
      setMatieres(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeSidebar();
    await logout();
    router.replace("/login");
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: -320, useNativeDriver: true, damping: 20, stiffness: 150 }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const handleSelectMatiere = (m: Matiere) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeSidebar();
    router.push({ pathname: "/chat/[matiereId]", params: { matiereId: m.id, matiereName: m.nom } });
  };

  const handleNiveauChange = (n: string) => {
    Haptics.selectionAsync();
    setNiveau(n);
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={s.root}>
      {/* HEADER */}
      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={openSidebar} style={s.menuBtn} hitSlop={8}>
          <Text style={s.menuIcon}>☰</Text>
        </Pressable>
        <View style={s.headerBrand}>
          <Image
            source={require("../assets/images/logo.png")}
            style={s.headerLogo}
            resizeMode="contain"
          />
          <Text style={s.headerTitle}>Assistant GI</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* WELCOME */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.welcome}>
          <View style={s.welcomeIcon}>
            <Image
              source={require("../assets/images/logo.png")}
              style={{ width: 56, height: 56, borderRadius: 12 }}
              resizeMode="contain"
            />
          </View>
          <Text style={s.welcomeTitle}>Assistant Pédagogique GI</Text>
          <Text style={s.welcomeDesc}>
            Sélectionnez une matière dans le menu pour commencer à poser vos questions.
            L'assistant Gemini vous répond dans le contexte du cursus Génie Informatique.
          </Text>
        </View>

        {/* NIVEAU TABS */}
        <View style={s.niveauTabs}>
          {NIVEAUX.map((n) => (
            <Pressable
              key={n}
              onPress={() => handleNiveauChange(n)}
              style={[s.niveauTab, niveau === n && s.niveauTabActive]}
            >
              <Text style={[s.niveauTabText, niveau === n && s.niveauTabTextActive]}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* MATIERE LIST */}
        <Text style={s.sectionLabel}>
          Matières — {niveau} ({matieres.length})
        </Text>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Feather name="alert-circle" size={36} color="#f87171" />
            <Text style={s.errorText}>{error}</Text>
            <Pressable onPress={loadMatieres} style={s.retryBtn}>
              <Text style={s.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : matieres.length === 0 ? (
          <View style={s.center}>
            <Feather name="book-open" size={36} color={C.muted} />
            <Text style={s.emptyText}>Aucune matière pour {niveau}.</Text>
          </View>
        ) : (
          matieres.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => handleSelectMatiere(m)}
              style={s.matiereItem}
              activeOpacity={0.7}
            >
              <Text style={s.matiereText} numberOfLines={2}>{m.nom}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <>
          <Animated.View
            style={[s.backdrop, { opacity: backdropAnim }]}
            pointerEvents="box-only"
          >
            <Pressable style={{ flex: 1 }} onPress={closeSidebar} />
          </Animated.View>

          <Animated.View
            style={[s.sidebar, { transform: [{ translateX: sidebarAnim }] }]}
          >
            {/* Sidebar header */}
            <View style={[s.sidebarHeader, { paddingTop: topPad + 10 }]}>
              <View style={s.sidebarBrand}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={s.sidebarLogo}
                  resizeMode="contain"
                />
                <Text style={s.sidebarTitle}>Assistant GI</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  closeSidebar();
                  setTimeout(() => {
                    const m = matieres[0];
                    if (m) handleSelectMatiere(m);
                  }, 300);
                }}
                style={s.btnNew}
                activeOpacity={0.75}
              >
                <Text style={s.btnNewText}>+ Nouvelle discussion</Text>
              </TouchableOpacity>
            </View>

            {/* User panel */}
            {user && (
              <View style={s.userPanel}>
                <Text style={s.userName}>{user.nom}</Text>
                <Text style={s.userMeta}>{user.email}</Text>
              </View>
            )}

            {/* Niveau tabs */}
            <View style={s.sidebarNiveaux}>
              {NIVEAUX.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => handleNiveauChange(n)}
                  style={[s.sidebarTab, niveau === n && s.sidebarTabActive]}
                >
                  <Text style={[s.sidebarTabText, niveau === n && s.sidebarTabTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>

            {/* Matiere list */}
            <ScrollView style={s.sidebarList} showsVerticalScrollIndicator={false}>
              <Text style={s.matiereListLabel}>
                Matières — {niveau} ({matieres.length})
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 20 }} />
              ) : (
                matieres.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => handleSelectMatiere(m)}
                    style={s.sidebarMatiereItem}
                    activeOpacity={0.7}
                  >
                    <Text style={s.sidebarMatiereText} numberOfLines={2}>{m.nom}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[s.sidebarFooter, { paddingBottom: bottomPad + 10 }]}>
              <TouchableOpacity onPress={handleLogout} style={s.btnLogout} activeOpacity={0.75}>
                <Text style={s.btnLogoutText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,50,56,0.6)",
    backgroundColor: "rgba(13,14,16,0.92)",
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    fontSize: 20,
    color: C.text,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: C.accent,
  },
  content: {
    padding: 20,
    gap: 0,
  },
  welcome: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    maxWidth: 540,
    alignSelf: "center",
    width: "100%",
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.accent,
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  niveauTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  niveauTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: C.bgHover,
    alignItems: "center",
  },
  niveauTabActive: {
    backgroundColor: "rgba(59,130,246,0.25)",
  },
  niveauTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.muted,
  },
  niveauTabTextActive: {
    color: "#e0e7ff",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  retryText: {
    color: C.accent,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  matiereItem: {
    width: "100%",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 6,
  },
  matiereText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    lineHeight: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 100,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: C.bgElevated,
    borderRightWidth: 1,
    borderRightColor: C.border,
    zIndex: 200,
    flexDirection: "column",
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sidebarLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  sidebarTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: C.accent,
  },
  btnNew: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
    alignItems: "center",
  },
  btnNewText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.accent,
  },
  userPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  userName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  userMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    marginTop: 3,
  },
  sidebarNiveaux: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sidebarTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: C.bgHover,
    alignItems: "center",
  },
  sidebarTabActive: {
    backgroundColor: "rgba(59,130,246,0.25)",
  },
  sidebarTabText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.muted,
  },
  sidebarTabTextActive: {
    color: "#e0e7ff",
  },
  sidebarList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  matiereListLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 4,
    paddingBottom: 8,
    paddingTop: 4,
  },
  sidebarMatiereItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  sidebarMatiereText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.muted,
    lineHeight: 18,
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  btnLogout: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  btnLogoutText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.muted,
  },
});
