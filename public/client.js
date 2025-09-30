// Connect to server
const socket = io("http://localhost:3000");


const usernameInput = document.getElementById("username");
const sessionIdInput = document.getElementById("sessionId");
const chatDiv = document.getElementById("chat");
const playersDiv = document.getElementById("players");
const leaderboardDiv = document.getElementById("leaderboard");
const sessionBox = document.getElementById("sessionBox");


document.getElementById("createSessionBtn").onclick = () => {
  socket.emit("createSession", {
    sessionCode: sessionIdInput.value,
    master: usernameInput.value,
  });
};

document.getElementById("joinSessionBtn").onclick = () => {
  socket.emit("joinSession", {
    sessionCode: sessionIdInput.value,
    username: usernameInput.value,
  });
};

document.getElementById("setQuestionBtn").onclick = () => {
  socket.emit("setQuestion", {
    sessionCode: sessionIdInput.value,
    question: document.getElementById("questionInput").value,
    answer: document.getElementById("answerInput").value,
  });
};

document.getElementById("startGameBtn").onclick = () => {
  socket.emit("startGame", { sessionCode: sessionIdInput.value });
};

document.getElementById("guessBtn").onclick = () => {
  socket.emit("guess", {
    sessionCode: sessionIdInput.value,
    guess: document.getElementById("guessInput").value,
  });
};


socket.on("sessionCreated", ({ sessionCode }) => {
  console.log("Session created:", sessionCode);

  sessionBox.innerHTML = `
    <span id="sessionCode">${sessionCode}</span>
    <button onclick="copyCode()">📋 Copy</button>
  `;

  chatDiv.innerHTML += `<div> Session <b>${sessionCode}</b> created. You are the game master.</div>`;
});

socket.on("playerList", (players) => {
  console.log("👥 Player list update:", players);

  let html = `<strong>Players connected: ${players.length}</strong><ul>`;
  players.forEach((p) => {
    html += `<li>${p.username} (${p.score} pts)</li>`;
  });
  html += "</ul>";

  playersDiv.innerHTML = html;
});

socket.on("newQuestion", ({ question }) => {
  chatDiv.innerHTML += `<div>❓ New Question: ${question}</div>`;
});

socket.on("gameStarted", ({ message }) => {
  chatDiv.innerHTML += `<div style="color:green">${message}</div>`;
});

socket.on("wrongGuess", (msg) => {
  chatDiv.innerHTML += `<div style="color:red">${msg}</div>`;
});

socket.on("attemptsOver", (msg) => {
  chatDiv.innerHTML += `<div style="color:orange">${msg}</div>`;
});

socket.on("gameEnded", ({ message, winner, players }) => {
  chatDiv.innerHTML += `<div style="color:blue">${message} ${
    winner ? "🏆 Winner: " + winner : ""
  }</div>`;
  updateLeaderboard(players);
  sessionBox.innerHTML = ""; 
});

socket.on("error", (msg) => {
  chatDiv.innerHTML += `<div style="color:red">⚠️ Error: ${msg}</div>`;
});


function updateLeaderboard(players) {
  if (!players) return;
  let html = "<strong>Leaderboard:</strong><br/>";
  players.forEach((p) => {
    html += `${p.username}: ${p.score} pts<br/>`;
  });
  leaderboardDiv.innerHTML = html;
}

function copyCode() {
  const code = document.getElementById("sessionCode")?.innerText.trim();
  if (!code) {
    alert("⚠️ No session code to copy!");
    return;
  }
  navigator.clipboard
    .writeText(code)
    .then(() => alert("Session code copied: " + code))
    .catch((err) => console.error("Failed to copy code", err));
}
