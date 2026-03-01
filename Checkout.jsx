import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useCart } from './CartContext';
import { useProducts } from './ProductContext';
import * as WebBrowser from 'expo-web-browser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 414) * size;

const Checkout = () => {
  const navigation = useNavigation();
  const { cart, dispatch } = useCart();
  const { products } = useProducts(); // Digunakan untuk mendapatkan context server
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('midtrans');

  // Deteksi URL API dari context produk (yang sudah berhasil resolve)
  const getApiUrl = () => {
    // Cari URL dari provider yang sedang aktif
    // Kita asumsikan API_OVERRIDE atau kandidat yang sudah divalidasi oleh ProductProvider
    return 'http://192.168.1.23:3000/api'; // Ganti dengan IP komputer Anda yang menjalankan server
  };

  const paymentMethods = [
    { id: 'midtrans', name: 'Midtrans (All Methods)', icon: 'credit-card-outline' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'bank' },
    { id: 'e_wallet', name: 'E-Wallet (OVO/Gopay)', icon: 'wallet-outline' },
  ];

  const selectedItems = cart.filter(item => item.checked);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Pilih item untuk dibayar');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/payment/snap-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice,
          items: selectedItems.map(item => ({
            id: item.id.toString(),
            price: item.price,
            quantity: item.quantity,
            name: item.name
          })),
          customer: {
            first_name: "Veston",
            last_name: "Customer",
            email: "user@veston.com"
          }
        }),
      });

      const data = await response.json();
      if (data.redirect_url) {
        // Open Midtrans Snap Page in Web Browser
        const result = await WebBrowser.openBrowserAsync(data.redirect_url);
        
        // Simpan transaksi di DB lokal/server jika perlu
        // Bersihkan keranjang yang sudah dibayar
        Alert.alert('Pembayaran Selesai', 'Terima kasih telah berbelanja di Veston!', [
            { 
              text: 'OK', 
              onPress: () => {
                dispatch({ type: 'CLEAR_CHECKED' });
                navigation.navigate('HomeScreen');
              }
            }
        ]);
      } else {
        Alert.alert('Error', 'Gagal membuat transaksi pembayaran');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menghubungi server pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <View style={{ width: scale(24) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressLeft}>
              <Icon name="map-marker" size={scale(24)} color="#000" />
              <View>
                <Text style={styles.addressName}>Veston Customer</Text>
                <Text style={styles.addressText}>Jl. Fashion No. 101, Jakarta Pusat, Indonesia</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>IDR {item.price.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity 
              key={method.id} 
              style={[
                styles.paymentOption, 
                selectedPayment === method.id && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentLeft}>
                <Icon name={method.icon} size={scale(20)} color={selectedPayment === method.id ? '#000' : '#888'} />
                <Text style={[
                  styles.paymentName,
                  selectedPayment === method.id && styles.selectedPaymentText
                ]}>
                  {method.name}
                </Text>
              </View>
              <View style={[
                styles.radioCircle,
                selectedPayment === method.id && styles.radioCircleSelected
              ]}>
                {selectedPayment === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>IDR {totalPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>IDR 0</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>IDR {totalPrice.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.disabledBtn]} 
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payBtnText}>
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Text>
        </TouchableOpacity>
      </View>
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
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontFamily: 'Evogria',
    fontSize: scale(18),
    letterSpacing: 2,
    color: '#000',
  },
  backButton: {
    padding: scale(5),
  },
  scrollContent: {
    padding: scale(20),
    paddingBottom: scale(100),
  },
  section: {
    marginBottom: scale(30),
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: scale(15),
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: scale(15),
    borderRadius: scale(12),
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(15),
    flex: 1,
  },
  addressName: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#000',
  },
  addressText: {
    fontSize: scale(14),
    color: '#666',
    marginTop: scale(2),
  },
  editBtn: {
    color: '#007AFF',
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
    backgroundColor: '#F9F9F9',
    padding: scale(10),
    borderRadius: scale(8),
  },
  itemImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(8),
    backgroundColor: '#EEE',
  },
  itemInfo: {
    marginLeft: scale(15),
    flex: 1,
  },
  itemName: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#000',
  },
  itemQty: {
    fontSize: scale(12),
    color: '#666',
    marginTop: scale(2),
  },
  itemPrice: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#000',
    marginTop: scale(2),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(15),
    backgroundColor: '#F9F9F9',
    borderRadius: scale(12),
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedPaymentOption: {
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  paymentName: {
    fontSize: scale(14),
    color: '#666',
  },
  selectedPaymentText: {
    color: '#000',
    fontWeight: '700',
  },
  radioCircle: {
    height: scale(20),
    width: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#000',
  },
  radioInner: {
    height: scale(10),
    width: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  summaryLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  summaryValue: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    marginTop: scale(10),
    paddingTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: scale(18),
    fontWeight: '900',
    color: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: scale(20),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  payButton: {
    backgroundColor: '#000',
    paddingVertical: scale(15),
    borderRadius: scale(30),
    alignItems: 'center',
   bottom: scale(30) 
   },
  disabledBtn: {
    opacity: 0.5,
  },
  payBtnText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '700',
    fontFamily: 'Evogria',
  },
});

export default Checkout;
