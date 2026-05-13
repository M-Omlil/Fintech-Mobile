import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "../../lib/utils";

type CardProps = ViewProps & { className?: string };

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-4",
        className
      )}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
      {...props}
    />
  );
}
