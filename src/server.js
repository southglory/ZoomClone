import http from "http"
import {Server} from "socket.io"
import {instrument} from "@socket.io/admin-ui";
import express from "express"

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname  + "/public")); //유저에게 공개. 프론트엔드.
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) =>res.redirect("/"));

//같은 3000포트에 http서버와 ws서버를 함께 사용할 수 있도록 했음.
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors:{
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false,
})


function publicRooms(){
    const {sockets:{adapter:{sids, rooms}}} = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;//물음표는 get하려는게 있거나 없거나 모를떄.
}

wsServer.on("connection", (socket) =>{
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(`Socket Event:${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());//모두에게 보냄.
    });
    //연결이 끊어지기 전에 bye를 보낼 수 있다. disconnected가 아니라 disconnecting이니까 아직 안나간 상태이다.
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) =>
       socket.to(room).emit("bye", socket.nickname, countRoom(room)-1)
        );
    });
    socket.on("disconnect", () =>{
        wsServer.sockets.emit("room_change", publicRooms());
    })
    socket.on("new_message", (msg, room, done) =>{
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", nickname => (socket["nickname"] = nickname));
});

// const sockets = [];
// wss.on("connection", (socket) =>{ //새로운 소캣(브라우저)가 들어올 때마다 실행되는 이벤트 리스너.
//     sockets.push(socket);
//     socket['nickname'] = "Anon";
//     console.log("Connected to Browser ✅");
//     socket.on("close", onSocketClose);
//     socket.on("message", (msg) => {
//         // msg = msg.toString('utf8')
//         const message = JSON.parse(msg);
//         switch (message.type){
//             case "new_message":
//                 sockets.forEach((aSocket) => 
//                     aSocket.send(`${socket.nickname}: ${message.payload}`)
//                 );
//                 break;
//             case "nickname":
//                 socket["nickname"]=message.payload;
//                 break;
//             default: //아무것도 안함
//         }        
//     });
// });

const handleListen = () => console.log('Listening on http://localhost:3000');
httpServer.listen(3000, handleListen);
