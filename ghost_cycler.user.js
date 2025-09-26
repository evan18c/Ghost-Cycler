// ==UserScript==
// @name         Ghost Cycler
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  No refresh + QoL
// @author       Evan
// @match        *.typeracer.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=typeracer.com
// @grant        none
// @downloadURL  https://github.com/evan18c/Ghost-Cycler/raw/refs/heads/master/ghost_cycler.user.js
// @updateURL    https://github.com/evan18c/Ghost-Cycler/raw/refs/heads/master/ghost_cycler.user.js
// ==/UserScript==

// Constant Script Variables
var username;
var universe;
var jsessionid;
var win;
var menu;
// Dynamic Script Variables
var ghostRaceCount;
var ghost;
var racer;
var racerRaceID;

// Called when a race is finished
function onFinishRace() {
	
	// Click Save Button
	Array.from(document.querySelectorAll('.gwt-Anchor')).find(e=>e.innerText.toLowerCase().includes("save")).click();
	
	// Increment Race Count
	ghostRaceCount++;
	
	// Joining again if 10 not done, or switching quotes
	if (ghostRaceCount < 10) {
		Array.from(document.querySelectorAll('.gwt-Anchor')).find(e=>e.innerText.toLowerCase().includes("try again")).click();
		menu.savesRemaining.innerText = `Saves Remaining: ${10-ghostRaceCount}`;
	} else {
		onFinish10Races();
		ghostRaceCount = 0;
	}
}

// Called when you join a race, collects info
function onJoinRace(data) {
	// Constant
	username = data.split("|")[10];
	universe = data.split("|")[11];
	jsessionid = window.hostpageData.gsURL.substring(20, 52);
	if (isResponsive()) {
		win = document.getElementById("com.typeracer.redesign.Redesign").contentWindow;
	} else {
		win = document.getElementById("com.typeracer.guest.Guest").contentWindow;
	}
}

// Called when you use 10 saves on a quote, moves on to the next quote
function onFinish10Races() {
	// Update GhostIndex
	let ghostIndex = getCurrentGhostIndex() + 1;
	setCurrentGhostIndex(ghostIndex);
	
	// Update Menu
	menu.currentGhostIndex.innerText = `Current Ghost: ${ghostIndex+1}/${getGhostLinkCount()}`;
	menu.savesRemaining.innerText = `Saves Remaining: 10`;
	
	// Get Ghost Link
	let currentGhostLink = getGhostLinkAtIndex(ghostIndex);
	if (currentGhostLink == "-1") {
		alert("You have run out of ghosts!");
		return;
	}
	
	// Update script variables
	let ghostData = parseGhostLink(currentGhostLink);
	ghost = ghostData[0];
	racer = ghostData[1];
	racerRaceID = ghostData[2];
	
	// Update Site Variables
	if (isResponsive()) {
		win.LAb.b = "gameserv;jsessionid=" + jsessionid + ghost;
	} else {
		win.CFb.b = "gameserv;jsessionid=" + jsessionid + ghost;
	}
	
	// Joins a new race
	let game = joinRecordedReplayGame(username, universe, racer, racerRaceID);
	if (game.startsWith("//EX")) {
		alert("Replay unavailable for ghosting!");
	}
	
	// Instant start next race by clicking rejoin link
	document.getElementsByClassName("raceAgainLink")[0].click();
}

