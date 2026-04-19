import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ВСТАВЬ СВОИ ДАННЫЕ FIREBASE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sharedTextRef = ref(database, "sharedText");

const textArea = document.getElementById("sharedText");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

// Получение текста из базы в реальном времени
onValue(sharedTextRef, (snapshot) => {
  const value = snapshot.val();

  if (value !== null) {
    textArea.value = value;
    status.textContent = "Данные синхронизированы";
  } else {
    textArea.value = "";
    status.textContent = "Текст пока пустой";
  }
}, (error) => {
  status.textContent = "Ошибка чтения данных";
  console.error(error);
});

// Сохранение текста в базу
saveButton.addEventListener("click", async () => {
  const text = textArea.value;

  try {
    await set(sharedTextRef, text);
    status.textContent = "Изменения сохранены";
  } catch (error) {
    status.textContent = "Ошибка сохранения";
    console.error(error);
  }
});

// Очистка текста
clearButton.addEventListener("click", async () => {
  try {
    await set(sharedTextRef, "");
    status.textContent = "Текст очищен";
  } catch (error) {
    status.textContent = "Ошибка очистки";
    console.error(error);
  }
});
