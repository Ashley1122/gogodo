import { useEffect, useState } from 'react';
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { auth, onAuthStateChanged, User } from "../utils/firebase";
import GlobalState from "../utils/GlobalState";
import { ActivityIndicator, View } from 'react-native';
import SignIn from './SignIn';
import SignOut from "./SignOut";
import HomeScreen from "./Home"; 

const Drawer = createDrawerNavigator();


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      setUser(user);
      GlobalState.setUser(user);
      setLoading(false)
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
          <Drawer.Navigator initialRouteName={user ? "Home" : "SignIn"}>
            <Drawer.Screen name="Home" component={HomeScreen} />
            {user ? (
              <Drawer.Screen
                name="SignOut"
                component={SignOut}
              />
            ) : (
              <Drawer.Screen name="SignIn" component={SignIn} />
            )}
          </Drawer.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
