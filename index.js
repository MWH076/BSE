const firebaseConfig = {
    apiKey: "AIzaSyC4dY2xcvQxWVY9Wl8exY5diBAD1agMNEc",
    authDomain: "byte-sized-empire.firebaseapp.com",
    projectId: "byte-sized-empire",
    storageBucket: "byte-sized-empire.appspot.com",
    messagingSenderId: "488597859047",
    appId: "1:488597859047:web:cb612c30f9fd8ab2971042"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let bakeryName = "";
let cookies = 0;
let coins = 0;
let cookieMultiplier = 1;
let clicksMultiplier = 1;
let profitsMultiplier = 5;
let ovenClicksRequired = 2;
let currentOvenClicks = 0;
let leaderboard = [];

const googleLoginButton = document.getElementById('google_login');
const googleLogoutButton = document.getElementById('google_logout');
const googleNameElement = document.getElementById('google_name');
const googlePfpElement = document.getElementById('google_pfp');
const bakeryBanner = document.getElementById('bakery_banner');
const screenAuth = document.getElementById('screen_auth');
const screenBakery = document.getElementById('screen_bakery');

function toggleScreens(isLoggedIn) {
    if (isLoggedIn) {
        screenAuth.classList.add('d-none');  // Hide login screen
        screenBakery.classList.remove('d-none');  // Show bakery game screen
    } else {
        screenAuth.classList.remove('d-none');  // Show login screen
        screenBakery.classList.add('d-none');  // Hide bakery game screen
    }
}

// Firebase Auth state listener (check if user is logged in)
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        initGame();
        toggleScreens(true); // Show the bakery screen
    } else {
        toggleScreens(false); // Show the login screen
    }
});

// Google Login Event
googleLoginButton.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        currentUser = result.user;
        initGame();
        toggleScreens(true); // Show bakery screen after login
    }).catch(error => {
        console.error("Login error: ", error);
    });
});

// Google Logout Event
googleLogoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        currentUser = null;
        toggleScreens(false); // Show login screen after logout
    }).catch(error => {
        console.error("Logout error: ", error);
    });
});

function initGame() {
    toggleScreens(true);
    googleNameElement.textContent = currentUser.displayName;
    googlePfpElement.src = currentUser.photoURL;
    bakeryBanner.textContent = `${currentUser.displayName}'s Bakery`;

    db.collection('bakeries').doc(currentUser.uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            cookies = data.cookies || 0;
            coins = data.coins || 0;
            cookieMultiplier = data.cookieMultiplier || 1;
            clicksMultiplier = data.clicksMultiplier || 1;
            profitsMultiplier = data.profitsMultiplier || 5;
            bakeryName = data.bakeryName || bakeryName;
            updateGameUI();
        } else {
            saveUserData();
        }
    });

    loadLeaderboard();
}

function updateGameUI() {
    document.getElementById('bakery_banner').textContent = `${bakeryName}'s Bakery`;
    document.getElementById('inventory_cookies').textContent = cookies;
    document.getElementById('inventory_coins').textContent = coins;
    document.getElementById('bar_oven').style.width = `${(currentOvenClicks / ovenClicksRequired) * 100}%`;
    document.getElementById('stats_oven').textContent = `${currentOvenClicks} / ${ovenClicksRequired}`;
}

function saveUserData() {
    db.collection('bakeries').doc(currentUser.uid).set({
        bakeryName,
        cookies,
        coins,
        cookieMultiplier,
        clicksMultiplier,
        profitsMultiplier
    });
}

function loadLeaderboard() {
    db.collection('bakeries')
        .orderBy('coins', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            leaderboard = [];
            snapshot.forEach(doc => leaderboard.push(doc.data()));
            updateLeaderboardUI();
        });
}

function updateLeaderboardUI() {
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}.</td>
            <td>${entry.bakeryName}</td>
            <td>${entry.coins}</td>
        `;
        leaderboardElement.appendChild(row);
    });
}

document.querySelector('.btn.w-full.h-24').addEventListener('click', () => {
    currentOvenClicks += clicksMultiplier;
    if (currentOvenClicks >= ovenClicksRequired) {
        cookies += cookieMultiplier;
        currentOvenClicks = 0;
        ovenClicksRequired += 2;
        document.getElementById('inventory_cookies').textContent = cookies;
    }
    updateGameUI();
    saveUserData();
});

document.getElementById('invest_cookie').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('input_cookie').value);
    if (coins >= amount * 10) {
        coins -= amount * 10;
        cookieMultiplier += amount;
        saveUserData();
        updateGameUI();
    }
});

document.getElementById('invest_clicks').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('input_clicks').value);
    if (coins >= amount * 10) {
        coins -= amount * 10;
        clicksMultiplier += amount;
        saveUserData();
        updateGameUI();
    }
});

document.getElementById('invest_profits').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('input_profits').value);
    if (coins >= amount * 10) {
        coins -= amount * 10;
        profitsMultiplier += amount;
        saveUserData();
        updateGameUI();
    }
});

document.getElementById('sellCookies').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('input_sell').value);
    if (cookies >= amount) {
        cookies -= amount;
        coins += amount * profitsMultiplier;
        saveUserData();
        updateGameUI();
    }
});

document.getElementById('bakery_save').addEventListener('click', () => {
    bakeryName = document.getElementById('input_bakery').value;
    saveUserData();
    updateGameUI();
});
