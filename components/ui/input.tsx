import React, { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import { cn } from "../../lib/utils";

type InputProps = TextInputProps & { className?: string };

export const Input = forwardRef<TextInput, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor="#9CA3AF"
        className={cn(
          "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
