import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CartProvider } from './CartContext';
import { ProductProvider } from './ProductContext';
import Login from './Login';
import HomeScreen from './HomeScreen';
import Category from './Category';
import Cart from './Cart';
import ProductDetail from './productDetail';
import Setting from './Setting';
import Checkout from './Checkout';
const Stack = createStackNavigator();

export default function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="HomeScreen" 
              component={HomeScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Category" 
              component={Category} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Cart" 
              component={Cart} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="productDetail" 
              component={ProductDetail} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Setting" 
              component={Setting} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Checkout" 
              component={Checkout} 
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </ProductProvider>
  );
}
