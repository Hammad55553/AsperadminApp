import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
    return (
        <View style={styles.card}>
            <View style={styles.info}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value}>{value}</Text>
                <View style={[styles.trendContainer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[styles.trend, { color: trend === 'New' ? colors.accent : colors.success }]}>
                        {trend}
                    </Text>
                </View>
            </View>
            <View style={[styles.iconContainer, { backgroundColor: color, shadowColor: color }]}>
                {icon}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.secondary,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    info: {
        flex: 1,
    },
    title: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    value: {
        color: colors.text.inverse,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    trendContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trend: {
        fontSize: 12,
        fontWeight: '600',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
