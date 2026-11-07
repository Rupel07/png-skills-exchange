import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";

// Show notifications even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

export async function registerForPushNotifications(userId: string) {
  try {
    if (!Device.isDevice) return null; // push is tested on a real phone

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.log("Push: no EAS projectId found, run eas init");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    currentToken = token;

    const { error } = await supabase
      .from("push_tokens")
      .upsert({ token, user_id: userId });
    if (error) console.log("Push token save error:", error.message);

    return token;
  } catch (e: any) {
    console.log("Push registration failed:", e?.message ?? e);
    return null;
  }
}

// Called on logout, so the next user on this phone doesn't get your notifications.
export async function removePushToken() {
  if (!currentToken) return;
  await supabase.from("push_tokens").delete().eq("token", currentToken);
  currentToken = null;
}
