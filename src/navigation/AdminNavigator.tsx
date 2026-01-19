import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { DashboardScreen, THEME } from '../screens/admin/DashboardScreen';
import { JobsScreen, MessagesScreen, SubscribersScreen, ApplicationsScreen } from '../screens/admin/AdminScreens';
import { AdminFooter } from '../components/admin/AdminFooter';
import { NotificationManager } from '../components/admin/NotificationManager';
import { FCMManager } from '../components/admin/FCMManager';

export const AdminNavigator = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [badges, setBadges] = useState({
        Messages: 0,
        Applications: 0
    });

    useEffect(() => {
        // Listen for unread messages
        const unreadMsgQuery = query(collection(db, 'messages'), where('status', '==', 'unread'));
        const unsubMsg = onSnapshot(unreadMsgQuery, (snap) => {
            setBadges(prev => ({ ...prev, Messages: snap.size }));
        }, (err) => console.log("Badge Error (Msgs):", err));

        // Listen for all applications (treating distinct new ones is hard without status, so using total count or assumes all are relevant for now)
        // Alternatively, if we wanted to be smarter, we could check for 'status' if it existed.
        // For now, let's just count ALL applications to match user request "new aaye to uoer count aa jae" 
        // (implying catching attention).
        const appQuery = query(collection(db, 'applications'));
        const unsubApp = onSnapshot(appQuery, (snap) => {
            setBadges(prev => ({ ...prev, Applications: snap.size }));
        }, (err) => console.log("Badge Error (Apps):", err));

        return () => {
            unsubMsg();
            unsubApp();
        };
    }, []);

    const renderScreen = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardScreen />;
            case 'Jobs': return <JobsScreen />;
            case 'Messages': return <MessagesScreen />;
            case 'Subscribers': return <SubscribersScreen />;
            case 'Applications': return <ApplicationsScreen />;
            default: return <DashboardScreen />;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
            <NotificationManager />
            <FCMManager />

            {/* Main Content Area */}
            <View style={styles.content}>
                {renderScreen()}
            </View>

            {/* Custom Bottom Tab Bar / Footer */}
            <AdminFooter
                activeTab={activeTab}
                onTabChange={setActiveTab}
                badges={badges}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    content: {
        flex: 1,
    }
});
