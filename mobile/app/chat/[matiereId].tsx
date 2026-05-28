import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Message, fetchChatHistory, sendChatMessage } from "@/lib/api";

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
  userBubbleBg: "#1e3a5f",
  sendBtn: "#2563eb",
};

interface DisplayMessage extends Message {
  id: string;
  isError?: boolean;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { matiereId, matiereName } = useLocalSearchParams<{
    matiereId: string;
    matiereName: string;
  }>();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, [matiereId]);

  const loadHistory = async () => {
    if (!matiereId) return;
    setLoading(true);
    try {
      const data = await fetchChatHistory(matiereId);
      const msgs = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(
        msgs.map((m: Message, i: number) => ({
          ...m,
          id: `history-${i}`,
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !matiereId) return;

    const userMsg: DisplayMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const data = await sendChatMessage(matiereId, text);
      const assistantMsg: DisplayMessage = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        content: data.reply || "",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e: any) {
      const errMsg: DisplayMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Erreur: ${e.message || "Impossible d'obtenir une réponse."}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const showWelcome = messages.length === 0 && !loading;

  return (
    <View style={s.container}>
      {/* HEADER — mirrors ChatArea.css .chat-header */}
      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.back()} style={s.menuBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <View style={s.headerBrand}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={s.headerLogo}
            resizeMode="contain"
          />
          <Text style={s.headerBrandTitle}>Assistant GI</Text>
        </View>
        <View style={s.headerMatiere}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {matiereName || "Sélectionnez une matière"}
          </Text>
          {matiereName ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>GI</Text>
            </View>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              showWelcome ? (
                <View style={s.welcome}>
                  <View style={s.welcomeIconWrap}>
                    <Image
                      source={require("../../assets/images/logo.png")}
                      style={s.welcomeLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={s.welcomeTitle}>Assistant Pédagogique GI</Text>
                  <Text style={s.welcomeDesc}>
                    Posez vos questions sur la matière sélectionnée. L'assistante
                    Gemini vous répond dans le contexte du cursus Génie Informatique.
                  </Text>
                  {matiereName ? (
                    <View style={s.chips}>
                      <Pressable
                        style={s.chip}
                        onPress={() => {
                          setInput("Peux-tu me donner un plan de révision pour cette matière ?");
                        }}
                      >
                        <Text style={s.chipText}>Plan de révision</Text>
                      </Pressable>
                      <Pressable
                        style={s.chip}
                        onPress={() => {
                          setInput("Explique-moi les notions fondamentales de ce cours.");
                        }}
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
                      source={require("../../assets/images/logo.png")}
                      style={{ width: 28, height: 28, borderRadius: 6 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={[s.bubble, s.assistantBubble, s.typingBubble]}>
                    <ActivityIndicator size="small" color={C.accent} />
                    <Text style={[s.bubbleText, { color: C.muted, marginLeft: 8 }]}>
                      En train de répondre…
                    </Text>
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[s.msgRow, item.role === "user" ? s.userRow : s.assistantRow]}>
                {item.role === "assistant" && (
                  <View style={s.avatar}>
                    <Image
                      source={require("../../assets/images/logo.png")}
                      style={{ width: 28, height: 28, borderRadius: 6 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
                <View
                  style={[
                    s.bubble,
                    item.role === "user" ? s.userBubble : s.assistantBubble,
                    item.isError && s.errorBubble,
                  ]}
                >
                  <Text
                    style={[
                      s.bubbleText,
                      item.role === "user" ? s.userBubbleText : s.assistantBubbleText,
                      item.isError && s.errorBubbleText,
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
                {item.role === "user" && (
                  <View style={s.userAvatar}>
                    <Text style={s.userAvatarText}>Vous</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}

        {/* INPUT BAR — mirrors .chat-input-pill */}
        <View style={[s.inputBar, { paddingBottom: bottomPad + 14 }]}>
          <View style={[s.inputPill, inputFocused && s.inputPillFocused]}>
            <TextInput
              style={s.textInput}
              placeholder={
                matiereName
                  ? "Posez votre question…"
                  : "Choisissez une matière dans le menu"
              }
              placeholderTextColor={C.muted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              returnKeyType="default"
              editable={!!matiereName}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending || !matiereName}
              style={({ pressed }) => [
                s.sendBtn,
                (!input.trim() || sending || !matiereName) && s.sendBtnDisabled,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="send" size={17} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
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
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerBrandTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: C.accent,
  },
  headerMatiere: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-end",
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.muted,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: C.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.accent,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  welcome: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    maxWidth: 540,
    alignSelf: "center",
    width: "100%",
  },
  welcomeIconWrap: {
    marginBottom: 20,
  },
  welcomeLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 28,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgElevated,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.muted,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: "row-reverse",
  },
  assistantRow: {
    flexDirection: "row",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    overflow: "hidden",
    flexShrink: 0,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(59,130,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: C.accent,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: C.userBubbleBg,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorBubble: {
    backgroundColor: "rgba(251,191,36,0.1)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  userBubbleText: {
    color: "#fff",
  },
  assistantBubbleText: {
    color: C.text,
  },
  errorBubbleText: {
    color: "#fcd34d",
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: C.bg,
  },
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
  inputPillFocused: {
    borderColor: C.primary,
  },
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
  sendBtnDisabled: {
    opacity: 0.35,
  },
});
