import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "@i18n/index";
import { ToastProvider } from "@components/index";
import { navigationRef } from "@navigation/ref";
import { RootNavigator } from "@navigation/RootNavigator";
import { SessionProvider } from "@services/auth/SessionProvider";
import { DIProvider } from "@services/di/DIProvider";
import { lightTheme, ThemeProvider } from "@theme/index";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Navigation container theme aligned to Amano tokens (fogWhite canvas). */
const navTheme: NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightTheme.colors.background,
    card: lightTheme.colors.surface,
    primary: lightTheme.colors.accent,
    text: lightTheme.colors.textPrimary,
    border: lightTheme.colors.border,
  },
};

/**
 * App entry. Provider order: SafeArea → Theme → Session → DI → Navigation. i18n is
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
      <ThemeProvider scheme="light">
        <SessionProvider>
          <DIProvider>
            <ToastProvider>
              <View style={styles.root}>
                <StatusBar style="dark" />
                <NavigationContainer ref={navigationRef} theme={navTheme} onReady={onReady}>
                  <RootNavigator />
                </NavigationContainer>
              </View>
            </ToastProvider>
          </DIProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.background },
});
