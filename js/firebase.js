const firebaseConfig = {
  apiKey: "AIzaSyA2aRuGIW3jQjCqnd6hcWAk8TXsS7wmJm4",
  authDomain: "unikatni-kutak-jk-394e6.firebaseapp.com",
  databaseURL:
    "https://unikatni-kutak-jk-394e6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "unikatni-kutak-jk-394e6",
  storageBucket: "unikatni-kutak-jk-394e6.firebasestorage.app",
  messagingSenderId: "642454571103",
  appId: "1:642454571103:web:2b8937f1b2ebf394f473ea",
  measurementId: "G-4BWKK0EN4W",
};

firebase.initializeApp(firebaseConfig);

window.auth = firebase.auth();
window.rtdb = firebase.database();
window.fs = firebase.firestore();
