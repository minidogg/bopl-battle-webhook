(async () => {
    const sleep = ms=>new Promise(r=>setTimeout(r, ms))
    const debugMode = false;
    // Some config so if someone wants to fork this they can easily get it setup for a different community
    const checkDelay = 60 * 1000;
    const community = 'bopl-battle';
    const maxMods = 8;

    // Requires
    const fs = require("fs");
    const fetch = require("node-fetch");

    // Create needed files
    if (!fs.existsSync("./webhooks.json")) fs.writeFileSync("./webhooks.json", "[]");
    if (!fs.existsSync("./lastLink.json")) fs.writeFileSync("./lastLink.json", "[]");

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


    // Gets the last links
    let latestLinks = JSON.parse(fs.readFileSync("./lastLink.json"));

    // Get the webhooks
    var webhooks = require("./webhooks.json");

    //Mod Type
    class Mod{
        constructor(){
            this.link = "";
            this.name = "";
            this.imageLink = "";
            this.description = "";
            this.author = "";
        }
    }

//Get mod links
    async function GetModLinks(){
        const blacklist = [
            `https://thunderstore.io/c/${community}/p/ebkr/r2modman/`,
            `https://thunderstore.io/c/${community}/p/BepInEx/BepInExPack/`
        ]

        let html = (await (await fetch(`https://thunderstore.io/c/${community}/`)).text())
        blacklist.forEach(unwantedLink=>{
            html = html.replaceAll(unwantedLink, "")
        })    

        let modLinks = []
        let linkRegexString = `"(https:\/\/thunderstore\.io\/c\/${community}\/p\/.*?\/.*\/)"`
        let linkRegex = new RegExp(linkRegexString)
        while(new RegExp(linkRegexString).test(html)){
            let newModLink = linkRegex.exec(html)[1]
            modLinks.push(newModLink)
            html = html.replace(new RegExp(linkRegexString), "")
        }
        if(debugMode==true)console.log("Mod Links", modLinks)
        return modLinks
    }

    async function GetModFromLink(link){
        let html = await (await fetch(link)).text()

        let description = /<meta property="og:description" content="([\s\S]*?)" \/>/.exec(html)[1]

        /*** @type {Mod} */
        let mod = {
            link,
            name: /<meta property="og:title" content="([\s\S]*?)" \/>/.exec(html)[1],
            imageLink: /<meta property="og:image" content="([\s\S]*?)" \/>/.exec(html)[1],
            description,
            author: /https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/([\s\S]*?)\//.exec(link)[1]
        }

        return mod;
    }


    // Function that checks to see if a new mod was released
    const checkForMods = async function(){
        let links = await GetModLinks()
        /*** @type {Array<Mod>} */
        let mods = []
        let i = 0;
        for(let link of links){
            if(i>=maxMods)break;
            sleep(40)
            mods.push(await GetModFromLink(link))
            i++
        }

        if(JSON.stringify(latestLinks)!="[]"){
            for(let i = 0;i<mods.length;i++){
                if(JSON.stringify(latestLinks[i])!=JSON.stringify(mods[i])){
                    let mod = mods[i]
                    webhooks.forEach(async (webhook) => {
                        await post(webhook, {
                            "content": "New Mod/Update <@&1175405777767387208> <@&1175405646993166346>",
                            "embeds": [{
                                "title": mod.name,
                                "description": `Team: [${mod.author}](https://thunderstore.io/c/bopl-battle/p/${mod.author})\n\n${mod.description}\n \n **Download it here:** \n ${mod.link}`,
                                "url": mod.link,
                                "thumbnail": {
                                    "url": mod.imageLink
                                }
                            }]
                        });
                    });
                    await sleep(20)
                }
            }
        }


        latestLinks = mods;
        fs.writeFileSync("./lastLink.json", JSON.stringify(latestLinks), 'utf-8')
    }

    // Does an initial check
    checkForMods();

    // Starts the loop
    setInterval(checkForMods, checkDelay);
})();
