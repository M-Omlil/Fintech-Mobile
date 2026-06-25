import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "@i18n/index";
import { ToastProvider } from "@components/index";
import { navigationRef } from "@navigation/ref";
import { RootNavigator } from "@navigation/RootNavigator";
import { SessionProvider } from "@services/auth/SessionProvider";
import { DIProvider } from "@services/di/DIProvider";
import { ThemeProvider, useTheme, useThemeMode } from "@theme/index";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** App canvas + navigation, themed from the active scheme (re-themes on light/dark switch). */
function AppShell({ onReady }: { onReady: () => void }) {
  const theme = useTheme();
  const { scheme } = useThemeMode();

  const navTheme = useMemo<NavTheme>(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        primary: theme.colors.accent,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
      },
    };
  }, [scheme, theme]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <NavigationContainer ref={navigationRef} theme={navTheme} onReady={onReady}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

/**
 * App entry. Provider order: SafeArea → Theme → Session → DI → Toast → Navigation. i18n is
 * initialized via side-effect import. First paint is gated on Inter loading.
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onReady = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <DIProvider>
            <ToastProvider>
              <AppShell onReady={onReady} />
            </ToastProvider>
          </DIProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
