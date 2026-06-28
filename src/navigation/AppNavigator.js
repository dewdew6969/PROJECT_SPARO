import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

import ChatListScreen from '../screens/main/ChatListScreen';
import ChatScreen from '../screens/main/ChatScreen';
import CreateChallengeScreen from '../screens/main/CreateChallengeScreen';
import CreateTournamentScreen from '../screens/main/CreateTournamentScreen';
import MatchVerificationScreen from '../screens/main/MatchVerificationScreen';
import OpponentProfileScreen from '../screens/main/OpponentProfileScreen';
import VenueMapScreen from '../screens/main/VenueMapScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
      <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
      <Stack.Screen name="OpponentProfile" component={OpponentProfileScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="VenueMap" component={VenueMapScreen} />
      <Stack.Screen name="MatchVerification" component={MatchVerificationScreen} />
    </Stack.Navigator>
  );
}
