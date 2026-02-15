import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import AddRecordScreen from './src/screens/AddRecordScreen';
import EditRecordScreen from './src/screens/EditRecordScreen';
import AIRecordScreen from './src/screens/AIRecordScreen';
import ListScreen from './src/screens/ListScreen';
import StatsScreen from './src/screens/StatsScreen';
import AuthScreen from './src/screens/AuthScreen';
import { ToastProvider } from './src/components/Toast';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 自定义标签栏图标组件
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  if (focused) {
    return (
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabIconGradient}
      >
        <Text style={styles.tabIconActive}>{icon}</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabIcon}>{icon}</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          ...SHADOWS.small,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: FONT_WEIGHT.medium,
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: '统计',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{
          title: '账单',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// 主应用内容（包含导航）
function AppContent() {
  const { user, loading, refreshUser, phoneAuthenticated, setPhoneAuthenticated } = useAuth();
  const [authKey, setAuthKey] = useState(0);

  const handleAuthSuccess = async (phoneUserId?: string) => {
    // 设置手机认证状态
    setPhoneAuthenticated(true, phoneUserId);
    // 强制重新渲染
    setAuthKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 用户通过 Supabase auth 或手机号认证登录
  if (!user && !phoneAuthenticated) {
    return <AuthScreen key={authKey} onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <NavigationContainer>
      <ToastProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={HomeTabs} />
          <Stack.Screen
            name="AddRecord"
            component={AddRecordScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="AIRecord"
            component={AIRecordScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="EditRecord"
            component={EditRecordScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </ToastProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconGradient: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
});
