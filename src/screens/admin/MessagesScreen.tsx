import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Linking } from 'react-native';
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { Mail, Trash2, X, Clock, Reply } from 'lucide-react-native';
import { THEME } from './DashboardScreen';

export const MessagesScreen = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);

    useEffect(() => {
        const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const markAsRead = async (msg: any) => {
        if (msg.status === 'read') return;
        try {
            await updateDoc(doc(db, 'messages', msg.id), { status: 'read' });
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const openMessage = (msg: any) => {
        setSelectedMessage(msg);
        markAsRead(msg);
    };

    const handleDelete = async (id: string, closeDetail = false) => {
        Alert.alert(
            "Delete Message",
            "Are you sure you want to delete this message?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'messages', id));
                            if (closeDetail) setSelectedMessage(null);
                        } catch (error) {
                            Alert.alert("Error", "Could not delete message");
                        }
                    }
                }
            ]
        );
    };

    const handleReply = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    const renderMessageItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.messageRow, item.status === 'unread' && styles.unreadRow]}
            onPress={() => openMessage(item)}
            activeOpacity={0.7}
        >
            <View style={styles.rowContent}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.msgPreview}>
                    <View style={styles.topLine}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.date}>
                            {item.timestamp?.toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.bottomLine}>
                        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                        {item.status === 'unread' && <View style={styles.unreadDot} />}
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteIconBtn}
                onPress={() => handleDelete(item.id)}
            >
                <Trash2 size={18} color="#64748b" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Inbox</Text>
                    <Text style={styles.headerSubtitle}>Manage contact inquiries</Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{messages.length} Total</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={THEME.colors.blue} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Mail size={48} color={THEME.subtext} />
                            <Text style={styles.emptyText}>Inbox is empty</Text>
                        </View>
                    }
                />
            )}

            {/* Message Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedMessage}
                onRequestClose={() => setSelectedMessage(null)}
            >
                <View style={styles.modalOverlay}>
                    {selectedMessage && (
                        <View style={styles.detailModal}>
                            <View style={styles.detailHeader}>
                                <View style={styles.senderInfo}>
                                    <View style={styles.detailAvatar}>
                                        <Text style={styles.detailAvatarText}>{selectedMessage.name?.[0]?.toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.senderTextContainer}>
                                        <Text style={styles.detailName} numberOfLines={1}>{selectedMessage.name}</Text>
                                        <Text style={styles.detailEmail} numberOfLines={1}>{selectedMessage.email}</Text>
                                    </View>
                                </View>
                                <View style={styles.headerRight}>
                                    <TouchableOpacity onPress={() => setSelectedMessage(null)} style={styles.closeBtn}>
                                        <X size={24} color="#fff" />
                                    </TouchableOpacity>
                                    <View style={styles.timestamp}>
                                        <Clock size={12} color={THEME.subtext} />
                                        <Text style={styles.timeText}>
                                            {selectedMessage.timestamp?.toLocaleDateString()} {selectedMessage.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <ScrollView style={styles.detailBody}>
                                <View style={styles.subjectLine}>
                                    <Text style={styles.label}>Subject:</Text>
                                    <Text style={styles.value}>{selectedMessage.subject || "No Subject"}</Text>
                                </View>
                                <Text style={styles.messageContent}>{selectedMessage.message}</Text>
                            </ScrollView>

                            <View style={styles.detailFooter}>
                                <TouchableOpacity
                                    style={styles.actionBtnDelete}
                                    onPress={() => handleDelete(selectedMessage.id, true)}
                                >
                                    <Trash2 size={18} color={THEME.colors.rose} />
                                    <Text style={styles.actionTextDelete}>Delete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtnReply}
                                    onPress={() => handleReply(selectedMessage.email)}
                                >
                                    <Reply size={18} color="#fff" />
                                    <Text style={styles.actionTextReply}>Reply via Email</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
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
    badge: {
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(14, 165, 233, 0.2)',
    },
    badgeText: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 80,
    },
    messageRow: {
        backgroundColor: THEME.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    unreadRow: {
        borderLeftWidth: 4,
        borderLeftColor: THEME.colors.blue,
        backgroundColor: 'rgba(14, 165, 233, 0.05)',
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.blue, // Gradient replacement
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    msgPreview: {
        flex: 1,
        marginRight: 8,
    },
    topLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        color: THEME.text,
        fontSize: 16,
        fontWeight: '500',
    },
    date: {
        color: '#64748b',
        fontSize: 12,
    },
    bottomLine: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    email: {
        color: THEME.subtext,
        fontSize: 14,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.colors.blue,
        marginLeft: 8,
    },
    deleteIconBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: THEME.subtext,
        fontSize: 16,
        marginTop: 12,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end', // Bottom align
        padding: 0,
    },
    detailModal: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        paddingBottom: 20,
    },
    detailHeader: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    senderInfo: {
        flex: 1, // Allow this to take available space
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    senderTextContainer: {
        flex: 1, // Shrink text if needed
    },
    detailAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: THEME.colors.indigo,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    detailName: {
        color: THEME.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    detailEmail: {
        color: THEME.colors.blue,
        fontSize: 14,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    closeBtn: {
        padding: 4,
        marginTop: 8,
    },
    timestamp: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    timeText: {
        color: THEME.subtext,
        fontSize: 12,
        marginLeft: 4,
    },
    detailBody: {
        padding: 20,
    },
    subjectLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    label: {
        color: '#64748b',
        fontSize: 14,
        marginRight: 8,
    },
    value: {
        color: THEME.text,
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    messageContent: {
        color: '#e2e8f0',
        fontSize: 16,
        lineHeight: 24,
    },
    detailFooter: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        flexDirection: 'row',
        gap: 12,
    },
    actionBtnDelete: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 14,
        borderRadius: 10,
    },
    actionTextDelete: {
        color: THEME.colors.rose,
        fontWeight: '600',
        marginLeft: 8,
    },
    actionBtnReply: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.blue,
        padding: 14,
        borderRadius: 10,
    },
    actionTextReply: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    }
});
