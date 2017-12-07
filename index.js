var app = require('express')();
var http = require('http').Server(app);
var io=require("socket.io")(http);

let events=require("./events.declaration.js");
//DEFINE SOCKET EVENTS HERE
//updates the list of players, contains a list of players.

app.get('/', function(req, res){
  res.sendFile(__dirname+"/index.html");
});
app.get("/lobby", function(req, res){
  res.sendFile(__dirname+"/lobby.html");
})
app.get("/player1", function(req, res){
  res.sendFile(__dirname+"/player1.html");
  
})
app.get("/player2", function(req, res){
  res.sendFile(__dirname+"/player2.html");
})

io.on("connection", function(socket){
})
//define a lobby in the namespace
var lobby=io.of("/lobby");
//the list of players in the lobby
var playerList=[]
lobby.on("connection", function(socket){
  socket.emit(events.UPDATE_LIST, playerList);
  socket.on(events.NEW_PLAYER, function(name){
    console.log(name+" has joined the lobby");
    playerList.push(name);
    socket.broadcast.emit(events.UPDATE_LIST, playerList);
    socket.emit(events.UPDATE_LIST, playerList);
  })
  socket.on(events.REQUEST_GAME, function(target, username){
    console.log(username+" is requesting a game against "+target);
    socket.emit(events.REQUEST_GAME, username);
    socket.on(events.CONFIRM_GAME, function(wantsGame){
      if(wantsGame){
        //redirect to battleship pages with specific namespaces
        console.log(target+" wants to play!");
      }
      else{
        //alerts the sender that the user rejected the offer. 
        console.log(target+" doesn't want to play");
      }
    })
  })

})
var player1=io.of("/player1");
var player2=io.of("/player2");
let player1Ready=false;
let player2Ready=false;
player1.on("connection", function(socket){
  console.log("PLAYER 1 has connected");
  socket.on(events.PLAYER_READY, function(readyStatus){
    console.log("Player 1 Ready!");
    player1Ready=readyStatus;
    if(player1Ready && player2Ready){
      socket.emit(events.PLAYER_READY, true)
    }
  })
  socket.on(events.SEND_COORDINATE, function(coordinate){
    console.log(coordinate);
    if(coordinate){
      console.log("Got coordinates "+coordinate[0]+","+coordinate[1]+" sending...")
      player2.emit(events.SEND_ATTACK, coordinate);
    }
  })
  socket.on(events.SEND_HIT_STATUS, function(data){
    console.log("player 1's hit status is sent")
    console.log(data.isHit ? "Hit!" : "Miss!");
    console.log("at coordinates "+data.coordinates[0]+", "+data.coordinates[1])
    player2.emit(events.SEND_HIT_STATUS, data);
  })
  socket.on(events.SUNK_SIGNAL, function(shipType){
    console.log("Player 's "+shipType+" has been sunk. ")
    player2.emit(events.SUNK_SIGNAL, shipType);
  })
})
player2.on("connection", function(socket){
  console.log("PLAYER 2 has connected")
  socket.on(events.PLAYER_READY, function(readyStatus){
    player2Ready=readyStatus;
    console.log("Player 2 Ready!");
    if(player2Ready && player1Ready){
      socket.emit(events.PLAYER_READY, true);
    }
  })
  socket.on(events.SEND_COORDINATE, function(coordinate){
    console.log(coordinate);
    if(coordinate){
      console.log("Got coordinates "+coordinate[0]+","+coordinate[1]+" sending...")
      player1.emit(events.SEND_ATTACK, coordinate);
    }
  })
  socket.on(events.SEND_HIT_STATUS, function(data){
    console.log("player 2's hit status is sent")
    console.log(data.isHit ? "Hit!" : "Miss!");
    console.log("at coordinates "+data.coordinates[0]+", "+data.coordinates[1])
    player1.emit(events.SEND_HIT_STATUS, data);
  })
  socket.on(events.SUNK_SIGNAL, function(shipType){
    console.log("Player 1's "+shipType+" has been sunk. ")
    player1.emit(events.SUNK_SIGNAL, shipType);
  })
})
http.listen(3000, function(){
  console.log('listening on *:3000');
});
    
