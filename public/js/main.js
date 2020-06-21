const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join chatroom
socket.emit("joinRoom", { username, room });

socket.emit("newRoomId", (socket) => {});

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

//private message from server
socket.on("privateMessage", (message) => {
  outputPrivateMessage(message);
});

// Message from server
socket.on("message", (message) => {
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  const msg = e.target.elements.msg.value;

  let generalBox = document.getElementById("toAllUsers");
  let id = document.querySelector(".chatTo:checked").id;
  let value = document.querySelector(".chatTo:checked").value;
  if (generalBox.checked == true) {
    // Emit message to server
    socket.emit("chatMessage", msg);
  } else if (id === socket.id) {
    socket.emit("messageToMe", "Du kan inte skicka till dig själv!");
  } else {
    socket.emit("say to someone", { id, value, msg });
  }

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output Privstemessage to DOM
function outputPrivateMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="privatmeta">Privat meddelande från ${message.username} <span>${message.time}</span></p>
  <p class="privattext">
    ${message.text}
  </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users
      .map(
        (user) =>
          `<li><input type="checkbox" id=${user.id} class="chatTo" name="user" value=${user.username} onclick="onlyOne(this)"></checkbox>
        <label for=${user.id}>${user.username}</label></li>`
      )
      .join("")}
  `;
}

//Endast en checkbox ikryssad
function onlyOne(checkbox) {
  var checkboxes = document.getElementsByName("user");
  checkboxes.forEach((item) => {
    if (item !== checkbox) item.checked = false;
  });
  return checkbox;
}