// Called when the script is loaded. MENU CREATION CREDIT TO KEEGAN TOURNAY!
function onScriptLoad() {
	// Initializing variables
	ghostRaceCount = 0;
	menu = {};
	
	// Menu Creation
	const style = document.createElement("style");
	style.textContent = `
		.ghost-menu {
			width: 550px;
			height: 300px;
			min-width: 250px;
			min-height: 150px;
			padding: 15px;
			background: #111;
			color: #f0f0f0;
			border: 1px solid #444;
			border-radius: 10px;
			box-shadow: 0 4px 20px rgba(0,0,0,0.3);
			position: absolute;
			top: 100px;
			left: 100px;
			font-family: sans-serif;
			user-select: none;
			cursor: grab;
			z-index: 99999;
			resize: both;
			overflow: hidden;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
		}

		.ghost-menu input,
		.ghost-menu textarea {
			width: 100%;
			margin-top: 6px;
			margin-bottom: 10px;
			padding: 6px;
			border: none;
			border-radius: 6px;
			background: #222;
			color: #f0f0f0;
			box-sizing: border-box;
		}

		.ghost-menu textarea {
			flex: 1;
			resize: none;
			margin-bottom: 0;
		}

		.ghost-menu textarea:focus {
			outline: none;
		}

        .top-bar {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: 10px;
		}

		.info-block {
			display: flex;
			flex-direction: column;
			gap: 5px;
			flex: 1;
		}

		.reset-button {
			padding: 6px 10px;
			border: none;
			border-radius: 6px;
			background: #d11a2a !important;
			color: white;
			font-weight: bold;
			cursor: pointer;
			white-space: nowrap;
            height: 100%;
		}

		.reset-button:hover {
			background: #ff1c1c !important;
		}

		.button-container {
			display: flex;
			gap: 10px;
			margin-top: 10px;
		}

		.ghost-menu button {
			flex: 1;
			padding: 8px;
			border: none;
			border-radius: 6px;
			background: #047AC6;
			color: white;
			font-weight: bold;
			cursor: pointer;
			transition: background 0.2s;
		}

		.ghost-menu button:hover {
			background: #009bff;
		}

		.ghost-menu hr {
			border: none;
			border-top: 1px solid #444;
			margin: 10px 0;
		}
	`;
	document.head.appendChild(style);
	
	function makeDraggable(el) {
        let isDragging = false;
        let offsetX, offsetY;

        el.addEventListener("mousedown", function (e) {
            const isResizeCorner = (() => {
                const rect = el.getBoundingClientRect();
                return e.clientX >= rect.right - 16 && e.clientY >= rect.bottom - 16;
            })();

            const isFormControl = e.target.closest("input, textarea, button");
            if (isResizeCorner || isFormControl) return;

            isDragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            el.style.cursor = "grabbing";
        });

        document.addEventListener("mousemove", function (e) {
            if (isDragging) {
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;

                localStorage.setItem("ghostMenuX", x);
                localStorage.setItem("ghostMenuY", y);
            }
        });

        document.addEventListener("mouseup", function () {
            isDragging = false;
            el.style.cursor = "grab";
        });
    }

    function makeResizable(el) {
        const observer = new ResizeObserver(() => {
            localStorage.setItem("ghostMenuWidth", el.offsetWidth);
            localStorage.setItem("ghostMenuHeight", el.offsetHeight);
        });
        observer.observe(el);
    }

	menu.menu = document.createElement("div");
	menu.menu.className = "ghost-menu";

	const savedX = localStorage.getItem("ghostMenuX");
	const savedY = localStorage.getItem("ghostMenuY");
	const savedWidth = localStorage.getItem("ghostMenuWidth");
	const savedHeight = localStorage.getItem("ghostMenuHeight");

	if (savedX) menu.menu.style.left = `${savedX}px`;
	if (savedY) menu.menu.style.top = `${savedY}px`;
	if (savedWidth) menu.menu.style.width = `${savedWidth}px`;
	if (savedHeight) menu.menu.style.height = `${savedHeight}px`;

	menu.topBar = document.createElement("div");
	menu.topBar.className = "top-bar";

	menu.infoBlock = document.createElement("div");
	menu.infoBlock.className = "info-block";

	menu.currentGhostIndex = document.createElement("div");
	menu.currentGhostIndex.innerText = `Current Ghost: 1/${getGhostLinkCount()}`;

	menu.savesRemaining = document.createElement("div");
	menu.savesRemaining.innerText = "Saves Remaining: 10";

	menu.infoBlock.appendChild(menu.currentGhostIndex);
	menu.infoBlock.appendChild(menu.savesRemaining);

	menu.resetButton = document.createElement("button");
	menu.resetButton.className = "reset-button";
	menu.resetButton.innerText = "Reset";

	menu.topBar.appendChild(menu.infoBlock);
	menu.topBar.appendChild(menu.resetButton);

	menu.divider = document.createElement("hr");

	menu.ghostLinks = document.createElement("textarea");
	menu.ghostLinks.rows = 4;
	menu.ghostLinks.wrap = "off";

	menu.buttonContainer = document.createElement("div");
	menu.buttonContainer.className = "button-container";

	menu.updateTexts = document.createElement("button");
	menu.updateTexts.innerText = "Update Texts";

	menu.skipText = document.createElement("button");
	menu.skipText.innerText = "Skip Text";

	menu.buttonContainer.appendChild(menu.updateTexts);
	menu.buttonContainer.appendChild(menu.skipText);

	menu.menu.appendChild(menu.topBar);
	menu.menu.appendChild(menu.divider);
	menu.menu.appendChild(menu.ghostLinks);
	menu.menu.appendChild(menu.buttonContainer);

	document.body.appendChild(menu.menu);
	makeDraggable(menu.menu);
	makeResizable(menu.menu);
	
	// Menu Functionality
	
	// Filling ghostLinks
	menu.ghostLinks.value = getGhostLinks().join("\n");
	
	// Update Texts functionality, this sets the ghosts
	menu.updateTexts.onclick = () => {
		setGhostLinks(menu.ghostLinks.value.split("\n"));
		alert("Texts updated.");
	}
	
	// Skip Text functionality, this just assums you typed the quote 10 times
	menu.skipText.onclick = () => {
		ghostRaceCount = 0;
		onFinish10Races();
	}
	
	// Reset functionality, loads the first quote in the list
	menu.resetButton.onclick = () => {
		setCurrentGhostIndex(0);
		let ghost = getGhostLinkAtIndex(0);
		if (ghost != "-1") {
			window.location.href = ghost;
		} else {
			alert("Set some ghosts first!");
		}
		ghostRaceCount = 0;
	}
	
	// Disabling refresh and replacing it with rejoining quote
	document.addEventListener("keydown", (event) => {
		if (event.ctrlKey && event.key == "r") {
			event.preventDefault();
			document.getElementsByClassName("raceAgainLink")[0].click();
		}
	});
}
window.onload = onScriptLoad;

