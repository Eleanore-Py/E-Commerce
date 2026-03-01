import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from './CartContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE = SCREEN_WIDTH / 414;
const scale = (size) => size + (size * (BASE - 1)) * 0.5;

const Cart = () => {
  const { cart, dispatch } = useCart();
  const navigation = useNavigation();

  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => {
    return item.checked ? sum + item.price * item.quantity : sum;
  }, 0);

  // Calculate selected items count
  const selectedCount = cart.filter(item => item.checked).length;

  const handleIncrement = (id) => {
    dispatch({ type: 'INCREMENT_QUANTITY', payload: id });
  };

  const handleDecrement = (id) => {
    dispatch({ type: 'DECREMENT_QUANTITY', payload: id });
  };

  const handleToggleCheck = (id) => {
    dispatch({ type: 'TOGGLE_CHECKED', payload: id });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItemContainer}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={() => handleToggleCheck(item.id)}
      >
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>IDR. {item.price.toLocaleString()}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.qtyButton} 
            onPress={() => handleDecrement(item.id)}
          >
            <Text style={styles.qtyArrow}>◄</Text>
          </TouchableOpacity>
          
          <View style={styles.qtyBox}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.qtyButton} 
            onPress={() => handleIncrement(item.id)}
          >
            <Text style={styles.qtyArrow}>►</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>CART</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{ width: scale(24) }} /> 
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cart}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.floatingFooter}>
          <View style={styles.footerInfo}>
            <Text style={styles.selectedText}>Item selected : {selectedCount}</Text>
            <Text style={styles.payText}>Pay : IDR {totalPrice.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => {
              if (selectedCount > 0) {
                navigation.navigate('Checkout');
              } else {
                Alert.alert('Info', 'Pilih minimal satu produk untuk checkout');
              }
            }}
          >
            <View style={styles.payIconCircle}>
               <Text style={styles.payIconText}>$</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    backgroundColor: '#fff',
  },
  backButton: {
    padding: scale(5),
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(24),
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: scale(1),
  },
  titleUnderline: {
    height: scale(2),
    backgroundColor: '#000',
    width: '100%',
    marginTop: scale(2),
  },
  listContent: {
    padding: scale(20),
    paddingBottom: scale(120),
  },
  separator: {
    height: scale(1),
    backgroundColor: '#ccc',
    marginVertical: scale(15),
  },
  cartItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    padding: scale(10),
    marginRight: scale(5),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    // 
  },
  checkmark: {
    color: '#000',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  itemImage: {
    width: scale(100),
    height: scale(100),
    resizeMode: 'contain',
  },
  itemDetails: {
    flex: 1,
    marginLeft: scale(15),
    justifyContent: 'center',
  },
  itemName: {
    fontSize: scale(16),
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000',
    marginBottom: scale(5),
  },
  itemPrice: {
    fontSize: scale(14),
    color: '#000',
    marginBottom: scale(10),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    padding: scale(5),
  },
  qtyArrow: {
    fontSize: scale(12),
    color: '#000',
  },
  qtyBox: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    marginHorizontal: scale(8),
  },
  qtyText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#000',
  },
  floatingFooter: {
    position: 'absolute',
    bottom: scale(45),
    left: scale(20),
    right: scale(20),
    backgroundColor: '#000',
    borderRadius: scale(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(15),
    paddingHorizontal: scale(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: scale(5),
    elevation: 5,
  },
  footerInfo: {
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: scale(12),
    opacity: 0.8,
    marginBottom: scale(5),
  },
  payText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '500',
  },
  payButton: {
  },
  payIconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payIconText: {
    fontSize: scale(20),
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(18),
    color: '#999',
    marginBottom: scale(20),
  },
  shopNowButton: {
    backgroundColor: '#000',
    paddingHorizontal: scale(30),
    paddingVertical: scale(12),
    borderRadius: scale(25),
  },
  shopNowText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default Cart;
