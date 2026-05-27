import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Matiere } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface SubjectPickerProps {
  visible: boolean;
  matieres: Matiere[];
  selectedId: string | null;
  onSelect: (m: Matiere) => void;
  onClose: () => void;
}

const LEVEL_ORDER = ["L1", "L2", "L3"];

function groupByLevel(matieres: Matiere[]) {
  const groups: Record<string, Matiere[]> = {};
  for (const m of matieres) {
    const lvl = m.niveau ?? "Autre";
    if (!groups[lvl]) groups[lvl] = [];
    groups[lvl].push(m);
  }
  return LEVEL_ORDER.filter((l) => groups[l])
    .map((l) => ({ title: l, data: groups[l] }))
    .concat(
      Object.keys(groups)
        .filter((k) => !LEVEL_ORDER.includes(k))
        .map((k) => ({ title: k, data: groups[k] }))
    );
}

export function SubjectPicker({
  visible,
  matieres,
  selectedId,
  onSelect,
  onClose,
}: SubjectPickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const sections = groupByLevel(matieres);

  const handleSelect = (m: Matiere) => {
    Haptics.selectionAsync();
    onSelect(m);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.handle} />
        <View
          style={[styles.header, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Choisir une matière
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View
              style={[styles.sectionHeader, { backgroundColor: colors.surface }]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.primary }]}
              >
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
                style={[
                  styles.item,
                  {
                    backgroundColor: isSelected
                      ? colors.userBubble
                      : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.itemText,
                    {
                      color: isSelected ? colors.accent : colors.foreground,
                      fontFamily: isSelected
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {item.nom_matiere}
                </Text>
                {isSelected && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a3d4a",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginVertical: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
});
