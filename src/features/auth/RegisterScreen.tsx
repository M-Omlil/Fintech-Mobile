import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Field, Screen, ScreenHeader, Text } from "@components/index";
import type { AuthStackParamList } from "@navigation/types";
import { useSession } from "@services/auth/SessionProvider";
import { makeStyles } from "@theme/index";

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/** Account creation screen. */
export function RegisterScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { register } = useSession();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    businessName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 4;

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await register({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.register.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen tabBarClearance={false}>
      <ScreenHeader title={t("auth.register.title")} onBack={() => navigation.goBack()} />

      <Text variant="bodyMd" color="textSecondary" style={styles.subtitle}>
        {t("auth.register.subtitle")}
      </Text>

      <View style={styles.form}>
        <Field
          label={t("auth.register.businessName")}
          value={businessName}
          onChangeText={setBusinessName}
          autoCapitalize="words"
        />
        <Field
          label={t("auth.register.ownerName")}
          value={ownerName}
          onChangeText={setOwnerName}
          autoCapitalize="words"
        />
        <Field
          label={t("auth.register.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label={t("auth.register.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
        <Button
          label={t("auth.register.submit")}
          onPress={onSubmit}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMd" color="textSecondary">
          {t("auth.register.haveAccount")}
        </Text>
        <Button
          variant="text"
          label={t("auth.register.goLogin")}
          fullWidth={false}
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  subtitle: { marginTop: t.spacing.xs, marginBottom: t.spacing.lg },
  form: { gap: t.spacing.md },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing.xs,
    marginTop: t.spacing.xl,
  },
}));
