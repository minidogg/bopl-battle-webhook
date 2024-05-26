(async()=>{
    async function post(url,json){
        await fetch(url, {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            //make sure to serialize your JSON body
            body: JSON.stringify(json)
        })
    }
    const fs = require("fs")
    if(!fs.existsSync("./webhooks.json"))fs.writeFileSync("./webhooks.json","[]")
    if(!fs.existsSync("./lastLink.txt"))fs.writeFileSync("./lastLink.txt","")
	let latestLink = fs.readFileSync("./lastLink.txt")
    // let latestLink = " "
	var webhooks = require("./webhooks.json")
    const checkForMods = async()=>{
        let regex = /"(https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/.+?)"/g
            let data = await (await fetch("https://thunderstore.io/c/bopl-battle/?ordering=newest")).text()
            data = data.replaceAll("https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/","")
            let modLink = regex.exec(data)[1]
            if(modLink!=latestLink){
                console.log("New mod was released! Epoch time: "+Date.now())
                let imgRegex = /"(https:\/\/gcdn\.thunderstore\.io\/live\/repository\/icons\/.*?)"/g
                let linkStuffs = /https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/(.+)\/(.+)\//.exec(modLink)
                let author = linkStuffs[1]
                let name = linkStuffs[2]
                data = data.replaceAll("https://gcdn.thunderstore.io/live/repository/icons/BepInEx-BepInExPack-5.4.2100.png.256x256_q95_crop.png","")
                let img = imgRegex.exec(data)[1]
                webhooks.forEach(async (webhook)=>{
                    
                    await post(webhook,{
                        "embeds": [{
                            "description": `# [${name}](${modLink})  \nTeam: [${author}](https://thunderstore.io/c/bopl-battle/p/${author})`,
                            "image": {
                                "url": img
                            }
                        }]
                    })
                    await post(webhook,{
                        "content":"<@&1175405777767387208> <@&1175405646993166346>"
                    })
        
                })
            }
            latestLink = modLink
            fs.writeFileSync("./lastLink.txt",latestLink)
    }
    checkForMods()
	setInterval(checkForMods,60000)
})()
