// configFirebase.js - Cấu hình Firebase (dùng chung toàn bộ trang)
// Giống dự án Buoi3: Firebase compat SDK qua CDN
const firebaseConfig = {
    apiKey: "AIzaSyBe5muFvv1ResuwdggmmsxUlTVSSD2Givk",
    authDomain: "demo1-b095f.firebaseapp.com",
    projectId: "demo1-b095f",
    storageBucket: "demo1-b095f.firebasestorage.app",
    messagingSenderId: "324072517562",
    appId: "1:324072517562:web:77711ac80e9db02ec0b783",
    measurementId: "G-DM91HRZCNF"
};

// Khởi tạo Firebase
const app = firebase.initializeApp(firebaseConfig);

// Khai báo Auth và Firestore dùng chung
const firebaseAuth = firebase.auth();
const db = firebase.firestore();

// Long polling: tránh treo write/listen khi mạng chặn streaming (proxy/firewall);
// ignoreUndefinedProperties: không từ chối object có field undefined (giỏ hàng/đơn hàng)
db.settings({
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true
});
