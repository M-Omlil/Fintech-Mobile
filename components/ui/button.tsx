import React from "react";
import { Pressable, Text, View, ActivityIndicator, PressableProps } from "react-native";
import { cn } from "../../lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline";

type ButtonProps = Omit<PressableProps, "children"> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
  loading?: boolean;
  children?: React.ReactNode;
};

export function Button({
  className,
  textClassName,
  variant = "default",
  fullWidth,
  disabled,
  loading,
  children,
  ...props
}: ButtonProps) {
  const baseClass = "flex-row items-center justify-center rounded-xl px-4 py-3";
  const variantClass =
    variant === "default"
      ? "bg-indigo-600 active:bg-indigo-700"
      : variant === "secondary"
      ? "bg-slate-100 active:bg-slate-200"
      : variant === "outline"
      ? "border border-slate-200 bg-white active:bg-slate-50"
      : "bg-transparent active:bg-slate-100";

  const baseTextClass =
    variant === "default"
      ? "text-white text-sm font-bold"
      : variant === "secondary"
      ? "text-slate-900 text-sm font-bold"
      : variant === "outline"
      ? "text-slate-700 text-sm font-bold"
      : "text-slate-700 text-sm font-bold";

  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        baseClass,
        variantClass,
        fullWidth && "w-full",
        (disabled || loading) && "opacity-60",
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "default" ? "#FFFFFF" : "#1F2937"}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {React.Children.map(children, (child) => {
            if (typeof child === "string" || typeof child === "number") {
              return <Text className={cn(baseTextClass, textClassName)}>{child}</Text>;
            }
            return child;
          })}
        </View>
      )}
    </Pressable>
  );
}
