import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ChatBubble";
import { AttachedFile, ChatInput } from "@/components/ChatInput";
import { SubjectPicker } from "@/components/SubjectPicker";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  ChatMessage,
  Matiere,
  fetchChatHistory,
  fetchMatieres,
  sendChatMessage,
} from "@/lib/api";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user, signOut } = useAuth();

  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loadingMatieres, setLoadingMatieres] = useState(true);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const data = await fetchMatieres(token);
        setMatieres(data);
      } catch {
        Alert.alert("Erreur", "Impossible de charger les matières.");
      } finally {
        setLoadingMatieres(false);
      }
    };
    void load();
  }, [token]);

  useEffect(() => {
    if (!selectedMatiere || !token) {
      setMessages([]);
      return;
    }
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const history = await fetchChatHistory(selectedMatiere.id, token);
        setMessages(history.slice().reverse());
      } catch {
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    void loadHistory();
  }, [selectedMatiere, token]);

  const handleSend = useCallback(
    async (text: string, file: AttachedFile | null) => {
      if (!selectedMatiere || !token) return;
      const userContent = file
        ? `[Fichier joint : ${file.name}]${text ? `\n\n${text}` : ""}`
        : text;
      const userMsg: ChatMessage = { role: "user", content: userContent };
      setMessages((prev) => [userMsg, ...prev]);
      setSending(true);
      const capturedToken = token;
      const capturedMatiereId = selectedMatiere.id;
      try {
        const res = await sendChatMessage(capturedMatiereId, text, capturedToken, file);
        const aiMsg: ChatMessage = {
          role: "assistant",
          content: res.reply,
          isRejected: res.autorise === false,
        };
        setMessages((prev) => [aiMsg, ...prev]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
        Alert.alert("Erreur", message);
        setMessages((prev) => prev.slice(1));
      } finally {
        setSending(false);
      }
    },
    [selectedMatiere, token]
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.8}
          style={[styles.subjectBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <Feather name="book-open" size={15} color={colors.primary} />
          <Text
            style={[styles.subjectBtnText, { color: selectedMatiere ? colors.foreground : colors.muted }]}
            numberOfLines={1}
          >
            {selectedMatiere ? selectedMatiere.nom_matiere : "Choisir une matière"}
          </Text>
          <Feather name="chevron-down" size={14} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignOut} hitSlop={10} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {!selectedMatiere ? (
          <View style={styles.emptyState}>
            {loadingMatieres ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : (
              <>
                <Feather name="book" size={48} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Sélectionnez une matière
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  Choisissez une matière pour commencer à discuter avec l'IA
                </Text>
                <TouchableOpacity
                  onPress={() => setPickerVisible(true)}
                  activeOpacity={0.8}
                  style={[styles.pickBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.pickBtnText}>Choisir une matière</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <>
            {loadingHistory ? (
              <View style={styles.centerLoader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
                inverted
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                  <View style={styles.chatEmpty}>
                    <Feather name="message-circle" size={32} color={colors.border} />
                    <Text style={[styles.chatEmptyText, { color: colors.muted }]}>
                      Posez votre première question sur{"\n"}
                      <Text style={{ color: colors.primary }}>{selectedMatiere.nom_matiere}</Text>
                    </Text>
                  </View>
                }
              />
            )}
            <View
              style={[
                styles.inputBar,
                {
                  paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8,
                  backgroundColor: colors.background,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <ChatInput onSend={handleSend} sending={sending} disabled={!selectedMatiere} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <SubjectPicker
        visible={pickerVisible}
        matieres={matieres}
        selectedId={selectedMatiere?.id ?? null}
        onSelect={setSelectedMatiere}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  subjectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  subjectBtnText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  logoutBtn: {
    padding: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  pickBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  pickBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  chatEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 80,
  },
  chatEmptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
