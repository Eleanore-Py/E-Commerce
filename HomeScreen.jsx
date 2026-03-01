import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 414) * size;
const CategoryItem = ({ imageSrc, name, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.categoryItemTouch}>
      <Image source={imageSrc} style={styles.categoryImage} resizeMode="contain" />
    </TouchableOpacity>
  );
};

const Header = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Veston</Text>
      <View style={styles.navContainer}>
        <View style={styles.navGroup}>
          <Text style={styles.navLink}>Chat</Text>
          <View style={styles.separator} />
          <Text style={styles.navLink}
              onPress={() => navigation.navigate('Cart')}
              >Cart</Text>
          <View style={styles.separator} />
          <Text style={styles.navLink}>Our Store</Text>
          <View style={styles.separator} />
          <Text style={styles.navLink}>Contact Us</Text>
          <View style={styles.separator} />
          <TouchableOpacity onPress={() => navigation.navigate('Setting')}>
            <Icon name="account-circle-outline" size={scale(22)} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const HeroSection = () => {
  return (
    <View style={styles.heroSection}>
      <Image
        source={{
          uri: 'https://api.builder.io/api/v1/image/assets/7ff328e9cf774366a1a7aa2461ba2b8b/b5a0d98fa58f06a0a0dc5ed8752a108814265f42?placeholderIfAbsent=true',
        }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <Text style={styles.heroText}>Style That Stays.</Text>
    </View>
  );
};

const CategoriesSection = ({ navigation }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.lineSeparator} />
      </View>
      <View style={styles.categoriesGrid}>
        <View style={styles.categoryColumn}>
          <CategoryItem
            imageSrc={require('./assets/Hoodie.png')}
            name="Hoodie"
            onPress={() => navigation.navigate('Category', { category: 'hoodie' })}
          />
          <View style={{ marginTop: scale(40) }}>
            <CategoryItem
              imageSrc={require('./assets/varsity.png')}
              name="Varsity"
              onPress={() => navigation.navigate('Category', { category: 'varsity' })}
            />
          </View>
          <View style={{ marginTop: scale(20) }}>
            <CategoryItem
              imageSrc={require('./assets/Winbreaker.png')}
              name="Windbreaker"
              onPress={() => navigation.navigate('Category', { category: 'windbreaker' })}
            />
          </View>
          <View style={{ marginTop: scale(35) }}>
            <CategoryItem
              imageSrc={require('./assets/Parka.png')}
              name="Parka"
              onPress={() => navigation.navigate('Category', { category: 'parka' })}
            />
          </View>
        </View>
        <View style={styles.categoryColumn}>
          <CategoryItem
            imageSrc={require('./assets/Denim.png')}
            name="Denim"
            onPress={() => navigation.navigate('Category', { category: 'denim' })}
          />
          <View style={{ marginTop: scale(30) }}>
            <CategoryItem
              imageSrc={require('./assets/harrington.png')}
              name="Harrington"
              onPress={() => navigation.navigate('Category', { category: 'harrington' })}
            />
          </View>
          <View style={{ marginTop: scale(35) }}>
            <CategoryItem
              imageSrc={require('./assets/Leather.png')}
              name="Leather"
              onPress={() => navigation.navigate('Category', { category: 'leather' })}
            />
          </View>
          <View style={{ marginTop: scale(15) }}>
            <CategoryItem
              imageSrc={require('./assets/Puffer.png')}
              name="Puffer"
              onPress={() => navigation.navigate('Category', { category: 'puffer' })}
            />
          </View>
        </View>
      </View>
      <View style={styles.categoryRow}>
        <View style={{ marginTop: scale(8) }}>
          <CategoryItem
            imageSrc={require('./assets/Track.png')}
            name="Track"
            onPress={() => navigation.navigate('Category', { category: 'track' })}
          />
        </View>
        <View>
          <CategoryItem
            imageSrc={require('./assets/Anorak.png')}
            name="Anorak"
            onPress={() => navigation.navigate('Category', { category: 'anorak' })}
          />
        </View>
      </View>
    </View>
  );
};

const LimitedEditionSection = () => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>LIMITED EDITION</Text>
        <View style={styles.lineSeparator} />
      </View>
      <View style={styles.limitedEditionContainer}>
        <Image
          source={{
            uri: 'https://api.builder.io/api/v1/image/assets/7ff328e9cf774366a1a7aa2461ba2b8b/d8ceef128b7f870f84929fc6123a81816f5abcc1?placeholderIfAbsent=true',
          }}
          style={styles.limitedImage1}
          resizeMode="contain"
        />
        <View style={styles.limitedItemContainer}>
          <Image
            source={{
              uri: 'https://api.builder.io/api/v1/image/assets/7ff328e9cf774366a1a7aa2461ba2b8b/793fd79fd3fc53d429e60aa4cf9afd682a818141?placeholderIfAbsent=true',
            }}
            style={styles.limitedImage2}
            resizeMode="contain"
          />
          <Text style={styles.textBase}>Leather Vest</Text>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Header />
          <HeroSection />
          <CategoriesSection navigation={navigation} />
          <LimitedEditionSection />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 2,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: scale(50), // Reduced since BottomNavigation is removed
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: scale(20),
  },
  title: {
    fontSize: scale(24),
    fontFamily: 'Evogria'
  },
  navContainer: {
    flexDirection: 'row',
    gap: scale(16),
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  navLink: {
    fontSize: scale(13),
    color: '#000',
    textDecorationLine: 'none',
    fontWeight: '400',
    paddingHorizontal: scale(3),
    paddingVertical: scale(2),
  },
  separator: {
    width: 1.5,
    height: scale(12),
    backgroundColor: '#000',
  },
  heroSection: {
    width: '100%',
    height: scale(300),
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    marginTop: scale(10),
    position: 'relative',
  },
  heroText: {
    fontSize: scale(30),
    position: 'relative',
    zIndex: 1,
  },
  section: {
    width: '100%',
    paddingHorizontal: scale(20),
    marginTop: scale(30),
  },
  sectionHeader: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: scale(16),
  },
  lineSeparator: {
    width: scale(86),
    height: 1,
    backgroundColor: '#000',
    marginTop: scale(6),
  },
 categoriesGrid: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'flex-start',
  marginTop: scale(20),
  gap: scale(10),
},
categoryColumn: {
  width: '48%',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: scale(20),
},
categoryItem: {
  alignItems: 'center',
  width: '100%',
},
categoryImage: {
  width: scale(120),
  height: scale(120),
},
categoryRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: scale(70),
  width: '100%',
},
  limitedEditionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(20),
  },
  limitedImage1: {
    width: scale(150),
    height: scale(135),
  },
  limitedImage2: {
    width: scale(146),
    height: scale(146),
  },
  limitedItemContainer: {
    alignItems: 'center',
  },
  textBase: {
    fontFamily: '',
    fontSize: scale(14),
    textAlign: 'center'
  },
});

export default HomeScreen;
