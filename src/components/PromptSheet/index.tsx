import React, { useEffect, useState } from "react";
import { View, type KeyboardTypeOptions } from "react-native";

import { Button } from "@components/Button";
import { Field } from "@components/Field";
import { Sheet } from "@components/Sheet";
import { makeStyles } from "@theme/index";

export type PromptField = {
  key: string;
  label: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** When true, the field may be left blank. */
  optional?: boolean;
};

export type PromptSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  fields: PromptField[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
};

function emptyValues(fields: PromptField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}

/**
 * Small form in a bottom sheet for quick creation flows (new account, client,
 * supplier, transfer…). Keeps screens free of bespoke form scaffolding.
 */
export function PromptSheet({
  visible,
  onClose,
  title,
  fields,
  submitLabel,
  onSubmit,
}: PromptSheetProps) {
  const styles = useStyles();
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(fields));
  const [submitting, setSubmitting] = useState(false);

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (visible) setValues(emptyValues(fields));
    // fields identity is stable per screen; reset only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const canSubmit = fields.every((f) => f.optional || (values[f.key] ?? "").trim().length > 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.form}>
        {fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            keyboardType={field.keyboardType}
            value={values[field.key] ?? ""}
            onChangeText={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
          />
        ))}
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  form: { gap: t.spacing.md, paddingBottom: t.spacing.md },
}));
