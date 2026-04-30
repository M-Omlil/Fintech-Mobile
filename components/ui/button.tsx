import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline";

type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
};

export function Button({
  className,
  variant = "default",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  // Définition des couleurs de texte selon la variante
  const getTextColorClass = () => {
    switch (variant) {
      case "default": return "text-white";
      case "secondary": return "text-[#061438]"; // mylegal-navy
      case "ghost": return "text-[#061438]";
      case "outline": return "text-slate-700";
      default: return "text-white";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-xl px-4 py-3.5 transition-all",
        props.disabled && "opacity-60",
        variant === "default" && "bg-[#1DABFC] shadow-sm", // mylegal-ocean
        variant === "secondary" && "bg-[#EBF0FE]", // mylegal-pale
        variant === "ghost" && "bg-transparent",
        variant === "outline" && "border border-slate-200 bg-transparent",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {/* React Native exige que le texte soit dans <Text>. 
        On map les children pour emballer automatiquement les strings.
      */}
      {React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return (
            <Text className={cn("text-[14px] font-bold", getTextColorClass())}>
              {child}
            </Text>
          );
        }
        // Si c'est une icône (Lucide), on la rend telle quelle
        return child;
      })}
    </TouchableOpacity>
  );
}