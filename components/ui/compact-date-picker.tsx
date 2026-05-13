import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { cn } from "../../lib/utils";

type CompactDatePickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
};

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatDate(value: Date | null) {
  if (!value) return "jj/mm/aaaa";
  const day = `${value.getDate()}`.padStart(2, "0");
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  return `${day}/${month}/${value.getFullYear()}`;
}

function buildMonthDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Array<{ date: Date; currentMonth: boolean }> = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    days.push({ date: new Date(year, month - 1, day), currentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ date: new Date(year, month, day), currentMonth: true });
  }

  const trailing = (7 - (days.length % 7)) % 7;
  for (let day = 1; day <= trailing; day++) {
    days.push({ date: new Date(year, month + 1, day), currentMonth: false });
  }

  return days;
}

export function CompactDatePicker({ value, onChange }: CompactDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ?? new Date());

  const days = useMemo(() => buildMonthDays(viewDate), [viewDate]);

  return (
    <View className="relative w-full">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setViewDate(value ?? new Date());
          setOpen(true);
        }}
        className="flex-row h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4"
      >
        <Text className={value ? "text-slate-900 text-[14px]" : "text-slate-400 text-[14px]"}>
          {formatDate(value)}
        </Text>
        <CalendarDays size={18} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-4"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="w-full max-w-[340px] rounded-2xl bg-white p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between px-1">
              <Text className="text-base font-bold text-slate-900">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="rounded-lg p-2 bg-slate-50"
                >
                  <ChevronLeft size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="rounded-lg p-2 bg-slate-50"
                >
                  <ChevronRight size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row flex-wrap mb-2">
              {weekDays.map((label) => (
                <View key={label} className="items-center" style={{ width: `${100 / 7}%` }}>
                  <Text className="text-[11px] font-bold text-slate-400 uppercase">{label}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {days.map(({ date, currentMonth }) => {
                const selected = value && isSameDay(date, value);
                return (
                  <View key={date.toISOString()} className="p-0.5 aspect-square" style={{ width: `${100 / 7}%` }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        onChange(date);
                        setOpen(false);
                        setViewDate(date);
                      }}
                      className={cn(
                        "flex-1 items-center justify-center rounded-xl",
                        selected ? "bg-indigo-600" : "bg-transparent"
                      )}
                    >
                      <Text
                        className={cn(
                          "text-[13px]",
                          selected
                            ? "font-bold text-white"
                            : currentMonth
                            ? "text-slate-900"
                            : "text-slate-300"
                        )}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  onChange(today);
                  setViewDate(today);
                  setOpen(false);
                }}
                className="px-3 py-2"
              >
                <Text className="text-sm font-bold text-indigo-600">Aujourd'hui</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOpen(false)} className="px-3 py-2">
                <Text className="text-sm font-bold text-slate-500">Fermer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
