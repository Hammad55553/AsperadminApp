import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';

export const DashboardScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.text}>Welcome to the Professional App Structure</Text>
            <Button
                title="Logout"
                variant="outline"
                onPress={() => navigation.replace('Login')}
                style={styles.button}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        color: colors.text.secondary,
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
        width: '100%',
    }
});
