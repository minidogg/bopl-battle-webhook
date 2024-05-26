(async () => {
    //some config so if someone wants to fork this they can easily get it setup for a different community
    const checkDelay = 30*1000
    const thunderstoreCommunity = 'https://thunderstore.io/c/bopl-battle'

    //requires
    const fs = require("fs")
    const fetch = require("node-fetch")

    //create needed files
    if (!fs.existsSync("./webhooks.json")) fs.writeFileSync("./webhooks.json", "[]")
    if (!fs.existsSync("./lastLink.txt")) fs.writeFileSync("./lastLink.txt", "")

    //helper function that makes it easier to post json to a url
    async function post(url, json) {
        await fetch(url, {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(json)
        })
    }

    //gets the last link
    let latestLink = fs.readFileSync("./lastLink.txt")

    //get the webhooks
    var webhooks = require("./webhooks.json")

    //function that checks to see if a new mod was released
    const checkForMods = async () => {
        //regex for getting mod link
        let regex = /"(https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/.+?)"/g

        //get the bopl battle thunderstore page's html
        let data = await (await fetch(thunderstoreCommunity+"/?ordering=newest")).text()

        //remove bepinex image and link (i'm probaly going to have to add r2modman to this later)
        data = data.replaceAll("https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/", "")
        data = data.replaceAll("https://gcdn.thunderstore.io/live/repository/icons/BepInEx-BepInExPack-5.4.2100.png.256x256_q95_crop.png", "")

        //finally we get the mod link
        let modLink = regex.exec(data)[1]
        if (modLink != latestLink) {
            console.log("New mod was released! Epoch time: " + Date.now()) //logging just because

            //regex for getting the image link and the mod team name and mod name
            let imgRegex = /"(https:\/\/gcdn\.thunderstore\.io\/live\/repository\/icons\/.*?)"/g
            let linkStuffs = /https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/(.+)\/(.+)\//.exec(modLink)

            //get the team and mod name from the linkStuffs array
            let author = linkStuffs[1]
            let name = linkStuffs[2]

            //get the image link using the imgRegex
            let img = imgRegex.exec(data)[1]

            //finally, post to the webhook
            webhooks.forEach(async (webhook) => {

                await post(webhook, {
                    "embeds": [{
                        "description": `# [${name}](${modLink})  \nTeam: [${author}](https://thunderstore.io/c/bopl-battle/p/${author})`,
                        "image": {
                            "url": img
                        }
                    }]
                })
                await post(webhook, {
                    "content": "New Mod <@&1175405777767387208> <@&1175405646993166346>"
                })

            })
        }
        //set the latestLink and then update the lastLink.txt file
        latestLink = modLink
        fs.writeFileSync("./lastLink.txt", latestLink)
    }
    //does an initial check
    checkForMods()

    //starts the loop
    setInterval(checkForMods, checkDelay)
})()