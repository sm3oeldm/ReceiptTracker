import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SPACING, RADIUS, SHADOW } from './src/constants/design';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ReportScreen from './src/screens/ReportScreen';
import GroupScreen from './src/screens/GroupScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import ReceiptConfirmScreen from './src/screens/ReceiptConfirmScreen';
import ReceiptDetailScreen from './src/screens/ReceiptDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

function TabIcon({ route, focused, color, size }) {
  let iconName;
  if (route.name === 'Home') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (route.name === 'Scan') {
    iconName = focused ? 'camera' : 'camera-outline';
  } else if (route.name === 'Report') {
    iconName = focused ? 'stats-chart' : 'stats-chart-outline';
  } else if (route.name === 'Group') {
    iconName = focused ? 'people' : 'people-outline';
  } else if (route.name === 'Assistant') {
    iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

function AppTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: (props) => <TabIcon route={route} {...props} />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 0,
          ...SHADOW.lg(colors.shadow),
          elevation: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: SPACING.xs,
          paddingBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.sm,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Group" component={GroupScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { colors } = useTheme();
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <RootStack.Screen name="HomeTabs" component={AppTabs} />
      <RootStack.Screen
        name="ReceiptConfirm"
        component={ReceiptConfirmScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <RootStack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const { colors } = useTheme();
  return (
    <AuthContext.Consumer>
      {({ isAuthenticated, isLoading }) => {
        if (isLoading) {
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <StatusBar style={colors.statusBar} />
            </View>
          );
        }

        return (
          <NavigationContainer>
            <StatusBar style={colors.statusBar} />
            {isAuthenticated ? <MainNavigator /> : <AuthStack />}
          </NavigationContainer>
        );
      }}
    </AuthContext.Consumer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
