/**
 * @format
 */
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Register background handler (MUST be outside of your components)
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);

    // Create the channel if it doesn't exist (good practice for background)
    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    // Display the notification manually to ensure it shows up
    await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        android: {
            channelId: 'default',
            pressAction: {
                id: 'default',
            },
        },
    });
});

AppRegistry.registerComponent(appName, () => App);
