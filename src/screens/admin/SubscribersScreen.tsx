import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Share } from 'react-native';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { Users, Trash2, Search, Mail, Download, Calendar } from 'lucide-react-native';
import { THEME } from './DashboardScreen';

export const SubscribersScreen = () => {
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'subscribers'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setSubscribers(subs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching subscribers:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Remove Subscriber",
            "Are you sure you want to remove this subscriber?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'subscribers', id));
                        } catch (error) {
                            Alert.alert("Error", "Could not remove subscriber");
                        }
                    }
                }
            ]
        );
    };

    const handleExport = async () => {
        const emails = subscribers.map(s => s.email).join(',\n');
        try {
            await Share.share({
                message: emails,
                title: "Subscriber Emails"
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendNewsletter = () => {
        if (subscribers.length === 0) return;
        const emails = subscribers.map(s => s.email).join(',');
        // Using BCC for privacy
        const url = `mailto:?bcc=${emails}`;
        Linking.openURL(url).catch((err: any) => console.error("Could not open mail client", err));
    };

    // Need to import Linking
    const Linking = require('react-native').Linking;

    const filteredSubscribers = subscribers.filter(sub =>
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>{item.email?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">{item.email}</Text>
                <View style={styles.dateRow}>
                    <Calendar size={12} color="#64748b" />
                    <Text style={styles.date}>{item.timestamp?.toLocaleDateString()}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Trash2 size={18} color="#64748b" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Subscribers</Text>
                    <Text style={styles.headerSubtitle}>Manage newsletter audience</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
                        <Download size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, styles.primaryBtn]} onPress={handleSendNewsletter}>
                        <Mail size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                        style={styles.input}
                        placeholder="Search emails..."
                        placeholderTextColor="#94a3b8"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                <View style={styles.countBadge}>
                    <Users size={14} color="#94a3b8" />
                    <Text style={styles.countText}>{filteredSubscribers.length} Active</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={THEME.colors.blue} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredSubscribers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Users size={48} color={THEME.subtext} />
                            <Text style={styles.emptyText}>No subscribers found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.text,
    },
    headerSubtitle: {
        color: THEME.subtext,
        fontSize: 14,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    primaryBtn: {
        backgroundColor: THEME.colors.blue,
        borderColor: THEME.colors.blue,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        marginLeft: 8,
        height: '100%',
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        gap: 6,
    },
    countText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 80,
    },
    // Card Styles
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `rgba(16, 185, 129, 0.1)`, // Green opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: `rgba(16, 185, 129, 0.2)`
    },
    cardIconText: {
        color: THEME.colors.green,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardInfo: {
        flex: 1,
        marginRight: 8,
    },
    email: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 15,
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    date: {
        color: '#64748b',
        fontSize: 12,
    },
    deleteBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: THEME.subtext,
        marginTop: 10,
    }
});
