import * as SQLite from 'expo-sqlite';
let db;
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('veston.db');
    
    // Create tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL,
        originalPrice REAL,
        sold INTEGER,
        imageKey TEXT,
        description TEXT,
        sizeChartImageKey TEXT,
        category TEXT
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        user TEXT,
        rating INTEGER,
        comment TEXT,
        date TEXT,
        FOREIGN KEY(productId) REFERENCES products(id)
      );
    `);

    // No seeding: biarkan kosong sampai ada upload/penambahan dari server
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export const getProductsFromDB = async () => {
  try {
    if (!db) await initDatabase();
    
    const products = await db.getAllAsync('SELECT * FROM products');
    const reviews = await db.getAllAsync('SELECT * FROM reviews');
    
    // Combine products with their reviews
    return products.map(p => {
      const productReviews = reviews.filter(r => r.productId === p.id);
      
      // Calculate rating stats
      const count = productReviews.length;
      const distribution = [0, 0, 0, 0, 0];
      let totalScore = 0;
      
      productReviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[5 - r.rating]++;
          totalScore += r.rating;
        }
      });
      
      const stars = count > 0 ? parseFloat((totalScore / count).toFixed(1)) : 0;
      
      return {
        ...p,
        rating: {
          stars,
          count,
          distribution
        },
        reviews: productReviews.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const addReviewToDB = async (productId, review) => {
  try {
    if (!db) await initDatabase();
    
    await db.runAsync(
      'INSERT INTO reviews (productId, user, rating, comment, date) VALUES (?, ?, ?, ?, ?)',
      [productId, review.user, review.rating, review.comment, review.date]
    );
    return true;
  } catch (error) {
    console.error('Error adding review:', error);
    return false;
  }
};