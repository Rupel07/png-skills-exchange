import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { registerForPushNotifications } from "../services/notifications";

export function usePushNotifications() {
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user && active) {
          await registerForPushNotifications(data.user.id);
        }
      } catch (e: any) {
        console.log("Push hook error:", e?.message ?? e);
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
