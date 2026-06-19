import { useNavigation } from "@react-navigation/native";
import {
  ArrowDownUp,
  Calendar,
  ChevronRight,
  FileText,
  Folder,
  type LucideIcon,
  Send,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  AmountText,
  Button,
  Card,
  EmptyState,
  Field,
  IconTile,
  Screen,
  ScreenHeader,
  Text,
} from "@components/index";
import { useBusiness, useInvoices } from "@hooks/index";
import { buildDocuments, type DocCategory, type DocItem } from "@services/documents";
import { exportAccountantBundle, exportInvoiceDocument } from "@services/export/invoiceDocument";
import { formatLongDate, formatMonthName } from "@services/format/date";
import { makeStyles, useTheme } from "@theme/index";
import type { TintName } from "@theme/theme";

const CATEGORIES: { key: DocCategory; tint: TintName }[] = [
  { key: "vente", tint: "blue" },
  { key: "achat", tint: "violet" },
  { key: "justificatif", tint: "green" },
];
const CAT_TINT: Record<DocCategory, TintName> = {
  vente: "blue",
  achat: "violet",
  justificatif: "green",
};
const CAT_CODE: Record<DocCategory, string> = { vente: "FV", achat: "FA", justificatif: "JUST" };

const unique = (xs: number[]): number[] => [...new Set(xs)];

/**
 * Classement des documents (Drive-like): catégorie → année → mois → fichiers, with a
 * search filter and date ordering. Every document in the app (factures de vente/achat,
 * justificatifs de paiement) is surfaced here with its canonical file name.
 */
