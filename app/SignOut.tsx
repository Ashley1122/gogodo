import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { signOut, auth } from '../utils/firebase';
import { ActivityIndicator, View, Text } from 'react-native';

const confirmSignOut = (navigation: any) => {
    Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    navigation.navigate("Home");
                }
            },
            {
                text: "Yes",
                onPress: async () => {
                    try {
                        await signOut(auth);
                        Alert.alert("Signed Out", "You have been Successfully signed out");
                        navigation.navigate("Home");
                    } catch (error: any) {
                        Alert.alert("Error", error.message);
                    }
                }
            }
        ],
        { cancelable: true }
    );
};

const SignOut = ({ navigation }: { navigation: any }) => {

    useEffect(() => {
        confirmSignOut(navigation);
    }, [])

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text> Signing you out... </Text>
            <ActivityIndicator size="large" />
        </View>
    )
}


export default SignOut;