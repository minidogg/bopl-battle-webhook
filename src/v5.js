// ? V5 Requires NO external dependencies besides node.js and a daemon for running the script.

// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

const fs = require("fs")
const path = require("path")
const lastLinksPath = path.resolve("./lastLinks.v5.json")
let coldStart = !fs.existsSync(lastLinksPath)
if(coldStart==true)fs.writeFileSync(lastLinksPath, "[]")
let lastLinks = fs.readFileSync(lastLinksPath)

const thunderstore_url = "https://thunderstore.io"
const community_id = "bopl-battle"
const mod_queries = [
    // [key, value]
    ["ordering", "last-updated"],
    ["section", "mods"],
    ["q", ""],
].map(e=>e.join("=")).join("&")
const filteredOutModLinks = ["https://thunderstore.io/c/bopl-battle/p/ebkr/r2modman/", "https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/"]

async function scanThunderstore(){
    let pageHtml = await (await fetch(thunderstore_url+"/c/"+community_id+"?"+mod_queries)).text()
    // const dom = new JSDOM();
    // let modLinks = Array.from(dom.window.document.querySelectorAll(".col-6.col-md-4.col-lg-3.mb-2.p-1.d-flex.flex-column")).map(e=>e.querySelector("a").href)
    let modLinks = []
    let regex = new RegExp(`(${thunderstore_url}\/c\/${community_id}\/p\/.*?\/.*?\/)`, "gi");
    while(true){
        let link = regex.exec(pageHtml)
        if(link==null)break;
        modLinks.push(link[1])
    }
    modLinks = modLinks.filter(e=>!filteredOutModLinks.includes(e))

    modLinks[0]
}
scanThunderstore()