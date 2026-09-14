const firebaseConfig = {
  apiKey: "AIzaSyD5q5P_etL70WXpkkxVmYwqGvdLdnfQAWs",
  authDomain: "myeongwolgwan-4aa1b.firebaseapp.com",
  databaseURL: "https://myeongwolgwan-4aa1b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myeongwolgwan-4aa1b",
  storageBucket: "myeongwolgwan-4aa1b.firebasestorage.app",
  messagingSenderId: "137803856184",
  appId: "1:137803856184:web:44f0d12e67ac31741629cd"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.mwDb = firebase.database().ref("myeongwolgwan");