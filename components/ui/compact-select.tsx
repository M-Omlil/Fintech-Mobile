import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { cn } from "../../lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type CompactSelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
};

export function CompactSelect({ value, options, onChange, placeholder }: CompactSelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? (placeholder ?? value);

  const toggleOpen = () => {
    if (!open) {
      triggerRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
        setCoords({ top: pageY + height + 6, left: pageX, width });
        setOpen(true);
      });
    } else {
      setOpen(false);
    }
  };

  return (
    <View ref={triggerRef} className="relative w-full">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleOpen}
        className="flex-row h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4"
      >
        <Text className="text-[14px] text-slate-900 flex-1" numberOfLines={1}>
          {selectedLabel}
        </Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDown size={18} color={open ? "#6B7280" : "#9CA3AF"} />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: 240,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
            className="rounded-xl border border-slate-200 bg-white p-1"
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {options.map((option) => {
                const isActive = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.7}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex-row w-full items-center justify-between rounded-lg px-3 py-3 my-0.5",
                      isActive ? "bg-indigo-50" : "bg-transparent"
                    )}
                  >
                    <Text className={cn("text-[14px] flex-1", isActive ? "font-bold text-indigo-700" : "text-slate-900")}>
                      {option.label}
                    </Text>
                    {isActive && <Check size={16} color="#4338CA" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
