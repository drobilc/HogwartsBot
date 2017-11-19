function getPageHeight() {
	var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0];
	return w.innerHeight|| e.clientHeight|| g.clientHeight;
}

function getPageWidth() {
	var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0];
	return w.innerWidth || e.clientWidth || g.clientWidth;
}

function nastaviTocke(dom, tocke, podatki) {
	var oldRange = podatki.max - podatki.min;
	var pageHeight = getPageHeight() - 350 - 100;
	var domElement = document.getElementById(dom);
	domElement.children[2].innerText = tocke;
	domElement.style.height = (((tocke - podatki.min) / oldRange) * pageHeight + 350) + "px";
}

function prikaziDomove(domovi) {
	var najmanjse = Math.min(domovi["gryffindor"], domovi["ravenclaw"], domovi["slytherin"], domovi["hufflepuff"]);
	var najvecje = Math.max(domovi["gryffindor"], domovi["ravenclaw"], domovi["slytherin"], domovi["hufflepuff"]);
	var podatki = {"min": najmanjse, "max": najvecje};
	for (var imeDoma in domovi) {
		if (domovi.hasOwnProperty(imeDoma)) {
			nastaviTocke(imeDoma, domovi[imeDoma], podatki);
		}
	}
}

function Sporocilo(uporabnik, besedilo) {
	this.uporabnik = uporabnik;
	this.besedilo = besedilo;
	this.element = document.createElement("div");
	this.element.className = "komentar";
	
	var randomAngle = Math.pow(-1, Math.floor(Math.random() * 2)) * Math.floor(Math.random() * 30);
	var randomX = Math.floor(Math.random() * (getPageWidth() - 210));
	var randomY = Math.floor(Math.random() * (getPageHeight() - 100));
	this.element.style.transform = "rotate("+randomAngle+"deg)";
	this.element.style.top = randomY + "px";
	this.element.style.left = randomX + "px";
	this.element.innerHTML = '<span class="avtor">' + this.uporabnik + '</span>' + this.besedilo;
	document.body.appendChild(this.element);
	
	this.remove = function() {
		this.element.parentElement.removeChild(this.element);
	}
	var _this = this;
	setTimeout(function() { _this.remove(); }, 5000);	
}

var socket = io();

socket.on("podatki", function(domovi) {
	prikaziDomove(domovi);
});

socket.on("sporocilo", function(podatki) {
	for (var i = 0; i < podatki.length; i++) {
		new Sporocilo(podatki[i].uporabnik, podatki[i].besedilo);
	}
});