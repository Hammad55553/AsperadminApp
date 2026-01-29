import React, { useEffect, useRef } from 'react';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

export const NotificationManager = () => {
    const isFirstLoadMessages = useRef(true);
    const isFirstLoadApps = useRef(true);
    const isFirstLoadSubscribers = useRef(true);
    const isFirstLoadJobs = useRef(true);

    useEffect(() => {
        const setupNotifications = async () => {
            // Request permissions (required for iOS)
            await notifee.requestPermission();

            // Create a channel (required for Android)
            await notifee.createChannel({
                id: 'default',
                name: 'Default Channel',
                importance: AndroidImportance.HIGH,
                sound: 'default',
            });
        };

        setupNotifications();

        // ---------------------------
        // 1. Listen for New Messages
        // ---------------------------
        const msgQuery = query(collection(db, 'messages'));
        const unsubMsg = onSnapshot(msgQuery, (snapshot) => {
            if (isFirstLoadMessages.current) {
                isFirstLoadMessages.current = false;
                return;
            }

            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    await notifee.displayNotification({
                        title: 'New Message Received 📩',
                        body: `From: ${data.name || 'Unknown'}\n${data.subject || 'No Subject'}`,
                        android: {
                            channelId: 'default',
                            pressAction: { id: 'default' },
                        },
                    });
                }
            });
        });

        // ---------------------------
        // 2. Listen for New Applications
        // ---------------------------
        const appQuery = query(collection(db, 'applications'));
        const unsubApp = onSnapshot(appQuery, (snapshot) => {
            if (isFirstLoadApps.current) {
                isFirstLoadApps.current = false;
                return;
            }

            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    await notifee.displayNotification({
                        title: 'New Job Application 📄',
                        body: `${data.fullName || 'Candidate'} applied for ${data.role || 'a position'}`,
                        android: {
                            channelId: 'default',
                            pressAction: { id: 'default' },
                        },
                    });
                }
            });
        });

        // ---------------------------
        // 3. Listen for New Subscribers
        // ---------------------------
        const subQuery = query(collection(db, 'subscribers'));
        const unsubSub = onSnapshot(subQuery, (snapshot) => {
            if (isFirstLoadSubscribers.current) {
                isFirstLoadSubscribers.current = false;
                return;
            }

            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    await notifee.displayNotification({
                        title: 'New Subscriber! 🎉',
                        body: `${data.email || 'Someone'} joined the newsletter.`,
                        android: {
                            channelId: 'default',
                            pressAction: { id: 'default' },
                        },
                    });
                }
            });
        });

        // ---------------------------
        // 4. Listen for New Jobs (e.g. posted by another admin/web)
        // ---------------------------
        const jobQuery = query(collection(db, 'jobs'));
        const unsubJob = onSnapshot(jobQuery, (snapshot) => {
            if (isFirstLoadJobs.current) {
                isFirstLoadJobs.current = false;
                return;
            }

            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    await notifee.displayNotification({
                        title: 'New Job Posted 💼',
                        body: `Position: ${data.title || 'Job'}\nLocation: ${data.location}`,
                        android: {
                            channelId: 'default',
                            pressAction: { id: 'default' },
                        },
                    });
                }
            });
        });

        return () => {
            unsubMsg();
            unsubApp();
            unsubSub();
            unsubJob();
        };
    }, []);

    return null; // This component handles side effects only
};
