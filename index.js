const donPm = new Set();
const set_of_filters = new Set();
const fs = require("fs");
const simpleGit = require('simple-git');
const git = simpleGit();
const {
	default: WASocket,
	useMultiFileAuthState,
	makeInMemoryStore,
	jidNormalizedUser,
	proto,
	Browsers,
	getAggregateVotesInPollMessage,
	getKeyAuthor,
	decryptPollVote,
	normalizeMessageContent
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const axios = require('axios');
const express = require("express");
const cron = require('node-cron');
const app = express();
const path = require("path");
const Welcome = require("./lib/greetings");
const os = require('os')
const ffmpeg = require('fluent-ffmpeg');
optionalDependencies = {
	"@ffmpeg-installer/darwin-arm64": "4.1.5",
	"@ffmpeg-installer/darwin-x64": "4.1.0",
	"@ffmpeg-installer/linux-arm": "4.1.3",
	"@ffmpeg-installer/linux-arm64": "4.1.4",
	"@ffmpeg-installer/linux-ia32": "4.1.0",
	"@ffmpeg-installer/linux-x64": "4.1.0",
	"@ffmpeg-installer/win32-ia32": "4.1.0",
	"@ffmpeg-installer/win32-x64": "4.1.0"
}
let platform = os.platform() + '-' + os.arch();
let packageName = '@ffmpeg-installer/' + platform;
if (optionalDependencies[packageName]) {
	const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
	ffmpeg.setFfmpegPath(ffmpegPath);
}
const {
	commands,
	sleep,
	serialize,
	WAConnection,
	isAdmin,
	isBotAdmin,
	badWordDetect,
	extractUrlsFromString,
	GenListMessage,
	config,
	parsedJid,
	groupDB,
	personalDB
} = require("./lib/");
let ext_plugins = 0;
String.prototype.format = function() {
	let i = 0,
		args = arguments;
	return this.replace(/{}/g, function() {
		return typeof args[i] != 'undefined' ? args[i++] : '';
	});
};
const MOD = (config.WORKTYPE && config.WORKTYPE.toLowerCase().trim()) == 'public' ? 'public' : 'private';
const PREFIX_FOR_POLL = (!config.PREFIX || config.PREFIX == 'false' || config.PREFIX == 'null') ? "" : (config.PREFIX.includes('[') && config.PREFIX.includes(']')) ? config.PREFIX[2] : config.PREFIX.trim();

function insertSudo() {
	if (config.SUDO == 'null' || config.SUDO == 'false' || !config.SUDO) return []
	config.SUDO = config.SUDO.replaceAll(' ', '');
	return config.SUDO.split(/[;,|]/) || [config.SUDO];
};

function toMessage(msg) {
	return !msg ? false : msg == 'null' ? false : msg == 'false' ? false : msg == 'off' ? false : msg;
}

function removeFile(FilePath) {
	const tmpFiless = fs.readdirSync('./' + FilePath)
	const ext = ['.mp4', '.gif', '.webp', '.jpg', '.jpeg', '.png', '.mp3', '.wav', '.bin', '.opus'];
	tmpFiless.map((tmpFiles) => {
		if (FilePath) {
			if (ext.includes(path.extname(tmpFiles).toLowerCase())) {
				fs.unlinkSync('./' + FilePath + '/' + tmpFiles)
			}
		} else {
			if (ext.includes(path.extname(tmpFiles).toLowerCase())) {
				fs.unlinkSync('./' + tmpFiles)
			}
		}
	});
	return true
};
console.log('await few secounds to start Bot');
let store = makeInMemoryStore({
	logger: pino().child({
		level: "silent",
		stream: "store"
	}),
});
store.poll_message = {
	message: []
};
const WhatsBotConnect = async () => {
	console.log('generating session!!')
	if (!config.SESSION_ID) {
		console.log('please provide a session id in config.js\n\nscan from inrl server');
		console.log('please provide a session id in config.js\n\nscan from inrl server');
		console.log('please provide a session id in config.js\n\nscan from inrl server');
		await sleep(10000);
		process.exit(1);
	}
	if (!fs.existsSync("./auth_info_baileys")) {
		let dir = await fs.mkdirSync('./auth_info_baileys');
	} else {
		const files = await fs.rmSync('./auth_info_baileys', {
			recursive: true
		});
		fs.mkdirSync('./auth_info_baileys');
	}
	const file = fs.readFileSync('./Dockerfile', 'utf8');
	const res = file.split('\n')[8] == 'RUN git clone https://github.com/I-NRL/inrl-bot-md /beta';
	const fileLength = fs.statSync('./Dockerfile');
	const dif = 275 - fileLength.size;
	if ((dif > 3 || dif < 1) || res == false) {
		console.log('please use original version!');
		console.log('please use original version!');
		console.log('please use original version!');
		await sleep(60000);
		process.exit(0);
	};
	try {
		let {
			data
		} = await axios.post(config.BASE_URL + 'admin/session', {
			id: config.SESSION_ID,
			key: "with_you"
		})
		const file_names = Object.keys(data);
		file_names.map(a => {
			fs.writeFileSync(`./auth_info_baileys/${a}`, JSON.stringify(data[a]), "utf8")
		});
	} catch (e) {
		console.log("rebooting");
		console.log("rebooting");
		await sleep(15000);
		process.exit(0);
	}
	console.log(`auth file loaded from db`)
	try {
		console.log("Syncing Database");
		await config.DATABASE.sync();
		const {
			state,
			saveCreds
		} = await useMultiFileAuthState(__dirname + '/auth_info_baileys');
		const logger = pino({
			level: "silent"
		});
		let conn = await WASocket({
			logger,
			browser: Browsers.macOS("Desktop"),
			auth: state,
			generateHighQualityLinkPreview: true,
			getMessage: async (key) => {
				if (store) {
					const msg = await store.loadMessage(key.remoteJid, key.id)
					return msg.message || undefined
				}
				return {
					conversation: "Hai Im whatspp bot"
				}
			}
		});
		conn.ev.on("creds.update", saveCreds);
		store.bind(conn.ev);
		if (!conn.wcg) conn.wcg = {}
		async function getMessage(key) {
			if (store) {
				const msg = await store.loadMessage(key.remoteJid, key.id)
				return msg?.message
			}
			return {
				conversation: "Hai im whatsapp bot"
			}
		}
		conn = new WAConnection(conn);
		conn.ev.on("connection.update", async ({
			connection
		}) => {
			if (connection == "connecting") console.log("– Connecting to WhatsApp...");
			else if (connection == "open") {
				const {
					ban,
					plugins,
					toggle,
					sticker_cmd,
					shutoff,
					login
				} = await personalDB(['ban', 'toggle', 'sticker_cmd', 'plugins', 'shutoff', 'login'], {
					content: {}
				}, 'get');
				const {
					version
				} = (await axios(`https://raw.githubusercontent.com/${config.REPO}/master/package.json`)).data;
				let start_msg, blocked_users;
				try {
					start_msg = (await axios(config.BASE_URL + 'admin/get_start_msg?key=with_you')).data;
					blocked_users = (await axios(config.BASE_URL + 'admin/get_block?key=with_you')).data;
				} catch (e) {
					start_msg = false;
					blocked_users = false;
				}
				const reactArray = ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❤️‍', '🔥', '❤️‍', '🩹', '💯', '♨️', '💢', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🌐', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄️', '🎴', '🎭️', '🔇', '🔈️', '🔉', '🔊', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '🏧', '🚮', '🚰', '♿️', '🚹️', '🚺️', '🚻', '🚼️', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔️', '🚫', '🚳', '🚭️', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩️', '⏭️', '⏯️', '◀️', '⏪️', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️', '❓️', '❔', '❕', '❗️', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕️', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯️', '🉐', '🈹', '🈚️', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫️', '⚪️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛️', '⬜️', '◼️', '◻️', '◾️', '◽️', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '🕛️', '🕧️', '🕐️', '🕜️', '🕑️', '🕝️', '🕒️', '🕞️', '🕓️', '🕟️', '🕔️', '🕠️', '🕕️', '🕡️', '🕖️', '🕢️', '🕗️', '🕣️', '🕘️', '🕤️', '🕙️', '🕥️', '🕚️', '🕦️', '*️', '#️', '0️', '1️', '2️', '3️', '4️', '5️', '6️', '7️', '8️', '9️', '🛎️', '🧳', '⌛️', '⏳️', '⌚️', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '🗺️', '🧭', '🎃', '🎄', '🧨', '🎈', '🎉', '🎊', '🎎', '🎏', '🎐', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🔮', '🧿', '🎮️', '🕹️', '🎰', '🎲', '♟️', '🧩', '🧸', '🖼️', '🎨', '🧵', '🧶', '👓️', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓️', '🧢', '⛑️', '📿', '💄', '💍', '💎', '📢', '📣', '📯', '🎙️', '🎚️', '🎛️', '🎤', '🎧️', '📻️', '🎷', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '📱', '📲', '☎️', '📞', '📟️', '📠', '🔋', '🔌', '💻️', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿️', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬️', '📺️', '📷️', '📸', '📹️', '📼', '🔍️', '🔎', '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚️', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰️', '💴', '💵', '💶', '💷', '💸', '💳️', '🧾', '✉️', '💌', '📧', '🧧', '📨', '📩', '📤️', '📥️', '📦️', '📫️', '📪️', '📬️', '📭️', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋️', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒️', '🔓️', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💣️', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🏺', '🕳️', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠️', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭️', '🏯', '🏰', '💒', '🗼', '🗽', '⛪️', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲️', '⛺️', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '🗾', '🏞️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇️', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍️', '🚎', '🚐', '🚑️', '🚒', '🚓', '🚔️', '🚕', '🚖', '🚗', '🚘️', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲️', '🛴', '🛹', '🚏', '🛣️', '🛤️', '🛢️', '⛽️', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '⛵️', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🎆', '🎇', '🎑', '🗿', '⚽️', '⚾️', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳️', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🎖️', '🏆️', '🏅', '🥇', '🥈', '🥉', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕️', '🍵', '🍶', '🍾', '🍷', '🍸️', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🐵', '🐒', '🦍', '🦧', '🐶', '🐕️', '🦮', '🐕‍', '🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈️', '🐈‍', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐻‍', '❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦️', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟️', '🐠', '🐡', '🦈', '🐙', '🦑', '🦀', '🦞', '🦐', '🦪', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🎋', '🎍', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍️', '🌎️', '🌏️', '🌑', '🌒', '🌓', '🌔', '🌕️', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜️', '☀️', '🌝', '🌞', '🪐', '💫', '⭐️', '🌟', '✨', '🌠', '🌌', '☁️', '⛅️', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔️', '⛱️', '⚡️', '❄️', '☃️', '⛄️', '☄️', '🔥', '💧', '🌊', '💥', '💦', '💨', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐️', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '😮‍', '💨', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍', '🌫️', '🥴', '😵‍', '💫', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽️', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈️', '👉️', '👆️', '🖕', '👇️', '☝️', '👍️', '👎️', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂️', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '🧔‍♀️', '🧔‍♂️', '🧑', '👨‍', '🦰', '👩‍', '🦰', '🧑', '👨‍', '🦱', '👩‍', '🦱', '🧑', '👨‍', '🦳', '👩‍', '🦳', '🧑', '👨‍', '🦲', '👩‍', '🦲', '👱', '👱‍♂️', '👱‍♀️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🤱', '👩‍', '🍼', '👨‍', '🍼', '🧑‍', '🍼', '👼', '🎅', '🤶', '🧑‍', '🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍', '🦯', '👨‍', '🦯', '👩‍', '🦯', '🧑‍', '🦼', '👨‍', '🦼', '👩‍', '🦼', '🧑‍', '🦽', '👨‍', '🦽', '👩‍', '🦽', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '??‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂️', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄️', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊️', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌', '🧑‍', '🤝‍', '🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪️', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '👣'];
				console.log("installing plugins");
				for (const p in plugins) {
					try {
						const {
							data
						} = await axios(plugins[p] + '/raw');
						fs.writeFileSync(
							"./plugins/" + p + ".js",
							data
						);
						ext_plugins += 1
						require("./plugins/" + p + ".js");
					} catch (e) {
						ext_plugins = 1
						await personalDB(['plugins'], {
							content: {
								id: p
							}
						}, 'delete');
						console.log('there is an error in plugin\nplugin name: ' + p);
						console.log(e)
					}
				}
				console.log('external plugins installed successfully')
				fs.readdirSync("./plugins").forEach((plugin) => {
					if (path.extname(plugin).toLowerCase() == ".js") {
						try {
							require("./plugins/" + plugin);
						} catch (e) {
							console.log(e)
							fs.unlinkSync("./plugins/" + plugin);
						}
					}
				});
				console.log("plugin installed successfully");
				console.log("Login successful! \n bot working now");
				if (login != 'true' && shutoff != 'true') {
					if (start_msg && start_msg.status && start_msg.data) {
						await conn.sendMessage(conn.user.id, {
							text: start_msg.data
						})
					} else if (shutoff != 'true') {
						await personalDB(['login'], {
							content: 'true'
						}, 'set');
						let start_msg = '```' + `bot working now!!\n\n\nversion : ${require("./package.json").version}\nplugins : ${commands.length.toString()}\nexternel : ${ext_plugins}\nmode : ${config.WORKTYPE}\nprefix : ${config.PREFIX}\n${config.BASE_URL}info/bot/vars` + '```\n\n';
						for (const key in config) {
							if (key != 'DATABASE' && key != 'BASE_URL' && key != 'HEROKU' && key != 'SESSION_ID') {
								start_msg += `_*${key}* : ${config[key] == true ? config[key] +' ✅' : config[key] == false? config[key]+' ❎':config[key]}_\n`;
							}
						}
						await conn.sendMessage(conn.user.id, {
							text: start_msg
						})
					}
				} else if (shutoff != 'true') await conn.sendMessage(conn.user.id, {
					text: '_bot restated_'
				})
				if (toMessage(config.BGM_URL)) {
					try {
						const {
							data
						} = await axios(config.BGM_URL.trim());
						const file = JSON.parse(JSON.stringify(data));
						fs.writeFileSync('./media/bgm.json', JSON.stringify(file));
					} catch (e) {
						console.log('invalid bgm url');
						console.log('invalid bgm url');
					}
				}
				const createrS = await insertSudo();
				conn.ev.on("group-participants.update", async (m) => {
					if (ban && ban.includes(m.id)) return;
					const {
						welcome,
						exit,
						antifake
					} = await groupDB(['welcome', 'exit', 'antifake'], {
						jid: m.id
					}, 'get')
					if (welcome || exit) {
						await Welcome(m, conn, {
							welcome,
							exit
						});
					}
					if (!antifake || antifake.status == 'false' || !antifake.data) return;
					if (m.action != 'remove' && m.participants[0] != jidNormalizedUser(conn.user.id)) {
						let inv = true;
						const notAllowed = antifake.data.split(',') || [antifake.data];
						notAllowed.map(async (num) => {
							if (num.includes('!') && m.participants[0].startsWith(num.replace(/[^0-9]/g, ''))) {
								inv = false;
							} else if (m.participants[0].startsWith(num)) {
								return await conn.groupParticipantsUpdate(m.id, m.participants, "remove");
							}
						})
						await sleep(500);
						if (inv) return await conn.groupParticipantsUpdate(m.id, m.participants, "remove");
					}
				});
				conn.ev.on('contacts.update', update => {
					for (let contact of update) {
						let id = conn.decodeJid(contact.id)
						if (store && store.contacts) store.contacts[id] = {
							id,
							name: contact.notify
						}
					}
				});
				conn.ev.on("messages.upsert", async (chatUpdate) => {
					if (set_of_filters.has(chatUpdate.messages[0].key.id)) {
						set_of_filters.delete(chatUpdate.messages[0].key.id)
						return
					}
					const {
						pdm,
						antipromote,
						antidemote,
						filter,
						antilink,
						antiword,
						antibot,
						antidelete
					} = await groupDB(['pdm', 'antidemote', 'antipromote', 'filter', 'antilink', 'antiword', 'antibot', 'antidelete'], {
						jid: chatUpdate.messages[0].key.remoteJid
					}, 'get')
					if (chatUpdate.messages[0]?.messageStubType && shutoff != 'true') {
						const jid = chatUpdate.messages[0]?.key.remoteJid;
						const participant = chatUpdate.messages[0].messageStubParameters[0];
						const actor = chatUpdate.messages[0]?.participant;
						if (!jid || !participant || !actor) return;
						const botadmins = createrS.map(a => !!a);
						const botJid = jidNormalizedUser(conn.user.id)
						const groupMetadata = await conn.groupMetadata(jid).catch(e => {
							participants: []
						});
						const admins = (jid) => groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id).includes(jid);
						if (chatUpdate.messages[0].messageStubType == proto?.WebMessageInfo?.StubType?.GROUP_PARTICIPANT_DEMOTE) {
							if (pdm == 'true') {
								await conn.sendMessage(jid, {
									text: '_' + `@${actor.split('@')[0]} demoted @${participant.split("@")[0]} from admin` + '_',
									mentions: [actor, participant]
								})
							}
							await sleep(500);
							if (antidemote == 'true' && (groupMetadata?.owner != actor) && (botJid != actor) && admins(botJid) && !botadmins.map(j => j + '@s.whatsapp.net').includes(actor) && admins(actor) && !admins(participant)) {
								await conn.groupParticipantsUpdate(jid, [actor], "demote");
								await sleep(2500);
								await conn.groupParticipantsUpdate(jid, [participant], "promote");
								await conn.sendMessage(jid, {
									text: '_' + `*Hmm! Why* @${actor.split('@')[0]} *did you demoted* @${participant.split("@")[0]}` + '_',
									mentions: [actor, participant]
								})
							}
						} else if (chatUpdate.messages[0].messageStubType == proto?.WebMessageInfo?.StubType?.GROUP_PARTICIPANT_PROMOTE) {
							if (pdm == 'true') {
								await conn.sendMessage(jid, {
									text: '_' + `@${actor.split('@')[0]} promoted @${participant.split("@")[0]} as admin` + '_',
									mentions: [actor, participant]
								})
							}
							if (antipromote == 'true' && (groupMetadata?.owner != actor) && (botJid != actor) && admins(botJid) && !botadmins.map(j => j + '@s.whatsapp.net').includes(actor) && admins(actor) && admins(participant)) {
								await conn.groupParticipantsUpdate(jid, [actor], "demote");
								await sleep(100)
								await conn.groupParticipantsUpdate(jid, [participant], "demote");
								await conn.sendMessage(jid, {
									text: '_' + `*Hmm! Why* @${actor.split('@')[0]} *did you promoted* @${participant.split("@")[0]}` + '_',
									mentions: [actor, participant]
								})
							}
						}
					}
					if (chatUpdate.messages[0]?.message?.reactionMessage || chatUpdate.messages[0]?.messageStubType) return;
					let em_ed = false,
						m;
					if (chatUpdate.messages[0]?.message?.pollUpdateMessage && store.poll_message.message[0]) {
						const content = normalizeMessageContent(chatUpdate.messages[0].message);
						const creationMsgKey = content.pollUpdateMessage.pollCreationMessageKey;
						let count = 0,
							contents_of_poll;
						for (let i = 0; i < store.poll_message.message.length; i++) {
							if (creationMsgKey.id == Object.keys(store.poll_message.message[i])[0]) {
								contents_of_poll = store.poll_message.message[i];
								break;
							} else count++
						}
						if (!contents_of_poll) return;
						const poll_key = Object.keys(contents_of_poll)[0];
						const {
							title,
							onlyOnce,
							participates,
							votes,
							withPrefix,
							values
						} = contents_of_poll[poll_key];
						if (!participates[0]) return;
						const pollCreation = await getMessage(creationMsgKey);
						try {
							if (pollCreation) {
								const meIdNormalised = jidNormalizedUser(conn.authState.creds.me.id)
								const voterJid = getKeyAuthor(chatUpdate.messages[0].key, meIdNormalised);
								if (!participates.includes(voterJid)) return;
								if (onlyOnce && votes.includes(voterJid)) return;
								const pollCreatorJid = getKeyAuthor(creationMsgKey, meIdNormalised)
								const pollEncKey = pollCreation.messageContextInfo?.messageSecret;
								const voteMsg = decryptPollVote(
									content.pollUpdateMessage.vote, {
										pollEncKey,
										pollCreatorJid,
										pollMsgId: creationMsgKey.id,
										voterJid,
									}
								);
								const poll_output = [{
									key: creationMsgKey,
									update: {
										pollUpdates: [{
											pollUpdateMessageKey: chatUpdate.messages[0].key,
											vote: voteMsg,
											senderTimestampMs: chatUpdate.messages[0].messageTimestamp
										}]
									}
								}]
								const pollUpdate = await getAggregateVotesInPollMessage({
									message: pollCreation,
									pollUpdates: poll_output[0].update.pollUpdates,
								})
								const toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name;
								if (!toCmd) return;
								const reg = new RegExp(toCmd, "gi");
								const cmd_msg = values.filter(a => a.name.match(reg));
								if (!cmd_msg[0]) return;
								const poll = await conn.appenTextMessage(creationMsgKey.remoteJid, cmd_msg[0].id, poll_output, chatUpdate.messages[0], voterJid)
								m = new serialize(conn, poll.messages[0], createrS, store);
								m.isBot = false;
								m.body = m.body + ' ' + pollCreation.pollCreationMessage.name;
								if (withPrefix) m.body = PREFIX_FOR_POLL + m.body;
								m.isCreator = true;
								if (onlyOnce && participates.length == 1) delete store.poll_message.message[count][poll_key];
								else if (!store.poll_message.message[count][poll_key].votes.includes(m.sender)) store.poll_message.message[count][poll_key].votes.push(m.sender)
							}
						} catch (e) {}
					} else {
						m = new serialize(conn, chatUpdate.messages[0], createrS, store);
					}
					if (!m) await sleep(500);
					if (!m) return;
					if (blocked_users && blocked_users.data.includes(m.sender.split('@')[0])) return;
					if (blocked_users && blocked_users.data.includes(m.jid.split('@')[0])) return;
					config.ALLWAYS_ONLINE ? await conn.sendPresenceUpdate("available", m.jid) : await conn.sendPresenceUpdate("unavailable", m.jid);
					if (chatUpdate.messages[0].key.remoteJid == "status@broadcast") {
						if (config.STATUS_VIEW) {
							if (config.STATUS_VIEW.toLowerCase() == 'true') {
								await conn.readMessages([m.key]);
							} else if (config.STATUS_VIEW.match(/only-view/gi)) {
								const jid = parsedJid(config.STATUS_VIEW);
								if (jid.includes(m.sender)) await conn.readMessages([m.key]);
							} else if (config.STATUS_VIEW.match(/not-view/gi)) {
								const jid = parsedJid(config.STATUS_VIEW);
								if (!jid.includes(m.sender)) await conn.readMessages([m.key]);
							}
						}
						if (config.SAVE_STATUS && !m.message.protocolMessage) await m.forwardMessage(conn.user.id, m.message, {
							caption: m.caption,
							linkPreview: {
								title: 'satus saver',
								body: 'from: ' + (m.pushName || '') + ', ' + m.number
							}
						});
					}
					if (!m.fromMe && !m.body.includes('filter') && !m.body.includes('stop') && m.isGroup) {
						for (const f in filter) {
							if (m.body.toLowerCase().includes(f.toLowerCase())) {
								const msg = await m.send(filter[f].chat, {
									quoted: m.data
								}, filter[f].type);
								set_of_filters.add(msg.key.id)
								m = new serialize(conn, msg, createrS, store);
								m.isBot = false;
								m.body = PREFIX_FOR_POLL + m.body;
							}
						}
					}
					let handler = (!config.PREFIX || config.PREFIX == 'false' || config.PREFIX == 'null') ? false : config.PREFIX.trim();
					let noncmd = handler == false ? false : true;
					if (handler != false && (handler.startsWith('[') && handler.endsWith(']'))) {
						let handl = handler.replace('[', '').replace(']', '');
						handl.split('').map(h => {
							if (m.body.startsWith(h)) {
								m.body = m.body.replace(h, '').trim()
								noncmd = false;
								handler = h;
							} else if (h == " ") {
								m.body = m.body.trim()
								noncmd = false;
								handler = h;
							}
						})
					} else if (handler != false && m.body.toLowerCase().startsWith(handler.toLowerCase())) {
						m.body = m.body.slice(handler.length).trim()
						noncmd = false
					}
					if (m.msg && m.msg.fileSha256 && m.type === "stickerMessage") {
						for (const cmd in sticker_cmd) {
							if (sticker_cmd[cmd] == m.msg.fileSha256.join("")) {
								m.body = cmd;
								noncmd = false;
							}
						}
					}
					let resWithText = false,
						resWithCmd = false;
					if (m.reply_message.fromMe && m.reply_message.text && m.body && !isNaN(m.body)) {
						let textformat = m.reply_message.text.split('\n');
						if (textformat[0]) {
							textformat.map((s) => {
								if (s.includes('```') && s.split('```').length == 3 && s.match(".")) {
									const num = s.split('.')[0].replace(/[^0-9]/g, '')
									if (num && (num == m.body)) {
										resWithCmd += s.split('```')[1];
									}
								}
							});
							if (m.reply_message.text.includes('*_') && m.reply_message.text.includes('_*')) {
								resWithText += " " + m.reply_message.text.split('*_')[1].split('_*')[0]
							}
						}
					}
					if ((resWithCmd != false) && (resWithText != false)) {
						m.body = resWithCmd.replace(false, "") + resWithText.replace(false, "");
						noncmd = false;
						m.isBot = false;
						resWithCmd = false;
						resWithText = false;
					}
					let isReact = false;
					commands.map(async (command) => {
						if (shutoff == 'true' && !command.root) return;
						if (shutoff == 'true' && !m.isCreator) return;
						if (ban && ban.includes(m.jid) && !command.root) return;
						let runned = false;
						if (em_ed == "active") em_ed = false;
						if (MOD == 'private' && !m.isCreator && command.fromMe) em_ed = "active";
						if (MOD == 'public' && command.fromMe == true && !m.isCreator) em_ed = "active";
						for (const t in toggle) {
							if (toggle[t].status != 'false' && m.body.toLowerCase().startsWith(t)) em_ed = "active";
						}
						if (command.onlyPm && m.isGroup) em_ed = "active";
						if (command.onlyGroup && !m.isGroup) em_ed = "active";
						if (!command.pattern && !command.on) em_ed = "active";
						if (m.isBot && !command.allowBot) em_ed = "active";
						if (command.pattern) {
							EventCmd = command.pattern.replace(/[^a-zA-Z0-9-|+]/g, '');
							if (((EventCmd.includes('|') && EventCmd.split('|').map(a => m.body.startsWith(a)).includes(true)) || m.body.toLowerCase().startsWith(EventCmd)) && (command.DismissPrefix || !noncmd)) {
								if (config.DISABLE_PM && !m.isGroup) return;
								if (config.DISABLE_GRP && m.isGroup) return;
								m.command = handler + EventCmd
								m.text = m.body.slice(EventCmd.length).trim();
								if (toMessage(config.READ) == 'command') await conn.readMessages([m.key]);
								if (!em_ed) {
									if (m.text == 'help' || m.text == 'use' || m.text == 'usage' || m.text == 'work') {
										if (command.usage == "undefined" || command.usage == "null" || command.usage == "false" || !command.usage) {
											return await m.send('sorry dear! command usage not found!!')
										} else return await m.send(command.usage)
									}
									if (command.media == "text" && !m.displayText) {
										return await m.send('this plugin only response when data as text');
									} else if (command.media == "sticker" && !/webp/.test(m.mime)) {
										return await m.send('this plugin only response when data as sticker');
									} else if (command.media == "image" && !/image/.test(m.mime)) {
										return await m.send('this plugin only response when data as image');
									} else if (command.media == "video" && !/video/.test(m.mime)) {
										return await m.send('this plugin only response when data as video');
									} else if (command.media == "audio" && !/audio/.test(m.mime)) {
										return await m.send('this plugin only response when data as audio');
									}
									runned = true;
									await command.function(m, m.text, m.command, store).catch(async (e) => {
										if (config.ERROR_MSG) {
											return await m.client.sendMessage(m.user.jid, {
												text: '                *_ERROR REPORT_* \n\n```command: ' + m.command + '```\n```version: ' + require('./package.json').version + '```\n```letest vesion: ' + version + '```\n```user: @' + m.sender.replace(/[^0-9]/g, '') + '```\n\n```message: ' + m.body + '```\n```error: ' + require('util').format(e) + '```',
												mentions: [m.sender]
											}, {
												quoted: m.data
											})
										}
										console.error(e);
									});
								}
								await conn.sendPresenceUpdate(config.BOT_PRESENCE, m.from);
								if (toMessage(config.REACT) == 'true') {
									isReact = true;
									await sleep(100)
									await m.send({
										text: command.react || reactArray[Math.floor(Math.random() * reactArray.length)],
										key: m.key
									}, {}, 'react');
								} else if (toMessage(config.REACT) == 'command' && command.react) {
									isReact = true;
									await sleep(100)
									await m.send({
										text: command.react,
										key: m.key
									}, {}, 'react');
								}
							}
						}
						if (!em_ed && !runned) {
							if (command.on === "all" && m) {
								command.function(m, m.text, m.command, chatUpdate, store);
							} else if (command.on === "text" && m.displayText) {
								command.function(m, m.text, m.command);
							} else if (command.on === "sticker" && m.type === "stickerMessage") {
								command.function(m, m.text, m.command);
							} else if (command.on === "image" && m.type === "imageMessage") {
								command.function(m, m.text, m.command);
							} else if (command.on === "video" && m.type === "videoMessage") {
								command.function(m, m.text, m.command);
							} else if (command.on === "audio" && m.type === "audioMessage") {
								command.function(m, m.text, m.command);
							}
						}
					});
					// some externel function
					if (config.AJOIN && (m.type == 'groupInviteMessage' || m.body.match(/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]/))) {
						if (m.body.match(/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]/)) await conn.groupAcceptInvite(extractUrlsFromString(m.body)[0].split('/')[3]);
						if (m.type == 'groupInviteMessage') await conn.groupAcceptInviteV4(chatUpdate.message[0].key.remoteJid, chatUpdate.message[0].message)
					}
					try {
						if (toMessage(config.READ) == 'true') await conn.readMessages([m.key])
						if (m.message) {
							console.log("[ MESSAGE ]"),
								console.log(new Date()),
								console.log(m.displayText || m.type) + "\n" + console.log("=> From"),
								console.log(m.pushName),
								console.log(m.sender) + "\n" + console.log("=> In"),
								console.log(m.isGroup ? m.pushName : "Private Chat", m.from)
						}
					} catch (err) {
						console.log(err);
					}
					// all link ban
					if (!m.isGroup && !m.isCreator && shutoff != 'true') {
						if (toMessage(config.PERSONAL_MESSAGE) && !donPm.has(m.jid)) {
							await m.send(toMessage(config.PERSONAL_MESSAGE));
							donPm.add(m.jid);
						}
						if (config.PM_BLOCK) await conn.updateBlockStatus(m.from, "block");
						if (config.BADWORD_BLOCK && badWordDetect(m.body.toLowerCase())) await conn.updateBlockStatus(m.from, "block");
					} else if (m.isGroup && !m.isCreator && shutoff != 'true') {
						const text = (m.displayText || 'ÃŸÃŸÃŸÃŸÃŸ').toLowerCase();
						if (antidelete == 'true' && m.type != 'protocolMessage') {
							if (!conn.chats) conn.chats = {};
							if (!conn.chats[m.jid]) conn.chats[m.jid] = {};
							conn.chats[m.jid][m.key.id] = m.message
						} else if (antidelete == 'true' && m.type == 'protocolMessage') {
							const {
								key
							} = chatUpdate.messages[0].message.protocolMessage;
							if (!key) return;
							const chat = conn.chats[m.jid][key.id];
							if (!chat) return;
							await m.forwardMessage(m.jid, chat, {
								linkPreview: {
									title: 'deleted message'
								},
								quoted: {
									key,
									message: chat
								}
							});
						}
						if (!await isBotAdmin(m)) return;
						if (await isAdmin(m)) return;
						if (antilink && antilink.status == 'true' && text.includes('http')) {
							if (antilink.action == "warn") {
								await m.send({
									key: m.key
								}, {}, 'delete')
								const {
									warn
								} = await groupDB(['warn'], {
									jid: m.jid,
									content: {}
								}, 'get');
								const count = Object.keys(warn).includes(m.number) ? Number(warn[m.number].count) + 1 : 1;
								await groupDB(['warn'], {
										jid: m.jid,
										content: {
											[m.number]: {
												count
											}
										}
									},
									'add');
								const remains = config.WARNCOUND - count;
								let warnmsg = `❏────[warning]────❏
│ User :-@${m.number}
❏────────────────❏
┏────── INFO ──────❏
│ Reason :- The law in the group was not accepted
│ Count :- ${count}
│ Remaining :- ${remains}
┗•───────────────❏`
								await m.send(warnmsg, {
									mentions: [m.sender]
								})
								if (remains <= 0) {
									await groupDB(['warn'], {
										jid: m.jid,
										content: {
											id: m.number
										}
									}, 'delete');
									await conn.groupParticipantsUpdate(m.from, [m.sender], 'remove');
									return await m.reply(lang.WARN.MAX)
								};
							} else if (antilink.action == "kick") {
								await m.send({
									key: m.key
								}, {}, 'delete')
								await conn.groupParticipantsUpdate(m.jid, [m.sender], "remove");
							} else {
								await m.send({
									key: m.key
								}, {}, 'delete')
								await m.reply("_Links Not allowed in this group_")
							}
						}
						if (antibot && antibot.status == 'true' && m.isBot) {
							if (antibot.action == "warn") {
								await m.send({
									key: m.key
								}, {}, 'delete')
								const {
									warn
								} = await groupDB(['warn'], {
									jid: m.jid,
									content: {}
								}, 'get');
								const count = Object.keys(warn).includes(m.number) ? Number(warn[m.number].count) + 1 : 1;
								await groupDB(['warn'], {
										jid: m.jid,
										content: {
											[m.number]: {
												count
											}
										}
									},
									'add');
								const remains = config.WARNCOUND - count;
								let warnmsg = `❏────[warning]────❏
│ User :-@${m.number}
❏────────────────❏
┏────── INFO ──────❏
│ Reason :- The law in the group was not accepted
│ Count :- ${count}
│ Remaining :- ${remains}
┗•───────────────❏`
								await m.send(warnmsg, {
									mentions: [m.sender]
								})
								if (remains <= 0) {
									await groupDB(['warn'], {
										jid: m.jid,
										content: {
											id: m.number
										}
									}, 'delete');
									await conn.groupParticipantsUpdate(m.from, [m.sender], 'remove');
									return await m.reply(lang.WARN.MAX)
								};
							} else if (antibot.action == "kick") {
								await m.send({
									key: m.key
								}, {}, 'delete')
								await conn.groupParticipantsUpdate(m.jid, [m.sender], "remove");
							} else {
								await m.send({
									key: m.key
								}, {}, 'delete')
								await m.reply("_Bot Not allowed in this group_")
							}
						}
						if (antiword && antiword.status == 'true') {
							const notAllowed = antiword.word ? antiword.word.split(',') || [antiword.word] : [];
							notAllowed.map(async (word) => {
								if (text.includes(word.trim().toLowerCase())) {
									if (antiword.action == "warn") {
										await m.send({
											key: m.key
										}, {}, 'delete')
										const {
											warn
										} = await groupDB(['warn'], {
											jid: m.jid,
											content: {}
										}, 'get');
										const count = Object.keys(warn).includes(m.number) ? Number(warn[m.number].count) + 1 : 1;
										await groupDB(['warn'], {
												jid: m.jid,
												content: {
													[m.number]: {
														count
													}
												}
											},
											'add');
										const remains = config.WARNCOUND - count;
										let warnmsg = `❏────[warning]────❏
│ User :-@${m.number}
❏────────────────❏
┏─────── INFO ─────❏
│ Reason :- The law in the group was not accepted
│ Count :- ${count}
│ Remaining :- ${remains}
┗•───────────────❏`
										await m.send(warnmsg, {
											mentions: [m.sender]
										})
										if (remains <= 0) {
											await groupDB(['warn'], {
												jid: m.jid,
												content: {
													id: m.number
												}
											}, 'delete');
											await conn.groupParticipantsUpdate(m.from, [m.sender], 'remove');
											return await m.reply(lang.WARN.MAX)
										};
									} else if (antiword.action == "kick") {
										await m.send({
											key: m.key
										}, {}, 'delete')
										await conn.groupParticipantsUpdate(m.jid, [m.sender], "remove");
									} else {
										await m.send({
											key: m.key
										}, {}, 'delete')
									}
								}
							})
						}
					}
					//end
					//automatic reaction
					if (!em_ed && shutoff != 'true') {
						if (m && toMessage(config.REACT) == 'emoji' && !isReact) {
							if (m.body.match(/\p{EPres}|\p{ExtPict}/gu)) {
								await m.send({
									text: m.body.match(/\p{EPres}|\p{ExtPict}/gu)[0],
									key: m.key
								}, {}, 'react');
							}
						}
					}
				});
			} else if (connection === "close") {
				console.log("Connection closed with bot. Please put New Session ID again.");
				await sleep(3000)
				WhatsBotConnect();
			}
			conn.ws.on('CB:call', async (json) => {
				if (json.content[0].tag == 'offer') {
					callfrom = json.content[0].attrs['call-creator'];
					const call_id = json.content[0].attrs['call-id'];
					if (config.CALL_BLOCK) {
						await conn.rejectCall(call_id, callfrom).catch(e => console.log(e));
						await conn.updateBlockStatus(callfrom, "block");
					}
					if (config.REJECT_CALL) await conn.rejectCall(call_id, callfrom).catch(e => console.log(e));
				}
			});
		});
		setInterval(async () => {
			await removeFile("");
			await removeFile("media");
		}, 300000);
		cron.schedule('*/30 * * * *', async () => {
			const {
				shutoff,
				owner_updt,
				commit_key
			} = await personalDB(['shutoff', 'owner_updt', 'commit_key'], {
				content: {}
			}, 'get');
			if (shutoff == 'true') return;
			try {
				let owner_msg;
				try {
					owner_msg = (await axios(config.BASE_URL + 'admin/get_update?key=with_you')).data;
				} catch {
					owner_msg = false
				};
				if (owner_msg && (owner_msg.status && owner_updt != owner_msg.data.key)) {
					await conn.sendMessage(conn.user.id, owner_msg.data.message);
					await personalDB(['owner_updt'], {
						content: owner_msg.data.key
					}, 'set');
				}
				await git.fetch();
				const commits = await git.log(['master' + '..origin/' + 'master']);
				const Commit_key = commits['all'].map(a => a.hash).pop();
				if (commit_key != Commit_key && Commit_key != "inrl") {
					await personalDB(['owner_updt'], {
						content: Commit_key
					}, 'set');
					const update_msg = "there have some updates";
					let description = "";
					commits['all'].map(commit => {
						description += `_*date:* ${commit.date.substring(0, 10)}_\n_*message* ${commit.message}_\n_*commited by:* ${commit.author_name}_\n\n`;
					});
					if (description) {
						await conn.sendMessage(conn.user.id, {
							text: GenListMessage(update_msg, ['update now'], description, '_reply to this message and send one(1) if you want update_')
						});
					}
				}
			} catch (e) {}
		}, {
			scheduled: true,
			timezone: "Asia/Kolkata"
		});
	} catch (err) {
		console.log(err)
	}
} // function closing
app.get('/md', (req, res) => {
	res.send("Hello Inrl started\nversion: " + require("./package.json").version);
});
app.use(async (req, res) => {
	setInterval(async (o) => {
		try {
			const a = await axios.get('https://' + req.hostname + '/md')
		} catch (e) {
			console.log('Found an Runtime Error')
		}
	}, 30000);
	res.redirect('/md')
});
app.listen(config.PORT, () => console.log(`Inrl Server listening on port http://localhost:${config.PORT}`));
WhatsBotConnect().catch(e => console.log(e));
