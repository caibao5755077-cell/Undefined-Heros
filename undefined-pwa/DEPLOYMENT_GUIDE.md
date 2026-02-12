# 🚀 UNDEFINED PWA 部署指南

## 📋 已完成的文件

✅ **PWA核心文件**
- `manifest.json` - PWA配置
- `service-worker.js` - 离线缓存和推送
- `firebase-config.js` - Firebase集成
- `index.html` - 主页（可用版本）

## 🎯 第一步：创建Firebase项目（10分钟）

### 1. 注册Firebase
1. 访问 https://firebase.google.com
2. 点击"Get Started"
3. 用Google账号登录
4. 点击"Add Project"创建项目

### 2. 项目配置
```
项目名称：undefined-delivery
地区：Europe (或Netherlands如果有)
启用Google Analytics：是（可选）
```

### 3. 获取配置信息
1. 在Firebase控制台，点击⚙️设置
2. 选择"项目设置"
3. 滚动到"您的应用"
4. 点击"Web"图标（</>）
5. 注册应用名称：UNDEFINED PWA
6. 复制firebaseConfig对象

### 4. 更新firebase-config.js
```javascript
const firebaseConfig = {
  apiKey: "你的API_KEY",
  authDomain: "undefined-delivery.firebaseapp.com",
  projectId: "undefined-delivery",
  storageBucket: "undefined-delivery.appspot.com",
  messagingSenderId: "你的SENDER_ID",
  appId: "你的APP_ID"
};
```

### 5. 启用Firebase服务
在Firebase控制台：
- **Authentication** → 启用"Email/Password"
- **Firestore Database** → 创建数据库（测试模式）
- **Storage** → 启用存储

---

## 🌐 第二步：部署到Vercel（5分钟）

### 方法1：通过GitHub（推荐）

1. **创建GitHub仓库**
```bash
# 在本地
cd undefined-pwa
git init
git add .
git commit -m "Initial commit: UNDEFINED PWA"
git remote add origin https://github.com/你的用户名/undefined-pwa.git
git push -u origin main
```

2. **连接Vercel**
- 访问 https://vercel.com
- 用GitHub登录
- 点击"Import Project"
- 选择你的undefined-pwa仓库
- 点击"Deploy"

3. **配置环境变量**（如果需要）
- 在Vercel项目设置中添加环境变量
- 不需要特殊配置，直接部署即可

**完成！你的网站会部署到：**
`https://undefined-pwa.vercel.app`

### 方法2：通过Vercel CLI

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd undefined-pwa
vercel

# 按提示操作：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - Project name? undefined-pwa
# - Directory? ./
# - Override settings? No

# 部署到生产环境
vercel --prod
```

---

## 📱 第三步：测试PWA功能

### 在手机上测试
1. 用手机浏览器打开部署的网站
2. Chrome：点击"添加到主屏幕"
3. Safari：点击分享 → "添加到主屏幕"
4. 图标会出现在手机桌面
5. 点击图标，像原生App一样打开

### 测试离线功能
1. 打开网站
2. 关闭WiFi和移动数据
3. 刷新页面
4. 网站仍然可以访问（Service Worker缓存）

---

## 🗄️ 第四步：Firestore数据结构

### 在Firebase控制台创建集合

#### 1. users（用户）
```javascript
{
  email: "user@example.com",
  name: "张三",
  phone: "+31612345678",
  role: "consumer", // consumer / merchant / rider
  createdAt: timestamp,
  address: {
    street: "Sarphatipark 12-2",
    city: "Amsterdam",
    zipCode: "1073 DE"
  }
}
```

#### 2. merchants（商家）
```javascript
{
  name: "La Bella Vita",
  category: "Fine Dining",
  cuisine: "意大利菜",
  rating: 4.9,
  reviews: 234,
  priceRange: "€€€",
  deliveryTime: "35-45 min",
  deliveryFee: 3.5,
  minOrder: 25,
  active: true,
  address: "Jordaan, Amsterdam"
}
```

#### 3. orders（订单）
```javascript
{
  userId: "user_id",
  merchantId: "merchant_id",
  riderId: "rider_id",
  items: [
    { name: "松露意面", quantity: 1, price: 25 }
  ],
  total: 28.60,
  status: "pending", // pending / accepted / preparing / delivering / completed
  deliveryAddress: "...",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 安全规则（重要！）
在Firestore → Rules中设置：
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能读写自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 所有人可以读商家，只有商家可以写
    match /merchants/{merchantId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'merchant';
    }
    
    // 订单规则
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.merchantId == request.auth.uid ||
         resource.data.riderId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

---

## 💳 第五步：集成Stripe支付

### 1. 创建Stripe账号
1. 访问 https://stripe.com
2. 注册账号（选择Netherlands）
3. 完成KYC验证

### 2. 获取API密钥
- Dashboard → Developers → API keys
- 复制"Publishable key"和"Secret key"

### 3. 在网站中集成
```html
<!-- 在需要支付的页面添加 -->
<script src="https://js.stripe.com/v3/"></script>
<script>
const stripe = Stripe('你的Publishable_key');

async function createCheckout() {
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 3100, // €31.00
      orderId: 'order_123'
    })
  });
  
  const { sessionId } = await response.json();
  stripe.redirectToCheckout({ sessionId });
}
</script>
```

---

## 📊 第六步：分析和监控

### Google Analytics
1. Firebase控制台 → Analytics
2. 复制Measurement ID
3. 已经在firebase-config.js中配置

### 实时监控
- Firebase Console → Firestore
- 可以看到实时数据变化
- Performance Monitoring（可选）

---

## 🔒 安全检查清单

- [ ] Firebase安全规则已设置
- [ ] Stripe使用生产密钥（不是测试密钥）
- [ ] 敏感信息不在前端代码中
- [ ] HTTPS已启用（Vercel自动）
- [ ] CSP headers配置（可选）

---

## 📱 推送通知（可选）

### 1. 获取VAPID密钥
```bash
# 使用web-push生成
npx web-push generate-vapid-keys
```

### 2. 在Firebase启用
- Firebase Console → Cloud Messaging
- 添加Web Push certificates
- 粘贴VAPID公钥

### 3. 请求通知权限
```javascript
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'your-vapid-public-key'
    });
    // 保存subscription到后端
  }
}
```

---

## 🎉 完成！

你的网站现在：
✅ 可以像App一样安装
✅ 支持离线访问
✅ 有用户认证
✅ 有数据库
✅ 有支付功能
✅ 全球CDN加速

**访问地址：** https://你的域名.vercel.app

---

## 🆘 常见问题

### Q: Service Worker不工作？
A: 确保在HTTPS环境，localhost也可以

### Q: Firebase连接失败？
A: 检查firebase-config.js中的配置是否正确

### Q: 安装提示不出现？
A: 需要满足PWA条件：HTTPS + manifest + service worker

### Q: 如何绑定自定义域名？
A: Vercel设置 → Domains → Add Domain

---

## 📞 获取帮助

- Firebase文档: https://firebase.google.com/docs
- Vercel文档: https://vercel.com/docs
- PWA教程: https://web.dev/progressive-web-apps

**预估总成本：€0-10/月**
- Firebase: 免费额度够初期使用
- Vercel: 免费托管
- Stripe: 按交易收费
- 域名: €10/年（可选）
