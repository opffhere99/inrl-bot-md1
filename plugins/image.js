const {
    inrl,
    lang,
    mode,
    badWordDetect,
    getJson,
    config
} = require('../lib');
const fs = require('fs');


inrl({
    pattern: "img",
    usage: 'send google image result for give text',
    react: "🖼",
    fromMe: mode,
    type: "search",
    desc : lang.IMG.IMG_DESC
}, async (message, match) => {
    if (!match) {
        return await message.send(lang.BASE.TEXT)
    }
    if(badWordDetect(match.toLowerCase()) && !message.isCreator) return await message.send(lang.BASE.NOT_AUTHR)
    let [text,number] = match.split(/[;,|]/)
    if(!text) text = match;
    if(!number) number = 1;
    if(number>3 && !message.isCreator) return await message.reply(lang.BASE.NOT_AUTHR);
    const data = await getJson(config.BASE_URL+'api/search/gis?text='+text+`&count=${number}&apikey=${config.INRL_KEY}`);
    const {result} = data;
    if(!data.status) return await message.send(`API key limit exceeded. Get a new API key at ${config.BASE_URL}api/signup. Set var inrl_key: your_api_key`);
    if(!result) return await message.send('_Not Found_');
    result.map(async(url)=>{
    return await message.sendReply(url,{caption:'*result for*: ```'+text+"```"},'image');
    });
});
