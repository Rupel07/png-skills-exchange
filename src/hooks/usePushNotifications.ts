import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

async function registerForPushNotifications(userId: string) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const { status } =
    existingStatus === "granted"
      ? { status: existingStatus }
      : await Notifications.requestPermissionsAsync();

  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);
}

export function usePushNotifications() {
  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user && active) {
        await registerForPushNotifications(data.user.id);
      }
    })();

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const requestId = response.notification.request.content.data?.requestId;
        if (typeof requestId === "string") {
          router.push({
            pathname: "/requests/[id]",
            params: { id: requestId },
          });
        }
      },
    );

    return () => {
      active = false;
      sub.remove();
    };
  }, []);
}
