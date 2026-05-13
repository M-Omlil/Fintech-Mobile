import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "../../lib/utils";

type LabelProps = TextProps & { className?: string };

export function Label({ className, ...props }: LabelProps) {
  return (
    <Text
      className={cn("mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500", className)}
      {...props}
    />
  );
}
