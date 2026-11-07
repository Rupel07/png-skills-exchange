import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1e88e5" }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Skills",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🛠️</Text>,
        }}
      />

      <Tabs.Screen
        name="my-requests"
        options={{
          title: "Requests",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📨</Text>,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>◎</Text>
          ),
        }}
      />
    </Tabs>
  );
}
