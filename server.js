// *** วาง firebaseConfig ของคุณที่คัดลอกมาไว้ตรงนี้ ***
const firebaseConfig = {
    apiKey: "AIzaSyCVPaneDtHhBqg95QcARJdZSSukekj-eV4", // (ใส่คีย์ของคุณ)
    authDomain: "project-5d273.firebaseapp.com",
    projectId: "project-5d273",
    storageBucket: "project-5d273.firebasestorage.app",
    messagingSenderId: "1045879012339",
    appId: "1:1045879012339:web:04a763e1a41e8c36be3086"
};

// เริ่มต้น Firebase
firebase.initializeApp(firebaseConfig);

// สร้างตัวแปรอ้างอิง
const auth = firebase.auth();
const db = firebase.firestore();

// --- ดึง UI Elements ทั้งหมดที่ "อาจจะ" มี ---
const message = document.getElementById("message");
const btnLogin = document.getElementById("btnLogin");
const loginSection = document.getElementById("loginSection");
const btnSignup = document.getElementById("btnSignup");
const btnLogout = document.getElementById("btnLogout");
const userInfoSection = document.getElementById("userInfo");
const userNameDisplay = document.getElementById("userName");


// --- 1. ฟังก์ชันสมัครสมาชิก (สำหรับ register.html) ---
if (btnSignup) {
    btnSignup.addEventListener("click", () => {
        // (ส่วนนี้ทำงานปกติ)
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        if (!name || !email || !password) {
            if (message) message.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
            return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                if (message) {
                    message.style.color = "green";
                    message.textContent = "สมัครสมาชิกสำเร็จ!";
                }
                db.collection("users").doc(user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    setTimeout(() => { window.location.href = "index.html"; }, 2000);
                });
            })
            .catch((error) => {
                if (message) {
                    message.style.color = "red";
                    message.textContent = "เกิดข้อผิดพลาด: " + error.message;
                }
            });
    });
}

// --- 2. ฟังก์ชันล็อกอิน (สำหรับ .index.html) ---
if (btnLogin) {
    btnLogin.addEventListener("click", () => {
        // (ส่วนนี้ทำงานปกติ)
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        if (!email || !password) {
            if (message) message.textContent = "กรุณากรอกอีเมลและรหัสผ่าน";
            return;
        }
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if (message) {
                    message.style.color = "green";
                    message.textContent = "ล็อกอินสำเร็จ! กำลังไปหน้าสมาชิก...";
                }
                 // เมื่อล็อกอินสำเร็จ ให้เด้งไป page1.html ทันที
                 // (นี่คือการแก้ปัญหาอีกแบบ ที่ง่ายกว่า)
                 window.location.href = "page1.html";
            })
            .catch((error) => {
                if (message) {
                    message.style.color = "red";
                    message.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
                }
            });
    });
}

// --- 3. ฟังก์ชันออกจากระบบ (สำหรับ page1.html) ---
if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        // (ส่วนนี้ทำงานปกติ)
        auth.signOut().then(() => {
            window.location.href = "index.html";
        });
    });
}


// === 4. ตัวตรวจสอบสถานะล็อกอิน (แก้ไขใหม่ทั้งหมด) ===
// ฟังก์ชันนี้จะ "รอ" จนกว่า Firebase จะ "นึกออก" ว่าล็อกอินอยู่หรือไม่
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        // onAuthStateChanged จะ "คืนค่า" ฟังก์ชันสำหรับหยุดฟัง
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe(); // <--- หยุดฟังทันทีที่ได้คำตอบแรก
            resolve(user); // ส่ง user (หรือ null) กลับไป
        }, reject);
    });
}

// ฟังก์ชันสำหรับแสดง/ซ่อน UI
function showContainer() {
    const loader = document.getElementById("loader");
    const container = document.querySelector(".container");
    if (loader) loader.style.display = "none";
    if (container) {
        container.style.display = "block";
        setTimeout(() => { container.style.opacity = "1"; }, 50); 
    }
}

// === 5. โค้ดหลักที่จะรัน (ตัวเฝ้ายามตัวใหม่) ===
// เราจะใช้ async/await เพื่อ "รอ" คำตอบ
(async function handleAuth() {
    
    // 1. "รอ" จนกว่าจะได้คำตอบแรกจาก Firebase
    const user = await getCurrentUser();

    // 2. หาว่าตอนนี้อยู่หน้าไหน
    const currentPage = window.location.pathname.split('/').pop();

    if (user) {
        // --- (A) ผู้ใช้ล็อกอินอยู่ ---

        // 1. ถ้าล็อกอินแล้ว แต่ดันอยู่หน้า login หรือ register
        if (currentPage === "index.html" || currentPage === "register.html") {
            window.location.href = "page1.html"; // เด้งไปหน้า page1
            return; // ไม่ต้องทำอะไรต่อ
        }
        
        // 2. ถ้าล็อกอินแล้ว และอยู่หน้า page1 (หรือหน้าอื่นๆ ที่ถูกต้อง)
        if (userInfoSection && userNameDisplay) {
            userInfoSection.style.display = "block"; 
            
            // ดึงชื่อมาแสดง
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) {
                userNameDisplay.textContent = doc.data().name;
            }
        }
        showContainer(); // แสดงเนื้อหาหน้านี้

    } else {
        // --- (B) ผู้ใช้ยังไม่ล็อกอิน ---

        // 1. ถ้ายังไม่ล็อกอิน แต่พยายามเข้าหน้า page1
        if (currentPage === "https://www.tinkercad.com/things/86fCHXx7U9S/editel") { 
            window.location.href = "index.html"; // เด้งกลับไปหน้า login
            return; // ไม่ต้องทำอะไรต่อ
        }

        // 2. ถ้ายังไม่ล็อกอิน และอยู่หน้า login หรือ register (ซึ่งถูกต้องแล้ว)
        showContainer(); // แสดงเนื้อหาหน้านี้
    }
})(); // <--- สั่งให้ฟังก์ชันนี้ทำงานทันที