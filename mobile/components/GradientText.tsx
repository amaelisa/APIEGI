import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Text, TextStyle } from "react-native";

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
    backgroundColor: "transparent",
    ...style,
  };

  return (
    <MaskedView maskElement={<Text style={textStyle}>{text}</Text>}>
      <LinearGradient
        colors={["#60a5fa", "#a78bfa", "#c084fc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[textStyle, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
