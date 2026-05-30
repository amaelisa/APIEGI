import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import {
  Matiere,
  Message,
  checkHealth,
  fetchChatHistory,
  fetchMatieres,
  sendChatMessage,
} from "@/lib/api";

const C = {
  bg: "#0d0e10",
  bgElevated: "#111315",
  bgHover: "#1a1d21",
  bgInput: "#1e293b",
  border: "#2d3238",
  borderSubtle: "rgba(45,50,56,0.6)",
  text: "#f1f5f9",
  muted: "#94a3b8",
  primary: "#3b82f6",
  accent: "#93c5fd",
  accentSoft: "rgba(59,130,246,0.18)",
  sendBtn: "#2563eb",
};

const NIVEAUX = ["L1", "L2", "L3"];

interface DisplayMessage extends Message {
  id: string;
  isError?: boolean;
}

const markdownStyles = {
  body: {
    color: C.text,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    backgroundColor: "transparent",
  },
  paragraph: { color: C.text, fontSize: 15, lineHeight: 22, marginBottom: 8, marginTop: 0 },
  strong: { color: C.text, fontFamily: "Inter_700Bold" },
  em: { color: C.text, fontStyle: "italic" as const },
  bullet_list: { color: C.text, marginLeft: 4, marginBottom: 6 },
  ordered_list: { color: C.text, marginLeft: 4, marginBottom: 6 },
  list_item: { color: C.text, fontSize: 15, lineHeight: 22 },
  code_inline: {
    backgroundColor: "#1a1d21",
    color: C.accent,
    fontSize: 13,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: "Inter_400Regular",
  },
  fence: {
    backgroundColor: "#1a1d21",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    color: C.accent,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  code_block: {
    backgroundColor: "#1a1d21",
    borderRadius: 8,
    padding: 12,
    color: C.accent,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  heading1: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8, marginTop: 4 },
  heading2: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6, marginTop: 4 },
  heading3: { color: C.text, fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 4, marginTop: 4 },
  blockquote: {
    backgroundColor: "rgba(59,130,246,0.08)",
    borderLeftColor: C.primary,
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 6,
    borderRadius: 4,
  },
  hr: { backgroundColor: C.border, height: 1, marginVertical: 12 },
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveauFilter, setNiveauFilter] = useState("L1");
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const sidebarAnim = useRef(new Animated.Value(-320)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  useEffect(() => {
    checkHealth().then(setApiOnline).catch(() => setApiOnline(false));
  }, []);

  const loadMatieres = useCallback(async (niveau: string) => {
    setLoadingMatieres(true);
    setError(null);
    try {
      const data = await fetchMatieres(niveau);
      setMatieres(data);
      setSelectedMatiere((prev) => {
        if (prev && data.some((m) => m.id === prev.id)) return prev;
        return data[0] || null;
      });
    } catch (e: any) {
      setError(e.message || "Erreur de chargement.");
    } finally {
      setLoadingMatieres(false);
    }
  }, []);

  useEffect(() => {
    loadMatieres(niveauFilter);
  }, [niveauFilter, loadMatieres]);

  useEffect(() => {
    if (!selectedMatiere) return;
    setMessages([]);
    setLoadingHistory(true);
    fetchChatHistory(selectedMatiere.id)
      .then((data) => {
        setMessages(
          (data.messages || []).map((m, i) => ({ ...m, id: `h-${i}` }))
        );
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [selectedMatiere]);

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
    setSelectedMatiere(m);
    closeSidebar();
  };

  const handleNiveauChange = (n: string) => {
    Haptics.selectionAsync();
    setNiveauFilter(n);
  };

  const handleNewChat = () => {
    Haptics.selectionAsync();
    setMessages([]);
    closeSidebar();
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeSidebar();
    await logout();
    router.replace("/login");
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !selectedMatiere) return;
    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const data = await sendChatMessage(selectedMatiere.id, text);
      const reply: DisplayMessage = { id: `a-${Date.now()}`, role: "assistant", content: data.reply || "" };
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e: any) {
      const err: DisplayMessage = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: `Erreur : ${e.message || "Impossible d'obtenir une réponse."}`,
        isError: true,
      };
      setMessages((prev) => [...prev, err]);
    } finally {
      setSending(false);
    }
  };

  const showWelcome = messages.length === 0 && !loadingHistory && !sending;

  return (
    <View style={s.root}>
      {/* ───── HEADER ───── */}
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
          <Text style={s.headerBrandTitle}>Assistant GI</Text>
        </View>
        <View style={s.headerMatiere}>
          {selectedMatiere ? (
            <>
              <Text style={s.headerTitle} numberOfLines={1}>
                {selectedMatiere.nom}
              </Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>{selectedMatiere.niveau || "GI"}</Text>
              </View>
            </>
          ) : (
            <Text style={s.headerTitleMuted}>Sélectionnez une matière</Text>
          )}
        </View>
      </View>

      {/* ───── CHAT AREA ───── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {loadingHistory ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[s.messageList, showWelcome && { flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              showWelcome ? (
                <View style={s.welcome}>
                  <Image
                    source={require("../assets/images/logo.png")}
                    style={s.welcomeLogo}
                    resizeMode="contain"
                  />
                  <Text style={s.welcomeTitle}>Assistant Pédagogique GI</Text>
                  <Text style={s.welcomeDesc}>
                    Posez vos questions sur la matière sélectionnée. L'assistante
                    Gemini vous répond dans le contexte du cursus Génie Informatique.
                  </Text>
                  {selectedMatiere ? (
                    <View style={s.chips}>
                      <Pressable
                        style={s.chip}
                        onPress={() =>
                          setInput("Peux-tu me donner un plan de révision pour cette matière ?")
                        }
                      >
                        <Text style={s.chipText}>Plan de révision</Text>
                      </Pressable>
                      <Pressable
                        style={s.chip}
                        onPress={() =>
                          setInput("Explique-moi les notions fondamentales de ce cours.")
                        }
                      >
                        <Text style={s.chipText}>Notions fondamentales</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : null
            }
            ListFooterComponent={
              sending ? (
                <View style={[s.msgRow, s.assistantRow]}>
                  <View style={s.avatar}>
                    <Image
                      source={require("../assets/images/logo.png")}
                      style={{ width: 28, height: 28, borderRadius: 6 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={[s.assistantBubble, s.typingBubble]}>
                    <ActivityIndicator size="small" color={C.accent} />
                    <Text style={s.typingText}>En train de répondre…</Text>
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[s.msgRow, item.role === "user" ? s.userRow : s.assistantRow]}>
                {item.role === "assistant" && (
                  <View style={s.avatar}>
                    <Image
                      source={require("../assets/images/logo.png")}
                      style={{ width: 28, height: 28, borderRadius: 6 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
                {item.role === "user" ? (
                  <LinearGradient
                    colors={["#1e3a5f", "#312e81", "#4c1d95"]}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.userBubble}
                  >
                    <Text style={s.userBubbleText}>{item.content}</Text>
                  </LinearGradient>
                ) : item.isError ? (
                  <View style={s.errorBubble}>
                    <Text style={s.errorBubbleText}>{item.content}</Text>
                  </View>
                ) : (
                  <View style={s.assistantBubble}>
                    <Markdown style={markdownStyles}>{item.content}</Markdown>
                  </View>
                )}
                {item.role === "user" && (
                  <View style={s.userAvatar}>
                    <Text style={s.userAvatarText}>Vous</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}

        {/* ───── INPUT BAR ───── */}
        <View style={[s.inputBar, { paddingBottom: bottomPad + 14 }]}>
          <View style={[s.inputPill, inputFocused && s.inputPillFocused]}>
            <TextInput
              style={s.textInput}
              placeholder={
                selectedMatiere
                  ? "Posez votre question ou importez un PDF…"
                  : "Choisissez une matière dans le menu"
              }
              placeholderTextColor={C.muted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              editable={!!selectedMatiere && !sending}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending || !selectedMatiere}
              style={({ pressed }) => [
                s.sendBtn,
                (!input.trim() || sending || !selectedMatiere) && s.sendBtnDisabled,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="send" size={17} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ───── SIDEBAR OVERLAY ───── */}
      {sidebarOpen && (
        <>
          <Animated.View
            style={[s.backdrop, { opacity: backdropAnim }]}
            pointerEvents="box-only"
          >
            <Pressable style={{ flex: 1 }} onPress={closeSidebar} />
          </Animated.View>

          <Animated.View style={[s.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
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
              <TouchableOpacity onPress={handleNewChat} style={s.btnNew} activeOpacity={0.75}>
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
                  style={[s.sidebarTab, niveauFilter === n && s.sidebarTabActive]}
                >
                  <Text style={[s.sidebarTabText, niveauFilter === n && s.sidebarTabTextActive]}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Matière list */}
            <ScrollView style={s.sidebarList} showsVerticalScrollIndicator={false}>
              <Text style={s.matiereListLabel}>
                Matières — {niveauFilter} ({matieres.length})
              </Text>
              {loadingMatieres ? (
                <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 20 }} />
              ) : error ? (
                <Text style={s.errorText}>{error}</Text>
              ) : (
                matieres.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => handleSelectMatiere(m)}
                    style={[
                      s.sidebarMatiereItem,
                      selectedMatiere?.id === m.id && s.sidebarMatiereItemActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.sidebarMatiereText,
                        selectedMatiere?.id === m.id && s.sidebarMatiereTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {m.nom}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Footer — status + logout */}
            <View style={[s.sidebarFooter, { paddingBottom: bottomPad + 10 }]}>
              <View style={s.healthRow}>
                <View
                  style={[
                    s.healthDot,
                    {
                      backgroundColor:
                        apiOnline === true ? "#4ade80"
                        : apiOnline === false ? "#f87171"
                        : C.muted,
                    },
                  ]}
                />
                <Text style={s.healthText}>
                  {apiOnline === true
                    ? "API connectée"
                    : apiOnline === false
                    ? "API hors ligne"
                    : "Vérification…"}
                </Text>
              </View>
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
  root: { flex: 1, backgroundColor: C.bg },

  // ─── Header ───
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
    backgroundColor: "rgba(13,14,16,0.92)",
    zIndex: 10,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuIcon: { fontSize: 20, color: C.text },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  headerBrandTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.accent },
  headerMatiere: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-end",
    flexWrap: "wrap",
    minWidth: 0,
  },
  headerTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.muted, flexShrink: 1 },
  headerTitleMuted: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.muted },
  badge: { backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, flexShrink: 0 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.accent },

  // ─── Messages ───
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  messageList: { paddingHorizontal: 16, paddingVertical: 20 },
  welcome: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    maxWidth: 540,
    alignSelf: "center",
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  welcomeLogo: { width: 56, height: 56, borderRadius: 12, marginBottom: 20 },
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 28 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgElevated,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.muted },

  msgRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20 },
  userRow: { flexDirection: "row-reverse" },
  assistantRow: { flexDirection: "row" },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "transparent", overflow: "hidden", flexShrink: 0 },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(59,130,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatarText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: C.accent },
  userBubble: {
    maxWidth: "82%",
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  userBubbleText: { color: "#fff", fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  assistantBubble: { maxWidth: "82%", paddingHorizontal: 4, paddingVertical: 4, flex: 1, minWidth: 0 },
  typingBubble: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12 },
  typingText: { color: C.muted, marginLeft: 8, fontSize: 14, fontFamily: "Inter_400Regular" },
  errorBubble: {
    maxWidth: "82%",
    backgroundColor: "rgba(251,191,36,0.1)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  errorBubbleText: { color: "#fcd34d", fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },

  // ─── Input bar ───
  inputBar: { paddingHorizontal: 14, paddingTop: 14, backgroundColor: C.bg },
  inputPill: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
  },
  inputPillFocused: { borderColor: C.primary },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.sendBtn,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.35 },

  // ─── Sidebar backdrop ───
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 100 },

  // ─── Sidebar ───
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
  sidebarBrand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sidebarLogo: { width: 28, height: 28, borderRadius: 6 },
  sidebarTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: C.accent },
  btnNew: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  btnNewText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.accent },
  userPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  userMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.muted, marginTop: 3 },
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
  sidebarTabActive: { backgroundColor: "rgba(59,130,246,0.25)" },
  sidebarTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.muted },
  sidebarTabTextActive: { color: "#e0e7ff" },
  sidebarList: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
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
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 44,
    justifyContent: "center",
  },
  sidebarMatiereItemActive: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(96,165,250,0.35)",
  },
  sidebarMatiereText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, lineHeight: 18 },
  sidebarMatiereTextActive: { color: "#bfdbfe" },
  errorText: { color: "#f87171", fontSize: 13, fontFamily: "Inter_400Regular", padding: 12 },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },
  healthRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.muted },
  btnLogout: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  btnLogoutText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.muted },
});
