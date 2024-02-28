const { inrl, GPT, mode, config,getJson} = require('../lib/');
inrl({
    pattern: "gpt",
    desc: 'get open ai chatgpt response',
    type: "eva",
    fromMe: mode
}, async (message, match) => {
    if(match && match == 'clear') {
        await GPT.clear();
        return await message.send('_successfully cleard_');
    }
    match = match || message.reply_message.text;
        if (!match) return await message.reply('_please can you provide me a task_');
        if(!config.OPEN_AI) {
            const res = await getJson(`${config.BASE_URL}api/ai/chatgpt?text=${match}&apikey=${config.INRL_KEY}`);
            if (!res.status) return await message.send(`Please enter a new apikey, as the given apikey limit has been exceeded. Visit ${config.BASE_URL}api/signup for gettig a new apikey. setvar inrl_key: your apikey`);
            return await message.send(res.result);
        } 
        return await message.send(await GPT.prompt(match));
});
