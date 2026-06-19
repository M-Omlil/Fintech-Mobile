import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Field, Screen, Text } from "@components/index";
import { DEMO_CREDENTIALS } from "@data/store/persistentStore";
import type { AuthStackParamList } from "@navigation/types";
import { useSession } from "@services/auth/SessionProvider";
import { makeStyles } from "@theme/index";

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/** Sign-in screen. */
export function LoginScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { login } = useSession();

  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch {
      setError(t("auth.login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen tabBarClearance={false}>
      <View style={styles.header}>
        <Text variant="displayLg" color="accent">
          Amano
        </Text>
        <Text variant="titleLg" color="textPrimary">
          {t("auth.login.title")}
        </Text>
        <Text variant="bodyMd" color="textSecondary">
          {t("auth.login.subtitle")}
        </Text>
      </View>

      <View style={styles.form}>
        <Field
          label={t("auth.login.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label={t("auth.login.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
        <Button label={t("auth.login.submit")} onPress={onSubmit} loading={loading} />
        <Text variant="caption" color="textSecondary" style={styles.hint}>
          {t("auth.login.demoHint", {
            email: DEMO_CREDENTIALS.email,
            password: DEMO_CREDENTIALS.password,
          })}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMd" color="textSecondary">
          {t("auth.login.noAccount")}
        </Text>
        <Button
          variant="text"
          label={t("auth.login.goRegister")}
          fullWidth={false}
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { gap: t.spacing.xs, marginTop: t.spacing.xxl, marginBottom: t.spacing.xl },
  form: { gap: t.spacing.md },
  hint: { textAlign: "center", marginTop: t.spacing.xs },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing.xs,
    marginTop: t.spacing.xl,
  },
}));
