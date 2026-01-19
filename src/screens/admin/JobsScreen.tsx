import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { Briefcase, Plus, Trash2, MapPin, Clock, Paintbrush, Globe, Database, Code, Terminal, Cpu, X, Box, ChevronDown } from 'lucide-react-native';
import { THEME } from './DashboardScreen';

// Reusable Dropdown Component
const DropdownSelector = ({ options, selectedValue, onSelect }: { options: string[], selectedValue: string, onSelect: (val: string) => void }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setVisible(!visible)}
                activeOpacity={0.8}
            >
                <Text style={styles.dropdownText}>{selectedValue}</Text>
                <ChevronDown size={20} color={THEME.subtext} />
            </TouchableOpacity>

            {/* Simple Inline Dropdown List */}
            {visible && (
                <View style={styles.dropdownList}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.dropdownItem,
                                selectedValue === option && { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                            ]}
                            onPress={() => {
                                onSelect(option);
                                setVisible(false);
                            }}
                        >
                            <Text style={[
                                styles.dropdownItemText,
                                selectedValue === option && { color: THEME.colors.blue, fontWeight: '600' }
                            ]}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// Icon mapping helper
const getIconForJob = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('design') || t.includes('artist') || t.includes('ui/ux')) return <Paintbrush size={20} color={THEME.text} />;
    if (t.includes('frontend') || t.includes('react') || t.includes('web')) return <Globe size={20} color={THEME.text} />;
    if (t.includes('backend') || t.includes('node') || t.includes('api')) return <Database size={20} color={THEME.text} />;
    if (t.includes('full stack') || t.includes('engineer') || t.includes('developer')) return <Code size={20} color={THEME.text} />;
    if (t.includes('security') || t.includes('cyber')) return <Terminal size={20} color={THEME.text} />;
    if (t.includes('ai') || t.includes('ml') || t.includes('intelligence')) return <Cpu size={20} color={THEME.text} />;
    return <Briefcase size={20} color={THEME.text} />; // Default
};

const getRandomColor = () => {
    const colors = [THEME.colors.blue, THEME.colors.rose, THEME.colors.purple, THEME.colors.green, THEME.colors.orange, THEME.colors.indigo];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const JobsScreen = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newJob, setNewJob] = useState({
        title: '',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        description: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddJob = async () => {
        if (!newJob.title || !newJob.location) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }

        try {
            await addDoc(collection(db, 'jobs'), {
                ...newJob,
                color: getRandomColor(),
                timestamp: serverTimestamp()
            });
            setModalVisible(false);
            setNewJob({ title: '', department: 'Engineering', location: 'Remote', type: 'Full-time', description: '' });
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to post job");
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete Job",
            "Are you sure you want to remove this job posting?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'jobs', id));
                        } catch (error) {
                            Alert.alert("Error", "Could not delete job");
                        }
                    }
                }
            ]
        );
    };

    const renderJobItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    {getIconForJob(item.title)}
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.jobDept}>{item.department}</Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <MapPin size={14} color={THEME.subtext} />
                    <Text style={styles.detailText}>{item.location}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Clock size={14} color={THEME.subtext} />
                    <Text style={styles.detailText}>{item.type}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Trash2 size={16} color={THEME.colors.rose} />
                <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Manage Jobs</Text>
                    <Text style={styles.headerSubtitle}>Create and manage open positions</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Plus size={20} color="#fff" />
                    <Text style={styles.addBtnText}>Post Job</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={THEME.colors.blue} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Briefcase size={48} color={THEME.subtext} />
                            <Text style={styles.emptyText}>No active job postings</Text>
                        </View>
                    }
                />
            )}

            {/* Add Job Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Post New Job</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={THEME.subtext} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.label}>Job Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Senior Product Designer"
                                placeholderTextColor={THEME.subtext}
                                value={newJob.title}
                                onChangeText={text => setNewJob({ ...newJob, title: text })}
                            />

                            <Text style={styles.label}>Department</Text>
                            <DropdownSelector
                                options={["Engineering", "Design", "Marketing", "Sales", "Customer Support", "HR", "Product", "Operations"]}
                                selectedValue={newJob.department}
                                onSelect={(val) => setNewJob({ ...newJob, department: val })}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Location</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="City, Country"
                                        placeholderTextColor={THEME.subtext}
                                        value={newJob.location}
                                        onChangeText={text => setNewJob({ ...newJob, location: text })}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.label}>Type</Text>
                                    <DropdownSelector
                                        options={["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Remote"]}
                                        selectedValue={newJob.type}
                                        onSelect={(val) => setNewJob({ ...newJob, type: val })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddJob}>
                                <Text style={styles.submitBtnText}>Post Job</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
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
    addBtn: {
        backgroundColor: THEME.colors.blue,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
    },
    listContent: {
        paddingBottom: 80,
    },
    card: {
        backgroundColor: THEME.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    jobTitle: {
        color: THEME.text,
        fontSize: 16,
        fontWeight: '600',
    },
    jobDept: {
        color: THEME.subtext,
        fontSize: 12,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    detailText: {
        color: '#cbd5e1',
        marginLeft: 6,
        fontSize: 13,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 10,
        borderRadius: 6,
    },
    deleteText: {
        color: THEME.colors.rose,
        marginLeft: 6,
        fontWeight: '500',
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end', // Align to bottom
        padding: 0, // Remove padding to flush with bottom
    },
    modalContent: {
        backgroundColor: THEME.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: 24,
        maxHeight: '85%', // Taller sheet
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 40, // Safe area for bottom
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: THEME.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        color: '#cbd5e1',
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        color: THEME.text,
        padding: 12,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    submitBtn: {
        backgroundColor: THEME.colors.blue,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Dropdown Styles
    dropdownButton: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        color: THEME.text,
        fontSize: 14,
    },
    dropdownList: {
        marginTop: 8,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 4,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    dropdownItemText: {
        color: THEME.subtext,
        fontSize: 14,
    }
});
