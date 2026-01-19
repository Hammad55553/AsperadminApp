import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

export const FCMManager = () => {
    useEffect(() => {
        const setupFCM = async () => {
            // 1. Request Permission
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);

                // 2. Get the token
                const token = await messaging().getToken();
                console.log('==============================================');
                console.log('[FCM Token via Console]:', token);
                console.log('==============================================');
            }
        };

        setupFCM();

        // 3. Listen for Foreground Messages
        // Note: Background/Quit messages are handled by index.js
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            Alert.alert(
                remoteMessage.notification?.title || 'New Notification',
                remoteMessage.notification?.body || ''
            );
        });

        return unsubscribe;
    }, []);

    return null;
};
