import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';

export const LoginScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <Button
                title="Go to Dashboard"
                onPress={() => navigation.replace('Dashboard')}
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
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        marginTop: 10,
    }
});
