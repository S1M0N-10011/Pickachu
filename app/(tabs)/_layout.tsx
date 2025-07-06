import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Dimensions, Platform } from 'react-native';

export default function TabLayout() {
  const { width, height } = Dimensions.get('window');
  const isTablet = width >= 768 || height >= 1024;

  const getTabBarStyle = () => {
    if (Platform.OS === 'ios') {
      return {
        backgroundColor: '#25292e',
        borderTopWidth: 0,
        paddingBottom: isTablet ? 12 : 20,
        paddingTop: isTablet ? 10 : 8,
        height: isTablet ? 55 : 70,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderRadius: 15,
        position: 'absolute' as const,
        marginHorizontal: isTablet ? 20 : 10,
        marginBottom: isTablet ? 20 : 30,
      };
    } else{
      return {
        backgroundColor: '#25292e',
        borderTopWidth: 0,
        paddingBottom: isTablet ? 6 : 8,
        paddingTop: isTablet ? 4 : 8,
        height: isTablet ? 50 : 60,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderRadius: 15,
        position: 'absolute' as const,
        marginHorizontal: isTablet ? 20 : 10,
        marginBottom: isTablet ? 15 : 10,
      };
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: getTabBarStyle(),
        tabBarLabelStyle: {
          fontSize: isTablet ? 14 : 12,
        },
      }}
      screenListeners={{
        tabPress: e => {
          if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home-sharp' : 'home-outline'} 
              color={color} 
              size={isTablet ? 28 : 24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              color={color} 
              size={isTablet ? 28 : 24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'account-circle' : 'account-circle-outline'} 
              color={color} 
              size={isTablet ? 28 : 24} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
