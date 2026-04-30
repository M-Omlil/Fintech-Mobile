import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: TextProps) {
  return (
    <Text 
      className={cn("mb-1 text-[12px] font-medium text-[#6B7280]", className)} 
      {...props} 
    />
  );
}