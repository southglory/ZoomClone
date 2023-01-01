import http from "http"
import {Server} from "socket.io"
import express from "express"

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname  + "/public")); //유저에게 공개. 프론트엔드.
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) =>res.redirect("/"));

//같은 3000포트에 http서버와 ws서버를 함께 사용할 수 있도록 했음.
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);


wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) =>{
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) =>{
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) =>{
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) =>{
        socket.to(roomName).emit("ice", ice);
    });
});


const handleListen = () => console.log('Listening on http://localhost:3000');
httpServer.listen(3000, handleListen);