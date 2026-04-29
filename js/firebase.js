const firebaseConfig = {
    apiKey: "AIzaSyAi_zMHobr2znFcxmC8NA5KJTeT_JmCcqs",
    authDomain: "mirely-esc.firebaseapp.com",
    projectId: "mirely-esc",
    storageBucket: "mirely-esc.firebasestorage.app",
    messagingSenderId: "596850005874",
    appId: "1:596850005874:web:ecd25b7fcec094ef87efeb"
};
firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();

db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

auth.getRedirectResult()
    .then(r => { if (r.user) console.log("Redirect OK:", r.user.email); })
    .catch(e => console.error("Error redirect:", e));
