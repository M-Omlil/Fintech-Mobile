import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type CompactSelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

export function CompactSelect({ value, options, onChange }: CompactSelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  // Réf sur le conteneur pour mesurer sa position à l'écran
  const triggerRef = useRef<View>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  // Calcule la position exacte du bouton sur l'écran du téléphone pour placer la liste en dessous
  const toggleOpen = () => {
    if (!open) {
      triggerRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
        setCoords({
          top: pageY + height + 6,
          left: pageX,
          width: width,
        });
        setOpen(true);
      });
    } else {
      setOpen(false);
    }
  };

  return (
    <View ref={triggerRef} className="relative w-full">
      {/* BOUTON DÉCLENCHEUR */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleOpen}
        className="flex-row h-12 w-full items-center justify-between rounded-xl border border-[#EBF0FE] bg-white px-4"
      >
        <Text className="text-[14px] text-[#061438]">{selectedLabel}</Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDown size={18} color={open ? "#6B7280" : "#9CA3AF"} />
        </View>
      </TouchableOpacity>

      {/* PORTAL NATIF : On utilise une Modal transparente pour superposer la liste au-dessus de tout */}
      <Modal visible={open} transparent animationType="fade">
        {/* Le fond de la modal sert de "Click Outside". Si on clique dessus, ça ferme. */}
        <Pressable 
          style={{ flex: 1 }} 
          onPress={() => setOpen(false)}
        >
          {/* LE MENU FLOTTANT */}
          <View
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: 220,
            }}
            className="rounded-xl border border-[#EBF0FE] bg-white p-1 shadow-lg"
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
                      isActive ? "bg-[#EEF2FF]" : "bg-transparent"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[14px]",
                        isActive ? "font-bold text-[#3730A3]" : "text-[#061438]"
                      )}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={16} color="#3730A3" />}
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