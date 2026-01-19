import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AdminNavigator } from './AdminNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const isAuthenticated = true; // Temporary: Auto-login to test Admin Panel

    return (
        <Stack.Navigator
            initialRouteName={isAuthenticated ? 'Admin' : 'Login'}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Admin" component={AdminNavigator} />
        </Stack.Navigator>
    );
};

export default AppNavigator;
