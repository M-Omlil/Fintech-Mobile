import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { LoginScreen } from "@features/auth/LoginScreen";
import { RegisterScreen } from "@features/auth/RegisterScreen";

import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

/** Auth flow (login / register) shown to guests. */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
