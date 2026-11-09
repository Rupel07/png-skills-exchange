import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Coords, getCurrentCoords } from "../services/location";
import { getSkills } from "../services/skills";
import { Skill } from "../types/skills";
import { distanceKm } from "../utils/distance";

type Located = Skill & { latitude: number; longitude: number };
export type MappedSkill = Located & { distanceKm: number | null };
export type LocationPermission = "granted" | "denied" | "unavailable";

export type NearbyState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      user: Coords | null;
      permission: LocationPermission;
      canAskAgain: boolean;
      skills: MappedSkill[];
    };

export function useNearbySkills() {
  const [state, setState] = useState<NearbyState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [all, location] = await Promise.all([
        getSkills(),
        getCurrentCoords(),
      ]);
      const user = location.status === "granted" ? location.coords : null;

      const skills = all
        .filter((s): s is Located => s.latitude != null && s.longitude != null)
        .map((s) => ({ ...s, distanceKm: user ? distanceKm(user, s) : null }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

      setState({
        status: "ready",
        user,
        permission: location.status,
        canAskAgain: location.status === "denied" ? location.canAskAgain : true,
        skills,
      });
    } catch {
      setState({
        status: "error",
        message: "Could not load skills. Check your connection and try again.",
      });
    }
  }, []);

  // Reload whenever the tab is opened, so new skills and permission changes show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { state, reload: load };
}
