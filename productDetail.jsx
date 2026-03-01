import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from './CartContext';
import { useProducts } from './ProductContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import chartImage from './assets/images/Chart.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE = SCREEN_WIDTH / 414;
const scale = (size) => size + (size * (BASE - 1)) * 0.5;

const ProductDetail = ({ route }) => {
  const { product: initialProduct } = route.params;
  const navigation = useNavigation();
  const { getProductById, addReview, refreshProducts } = useProducts();
  const { dispatch } = useCart();

  // Get the latest product data from Context
  const product = getProductById(initialProduct.id);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Produk tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  // State untuk deskripsi
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // State untuk Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      refreshProducts();
    }, [])
  );
  // Fungsi untuk memotong deskripsi
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const displayText = showFullDescription
    ? product.description
    : truncateText(product.description, 100);

  const addToCart = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        checked: true,
      },
    });
    Alert.alert('Berhasil!', `"${product.name}" telah ditambahkan ke keranjang.`);
  };

  const handleSubmitReview = () => {
    if (reviewComment.trim() === '') {
      Alert.alert('Error', 'Mohon isi komentar review anda.');
      return;
    }

    const newReview = {
      id: Date.now(),
      user: 'Me',
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toLocaleDateString()
    };

    addReview(product.id, newReview);
    setReviewComment('');
    setReviewRating(5);
    Alert.alert('Terima Kasih!', 'Review anda telah berhasil disimpan.');
  };

  // Helper untuk render bintang
  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  // Default rating data jika tidak ada
  const ratingData = product.rating || {
    stars: 0,
    count: 0,
    distribution: [0, 0, 0, 0, 0]
  };

  const ratingColors = [
    '#00C853', // 5 stars
    '#FFD700', // 4 stars
    '#FFA500', // 3 stars
    '#FF6347', // 2 stars
    '#FF0000'  // 1 star
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRODUCT DETAIL</Text>
        <View style={{ width: scale(24) }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={product.image || { uri: 'https://via.placeholder.com/1200?text=No+Image' }}
            style={styles.productImage}
            resizeMode="cover"
            resizeMethod="resize"
            onError={() => {
              product.image = { uri: 'https://via.placeholder.com/1200?text=No+Image' };
            }}
          />
        </View>
        <View style={styles.infoPadding}>
          <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>IDR {product.price?.toLocaleString()}</Text>
            <Text style={styles.originalPrice}>IDR {product.originalPrice?.toLocaleString()}</Text>
          </View>
          <Text style={styles.soldText}>{product.sold?.toLocaleString()} Sold</Text>
        </View>
        <View style={styles.colorSwatch}>
          <View style={[styles.colorBox, { backgroundColor: '#000000' }]} />
          <View style={[styles.colorBox, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.colorBox, { backgroundColor: '#FF5733' }]} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.descriptionText}>{displayText}</Text>
          {product.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setShowFullDescription(!showFullDescription)}
              style={styles.loadMoreButton}
            >
              <Text style={styles.loadMoreText}>
                {showFullDescription ? 'Show Less' : 'Load More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIZE CHART</Text>
          <Image
            source={chartImage}
            style={styles.sizeChartImage}
            resizeMode="contain"
          />
        </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REVIEW</Text>
            
            {/* Overall Rating Section */}
            <View style={styles.overallRatingContainer}>
              <Text style={styles.overallRatingText}>{ratingData.stars}</Text>
              <View style={{marginLeft: 10}}>
                   <Text style={styles.ratingStars}>{renderStars(Math.round(ratingData.stars))}</Text>
                   <Text style={styles.overallRatingMax}>{ratingData.count} Reviews</Text>
              </View>
            </View>

            {/* Distribution Bars */}
            <View style={styles.distributionContainer}>
              {ratingData.distribution.map((count, index) => {
                 const starCount = 5 - index;
                 const percentage = ratingData.count > 0 ? (count / ratingData.count) * 100 : 0;
                 
                 return (
                    <View key={index} style={styles.ratingRow}>
                      <View style={styles.ratingBar}>
                        <View style={[styles.ratingFill, { width: `${percentage}%`, backgroundColor: ratingColors[index] }]} />
                      </View>
                      <Text style={styles.ratingStars}>
                          {renderStars(starCount)}
                      </Text>
                      <Text style={styles.ratingCountText}>{count}</Text>
                    </View>
                 );
              })}
            </View>
            
            {/* Write Review Section */}
            <View style={styles.writeReviewContainer}>
              <Text style={styles.subSectionTitle}>Write a Review</Text>
              <View style={styles.starInputContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Text style={[styles.starInput, { color: star <= reviewRating ? '#FFD700' : '#CCCCCC' }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review here..."
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
              />
              <TouchableOpacity style={styles.submitReviewButton} onPress={handleSubmitReview}>
                <Text style={styles.submitReviewText}>Submit Review</Text>
              </TouchableOpacity>
            </View>

            {/* User Reviews List */}
            <View style={styles.userReviewsList}>
               <Text style={styles.subSectionTitle}>User Reviews</Text>
               {product.reviews && product.reviews.length > 0 ? (
                 product.reviews.map((review, index) => (
                   <View key={index} style={styles.reviewItem}>
                     <View style={styles.reviewHeader}>
                       <Text style={styles.reviewUser}>{review.user}</Text>
                       <Text style={styles.reviewDate}>{review.date}</Text>
                     </View>
                     <Text style={styles.reviewRatingStars}>{renderStars(review.rating)}</Text>
                     <Text style={styles.reviewComment}>{review.comment}</Text>
                   </View>
                 ))
               ) : (
                 <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
               )}
            </View>

          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cartButton} onPress={addToCart}>
          <Text style={styles.cartButtonText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: scale(100),
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: scale(400), // Ukuran yang lebih proporsional untuk hoodie
    backgroundColor: '#F9F9F9',
    marginBottom: scale(10),
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  infoPadding: {
    paddingHorizontal: scale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: scale(18),
    fontFamily: 'Evogria',
    letterSpacing: 2,
    color: '#000',
  },
  backButton: {
    padding: scale(5),
  },
  productImage: {
    width: '100%',
    height: Math.min(scale(650), SCREEN_WIDTH * 0.9),
    resizeMode: 'contain',
    borderRadius: scale(10),
    marginBottom: scale(50),
  },
  infoContainer: {
    marginBottom: scale(20),
  },
  productName: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#000000',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: scale(8),
  },
  currentPrice: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#000000',
  },
  originalPrice: {
    fontSize: scale(16),
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  soldText: {
    fontSize: scale(14),
    color: '#666666',
    marginTop: scale(4),
  },
  colorSwatch: {
    flexDirection: 'row',
    gap: scale(8),
    marginBottom: scale(20),
  },
  colorBox: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
  },
  section: {
    marginBottom: scale(30),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: scale(12),
  },
  descriptionText: {
    fontSize: scale(14),
    color: '#000000',
    lineHeight: scale(20),
  },
  loadMoreButton: {
    marginTop: scale(8),
    alignSelf: 'flex-start',
  },
  loadMoreText: {
    color: '#007AFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
  sizeChartImage: {
    width: '100%',
    height: scale(300),
    resizeMode: 'contain',
    backgroundColor: '#F5F5F5',
    marginTop: scale(10),
    borderRadius: scale(8),
  },
  reviewContainer: {
    marginBottom: scale(10),
  },
  overallRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  overallRatingText: {
    fontSize: scale(48),
    fontWeight: 'bold',
    color: '#000',
  },
  overallRatingMax: {
    fontSize: scale(14),
    color: '#666',
    marginTop: scale(2),
  },
  distributionContainer: {
    marginTop: scale(5),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  ratingBar: {
    width: '50%',
    height: scale(8),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(4),
    marginRight: scale(10),
  },
  ratingFill: {
    height: '100%',
    borderRadius: scale(4),
  },
  ratingStars: {
    fontSize: scale(14),
    color: '#FFD700',
    minWidth: scale(80),
  },
  ratingCountText: {
    marginLeft: scale(10),
    fontSize: scale(12),
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom:40,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cartButton: {
    backgroundColor: '#000000',
    paddingVertical: scale(12),
    borderRadius: scale(30),
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  writeReviewContainer: {
    marginTop: scale(20),
    padding: scale(16),
    backgroundColor: '#F9F9F9',
    borderRadius: scale(8),
  },
  subSectionTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: scale(10),
    color: '#000',
  },
  starInputContainer: {
    flexDirection: 'row',
    marginBottom: scale(10),
  },
  starInput: {
    fontSize: scale(30),
    marginRight: scale(5),
  },
  reviewInput: {
    backgroundColor: '#FFF',
    borderRadius: scale(8),
    padding: scale(10),
    height: scale(80),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: scale(10),
  },
  submitReviewButton: {
    backgroundColor: '#000',
    padding: scale(10),
    borderRadius: scale(5),
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  userReviewsList: {
    marginTop: scale(20),
    paddingBottom: scale(60),
  },
  reviewItem: {
    marginBottom: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: scale(10),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(5),
  },
  reviewUser: {
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  reviewDate: {
    color: '#999',
    fontSize: scale(12),
  },
  reviewRatingStars: {
    color: '#FFD700',
    fontSize: scale(14),
    marginBottom: scale(5),
  },
  reviewComment: {
    fontSize: scale(14),
    color: '#333',
    lineHeight: scale(20),
  },
  noReviewsText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: scale(5),
  },
});

export default ProductDetail;
