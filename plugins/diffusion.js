const {
	inrl,
	mode,
	config,
	getBuffer,
} = require('../lib');


inrl({
	pattern: 'diffusion ?(.*)',
	type: "eva",
	desc: "stable diffusion ai",
	fromMe: mode
}, async (message, match) => {
	match = match || message.reply_message.text;
	if (!match) return await message.send("*please give me an query!*");
	const res = await getBuffer(`${config.BASE_URL}api/ai/diffusion?text=${match}&apikey=${config.INRL_KEY}`);
	return await message.send(res, {},'image');
});
