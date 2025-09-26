// When hosted on Render, same origin works (no need to hardcode URL)
const socket = io();

// Join game
document.getElementById("joinBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  socket.emit("joinSession", { sessionCode: "ABC123", username });
});

socket.on("playerList", (players) => {
  console.log("Current players:", players);
});
