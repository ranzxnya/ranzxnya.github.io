// *** ใส่ค่า Config ของคุณที่คัดลอกมาจาก Firebase ตรงนี้ ***
const firebaseConfig = {
  apiKey: "AIzaSyCVPaneDtHhBqg95QcARJdZSSukekj-eV4",
  authDomain: "project-5d273.firebaseapp.com",
  projectId: "project-5d273",
  storageBucket: "project-5d273.firebasestorage.app",
  messagingSenderId: "1045879012339",
  appId: "1:1045879012339:web:04a763e1a41e8c36be3086",
  measurementId: "G-FS44E8KW8R"
};

// เริ่มต้น Firebase
firebase.initializeApp(firebaseConfig);

// สร้างตัวแปรอ้างอิงไปยัง Service ที่เราจะใช้
const auth = firebase.auth();
const db = firebase.firestore();

// --- ส่วนของการจัดการ UI ---
const btnSignup = document.getElementById("btnSignup");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const message = document.getElementById("message");

const signupSection = document.getElementById("signupSection");
const loginSection = document.getElementById("loginSection");
const userInfoSection = document.getElementById("userInfo");
const userNameDisplay = document.getElementById("userName");

// --- 1. ฟังก์ชันสมัครสมาชิก ---
btnSignup.addEventListener("click", () => {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
        message.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
        return;
    }

    // 1. สร้างบัญชีผู้ใช้ใน Authentication
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // สมัครสำเร็จ! userCredential.user คือข้อมูลผู้ใช้
            const user = userCredential.user;
            message.textContent = "สมัครสมาชิกสำเร็จ!";

            // 2. บันทึกข้อมูลเพิ่มเติม (เช่น ชื่อ) ลงใน Firestore
            // เราจะใช้ user.uid (รหัสเฉพาะตัว) เป็น ID ของเอกสาร
            db.collection("users").doc(user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("บันทึกข้อมูลชื่อลง Firestore สำเร็จ");
            })
            .catch((error) => {
                console.error("เกิดข้อผิดพลาดในการบันทึก Firestore: ", error);
            });
            
        })
        .catch((error) => {
            // ถ้าสมัครไม่สำเร็จ (เช่น อีเมลซ้ำ, รหัสผ่านง่ายไป)
            message.textContent = "เกิดข้อผิดพลาด: " + error.message;
        });
});

// --- 2. ฟังก์ชันล็อกอิน ---
btnLogin.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // ล็อกอินสำเร็จ
            message.textContent = "ล็อกอินสำเร็จ!";
            // (ฟังก์ชัน onAuthStateChanged ด้านล่างจะจัดการซ่อน/แสดงฟอร์มเอง)
        })
        .catch((error) => {
            message.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        });
});

// --- 3. ฟังก์ชันออกจากระบบ ---
btnLogout.addEventListener("click", () => {
    auth.signOut().then(() => {
        message.textContent = "ออกจากระบบแล้ว";
    });
});

// --- 4. ตัวตรวจสอบสถานะล็อกอิน (สำคัญมาก) ---
// ฟังก์ชันนี้จะทำงานอัตโนมัติเมื่อมีการเปลี่ยนแปลงสถานะ (ล็อกอิน/ล็อกเอาต์)
auth.onAuthStateChanged((user) => {
    if (user) {
        // --- ผู้ใช้ล็อกอินอยู่ ---
        // ซ่อนฟอร์มสมัครและล็อกอิน
        loginSection.style.display = "none";
        signupSection.style.display = "none";
        
        // แสดงส่วนข้อมูลผู้ใช้
        userInfoSection.style.display = "block";

        // ดึงข้อมูลชื่อจาก Firestore มาแสดง
        db.collection("users").doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    userNameDisplay.textContent = doc.data().name; // แสดงชื่อ
                } else {
                    console.log("ไม่พบข้อมูลผู้ใช้ใน Firestore!");
                }
            })
            .catch((error) => {
                console.log("เกิดข้อผิดพลาดในการดึงข้อมูล: ", error);
            });

    } else {
        // --- ผู้ใช้ล็อกเอาต์ ---
        // แสดงฟอร์มสมัครและล็อกอิน
        loginSection.style.display = "block";
        signupSection.style.display = "block";
        
        // ซ่อนส่วนข้อมูลผู้ใช้
        userInfoSection.style.display = "none";
        userNameDisplay.textContent = "";
    }
});
