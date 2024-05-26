(async () => {
    // Some config so if someone wants to fork this they can easily get it setup for a different community
    const checkDelay = 30 * 1000;
    const thunderstoreCommunity = 'https://thunderstore.io/c/bopl-battle';

    // Requires
    const fs = require("fs");
    const fetch = require("node-fetch");

    // Create needed files
    if (!fs.existsSync("./webhooks.json")) fs.writeFileSync("./webhooks.json", "[]");
    if (!fs.existsSync("./lastLink.txt")) fs.writeFileSync("./lastLink.txt", "");

    // Helper function that makes it easier to post JSON to a URL
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

    // Gets the last link
    let latestLink = fs.readFileSync("./lastLink.txt");

    // Get the webhooks
    var webhooks = require("./webhooks.json");

    // Function that checks to see if a new mod was released
    const checkForMods = async () => {
        // Regex for getting mod link
        let regex = /"(https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/.+?)"/g;

        // Get the bopl battle thunderstore page's HTML
        let data = await (await fetch(thunderstoreCommunity + "/?ordering=newest")).text();

        // Remove BepInEx image and link (I'm probably going to have to add r2modman to this later)
        data = data.replaceAll("https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/", "");
        data = data.replaceAll("https://gcdn.thunderstore.io/live/repository/icons/BepInEx-BepInExPack-5.4.2100.png.256x256_q95_crop.png", "");

        // Finally we get the mod link
        let modLink = regex.exec(data)[1];
        if (modLink != latestLink) {
            console.log("New mod was released! Epoch time: " + Date.now()); // Logging just because

            // Regex for getting the image link and the mod team name and mod name
            let imgRegex = /"(https:\/\/gcdn\.thunderstore\.io\/live\/repository\/icons\/.*?)"/g;
            let linkStuffs = /https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/(.+)\/(.+)\//.exec(modLink);

            // Get the team and mod name from the linkStuffs array
            let author = linkStuffs[1];
            let name = linkStuffs[2];

            // Get the image link using the imgRegex
            let img = imgRegex.exec(data)[1];

            // Fetch the mod page so we can take some meta tag data
            let meta = await (await fetch(modLink)).text();

            // Get rid of new lines so the regex doesn't commit break
            meta = meta.replaceAll("\n", "&insertLineBreak;");

            // Finally get the description
            let reg1 = /<meta name="description" content="([.\s\S]*?)">/g;
            let description = reg1.exec(meta)[1].replaceAll("&quot;", '"').replaceAll("&insertLineBreak;", "\n");

            // Finally, post to the webhook
            webhooks.forEach(async (webhook) => {
                await post(webhook, {
                    "content": "New Mod <@&1175405777767387208> <@&1175405646993166346>",
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
        // Set the latestLink and then update the lastLink.txt file
        latestLink = modLink;
        fs.writeFileSync("./lastLink.txt", latestLink);
    };

    // Does an initial check
    checkForMods();

    // Starts the loop
    setInterval(checkForMods, checkDelay);
})();
