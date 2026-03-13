import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCJi7VAcf73Zkk02eCj7jpHyHfejGWiIew",
    authDomain: "volcano-accessories.firebaseapp.com",
    projectId: "volcano-accessories",
    storageBucket: "volcano-accessories.firebasestorage.app",
    messagingSenderId: "606346666459",
    appId: "1:606346666459:web:87e953f289c6a543c607fe",
    measurementId: "G-VL0P7KSKRD"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// تصدير الأدوات عشان نستخدمها في صفحة الأدمن
export const db = getFirestore(app);
export const storage = getStorage(app);