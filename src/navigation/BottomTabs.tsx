import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";

import { DashboardScreen } from "@features/dashboard/DashboardScreen";
import { HomeScreen } from "@features/home/HomeScreen";
import { FacturesScreen } from "@features/invoicing/invoices/FacturesScreen";
import { MenuScreen } from "@features/menu/MenuScreen";

import { FloatingTabBar } from "./FloatingTabBar";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

// Module-scope render function: react-navigation invokes `tabBar` as a function, so
// FloatingTabBar must be rendered as an element (its own fiber) for its hooks to be
// valid. Defining it here keeps the reference stable (no unstable-nested-components).
const renderTabBar = (props: BottomTabBarProps) => <FloatingTabBar {...props} />;

/** The four primary tabs (Section 6.1). */
export function BottomTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t("tabs.home") }} />
      <Tab.Screen
        name="Facturation"
        component={FacturesScreen}
        options={{ tabBarLabel: t("tabs.facturation") }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: t("tabs.dashboard") }}
      />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ tabBarLabel: t("tabs.menu") }} />
    </Tab.Navigator>
  );
}
