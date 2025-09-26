import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import{ Server } from 'socket.io';
import{ gameLogic } from './gameLogic.js';


dotenv.config()

const app = express()
const PORT = process.env.PORT

const server = http.createServer(app);
const io = new Server(server,{
    cors:{ origin:"*"},
    methods: ["GET", "POST"]
});

const logicGame = new gameLogic(io);

//middleware

app.use(express.static('public'));

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);
  
    // create a new session
    socket.on("createSession", async ({ sessionCode, master }) => {
      socket.sessionCode = sessionCode; // store sessionCode on socket
      await logicGame.createSession(sessionCode, socket, master);
    });
  
    // add player to session
    socket.on("joinSession", async ({ sessionCode, username }) => {
      socket.sessionCode = sessionCode; // store sessionCode for disconnect cleanup
      await logicGame.addPlayer(sessionCode, socket, username);
    });
  
    // handle guesses
    socket.on("guess", async ({ sessionCode, guess }) => {
      await logicGame.handleGuess(sessionCode, socket, guess);
    });
  
    // set question (only by master)
    socket.on("setQuestion", async ({ sessionCode, question, answer }) => {
      await logicGame.setQuestions(sessionCode, question, answer);
    });
  
    // disconnect event
    socket.on("disconnect", async () => {
      console.log("Disconnected:", socket.id);
  
      if (socket.sessionCode) {
        await logicGame.removePlayer(socket.sessionCode, socket.id);
      }
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });