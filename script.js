import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ТВОЙ CONFIG (я его дополнил databaseURL)
const firebaseConfig = {
  apiKey: "AIzaSyCnZT-SQZBQBxG261x0pTrq2ZteHihyuyo",
  authDomain: "lab4-a56a7.firebaseapp.com",
  databaseURL: "https://lab4-a56a7-default-rtdb.firebaseio.com",
  projectId: "lab4-a56a7",
  storageBucket: "lab4-a56a7.firebasestorage.app",
  messagingSenderId: "905535478342",
  appId: "1:905535478342:web:1ff617525da2de61700847"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ссылка на данные
const sharedTextRef = ref(database, "sharedText");

// элементы
const textArea = document.getElementById("sharedText");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

// 📡 Слушаем изменения (магия синхронизации)
onValue(sharedTextRef, (snapshot) => {
  const value = snapshot.val();

  if (value !== null) {
    textArea.value = value;
    status.textContent = "Синхронизировано";
  } else {
    textArea.value = "";
    status.textContent = "Пусто";
  }
}, (error) => {
  console.error(error);
  status.textContent = "Ошибка подключения";
});

// 💾 Сохранение
saveButton.addEventListener("click", async () => {
  const text = textArea.value;

  try {
    await set(sharedTextRef, text);
    status.textContent = "Сохранено";
  } catch (error) {
    console.error(error);
    status.textContent = "Ошибка";
  }
});

// 🧹 Очистка
clearButton.addEventListener("click", async () => {
  try {
    await set(sharedTextRef, "");
    status.textContent = "Очищено";
  } catch (error) {
    console.error(error);
    status.textContent = "Ошибка";
  }
});
