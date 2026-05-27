import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export interface AttachedFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

interface ChatInputProps {
  onSend: (text: string, file: AttachedFile | null) => void;
  sending: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, sending, disabled }: ChatInputProps) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachedFile | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleAttach = async () => {
    if (Platform.OS === "web") return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "*/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? undefined,
          size: asset.size ?? undefined,
        });
      }
    } catch {
      // user cancelled or picker failed — ignore
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !file) || sending || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed, file);
    setText("");
    setFile(null);
    inputRef.current?.focus();
  };

  const canSend = (text.trim().length > 0 || file !== null) && !sending && !disabled;

  return (
    <View style={styles.wrapper}>
      {file !== null && (
        <View style={[styles.fileTag, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
          <Feather name="file-text" size={12} color={colors.primary} />
          <Text style={[styles.fileName, { color: colors.primary }]} numberOfLines={1}>
            {file.name}
          </Text>
          <TouchableOpacity onPress={() => setFile(null)} hitSlop={8}>
            <Feather name="x" size={12} color={colors.muted} />
          </TouchableOpacity>
        </View>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.input,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        {Platform.OS !== "web" && (
          <Pressable
            onPress={handleAttach}
            disabled={sending || disabled}
            style={({ pressed }) => [
              styles.attachBtn,
              { opacity: pressed || disabled ? 0.5 : 1 },
            ]}
          >
            <Feather name="paperclip" size={18} color={colors.muted} />
          </Pressable>
        )}
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={file ? "Ajouter un message (optionnel)..." : "Posez votre question..."}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          multiline
          maxLength={2000}
          returnKeyType="default"
          onSubmitEditing={Platform.OS === "ios" ? undefined : handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: canSend ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={16} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  fileTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    maxWidth: "90%",
  },
  fileName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  attachBtn: {
    padding: 4,
    alignSelf: "flex-end",
    marginBottom: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
