// Firebase配置文件
// ⚠️ 这个文件需要你用自己的Firebase项目配置替换

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyAiQeP8jOgFWsh4yNzRaLPjl3yD7Lgov0w",
  authDomain: "undefined-heros.firebaseapp.com",
  projectId: "undefined-heros",
  storageBucket: "undefined-heros.firebasestorage.app",
  messagingSenderId: "962146875919",
  appId: "1:962146875919:web:a17d052ab6e8aa025147a",
  measurementId: "G-RGQV4394LB"
};

// 初始化Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  
  // 初始化服务
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  console.log('✅ Firebase已初始化');
} else {
  console.error('❌ Firebase SDK未加载');
}

// 用户认证功能
const AuthService = {
  // 注册
  async signup(email, password, userData) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // 保存用户数据到Firestore
      await db.collection('users').doc(user.uid).set({
        email: email,
        ...userData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 登录
  async login(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 登出
  async logout() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 获取当前用户
  getCurrentUser() {
    return auth.currentUser;
  },
  
  // 监听认证状态
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
};

// 订单管理功能
const OrderService = {
  // 创建订单
  async createOrder(orderData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('用户未登录');
      
      const order = {
        userId: user.uid,
        ...orderData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('orders').add(order);
      return { success: true, orderId: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 获取用户订单
  async getUserOrders() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('用户未登录');
      
      const snapshot = await db.collection('orders')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, orders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 实时监听订单状态
  listenToOrder(orderId, callback) {
    return db.collection('orders').doc(orderId).onSnapshot(doc => {
      if (doc.exists) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },
  
  // 更新订单状态
  async updateOrderStatus(orderId, status) {
    try {
      await db.collection('orders').doc(orderId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 商家管理功能
const MerchantService = {
  // 获取商家列表
  async getMerchants(filters = {}) {
    try {
      let query = db.collection('merchants').where('active', '==', true);
      
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
      
      const snapshot = await query.get();
      const merchants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, merchants };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // 获取商家详情
  async getMerchantDetail(merchantId) {
    try {
      const doc = await db.collection('merchants').doc(merchantId).get();
      if (!doc.exists) {
        throw new Error('商家不存在');
      }
      return { success: true, merchant: { id: doc.id, ...doc.data() } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService, OrderService, MerchantService };
}
