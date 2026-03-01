import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 414) * size;

const BottomNavigation = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/images/TombolNavigasi.png')}
        style={styles.navBackground}
        resizeMode="contain"
      />

      {/* Cart Button (Left - Absolute) */}
      <TouchableOpacity 
        style={styles.cartButtonContainer} 
        onPress={() => navigation.navigate('Cart')}
      >
        <Icon name="cart-outline" size={scale(24)} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Menu/More Button (Right - Absolute) */}
      <TouchableOpacity 
        style={styles.moreButtonContainer}
        onPress={() => navigation.navigate('Setting')}
      >
        <Icon name="dots-horizontal" size={scale(24)} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Home Button (Center - Absolute) */}
      <TouchableOpacity 
        style={styles.homeButtonContainer} 
        onPress={() => navigation.navigate('Login')}
        activeOpacity={1}
      >
        <View style={styles.homeCircle}>
          <Icon name="home" size={scale(28)} color="#000000" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: scale(50),
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.9,
    height: scale(80),
    alignItems: 'center',
  },
  navBackground: {
    width: '100%',
    height: scale(60),
    position: 'absolute',
    bottom: 0,
  },
  cartButtonContainer: {
    position: 'absolute',
    left: scale(99), // Original paddingHorizontal value
    bottom: scale(5), // Adjust to be vertically centered in the 60px black bar
    zIndex: 1,
  },
  moreButtonContainer: {
    position: 'absolute',
    right: scale(93), // Original paddingHorizontal value
    bottom: scale(5), // Adjust to be vertically centered in the 60px black bar
    zIndex: 1,
  },
  homeButtonContainer: {
    position: 'absolute',
    top: scale(10),
    zIndex: 2,
  },
  homeCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: scale(3.5),
    borderColor: '#000000',
  },
});

export default BottomNavigation;
