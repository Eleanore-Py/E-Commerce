import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 414) * size;

const SettingItem = ({ icon, label, onPress, value, type = 'chevron', color = '#000' }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === 'switch'}>
    <View style={styles.settingLeft}>
      <Icon name={icon} size={scale(24)} color={color} />
      <Text style={[styles.settingLabel, { color }]}>{label}</Text>
    </View>
    {type === 'chevron' && <Icon name="chevron-right" size={scale(24)} color="#CCC" />}
    {type === 'switch' && (
      <Switch
        value={value}
        onValueChange={onPress}
        trackColor={{ false: "#767577", true: "#000" }}
        thumbColor={value ? "#FFF" : "#f4f3f4"}
      />
    )}
  </TouchableOpacity>
);

const Setting = () => {
  const navigation = useNavigation();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Google Auth Hook
  // PENTING: Untuk Login Google sungguhan, Anda HARUS mendaftarkan Client ID di Google Cloud Console
  // dan menggunakan skema redirect yang benar di Expo Go atau Standalone App.
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Ganti Client ID di bawah ini dengan milik Anda sendiri
    androidClientId: "863378516584-v26m368s9gq7i21u4u0g100v8468u88u.apps.googleusercontent.com", // Contoh placeholder
    iosClientId: "863378516584-ios-placeholder.apps.googleusercontent.com",
    webClientId: "863378516584-web-placeholder.apps.googleusercontent.com",
    expoClientId: "863378516584-expo-placeholder.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken);
    }
  }, [response]);

  const fetchUserInfo = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      setUserData({ name: user.name, email: user.email, picture: user.picture });
      setIsLoggedIn(true);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data user Google');
    }
  };

  const handleAuth = () => {
    if (!isLoggedIn) {
      promptAsync();
    } else {
      Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            setIsLoggedIn(false);
            setUserData(null);
          } 
        }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: scale(24) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoggedIn && userData && (
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <Icon name="account" size={scale(40)} color="#FFF" />
            </View>
            <View>
              <Text style={styles.profileName}>{userData.name}</Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {isLoggedIn ? (
            <>
              <SettingItem 
                icon="map-marker-outline" 
                label="Shipping Address" 
                onPress={() => console.log('Shipping address')} 
              />
              <SettingItem 
                icon="lock-outline" 
                label="Security" 
                onPress={() => console.log('Security')} 
              />
            </>
          ) : (
            <Text style={styles.loginHint}>Silakan login untuk mengatur alamat pengiriman dan keamanan.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingItem 
            icon="bell-outline" 
            label="Notifications" 
            type="switch"
            value={isNotificationsEnabled}
            onPress={() => setIsNotificationsEnabled(!isNotificationsEnabled)} 
          />
          <SettingItem 
            icon="translate" 
            label="Language" 
            onPress={() => console.log('Language')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem 
            icon="help-circle-outline" 
            label="Help Center" 
            onPress={() => console.log('Help Center')} 
          />
          <SettingItem 
            icon="information-outline" 
            label="About Veston" 
            onPress={() => console.log('About')} 
          />
        </View>

        <TouchableOpacity 
          style={[styles.authButton, isLoggedIn ? styles.logoutButton : styles.googleButton]} 
          onPress={handleAuth}
        >
          <Icon 
            name={isLoggedIn ? "logout" : "google"} 
            size={scale(20)} 
            color={isLoggedIn ? "#FF4D4D" : "#FFF"} 
          />
          <Text style={[styles.authText, isLoggedIn ? styles.logoutText : styles.googleText]}>
            {isLoggedIn ? "Logout" : "Login with Google"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontFamily: 'Evogria',
    fontSize: scale(18),
    letterSpacing: 2,
  },
  backButton: {
    padding: scale(5),
  },
  scrollContent: {
    paddingBottom: scale(40),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(20),
    backgroundColor: '#F9F9F9',
    margin: scale(20),
    borderRadius: scale(16),
    gap: scale(15),
  },
  profileAvatar: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#000',
  },
  profileEmail: {
    fontSize: scale(14),
    color: '#666',
  },
  section: {
    marginTop: scale(20),
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: scale(10),
  },
  loginHint: {
    fontSize: scale(14),
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: scale(10),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(15),
  },
  settingLabel: {
    fontSize: scale(15),
    fontWeight: '500',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(10),
    marginTop: scale(40),
    paddingVertical: scale(15),
    marginHorizontal: scale(20),
    borderRadius: scale(12),
  },
  googleButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000',
  },
  googleText: {
    color: '#FFF',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FFEBEB',
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: '#FF4D4D',
  },
  authText: {
    fontSize: scale(16),
    fontWeight: '700',
  },
});

export default Setting;
