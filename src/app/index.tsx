import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function Index() {
  const [status, setStatus] = useState("Checking Supabase...");

  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      setStatus(error ? `Error: ${error.message}` : "Supabase connected ✅");
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{status}</Text>
    </View>
  );
}
