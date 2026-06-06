import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCO2ZbUGkGCU3xpw4MwhixzQ6p3ED4KHhw",
  authDomain: "campus-pulse-d0ff5.firebaseapp.com",
  projectId: "campus-pulse-d0ff5",
  storageBucket: "campus-pulse-d0ff5.firebasestorage.app",
  messagingSenderId: "80566130984",
  appId: "1:80566130984:web:500723056372e9d50b981d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SYSTEM_DOC_REF = doc(db, "school_ecosystem", "live_state");

export async function initializeDatabase() {
    const docSnap = await getDoc(SYSTEM_DOC_REF);
    if (!docSnap.exists()) {
        await setDoc(SYSTEM_DOC_REF, {
            studentBalance: 45,
            canteenRevenue: 2450,
            ahmadAttendance: "Absent",
            johnAttendance: "Absent",
            bookStatus: "Available",
            adminLogs: [],
            canteenInvoices: [], // Track sales records in cloud node
            canteenMenu: [
                { name: "Fresh Chicken Sandwich", price: 15, stock: 40 },
                { name: "Hot Morning Espresso", price: 10, stock: 25 }
            ],
            libraryBooks: [
                { title: "The History of Qatar", isbn: "978-00611", status: "Available" },
                { title: "Introduction to Computer Science", isbn: "978-01311", status: "Available" },
                { title: "Advanced Calculus & Physics", isbn: "978-03211", status: "Available" }
            ],
            libraryLeases: [] // Tracks historical book checkouts
        });
    } else {
        // Safe check to ensure library fields are appended if document already exists without them
        const existingData = docSnap.data();
        if (!existingData.libraryBooks || !existingData.libraryLeases) {
            await setDoc(SYSTEM_DOC_REF, {
                libraryBooks: [
                    { title: "The History of Qatar", isbn: "978-00611", status: "Available" },
                    { title: "Introduction to Computer Science", isbn: "978-01311", status: "Available" },
                    { title: "Advanced Calculus & Physics", isbn: "978-03211", status: "Available" }
                ],
                libraryLeases: []
            }, { merge: true });
        }
    }
}

export async function logToAdminCloud(user, role, action, context, statusClass, statusText) {
    const logEntry = { 
        user, role, action, context, statusClass, statusText, 
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    };
    await updateDoc(SYSTEM_DOC_REF, { adminLogs: arrayUnion(logEntry) });
}

export async function pushInvoiceToCloud(invoiceObj) {
    await updateDoc(SYSTEM_DOC_REF, {
        canteenInvoices: arrayUnion(invoiceObj)
    });
}

export async function clearAllInvoicesCloud() {
    await updateDoc(SYSTEM_DOC_REF, {
        canteenInvoices: []
    });
}

export async function updateCloudField(fieldName, value) {
    let updateObject = {};
    updateObject[fieldName] = value;
    await updateDoc(SYSTEM_DOC_REF, updateObject);
}

export async function addNewMenuItem(itemObject) {
    await updateDoc(SYSTEM_DOC_REF, {
        canteenMenu: arrayUnion(itemObject)
    });
}

export async function updateMenuItem(indexToUpdate, updatedFields) {
    const docSnap = await getDoc(SYSTEM_DOC_REF);
    if (docSnap.exists()) {
        const currentMenu = docSnap.data().canteenMenu || [];
        if (currentMenu[indexToUpdate]) {
            currentMenu[indexToUpdate] = { ...currentMenu[indexToUpdate], ...updatedFields };
            await updateDoc(SYSTEM_DOC_REF, { canteenMenu: currentMenu });
        }
    }
}

export async function deleteMenuItem(indexToDelete) {
    const docSnap = await getDoc(SYSTEM_DOC_REF);
    if (docSnap.exists()) {
        const currentMenu = docSnap.data().canteenMenu || [];
        const updatedMenu = currentMenu.filter((_, index) => index !== indexToDelete);
        await updateDoc(SYSTEM_DOC_REF, { canteenMenu: updatedMenu });
    }
}

export async function pushLeaseToCloud(leaseObj) {
    await updateDoc(SYSTEM_DOC_REF, {
        libraryLeases: arrayUnion(leaseObj)
    });
}

export async function clearAllLeasesCloud() {
    await updateDoc(SYSTEM_DOC_REF, {
        libraryLeases: []
    });
}

export async function updateLibraryBooksCloud(updatedBooksArray) {
    await updateDoc(SYSTEM_DOC_REF, {
        libraryBooks: updatedBooksArray
    });
}

export async function fetchCloudState() {
    const docSnap = await getDoc(SYSTEM_DOC_REF);
    if (docSnap.exists()) return docSnap.data();
    return null;
}

/**
 * Prompts the evaluator for a secure PIN code challenge (Canteen POS Only)
 * @param {string} userName 
 * @returns {boolean} True if authenticated, False if blocked/canceled
 */
export function verifyUserSecurePIN(userName) {
    const enteredPin = prompt(`📟 RFID Secure Terminal: Card detected for ${userName}.\nEnter 4-digit Authorization PIN:`);
    if (enteredPin === null) return false; 
    if (enteredPin === "1234") return true; 
    
    alert("❌ Access Denied: Invalid Security PIN Code.");
    return false;
}

// shared.js snippet - Ensure your state schema contains structured student databases
const defaultInitialState = {
    canteenInventory: [],
    canteenInvoices: [],
    adminLogs: [],
    // Key-value registry holding custom parameters for independent profiles
    studentProfiles: {
        "Ahmad Ali": { balance: 45, limit: 50, role: "Student" },
        "Fatima Al-Thani": { balance: 120, limit: 75, role: "Student" },
        "Zayed Al-Kuwari": { balance: 200, limit: 100, role: "Student" },
        "Mr. John": { balance: 500, limit: 500, role: "Teacher" }
    }
};