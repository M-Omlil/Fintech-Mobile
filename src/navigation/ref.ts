import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

/**
 * Global navigation container ref — lets app-level code reach the navigator from outside
 * a screen if needed (kept stable for future use, e.g. deep links / overlays).
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
