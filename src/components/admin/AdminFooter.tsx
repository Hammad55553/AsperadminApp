import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { LayoutDashboard, Briefcase, MessageSquare, Users, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../screens/admin/DashboardScreen';

interface AdminFooterProps {
    activeTab: string;
    onTabChange: (tabName: string) => void;
    badges?: { [key: string]: number };
}

const TabButton = ({ name, icon: Icon, label, isActive, onPress, badgeCount }: any) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const opacityValue = useRef(new Animated.Value(0.6)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1.1,
                    friction: 5,
                    useNativeDriver: true
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.spring(translateY, {
                    toValue: -4,
                    friction: 5,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true
                }),
                Animated.timing(opacityValue, {
                    toValue: 0.6,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 5,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [isActive]);

    return (
        <TouchableOpacity
            style={styles.tabButton}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: THEME.colors.blue }]} />
            )}

            <Animated.View style={{
                transform: [{ scale: scaleValue }, { translateY }],
                opacity: opacityValue,
                alignItems: 'center'
            }}>
                <View>
                    <Icon
                        size={24}
                        color={isActive ? THEME.colors.blue : THEME.text}
                    />
                    {badgeCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={[
                    styles.tabLabel,
                    { color: isActive ? THEME.colors.blue : THEME.text }
                ]}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export const AdminFooter = ({ activeTab, onTabChange, badges = {} }: AdminFooterProps) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.glassContainer}>
                <TabButton name="Dashboard" icon={LayoutDashboard} label="Home" isActive={activeTab === 'Dashboard'} onPress={() => onTabChange('Dashboard')} />
                <TabButton name="Jobs" icon={Briefcase} label="Jobs" isActive={activeTab === 'Jobs'} onPress={() => onTabChange('Jobs')} />
                <TabButton
                    name="Messages"
                    icon={MessageSquare}
                    label="Msgs"
                    isActive={activeTab === 'Messages'}
                    onPress={() => onTabChange('Messages')}
                    badgeCount={badges['Messages'] || 0}
                />
                <TabButton name="Subscribers" icon={Users} label="Subs" isActive={activeTab === 'Subscribers'} onPress={() => onTabChange('Subscribers')} />
                <TabButton
                    name="Applications"
                    icon={FileText}
                    label="Apps"
                    isActive={activeTab === 'Applications'}
                    onPress={() => onTabChange('Applications')}
                    badgeCount={badges['Applications'] || 0}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    glassContainer: {
        flexDirection: 'row',
        // Simulating Glassmorphism
        backgroundColor: 'rgba(15, 23, 42, 0.98)', // Darker (Slate-900) and less transparent
        borderRadius: 24,
        paddingVertical: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,

        // Shadow (Glow effect)
        shadowColor: THEME.colors.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        position: 'relative',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
    activeIndicator: {
        position: 'absolute',
        top: -12, // Push it slightly above the icon
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: THEME.colors.blue,
        shadowColor: THEME.colors.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#be123c', // Darker Rose for better contrast
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#1e293b', // Match card bg to create "cutout" effect
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
