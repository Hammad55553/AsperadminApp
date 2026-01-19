import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Linking } from 'react-native';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { Briefcase, MapPin, Mail, Trash2, X, Clock, FileText, Download, Phone } from 'lucide-react-native';
import { THEME } from './DashboardScreen';

export const ApplicationsScreen = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<any>(null);

    useEffect(() => {
        const q = query(collection(db, 'applications'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown Candidate',
                    timestamp: data.timestamp?.toDate()
                };
            });
            setApplications(apps);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching applications:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, closeDetail = false) => {
        Alert.alert(
            "Delete Application",
            "Are you sure you want to delete this application?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'applications', id));
                            if (closeDetail) setSelectedApp(null);
                        } catch (error) {
                            Alert.alert("Error", "Could not delete application");
                        }
                    }
                }
            ]
        );
    };

    const handleDownloadResume = (url: string) => {
        if (!url) {
            Alert.alert("No Resume", "This candidate did not upload a resume.");
            return;
        }
        Linking.openURL(url).catch(err => {
            Alert.alert("Error", "Could not open resume link");
        });
    };

    const handleContact = (email: string, position: string) => {
        const subject = `Regarding your application for ${position}`;
        Linking.openURL(`mailto:${email}?subject=${subject}`);
    };

    const renderAppItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.appCard}
            onPress={() => setSelectedApp(item)}
            activeOpacity={0.8}
        >
            <View style={styles.cardTop}>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{item.position}</Text>
                </View>
                <Text style={styles.date}>{item.timestamp?.toLocaleDateString()}</Text>
            </View>

            <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{item.fullName}</Text>
                <View style={styles.infoRow}>
                    <Mail size={14} color="#94a3b8" />
                    <Text style={styles.infoText}>{item.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Phone size={14} color="#94a3b8" />
                    <Text style={styles.infoText}>{item.phone || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.viewDetails}>View Details &rarr;</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Job Applications</Text>
                    <Text style={styles.headerSubtitle}>Review incoming talent</Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{applications.length} Applicants</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={THEME.colors.blue} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={applications}
                    renderItem={renderAppItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Briefcase size={48} color={THEME.subtext} />
                            <Text style={styles.emptyText}>No applications yet</Text>
                        </View>
                    }
                />
            )}

            {/* Application Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedApp}
                onRequestClose={() => setSelectedApp(null)}
            >
                <View style={styles.modalOverlay}>
                    {selectedApp && (
                        <View style={styles.detailModal}>
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalTitle}>{selectedApp.fullName}</Text>
                                    <View style={[styles.roleBadge, { alignSelf: 'flex-start', marginTop: 4 }]}>
                                        <Text style={styles.roleText}>{selectedApp.position}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedApp(null)}>
                                    <X size={24} color={THEME.subtext} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Contact Information</Text>
                                    <View style={styles.infoGrid}>
                                        <View style={styles.infoBox}>
                                            <Mail size={16} color="#cbd5e1" />
                                            <Text style={styles.infoBoxText}>{selectedApp.email}</Text>
                                        </View>
                                        <View style={styles.infoBox}>
                                            <Phone size={16} color="#cbd5e1" />
                                            <Text style={styles.infoBoxText}>{selectedApp.phone || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.infoBox}>
                                            <Clock size={16} color="#cbd5e1" />
                                            <Text style={styles.infoBoxText}>Applied: {selectedApp.timestamp?.toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Cover Letter</Text>
                                    <Text style={styles.coverLetter}>{selectedApp.coverLetter || "No cover letter provided."}</Text>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Resume / CV</Text>
                                    {selectedApp.resumeUrl ? (
                                        <TouchableOpacity
                                            style={styles.resumeBtn}
                                            onPress={() => handleDownloadResume(selectedApp.resumeUrl)}
                                        >
                                            <FileText size={20} color={THEME.colors.blue} />
                                            <Text style={styles.resumeText}>View Resume PDF</Text>
                                            <Download size={16} color={THEME.colors.blue} style={{ marginLeft: 'auto' }} />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.noFile}>
                                            <Text style={{ color: THEME.subtext }}>No resume uploaded</Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.actionBtnDelete}
                                    onPress={() => handleDelete(selectedApp.id, true)}
                                >
                                    <Trash2 size={18} color={THEME.colors.rose} />
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtnContact}
                                    onPress={() => handleContact(selectedApp.email, selectedApp.position)}
                                >
                                    <Mail size={18} color="#fff" />
                                    <Text style={styles.contactText}>Contact</Text>
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
    // App Card
    appCard: {
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    roleBadge: {
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    roleText: {
        color: '#38bdf8',
        fontWeight: '600',
        fontSize: 12,
    },
    date: {
        color: '#64748b',
        fontSize: 12,
    },
    candidateInfo: {
        marginTop: 12,
    },
    candidateName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        alignItems: 'flex-end',
    },
    viewDetails: {
        color: THEME.colors.blue,
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: THEME.subtext,
        marginTop: 10,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end', // Align to bottom
        padding: 0,
    },
    detailModal: {
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    modalHeader: {
        padding: 20,
        backgroundColor: '#1E293B',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 4,
    },
    infoGrid: {
        gap: 12,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 8,
    },
    infoBoxText: {
        color: '#cbd5e1',
        fontSize: 14,
    },
    coverLetter: {
        color: '#cbd5e1',
        lineHeight: 22,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 8,
    },
    resumeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(14, 165, 233, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(14, 165, 233, 0.3)',
        gap: 12,
    },
    resumeText: {
        color: '#fff',
        fontWeight: '500',
    },
    noFile: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
    },
    modalFooter: {
        padding: 20,
        backgroundColor: '#1E293B',
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
    deleteText: {
        color: THEME.colors.rose,
        fontWeight: '600',
        marginLeft: 8,
    },
    actionBtnContact: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.colors.blue,
        padding: 14,
        borderRadius: 10,
    },
    contactText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    }
});
