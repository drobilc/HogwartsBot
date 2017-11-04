var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var database = new sqlite3.Database("../database.db");
var PORT = 80;

var domovi = {
	"gryffindor": 0,
	"ravenclaw": 0,
	"slytherin": 0,
	"hufflepuff": 0
};

var stariDomovi = {
	"gryffindor": 0,
	"ravenclaw": 0,
	"slytherin": 0,
	"hufflepuff": 0
};

function posodobiPodatke() {
	database.each("SELECT house, SUM(points) AS points FROM points GROUP BY house", function(err, row) {
		if (row.house in stariDomovi) {
			stariDomovi[row.house] = row.points;
		}
	}, function() {
		if (stariDomovi.gryffindor != domovi.gryffindor || stariDomovi.ravenclaw != domovi.ravenclaw || stariDomovi.slytherin != domovi.slytherin || stariDomovi.hufflepuff != domovi.hufflepuff) {
			domovi.gryffindor = stariDomovi.gryffindor;
			domovi.ravenclaw = stariDomovi.ravenclaw;
			domovi.slytherin = stariDomovi.slytherin;
			domovi.hufflepuff = stariDomovi.hufflepuff;
			io.emit("podatki", domovi);
			console.log("Podatki so bili spremenjeni!");
		}
	});
}

app.use('/slike', express.static('slike'));
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	socket.emit("podatki", domovi);
});

var interval = setInterval(function() {
	var cas = new Date();
	console.log("Posodabljam podatke... [" + cas + "]");
	posodobiPodatke();
}, 10000);

http.listen(PORT, function(){
	console.log("Running on 0.0.0.0:"+PORT);
	posodobiPodatke();
});