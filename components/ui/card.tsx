import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-[#EBF0FE] bg-white p-4 shadow-sm", // #EBF0FE = mylegal-cloud
        className
      )}
      {...props}
    />
  );
}