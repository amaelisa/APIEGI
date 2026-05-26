import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Message, fetchChatHistory, sendChatMessage } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface DisplayMessage extends Message {
  id: string;
  pending?: boolean;
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { matiereId, matiereName } = useLocalSearchParams<{
    matiereId: string;
    matiereName: string;
  }>();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [matiereId]);

  const loadHistory = async () => {
    if (!matiereId) return;
    setLoading(true);
    try {
      const data = await fetchChatHistory(matiereId);
      const msgs = Array.isArray(data?.messages) ? data.messages : Array.isArray(data) ? (data as any) : [];
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

    try {
      const data = await sendChatMessage(matiereId, text);
      const assistantMsg: DisplayMessage = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        content: data.response || data.content || String(data),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errMsg: DisplayMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Erreur: ${e.message || "Impossible d'obtenir une réponse."}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const s = styles(colors);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const reversedMessages = [...messages].reverse();

  return (
    <View style={[s.container]}>
      <View style={[s.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {matiereName || "Chat"}
          </Text>
          <View style={s.onlineDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={0}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={reversedMessages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={s.messageList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!!reversedMessages.length}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              sending ? (
                <View style={[s.bubble, s.assistantBubble, { flexDirection: "row", gap: 6 }]}>
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                  <Text style={[s.bubbleText, { color: colors.mutedForeground }]}>
                    En train de répondre...
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={[
                  s.bubbleRow,
                  item.role === "user" ? s.userRow : s.assistantRow,
                ]}
              >
                {item.role === "assistant" && (
                  <View style={s.avatar}>
                    <Feather name="cpu" size={14} color={colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    s.bubble,
                    item.role === "user" ? s.userBubble : s.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      s.bubbleText,
                      item.role === "user" ? s.userText : s.assistantText,
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        <View style={[s.inputBar, { paddingBottom: bottomPad + 12 }]}>
          <TextInput
            style={s.textInput}
            placeholder="Posez votre question..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={({ pressed }) => [
              s.sendBtn,
              (!input.trim() || sending) && s.sendBtnDisabled,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { width: 40, alignItems: "flex-start" },
    headerTitleWrap: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
    headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, maxWidth: "80%" },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 4 },
    userRow: { justifyContent: "flex-end" },
    assistantRow: { justifyContent: "flex-start" },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: `${colors.primary}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    bubble: {
      maxWidth: "78%",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
    userText: { color: "#fff" },
    assistantText: { color: colors.foreground },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      maxHeight: 120,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: colors.border },
  });
