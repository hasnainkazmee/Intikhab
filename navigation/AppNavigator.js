import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../utils/firebaseConfig';
import { COLORS, URDU_TEXT } from '../utils/constants';

// Import screens
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import IntikhabScreen from '../screens/IntikhabScreen';
import PoetScreen from '../screens/PoetScreen';
import SavedByListScreen from '../screens/SavedByListScreen';
import PoetVerificationRequestScreen from '../screens/PoetVerificationRequestScreen';
import PoetVerificationScreen from '../screens/PoetVerificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accentGold,
        tabBarInactiveTintColor: '#A9A9A9',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        headerStyle: {
          backgroundColor: '#1a1a1a',
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontFamily: 'NotoNastaliqUrdu',
          writingDirection: 'rtl',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: URDU_TEXT.home,
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
        options={{ 
          title: URDU_TEXT.discover,
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: URDU_TEXT.profile,
          headerShown: false,
        }} 
      />
    </Tab.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontFamily: 'NotoNastaliqUrdu',
            writingDirection: 'rtl',
          },
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Intikhab" 
              component={IntikhabScreen} 
              options={({ route }) => ({ title: route.params?.intikhabName || URDU_TEXT.appName })} 
            />
            <Stack.Screen 
              name="Poet" 
              component={PoetScreen} 
              options={({ route }) => ({ title: route.params?.poetId || '' })} 
            />
            <Stack.Screen 
              name="SavedByList" 
              component={SavedByListScreen} 
              options={{ title: URDU_TEXT.savedBy }} 
            />
            <Stack.Screen 
              name="PoetVerificationRequest" 
              component={PoetVerificationRequestScreen} 
              options={{ title: URDU_TEXT.poetVerification }} 
            />
            <Stack.Screen 
              name="PoetVerification" 
              component={PoetVerificationScreen} 
              options={{ title: URDU_TEXT.poetVerification }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;