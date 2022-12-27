import http from "http"
import WebSocket from "ws";
import express from "express"

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname  + "/public")); //유저에게 공개. 프론트엔드.
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) =>res.redirect("/"));

const handleListen = () => console.log('Listening on http://localhost:3000');
//같은 3000포트에 http서버와 ws서버를 함께 사용할 수 있도록 했음.
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

function onSocketClose(){
    console.log("Disconnected from the Browser ❌");
}

const sockets = [];


wss.on("connection", (socket) =>{ //새로운 소캣(브라우저)가 들어올 때마다 실행되는 이벤트 리스너.
    sockets.push(socket);
    socket['nickname'] = "Anon";
    console.log("Connected to Browser ✅");
    socket.on("close", onSocketClose);
    socket.on("message", (msg) => {
        // msg = msg.toString('utf8')
        const message = JSON.parse(msg);
        switch (message.type){
            case "new_message":
                sockets.forEach((aSocket) => 
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                );
                break;
            case "nickname":
                socket["nickname"]=message.payload;
                break;
            default: //아무것도 안함
        }        
    });
});


server.listen(3000, handleListen);

{
    type:"message";
    payload:"hello everyone!";
}
{
    type:"nickname";
    payload:"nico";
}
