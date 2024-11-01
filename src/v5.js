// ? V5 Requires NO external dependencies besides node.js and a daemon for running the script.

// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

const fs = require("fs");
const path = require("path")

// TODO: Move this into a config.json file
const providedConfig = {
    thunderstore_url: "https://thunderstore.io",
    community_id: "bopl-battle",
    mod_queries: [
        ["ordering", "last-updated"],
        ["section", "mods"],
        ["q", ""],
    ],
    filteredOutModLinks: ["https://thunderstore.io/c/bopl-battle/p/ebkr/r2modman/", "https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/"],
    intervalTime: 60000,
    loopEnabled: true,
    IS_GOOGLE_SHEETS: false
}
if(typeof(IS_GOOGLE_SHEETS)!="undefined"){
    providedConfig.loopEnabled = false
    providedConfig.IS_GOOGLE_SHEETS = true
}

// Make sure the Webhooks file exists and then get the webhook links from it.
if (!fs.existsSync("./webhooks.json")) fs.writeFileSync("./webhooks.json", "[\n['webhook_url', 'ping roles. eg <@&ROLE_ID>']\n]");
let webhooks = JSON.parse(fs.readFileSync("./webhooks.json", "utf-8"));

// Variables related to storing links
const lastLinksPath = path.resolve("./lastLinks.v5.json")
let coldStart = !fs.existsSync(lastLinksPath)
if(coldStart==true)fs.writeFileSync(lastLinksPath, "[]", "utf-8")
let lastLinks = JSON.parse(fs.readFileSync(lastLinksPath, "utf-8"))

// Start the next iteration of the infinite loop.
function loop(){
    try{
    if(providedConfig.loopEnabled==false)return;
    setTimeout(scanThunderstore, providedConfig.intervalTime+Math.round(Math.random()*1000))
    }catch(err){
        console.error(err)
    }
}

// Function for updating last links
function updateLastLinks(modLinks){
    lastLinks = modLinks
    fs.writeFileSync(lastLinksPath, JSON.stringify(lastLinks), "utf-8")
}

// Function for getting the mod metadata from thunderstore.
async function getMetadata(link){
	let html = await (await fetch(link)).text()
	let metadata = {
		"title":/<meta property="og:title" content="([\s\S]*?)" \/>/.exec(html)[1],
		"image":/<meta property="og:image" content="(.*?)" \/>/.exec(html)[1],
		"description":/<meta property="og:description" content="([\s\S]*?)" \/>/.exec(html)[1],
		"author": /https:\/\/thunderstore\.io\/c\/.*?\/p\/(.*?)\/.*?\//.exec(html)[1]
	}
	return metadata
}

// The function that actually scans the thunderstore page
async function scanThunderstore(config = providedConfig){
    let pageHtml = await (await fetch(config.thunderstore_url+"/c/"+config.community_id+"?"+config.mod_queries)).text()
    // const dom = new JSDOM();
    // let modLinks = Array.from(dom.window.document.querySelectorAll(".col-6.col-md-4.col-lg-3.mb-2.p-1.d-flex.flex-column")).map(e=>e.querySelector("a").href)
    let modLinks = []
    let regex = new RegExp(`(${config.thunderstore_url}\/c\/${config.community_id}\/p\/.*?\/.*?\/)`, "gi");
    while(true){
        let link = regex.exec(pageHtml)
        if(link==null)break;
        modLinks.push(link[1])
    }
    modLinks = modLinks.filter(e=>!config.filteredOutModLinks.includes(e)).splice(0, 5)
    
    if(coldStart==true){
        updateLastLinks(modLinks)
        coldStart = false;
        loop()
        return;
    }

    let linkDifference = []
    // if(modLinks[0]!=lastLinks[0])linkDifference.push(modLinks[0])
    linkDifference = modLinks.filter(e=>!lastLinks.includes(e))

    await PostLinksToDiscord(linkDifference, config)

    updateLastLinks(modLinks)
    loop()
}

async function PostLinksToDiscord(linkDifference, config){
    for(let link of linkDifference){
        console.log(link)
        let metadata = await getMetadata(link)
        let webhookMessageData = JSON.stringify({ 
            "content": "New Mod/Update ROLES",
            "embeds": [{
                "title": metadata.title,
                "description": `Team: [${metadata.author}](${config.thunderstore_url}/c/${config.community_id}/p/${metadata.author})\n\n${metadata.description}\n \n **Download it here:** \n ${link}`,
                "url": link,
                "thumbnail": {
                    "url": metadata.image
                }
            }]
        })
        webhooks.forEach(async (webhook) => {
            await fetch(webhook[0], {
                method: "post",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: webhookMessageData.replace("ROLES", webhook[1])
            });
        });
    }
}

scanThunderstore()