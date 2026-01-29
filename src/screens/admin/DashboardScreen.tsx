import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { PieChart } from 'react-native-chart-kit';
import { Users, MessageSquare, Briefcase, Activity, Smartphone, Monitor, RefreshCw } from 'lucide-react-native';
import { collection, getCountFromServer, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { sendNotification } from '../../services/FCMService';
import Toast from 'react-native-toast-message';

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

    // Provide default traffic data structure to avoid undefined errors
    const [trafficData, setTrafficData] = useState<{
        labels: string[];
        mobile: number[];
        desktop: number[];
    }>({ labels: [], mobile: [], desktop: [] });
    const [deviceData, setDeviceData] = useState<any>([]);
    const [extraMetrics, setExtraMetrics] = useState({
        homeViews: 0,
        mobileUsers: 0
    });

    const [activity, setActivity] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('week');
    const [rawEvents, setRawEvents] = useState<any[]>([]); // Store raw events for local filtering
    const [visibleSeries, setVisibleSeries] = useState({ desktop: true, mobile: true });

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

            // 2. Fetch Recent Messages & Applications for Activity Feed
            const recentMsgsQuery = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(3));
            const recentAppsQuery = query(collection(db, 'applications'), orderBy('timestamp', 'desc'), limit(3));

            const [recMsgSnap, recAppSnap] = await Promise.all([
                getDocs(recentMsgsQuery),
                getDocs(recentAppsQuery)
            ]);

            const recMsgs = recMsgSnap.docs.map(doc => ({
                id: doc.id,
                type: 'message',
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date()
            }));

            const recApps = recAppSnap.docs.map(doc => ({
                id: doc.id,
                type: 'application',
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date()
            }));

            // Merge and Sort
            const combinedActivity = [...recMsgs, ...recApps]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 5); // Take top 5

            setActivity(combinedActivity);


            // 3. Fetch Analytics Events (fetch last 90 days once)
            const d = new Date();
            d.setDate(d.getDate() - 90);
            const threeMonthsAgo = Timestamp.fromDate(d);

            const analyticsQuery = query(
                collection(db, 'analytics_events'),
                where('timestamp', '>=', threeMonthsAgo),
                orderBy('timestamp', 'desc')
            );

            const analyticsSnap = await getDocs(analyticsQuery);

            const events = analyticsSnap.docs.map(doc => {
                const data = doc.data();
                // Handle Firestore Timestamp or standard date string
                const dateObj = data?.timestamp?.toDate ? data.timestamp.toDate() : new Date();
                return { ...data, date: dateObj.toISOString().slice(0, 10) };
            });

            setRawEvents(events); // Store raw events

            // Process for stats immediately based on default view (will be handled by useEffect too, but good for initial stats)
            // But we can just rely on the useEffect for trafficData if we add rawEvents to dependency or call process directly.
            // However, we need 'mobileCount' and 'desktopCount' for the Pie chart which effectively uses ALL fetched data (or maybe just recent?).
            // The original code used the fetched limit(500) for the pie chart. Now we have last 90 days. 
            // We should probably rely on the same 90-day window for consistency, or all time? 
            // Original used limit(500). 90 days is likely more than 500 if active, or less.
            // Let's use the fetched events for consistency.

            // -- Process Device Data (from fetched events - last 90 days) --
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

            Toast.show({ type: 'success', text1: 'Dashboard Verified', text2: 'Data updated successfully' });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Could not fetch data' });
        } finally {
            setLoading(false);
        }
    };

    // Effect to process traffic data whenever timeRange or rawEvents changes
    useEffect(() => {
        if (!rawEvents) return;

        const daysToView = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
        const dates: string[] = [];

        // Generate date labels
        for (let i = daysToView - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
        }

        // For Highcharts, we just need simple arrays of values corresponding to the dates
        const mobileValues = dates.map(date => {
            return rawEvents.filter((e: any) => e.date === date && (e.deviceType === 'mobile' || e.deviceType === 'tablet')).length;
        });

        const desktopValues = dates.map(date => {
            return rawEvents.filter((e: any) => e.date === date && (!e.deviceType || e.deviceType === 'desktop')).length;
        });

        const labels = dates.map(d => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

        setTrafficData({
            labels,
            mobile: mobileValues,
            desktop: desktopValues
        });

    }, [timeRange, rawEvents]);

    // -- Highcharts Configuration --
    const highChartHtml = useMemo(() => {
        const options = {
            chart: {
                type: 'spline',
                backgroundColor: THEME.card,
                height: 250,
                spacing: [10, 10, 15, 10],
                marginTop: 30
            },
            title: { text: null },
            credits: { enabled: false },
            xAxis: {
                categories: trafficData.labels,
                lineColor: 'rgba(255,255,255,0.1)',
                tickColor: 'rgba(255,255,255,0.1)',
                labels: {
                    style: { color: THEME.subtext, fontSize: '10px' },
                    step: timeRange === 'week' ? 1 : timeRange === 'month' ? 4 : 10
                }
            },
            yAxis: {
                title: { text: null },
                gridLineColor: 'rgba(255,255,255,0.05)',
                labels: {
                    style: { color: THEME.subtext }
                }
            },
            legend: {
                itemStyle: { color: '#e2e8f0' },
                itemHoverStyle: { color: '#fff' },
                verticalAlign: 'top',
                align: 'right',
                floating: true,
                y: -30
            },
            plotOptions: {
                spline: {
                    lineWidth: 3,
                    marker: {
                        enabled: false,
                        states: {
                            hover: { enabled: true }
                        }
                    }
                }
            },
            series: [
                {
                    name: 'Desktop',
                    data: trafficData.desktop,
                    color: THEME.colors.indigo,
                    lineColor: THEME.colors.indigo,
                    visible: visibleSeries.desktop
                },
                {
                    name: 'Mobile',
                    data: trafficData.mobile,
                    color: THEME.colors.pink,
                    lineColor: THEME.colors.pink,
                    visible: visibleSeries.mobile
                }
            ]
        };

        return `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
              <style>
                html, body { height: 100%; margin: 0; padding: 0; background-color: ${THEME.card}; overflow: hidden; }
                #container { width: 100%; height: 100%; }
              </style>
              <script src="https://code.highcharts.com/highcharts.js"></script>
            </head>
            <body>
              <div id="container"></div>
              <script>
                document.addEventListener('DOMContentLoaded', function () {
                   Highcharts.chart('container', ${JSON.stringify(options)});
                });
              </script>
            </body>
          </html>
        `;
    }, [trafficData, timeRange, visibleSeries]);

    useEffect(() => {
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
                    <TouchableOpacity
                        style={styles.livePill}
                        onPress={fetchAllData}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={THEME.colors.green} style={{ marginRight: 6 }} />
                        ) : (
                            <RefreshCw size={14} color={THEME.colors.green} style={{ marginRight: 6 }} />
                        )}
                        <Text style={styles.liveText}>{loading ? 'Updating...' : 'Refresh'}</Text>
                    </TouchableOpacity>
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

                {/* Traffic Chart (Highcharts Style) */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Activity size={18} color={THEME.text} />
                            <Text style={styles.chartTitle}>Site Traffic</Text>
                        </View>

                        {/* Time Range Selector */}
                        <View style={styles.rangeSelector}>
                            <TouchableOpacity
                                style={[styles.rangeBtn, timeRange === 'week' && styles.rangeBtnActive]}
                                onPress={() => setTimeRange('week')}
                            >
                                <Text style={[styles.rangeText, timeRange === 'week' && styles.rangeTextActive]}>1W</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rangeBtn, timeRange === 'month' && styles.rangeBtnActive]}
                                onPress={() => setTimeRange('month')}
                            >
                                <Text style={[styles.rangeText, timeRange === 'month' && styles.rangeTextActive]}>1M</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rangeBtn, timeRange === '3months' && styles.rangeBtnActive]}
                                onPress={() => setTimeRange('3months')}
                            >
                                <Text style={[styles.rangeText, timeRange === '3months' && styles.rangeTextActive]}>3M</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 260, overflow: 'hidden', borderRadius: 8 }}>
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: highChartHtml }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            style={{ backgroundColor: 'transparent' }}
                            scrollEnabled={false}
                        />
                    </View>

                    {/* Custom Legend / Toggles */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.legendBtn, !visibleSeries.desktop && styles.legendBtnInactive, { borderColor: THEME.colors.indigo }]}
                            onPress={() => setVisibleSeries(prev => ({ ...prev, desktop: !prev.desktop }))}
                        >
                            <View style={[styles.legendDot, { backgroundColor: visibleSeries.desktop ? THEME.colors.indigo : 'gray' }]} />
                            <Text style={styles.legendText}>Desktop</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.legendBtn, !visibleSeries.mobile && styles.legendBtnInactive, { borderColor: THEME.colors.pink }]}
                            onPress={() => setVisibleSeries(prev => ({ ...prev, mobile: !prev.mobile }))}
                        >
                            <View style={[styles.legendDot, { backgroundColor: visibleSeries.mobile ? THEME.colors.pink : 'gray' }]} />
                            <Text style={styles.legendText}>Mobile</Text>
                        </TouchableOpacity>
                    </View>
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

                {/* Recent Activity Feed */}
                <View style={[styles.chartCard, { marginBottom: 30 }]}>
                    <View style={styles.chartHeader}>
                        <RefreshCw size={18} color={THEME.text} />
                        <Text style={styles.chartTitle}>Recent Activity</Text>
                    </View>
                    <View style={{ paddingHorizontal: 4 }}>
                        {activity.length > 0 ? (
                            activity.map((item, index) => {
                                const isMsg = item.type === 'message';
                                const iconColor = isMsg ? THEME.colors.blue : THEME.colors.rose;
                                const bgColor = isMsg ? 'rgba(59, 130, 246, 0.1)' : 'rgba(244, 63, 94, 0.1)';
                                const Icon = isMsg ? MessageSquare : Briefcase;
                                const title = isMsg ? "New message from" : "Application received for";
                                const name = isMsg ? (item.name || "Visitor") : (item.role || "Job");
                                const timeStr = item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const dateStr = item.timestamp.toLocaleDateString();

                                return (
                                    <View key={item.id} style={[styles.activityItem, index === activity.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={[styles.activityIcon, { backgroundColor: bgColor }]}>
                                            <Icon size={16} color={iconColor} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.activityText}>{title} <Text style={{ fontWeight: 'bold', color: THEME.text }}>{name}</Text></Text>
                                            <Text style={styles.activityTime}>{dateStr} • {timeStr}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: THEME.subtext }}>No recent activity</Text>
                            </View>
                        )}
                    </View>
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
        paddingBottom: 100, // Increased to avoid overlapping with footer/tab bar
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
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityText: {
        color: THEME.subtext,
        fontSize: 14,
        lineHeight: 20,
    },
    activityTime: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    rangeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 2,
    },
    rangeBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    rangeBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    rangeText: {
        color: THEME.subtext,
        fontSize: 12,
        fontWeight: '500',
    },
    rangeTextActive: {
        color: THEME.text,
        fontWeight: 'bold',
    },
    legendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
    },
    legendBtnInactive: {
        opacity: 0.5,
        borderColor: 'gray',
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        color: THEME.text,
        fontSize: 12,
        fontWeight: '500',
    }
});
