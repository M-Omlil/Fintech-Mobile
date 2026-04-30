import React, { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export const Input = forwardRef<TextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor="#9CA3AF" // text-gray-400
        className={cn(
          "h-12 w-full rounded-xl border border-[#EBF0FE] bg-white px-4 text-[15px] text-[#061438]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";