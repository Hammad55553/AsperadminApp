import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, useWindowDimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Users, MessageSquare, Briefcase, Activity, Smartphone, Monitor } from 'lucide-react-native';
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

// Theme constants matching the web admin
export const THEME = {
    background: '#0f172a', // Slate 900
    card: '#1e293b',      // Slate 800
    text: '#f8fafc',      // Slate 50
    subtext: '#94a3b8',   // Slate 400
    border: 'rgba(255,255,255,0.05)',
    colors: {
        blue: '#3b82f6',
        green: '#10b981',
        rose: '#f43f5e',
        purple: '#8b5cf6',
        orange: '#f59e0b',
        pink: '#ec4899',
        indigo: '#6366f1'
    }
};

export const DashboardScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    const chartWidth = Math.min(width - 40, 800);

    const [stats, setStats] = useState({
        messages: 0,
        subscribers: 0,
        applications: 0
    });
    const [loading, setLoading] = useState(false);

    const [trafficData, setTrafficData] = useState<any>(null);
    const [deviceData, setDeviceData] = useState<any>([]);
    const [extraMetrics, setExtraMetrics] = useState({
        homeViews: 0,
        mobileUsers: 0
    });

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Counts (Messages, Subscribers, Applications)
                const [msgSnap, subSnap, appSnap] = await Promise.all([
                    getCountFromServer(collection(db, 'messages')),
                    getCountFromServer(collection(db, 'subscribers')),
                    getCountFromServer(collection(db, 'applications'))
                ]);

                setStats({
                    messages: msgSnap.data().count,
                    subscribers: subSnap.data().count,
                    applications: appSnap.data().count
                });

                // 2. Fetch Analytics Events for Charts & extra metrics
                // Calculate last 7 days
                const dates: string[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
                }

                const analyticsQuery = query(
                    collection(db, 'analytics_events'),
                    orderBy('timestamp', 'desc'),
                    limit(500)
                );

                const analyticsSnap = await getDocs(analyticsQuery);

                if (analyticsSnap.empty) {
                    // Fallback for empty data to avoid crash
                    setTrafficData({
                        labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
                        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
                    });
                    return;
                }

                const events = analyticsSnap.docs.map(doc => {
                    const data = doc.data();
                    // Handle Firestore Timestamp or standard date string
                    const dateObj = data?.timestamp?.toDate ? data.timestamp.toDate() : new Date();
                    return { ...data, date: dateObj.toISOString().slice(0, 10) };
                });

                // -- Process Traffic Data (Last 7 Days) --
                const dailyVisits = dates.map(date => {
                    return events.filter((e: any) => e.date === date && e.event === 'page_view').length;
                });

                setTrafficData({
                    labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
                    datasets: [{
                        data: dailyVisits,
                        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
                        strokeWidth: 3
                    }]
                });

                // -- Process Device Data --
                const mobileCount = events.filter((e: any) => e.deviceType === 'mobile' || e.deviceType === 'tablet').length;
                const desktopCount = events.filter((e: any) => !e.deviceType || e.deviceType === 'desktop').length;

                setDeviceData([
                    {
                        name: "Desktop",
                        population: desktopCount,
                        color: THEME.colors.indigo,
                        legendFontColor: THEME.text,
                        legendFontSize: 12
                    },
                    {
                        name: "Mobile",
                        population: mobileCount,
                        color: THEME.colors.pink,
                        legendFontColor: THEME.text,
                        legendFontSize: 12
                    }
                ]);

                // -- Process Extra Metrics --
                const homeViews = events.filter((e: any) => e.event === 'page_view' && (e.page === '/' || e.pathname === '/')).length;
                setExtraMetrics({
                    homeViews,
                    mobileUsers: mobileCount
                });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const chartConfig = {
        backgroundGradientFrom: THEME.card,
        backgroundGradientTo: THEME.card,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => THEME.subtext,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "4",
            strokeWidth: "0",
            stroke: "#ffa726"
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.subtitle}>Overview of performance</Text>
                    </View>
                    <View style={styles.livePill}>
                        <View style={styles.dot} />
                        <Text style={styles.liveText}>Live</Text>
                    </View>
                </View>

                {/* Key Metrics Grid */}
                <View style={styles.grid}>
                    <StatCard
                        title="Total Messages"
                        value={stats.messages}
                        icon={<MessageSquare size={20} color="#fff" />}
                        color={THEME.colors.blue}
                        trend="+12%"
                    />
                    <StatCard
                        title="Subscribers"
                        value={stats.subscribers}
                        icon={<Users size={20} color="#fff" />}
                        color={THEME.colors.green}
                        trend="+5%"
                    />
                    <StatCard
                        title="Applications"
                        value={stats.applications}
                        icon={<Briefcase size={20} color="#fff" />}
                        color={THEME.colors.rose}
                        trend="New"
                        trendColor={THEME.colors.rose}
                    />
                </View>

                {/* Second Row Metrics (New) */}
                <View style={styles.grid}>
                    <StatCard
                        title="Home Views"
                        value={extraMetrics.homeViews}
                        icon={<Activity size={20} color="#fff" />}
                        color={THEME.colors.purple}
                        trend="24h"
                    />
                    <StatCard
                        title="Mobile Users"
                        value={extraMetrics.mobileUsers}
                        icon={<Smartphone size={20} color="#fff" />}
                        color={THEME.colors.pink}
                        trend="Device"
                    />
                </View>

                {/* Traffic Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Activity size={18} color={THEME.text} />
                        <Text style={styles.chartTitle}>Site Traffic</Text>
                        <Text style={styles.chartSubtitle}>Last 7 Days</Text>
                    </View>
                    {trafficData ? (
                        <LineChart
                            data={trafficData}
                            width={width - 64} // padding adjustment
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    ) : (
                        <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator color={THEME.colors.blue} />
                        </View>
                    )}
                </View>

                {/* Device Breakdown Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Monitor size={18} color={THEME.text} />
                        <Text style={styles.chartTitle}>Device Types</Text>
                    </View>
                    {deviceData.length > 0 ? (
                        <PieChart
                            data={deviceData}
                            width={width - 64}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    ) : (
                        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: THEME.subtext }}>No device data available</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, icon, color, trend, trendColor, isTablet }: any) => (
    <View style={[styles.statCard, { minWidth: isTablet ? '30%' : '45%' }]}>
        <View style={styles.statInfo}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <View style={[styles.trendBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Text style={[styles.trendText, { color: trendColor || THEME.colors.green }]}>{trend}</Text>
            </View>
        </View>
        <View style={[styles.iconBox, { backgroundColor: color, shadowColor: color }]}>
            {icon}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.text,
    },
    subtitle: {
        fontSize: 14,
        color: THEME.subtext,
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: THEME.colors.green,
        marginRight: 6,
    },
    liveText: {
        color: THEME.colors.green,
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        minWidth: '45%', // 2 columns
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: THEME.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statInfo: {
        flex: 1,
    },
    statTitle: {
        color: THEME.subtext,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    statValue: {
        color: THEME.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    trendBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    chartCard: {
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: THEME.border,
        marginBottom: 16,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartTitle: {
        color: THEME.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    chartSubtitle: {
        color: THEME.subtext,
        fontSize: 12,
    },
    chart: {
        borderRadius: 16,
        marginVertical: 8,
    }
});