export function ClassementScreen() {
  const { t } = useTranslation();
  const tk = t as unknown as (key: string) => string;
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();
  const { data: invoices } = useInvoices();
  const { data: business } = useBusiness();

  const [category, setCategory] = useState<DocCategory | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [query, setQuery] = useState("");
  const [recentFirst, setRecentFirst] = useState(true);

  const docs = useMemo(() => buildDocuments(invoices ?? []), [invoices]);

  const inCategory = useMemo(
    () => (category ? docs.filter((d) => d.category === category) : []),
    [docs, category],
  );
  const years = useMemo(
    () => unique(inCategory.map((d) => new Date(d.date).getFullYear())).sort((a, b) => b - a),
    [inCategory],
  );
  const inYear = useMemo(
    () => inCategory.filter((d) => new Date(d.date).getFullYear() === year),
    [inCategory, year],
  );
  const months = useMemo(
    () => unique(inYear.map((d) => new Date(d.date).getMonth())).sort((a, b) => b - a),
    [inYear],
  );
  const files = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inYear
      .filter((d) => new Date(d.date).getMonth() === month)
      .filter(
        (d) => !q || d.fileName.toLowerCase().includes(q) || d.title.toLowerCase().includes(q),
      )
      .sort((a, b) => (recentFirst ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  }, [inYear, month, query, recentFirst]);

  const countIn = (c: DocCategory) => docs.filter((d) => d.category === c).length;

  const pop = () => {
    if (month != null) {
      setMonth(undefined);
      setQuery("");
    } else if (year != null) setYear(undefined);
    else if (category != null) setCategory(undefined);
    else navigation.goBack();
  };

  const onOpen = (invoiceId: string, fileName: string) => {
    const invoice = (invoices ?? []).find((i) => i.id === invoiceId);
    if (invoice && business)
      exportInvoiceDocument(business, invoice, fileName).catch(() => undefined);
  };

  /** Bundle every document in the scope into one PDF and share it with the accountant. */
  const shareToAccountant = (scopeDocs: DocItem[], fileName: string) => {
    if (!business) return;
    const ids = new Set(scopeDocs.map((d) => d.invoiceId));
    const list = (invoices ?? []).filter((i) => ids.has(i.id));
    exportAccountantBundle(business, list, fileName).catch(() => undefined);
  };

  const crumb = [
    t("invoicing.classement.title"),
    category ? tk(`invoicing.classement.cat.${category}`) : null,
    year != null ? String(year) : null,
    month != null ? formatMonthName(month) : null,
  ]
    .filter(Boolean)
    .join("  ›  ");

  return (
    <Screen>
      <ScreenHeader title={t("invoicing.classement.title")} onBack={pop} />

      <Text variant="caption" color="textSecondary" style={styles.crumb}>
        {crumb}
      </Text>

      {/* Level: categories */}
      {!category ? (
        <View style={styles.list}>
          {CATEGORIES.map(({ key, tint }) => (
            <Row
              key={key}
              icon={Folder}
              tint={tint}
              title={tk(`invoicing.classement.cat.${key}`)}
              subtitle={t("invoicing.classement.count", { count: countIn(key) })}
              onPress={() => setCategory(key)}
            />
          ))}
        </View>
      ) : year == null ? (
        <View style={styles.list}>
          {years.length === 0 ? (
            <Empty />
          ) : (
            years.map((y) => (
              <Row
                key={y}
                icon={Folder}
                tint="navy"
                title={String(y)}
                subtitle={t("invoicing.classement.count", {
                  count: inCategory.filter((d) => new Date(d.date).getFullYear() === y).length,
                })}
                onPress={() => setYear(y)}
              />
            ))
          )}
        </View>
      ) : month == null ? (
        <View style={styles.list}>
          <Button
            variant="secondary"
            label={t("invoicing.classement.shareAccountant")}
            leadingIcon={Send}
            onPress={() =>
              shareToAccountant(
                inYear,
                `Comptable-${category ? CAT_CODE[category] : "DOC"}-${year}.pdf`,
              )
            }
          />
          {months.map((m) => (
            <Row
              key={m}
              icon={Calendar}
              tint="navy"
              title={formatMonthName(m)}
              subtitle={t("invoicing.classement.count", {
                count: inYear.filter((d) => new Date(d.date).getMonth() === m).length,
              })}
              onPress={() => setMonth(m)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          <Field
            label={t("invoicing.classement.search")}
            placeholder="FV, FA, client…"
            value={query}
            onChangeText={setQuery}
          />
          <Pressable
            onPress={() => setRecentFirst((v) => !v)}
            accessibilityRole="button"
            style={styles.order}
          >
            <ArrowDownUp size={16} color={theme.colors.accent} strokeWidth={2} />
            <Text variant="label" color="accent">
              {recentFirst
                ? t("invoicing.classement.orderRecent")
                : t("invoicing.classement.orderOldest")}
            </Text>
          </Pressable>

          <Button
            variant="secondary"
            label={t("invoicing.classement.shareAccountant")}
            leadingIcon={Send}
            onPress={() =>
              shareToAccountant(
                inYear.filter((d) => new Date(d.date).getMonth() === month),
                `Comptable-${category ? CAT_CODE[category] : "DOC"}-${year}-${
                  month != null ? formatMonthName(month) : ""
                }.pdf`,
              )
            }
          />

          {files.length === 0 ? (
            <Empty />
          ) : (
            files.map((d) => (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                onPress={() => onOpen(d.invoiceId, d.fileName)}
              >
                <Card variant="surface" style={styles.fileRow}>
                  <IconTile icon={FileText} tint={CAT_TINT[d.category]} />
                  <View style={styles.fileInfo}>
                    <Text variant="bodyMd" color="textPrimary" numberOfLines={1}>
                      {d.fileName}
                    </Text>
                    <Text variant="caption" color="textSecondary">
                      {d.title} · {formatLongDate(d.date)}
                    </Text>
                  </View>
                  <AmountText value={d.amount} variant="bodyMd" />
                </Card>
              </Pressable>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

type RowProps = {
  icon: LucideIcon;
  tint: TintName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function Row({ icon, tint, title, subtitle, onPress }: RowProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card variant="surface" style={styles.row}>
        <IconTile icon={icon} tint={tint} />
        <View style={styles.rowInfo}>
          <Text variant="titleMd" color="textPrimary">
            {title}
          </Text>
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        </View>
        <ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={2} />
      </Card>
    </Pressable>
  );
}

function Empty() {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <EmptyState
        illustration={<IconTile icon={Folder} tint="navy" size={64} />}
        title={t("invoicing.classement.emptyTitle")}
        body={t("invoicing.classement.emptyBody")}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  crumb: { marginTop: t.spacing.sm, marginBottom: t.spacing.xs },
  list: { gap: t.spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  rowInfo: { flex: 1, gap: 2 },
  order: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.xs,
    paddingVertical: t.spacing.xs,
  },
  fileRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
  fileInfo: { flex: 1, gap: 2 },
  empty: { minHeight: 280 },
}));
