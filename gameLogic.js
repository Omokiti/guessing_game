import { PrismaClient } from "@prisma/client";
import logger from './utility/logger.js';
const prisma = new PrismaClient();


// import { nanoid } from 'nanoid';
export class gameLogic{
    constructor(io){
        this.io = io;
    }


 async createSession(sessionCode, socket,master){
    try {
        // const sessionCode = nanoid(6);
        const session = await prisma.session.create({
            data:{sessionCode,master},
            include:{ players:true }
        });
        socket.join(sessionCode);
        socket.emit('sessionCreated',{ sessionCode });

        logger.info(`Session created :${sessionCode} by ${master}`);
    } catch (error) {
        logger.error(`Error creating session;${error.message}`)
    }
 }



async addPlayer(sessionCode,socket,username){
    try {
        const session = await prisma.session.findUnique({
        where : { sessionCode },
        include:{ players:true }
        });

        if(!session  || session.inProgress){
            socket.emit('error','Cannot join session')
            logger.warn(`Player ${username} failed to join session ${sessionCode}`)
            return;
        }
       const player = await prisma.player.create({
            data:{username,sessionId:session.id}
        })

        if (!this.sockets) this.sockets = {};
        this.sockets[socket.id] = player.id;

        socket.join(sessionCode);
        const updatedPlayers = await prisma.player.findMany({
            where:{sessionId:session.id}
        })
        this.io.to(sessionCode).emit('playerList',updatedPlayers)
        logger.info(`player ${username} joined session ${sessionCode}`);
    } catch (error) {
        logger.error(`Error adding player to session:${error.message}`)
    }
}


async removePlayer(sessionCode, socketId) {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionCode },
        include: { players: true },
      });

      if (!session) return;

      const player = session.players.find((p) => p.socketId === socketId);
      if (!player) return;

      await prisma.player.delete({ where: { id: player.id } });

      const updatedPlayers = await prisma.player.findMany({
        where: { sessionId: session.id },
      });

      this.io.to(sessionCode).emit('playerList', updatedPlayers);

      logger.info(
        `Player ${player.username} removed from session ${sessionCode}`
      );
    } catch (err) {
      logger.error(`Error removing player: ${err.message}`);
    }
  }


async setQuestions(sessionCode,question,answer){
 try {
    const session = await prisma.session.update({
        where:{ sessionCode} ,
        data:{ question,answer:answer.toLowerCase(), inProgress:true }
    })
    this.io.to(sessionCode).emit('newQuestion',{ question });

    //timer
    setTimeout(async()=>{
        const time = await prisma.session.findUnique({
            where:{ sessionCode} ,
            include:{ players:true },
        })
        if(!time.inProgress) return;

        await prisma.session.update({
            where:{ sessionCode },
            data:{ inProgress:false }

        })
        this.io.to(sessionCode).emit('gameEnded',{
            message:`Time is up Answer is ${time.answer}`,
            winner:null,
            players:time.players
        });
        logger.warn(`Game in session ${sessionCode} ended`)
    },300000)
 } catch (error) {
    logger.error(`Error setting question in session ${sessionCode}:${error.message}`)
 }
}
// 600000

async handleGuess(sessionCode,socket,guess){
    try {
        const session = await prisma.session.findUnique({
            where: {sessionCode},
            include: { players:true}
        })
        if(!session || !session.inProgress) return;

        const playerId = this.sockets[socket.id];
        if (!playerId) {
          socket.emit("error", "Player not found.");
          return;
        }

        const player = session.players.find((p) => p.id ===playerId);
        if(!player) return;

        if( guess.toLowerCase() === session.answer){
            await prisma.player.update({
                where:{ id:player.id},
                data:{ score:{ increment:10 }}
            })

            await prisma.session.update({
                where :{ sessionCode },
                data:{ inProgress:false }
            })

            const updatedPlayers = await prisma.player.findMany({
                where:{ sessionId:session.id }
            })
            this.io.to(sessionCode).emit('game has ended',{
                message:`${player.username} guessed correctly , The answer is ${session.answer}`,
                winner: player.username,
                players:updatedPlayers
            })

            logger.info(`player ${player.username} won in session ${sessionCode}`)
        } else{
            socket.emit('wrong guess please try again')
            logger.info(`player ${player.username} guessed wrong in session ${sessionCode}`)
        }
    } catch (error) {
        logger.error(`Error handling guess in session ${sessionCode}: ${error.message}`)
        
    }

}



}