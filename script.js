import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnZT-SQZBQBxG261x0pTrq2ZteHihyuyo",
  authDomain: "lab4-a56a7.firebaseapp.com",
  projectId: "lab4-a56a7",
  storageBucket: "lab4-a56a7.firebasestorage.app",
  messagingSenderId: "905535478342",
  appId: "1:905535478342:web:1ff617525da2de61700847"
};

// 🔥 ВАЖНО: правильный URL базы
const app = initializeApp(firebaseConfig);
const database = getDatabase(
  app,
  "https://lab4-a56a7-default-rtdb.europe-west1.firebasedatabase.app"
);

const sharedTextRef = ref(database, "sharedText");

const textArea = document.getElementById("sharedText");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

// 📡 слушаем изменения
onValue(sharedTextRef, (snapshot) => {
  const value = snapshot.val();

  if (value !== null) {
    textArea.value = value;
    status.textContent = "Синхронизировано";
  } else {
    textArea.value = "";
    status.textContent = "Пусто";
  }
});

// 💾 сохранить
saveButton.addEventListener("click", async () => {
  try {
    await set(sharedTextRef, textArea.value);
    status.textContent = "Сохранено";
  } catch (e) {
    console.error(e);
    status.textContent = "Ошибка";
  }
});

// 🧹 очистить
clearButton.addEventListener("click", async () => {
  try {
    await set(sharedTextRef, "");
    status.textContent = "Очищено";
  } catch (e) {
    console.error(e);
    status.textContent = "Ошибка";
  }
});
