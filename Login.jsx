import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 414) * size;

const Login = () => {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Evogria: require('./assets/fonts/Evogria.otf'),
    'Souliyo Unicode': require('./assets/fonts/SouliyoUnicode.ttf'),
  });

  if (!fontsLoaded) return null;

  const handlePress = () => {
    navigation.navigate('HomeScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('./assets/images/Bg.jpg')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.top}>
            <Text style={styles.brandTitle}>Veston</Text>
            <Text style={styles.brandTagline}>Style That Stays.</Text>
          </View>
          <View style={styles.bottom}>
            <TouchableOpacity style={styles.startButton} onPress={handlePress}>
              <Text style={styles.buttonText}>Tap to Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingVertical: scale(24),
  },
  top: {
    alignItems: 'center',
    marginTop: scale(40),
  },
  bottom: {
    alignItems: 'center',
    marginBottom: scale(40),
  },
  brandTitle: {
    color: '#FFF',
    fontFamily: 'Evogria',
    fontSize: scale(72),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: scale(8),
  },
  brandTagline: {
    color: '#FFF',
    fontFamily: 'Souliyo Unicode',
    fontSize: scale(20),
    fontWeight: '400',
    marginBottom: scale(28),
  },
  startButton: {
    backgroundColor: '#FFF',
    borderRadius: scale(28),
    paddingVertical: scale(14),
    paddingHorizontal: scale(36),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 4,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Evogria',
    fontSize: scale(22),
    fontWeight: '600',
  },
});

export default Login;
