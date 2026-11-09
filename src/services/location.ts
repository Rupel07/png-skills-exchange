import * as Location from "expo-location";

export type Coords = { latitude: number; longitude: number };

export type LocationResult =
  | { status: "granted"; coords: Coords }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "unavailable" };

export async function getCurrentCoords(): Promise<LocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    return { status: "denied", canAskAgain: permission.canAskAgain };
  }
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: "granted",
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch {
    // Thrown when location services are switched off or no fix is available.
    return { status: "unavailable" };
  }
}

// Turns coordinates into a readable place name, e.g. "Boroko, National Capital District".
export async function reverseGeocode(coords: Coords): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) return null;
    const parts = [place.district ?? place.city, place.region].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    // Geocoding is a nicety; the form still works without it.
    return null;
  }
}