// Checks for race completion, calls main function once when done, also keeps popups out of the way
var calledOnFinishRace = false;
function checkFinishRace() {
	// Race completion check
	let elems = document.getElementsByClassName("gameStatusLabel");
	if (elems.length > 0) {
		if (elems[0].innerText.includes("You finished")) {
			if (!calledOnFinishRace) {
				onFinishRace();
				calledOnFinishRace = true;
			}
		} else {
			calledOnFinishRace = false;
		}
	}
	// Move Popups out of the way
	for (const popup of document.getElementsByClassName("DialogBox")) {
        popup.style = "left: 425px; top: 425px; position: absolute;";
    }
}
setInterval(checkFinishRace, 100);

// Joins a replay
function joinRecordedReplayGame(username, universe, racer, racerRaceID) {
	return request(`7|1|10|${win.$moduleBase}|58891928A0FDDBA80EBF2E645D879779|_|joinRecordedReplayGame|15|1f|2f|${username}|${universe}|${racer}|1|2|3|4|2|5|6|5|0|1|0|0|7|8|6|${racerRaceID}|9|7|10|`);
}


// Performs a gameserv request (synchronously to receive return data)
function request(payload) {
	let xhr = new XMLHttpRequest();
	let url = "https://play.typeracer.com/gameserv;jsessionid=" + jsessionid + ghost
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-Type", "text/x-gwt-rpc;");
	xhr.setRequestHeader("X-Gwt-Module-Base", win.$moduleBase);
	xhr.setRequestHeader("X-Gwt-Permutation", win.$strongName);
	xhr.send(payload);
	return xhr.responseText;
}

// Intercepts requests to collect data
let oldSend = XMLHttpRequest.prototype.send;
let newSend = function (body) {
	if (body.includes("joinRecordedReplayGame")) {
		onJoinRace(body);
	}
    oldSend.call(this, body);
}
XMLHttpRequest.prototype.send = newSend;

// Gets the current ghost index
function getCurrentGhostIndex() {
	let index = localStorage.getItem("currentGhostIndex");
	if (index != null) {
		return parseInt(index);
	} else {
		localStorage.setItem("currentGhostIndex", 0);
		return 0;
	}
}

// Updates the current ghost index
function setCurrentGhostIndex(index) {
	localStorage.setItem("currentGhostIndex", index);
}

// Gets the list of ghosts
function getGhostLinks() {
	let ghostLinks = localStorage.getItem("ghostLinks");
	if (ghostLinks != null) {
		return ghostLinks.split(",");
	} else {
		return [];
	}
}

// Sets the ghost links
function setGhostLinks(ghostLinks) {
	localStorage.setItem("ghostLinks", ghostLinks.join(","));
}

// Gets the ghost at the specified index, returns "-1" if no more ghosts
function getGhostLinkAtIndex(index) {
	let ghostLinks = getGhostLinks();
	if (index >= ghostLinks.length) {
		return "-1";
	} else {
		return ghostLinks[index];
	}
}

// Gets the amount of ghosts there are saved
function getGhostLinkCount() {
	let ghostLinks = localStorage.getItem("ghostLinks");
	if (ghostLinks != null) {
		return ghostLinks.split(",").length;
	} else {
		return 0;
	}
}

// Parses ghost link
function parseGhostLink(lnk) {
	let ghost = "?" + lnk.split("?")[1];
	let racer = lnk.match(/tr%3A(\w+)/)[1];
	let racerRaceID = lnk.match(/tr%3A\w+%7C(\d+)/)[1];
	return [ghost, racer, racerRaceID];
}

// Checks if you're on the redesigned theme
function isResponsive() {
	let copyright = document.getElementsByClassName("copyright")[0];
	if (copyright != null) {
		return true;
	} else {
		return false;
	}
}