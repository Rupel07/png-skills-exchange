import { Tabs } from "expo-router";
import { StyleSheet, Text, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePushNotifications } from "../../hooks/usePushNotifications";

const ACTIVE = "#1F6FEB";
const INACTIVE = "#8A94A6";

type IconProps = { color: ColorValue | null; focused: boolean; size: number };

const tabIcon =
  (glyph: string) =>
  ({ color, size }: IconProps) => (
    <Text
      style={{ color: color ?? INACTIVE, fontSize: size, lineHeight: size }}
    >
      {glyph}
    </Text>
  );

export default function TabLayout() {
  usePushNotifications();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerTitleStyle: { fontWeight: "700", color: "#222" },
        headerStyle: { backgroundColor: "#fff" },
        headerShadowVisible: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "#E3E6EB",
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("⌂") }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Skills",
          tabBarIcon: tabIcon("▣"),
        }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{
          title: "Requests",
          tabBarIcon: tabIcon("✉"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: tabIcon(" 👤"),
        }}
      />
    </Tabs>
  );
}
