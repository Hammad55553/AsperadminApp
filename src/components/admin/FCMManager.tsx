import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export const FCMManager = () => {
    useEffect(() => {
        const setupFCM = async () => {
            // 1. Request Permission & Create Channel (Notifee)
            await notifee.requestPermission();
            await notifee.createChannel({
                id: 'default',
                name: 'Default Channel',
                importance: AndroidImportance.HIGH,
                sound: 'default',
            });

            // 2. Request FCM Permission
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);

                // 3. Get the token
                const token = await messaging().getToken();
                console.log('==============================================');
                console.log('[FCM Token]:', token);
                console.log('==============================================');

                // 4. Subscribe to 'general' topic (Like Yaaripay)
                await messaging().subscribeToTopic('general');
                console.log('✅ Subscribed to topic: "general"');
            }
        };

        setupFCM();

        // 5. Listen for Foreground Messages
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            console.log('Foreground Message:', remoteMessage);

            await notifee.displayNotification({
                title: remoteMessage.notification?.title || 'New Notification',
                body: remoteMessage.notification?.body || '',
                android: {
                    channelId: 'default',
                    // smallIcon: 'ic_launcher', // Ensure this resource exists or remove line to use default
                    pressAction: {
                        id: 'default',
                    },
                },
            });
        });

        return unsubscribe;
    }, []);

    return null;
};
