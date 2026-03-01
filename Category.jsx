import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useProducts } from './ProductContext';
import BottomNavigation from './BottomNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 414) * size;

const ProductCard = ({ imageSrc, name, price, onPress }) => {
  const [src, setSrc] = React.useState(imageSrc);
  const fallback = { uri: 'https://via.placeholder.com/500x500?text=No+Image' };
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <Image
        source={src}
        style={styles.productImage}
        resizeMode="cover"
        resizeMethod="auto"
        onError={() => setSrc(fallback)}
      />
      <Text style={styles.productName}>{name}</Text>
      <Text style={styles.productPrice}>{price}</Text>
    </TouchableOpacity>
  );
};

const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const category = route.params?.category || '';
  const { products, refreshProducts } = useProducts();

  useFocusEffect(
    React.useCallback(() => {
      refreshProducts(category);
    }, [category])
  );

  const openProductDetail = (product) => {
    navigation.navigate('productDetail', { product });
  };

  const title = category ? category.toUpperCase() : 'CATEGORY';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: scale(24) }} />
      </View>
      <View style={styles.lineSeparator} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.countText}>{products.length} produk</Text>

        <View style={styles.gridContainer}>
          {products.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard
                imageSrc={product.image}
                name={product.name}
                price={`IDR ${product.price.toLocaleString()}`}
                onPress={() => openProductDetail(product)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
  },
  backButton: {
    padding: scale(5),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(120), // Increased to match new BottomNavigation position
  },
  title: {
    fontSize: scale(24),
    fontFamily: 'Evogria',
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 2,
  },
  lineSeparator: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: scale(10),
  },
  countText: {
    textAlign: 'center',
    marginBottom: scale(10),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: scale(20),
  },
  productCard: {
    width: '100%',
    alignItems: 'center',
    padding: scale(10),
    backgroundColor: '#fff',
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: scale(180),
    backgroundColor: '#f5f5f5',
    borderRadius: scale(8),
  },
  productName: {
    marginTop: scale(10),
    fontSize: scale(14),
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  productPrice: {
    marginTop: scale(6),
    fontSize: scale(12),
    color: '#333',
  },
});

export default CategoryScreen;
