const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authorInput = document.getElementById("author");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const messageList = document.getElementById("messageList");

async function loadMessages() {
  const { data, error } = await client
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки сообщений:", error.message);
    return;
  }

  messageList.innerHTML = "";

  data.forEach((item) => {
    const li = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.author} • ${new Date(item.created_at).toLocaleString()}`;

    const text = document.createElement("div");
    text.textContent = item.text;

    li.appendChild(meta);
    li.appendChild(text);
    messageList.appendChild(li);
  });
}

async function sendMessage() {
  const author = authorInput.value.trim();
  const text = messageInput.value.trim();

  if (!author || !text) {
    alert("Введите имя и сообщение");
    return;
  }

  const { error } = await client
    .from("messages")
    .insert([{ author, text }]);

  if (error) {
    console.error("Ошибка отправки сообщения:", error.message);
    return;
  }

  messageInput.value = "";
  loadMessages();
}

sendBtn.addEventListener("click", sendMessage);

loadMessages();
setInterval(loadMessages, 2000);
