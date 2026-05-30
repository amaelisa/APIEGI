import { LinearGradient } from "expo-linear-gradient";
import { Platform, Text, TextStyle, View } from "react-native";

interface GradientTextProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  style?: TextStyle;
}

export function GradientText({
  text,
  fontSize = 22,
  fontFamily = "Inter_700Bold",
  style,
}: GradientTextProps) {
  const textStyle: TextStyle = {
    fontSize,
    fontFamily,
    textAlign: "center",
    marginBottom: 6,
    ...style,
  };

  if (Platform.OS === "web") {
    return (
      <Text
        style={[
          textStyle,
          {
            background: "linear-gradient(90deg, #60a5fa, #a78bfa, #c084fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          } as unknown as TextStyle,
        ]}
      >
        {text}
      </Text>
    );
  }

  return (
    <Text style={[textStyle, { color: "#c4b5fd" }]}>{text}</Text>
  );
}
