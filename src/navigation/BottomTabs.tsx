import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { useTranslation } from "react-i18next";

import { CardsScreen } from "@features/cards/CardsScreen";
import { HomeScreen } from "@features/home/HomeScreen";
import { MenuScreen } from "@features/menu/MenuScreen";
import { TransactionsScreen } from "@features/transactions/TransactionsScreen";

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
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarLabel: t("tabs.transactions") }}
      />
      <Tab.Screen name="Cards" component={CardsScreen} options={{ tabBarLabel: t("tabs.cards") }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ tabBarLabel: t("tabs.menu") }} />
    </Tab.Navigator>
  );
}
