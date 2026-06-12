import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme';
import { LoginScreen }              from '../screens/LoginScreen';
import { RegisterScreen }           from '../screens/RegisterScreen';
import { HomeScreen }               from '../screens/HomeScreen';
import { RespiracionScreen }        from '../screens/RespiracionScreen';
import { PinealScreen }             from '../screens/PinealScreen';
import { HistorialScreen }          from '../screens/HistorialScreen';
import { JournalScreen }            from '../screens/JournalScreen';
import { IntegrityJournalScreen }   from '../screens/IntegrityJournalScreen';
import { AccionMasivaScreen }       from '../screens/AccionMasivaScreen';

export type AuthStackParams = { Login: undefined; Register: undefined; };
export type RootStackParams = {
  Auth: undefined; App: undefined;
  Journal: undefined; IntegrityJournal: undefined;
  AccionMasiva: undefined; Pineal: undefined;
  Respiracion: { protocolo: 'rescate' | 'expansion' | 'coherencia' | 'pineal' };
};

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const AppTab    = createBottomTabNavigator();
const Root      = createNativeStackNavigator<RootStackParams>();

function AuthNav() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNav() {
  return (
    <AppTab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border, borderTopWidth: 0.5, paddingBottom: 8, height: 60 },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textHint,
      tabBarLabelStyle: { fontSize: 9, fontWeight: fonts.medium, letterSpacing: 0.8 },
    }}>
      <AppTab.Screen name="Estado"    component={HomeScreen}     options={{ title: 'Estado' }} />
      <AppTab.Screen name="Historial" component={HistorialScreen} options={{ title: 'Historial' }} />
    </AppTab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <View style={{ flex:1, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center' }}><ActivityIndicator color={colors.accent} /></View>;

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Root.Screen name="App"              component={AppNav} />
            <Root.Screen name="Journal"          component={JournalScreen}          options={{ presentation: 'modal' }} />
            <Root.Screen name="IntegrityJournal" component={IntegrityJournalScreen} options={{ presentation: 'modal' }} />
            <Root.Screen name="AccionMasiva"     component={AccionMasivaScreen}     options={{ presentation: 'modal' }} />
            <Root.Screen name="Pineal"           component={PinealScreen}           options={{ presentation: 'modal' }} />
            <Root.Screen name="Respiracion"      component={RespiracionScreen}      options={{ presentation: 'modal' }} />
          </>
        ) : (
          <Root.Screen name="Auth" component={AuthNav} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
