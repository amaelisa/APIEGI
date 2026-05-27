import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const colors = useColors();
  const isUser = role === "user";

  return (
    <View
      style={[
        styles.wrapper,
        isUser ? styles.wrapperUser : styles.wrapperAI,
      ]}
    >
      {!isUser && (
        <View
          style={[styles.avatar, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.avatarText}>IA</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.userBubble, borderColor: colors.primary }]
            : [styles.bubbleAI, { backgroundColor: colors.aiBubble, borderColor: colors.border }],
          { maxWidth: "78%" },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? "#dbeafe" : colors.foreground },
          ]}
        >
          {content}
        </Text>
        {timestamp ? (
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timestamp}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  wrapperUser: {
    justifyContent: "flex-end",
  },
  wrapperAI: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    marginBottom: 2,
  },
  avatarText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  time: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
