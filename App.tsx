import './global.css'; 
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppLayout } from './components/Layout';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Set status bar to dark to match your premium theme */}
      <StatusBar style="dark" />
      <AppLayout />
    </SafeAreaProvider>
  );
}