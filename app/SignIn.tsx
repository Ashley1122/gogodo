import React, { useState } from 'react'
import { SafeAreaView, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword, auth } from '../utils/firebase';

const SignIn = ({ navigation }: { navigation: any }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter your credentials");
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert("Success", "Signed in successfully");
            navigation.navigate("Home");
        }
        catch (err: any) {
            Alert.alert("Error", err.message);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { width: '100%', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
    button: { backgroundColor: '#007bff', padding: 10, borderRadius: 8, alignItems: 'center', width: '100%' },
    buttonText: { color: '#fff', fontSize: 16 }
});

export default SignIn