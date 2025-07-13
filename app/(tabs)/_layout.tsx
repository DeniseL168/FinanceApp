import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          headerShown: false, // hide header on Home
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          tabBarLabel: 'Finance',
          headerShown: false, // hide header on Finance
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          headerShown: false, // hide header on Profile
        }}
      />
    </Tabs>
  );
}
