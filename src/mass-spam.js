(async () => {
    const checkDelay = 30 * 1000;
    const thunderstoreCommunity = 'https://thunderstore.io/c/bopl-battle/?ordering=newest&page=3';

    const fs = require("fs");
    const fetch = require("node-fetch");

    if (!fs.existsSync("./webhooks.json")) fs.writeFileSync("./webhooks.json", "[]");
    if (!fs.existsSync("./lastLinks.json")) fs.writeFileSync("./lastLinks.json", "[]");

    async function post(url, json) {
        await fetch(url, {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(json)
        });
    }

    let latestLinks = JSON.parse(fs.readFileSync("./lastLinks.json"));

    var webhooks = require("./webhooks.json");

    const checkForMods = async () => {
        let regex = /"(https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/.+?)"/g;
        let data = await (await fetch(thunderstoreCommunity)).text();

        data = data.replaceAll("https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/", "");
        data = data.replaceAll("https://gcdn.thunderstore.io/live/repository/icons/BepInEx-BepInExPack-5.4.2100.png.256x256_q95_crop.png", "");

        let modLinks = [];
        let match;
        while ((match = regex.exec(data)) !== null) {
            modLinks.push(match[1]);
        }

        let newMods = modLinks.filter(link => !latestLinks.includes(link));

        for (let modLink of newMods) {
            console.log("New mod was released! Epoch time: " + Date.now());

            let linkStuffs = /https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/(.+)\/(.+)\//.exec(modLink);
            let author = linkStuffs[1];
            let name = linkStuffs[2];

            let modPage = await (await fetch(modLink)).text();

            let imgRegex = /<meta property="og:image" content="(https:\/\/gcdn\.thunderstore\.io\/live\/repository\/icons\/.*?)"/g;
            let imgMatch = imgRegex.exec(modPage);
            let img = imgMatch ? imgMatch[1] : "";

            modPage = modPage.replaceAll("\n", "&insertLineBreak;");

            let reg1 = /<meta name="description" content="([.\s\S]*?)">/g;
            let description = reg1.exec(modPage)[1].replaceAll("&quot;", '"').replaceAll("&insertLineBreak;", "\n");
  
            webhooks.forEach(async (webhook) => {
                await post(webhook, {
                    "content": "New Mod", // <@&1175405777767387208> <@&1175405646993166346>
                    "embeds": [{
                        "title": name,
                        "description": `Team: [${author}](https://thunderstore.io/c/bopl-battle/p/${author})\n\n${description}\n \n **Download it here:** \n ${modLink}`,
                        "url": modLink,
                        "thumbnail": {
                            "url": img
                        }
                    }]
                });
            });
        }

        latestLinks = modLinks;
        fs.writeFileSync("./lastLinks.json", JSON.stringify(latestLinks));
    };

    checkForMods();
    setInterval(checkForMods, checkDelay);
})();
