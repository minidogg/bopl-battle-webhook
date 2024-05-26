(async()=>{
    const fs = require("fs")
    if(!fs.existsSync("./webhooks.json"))fs.writeFileSync("./webhooks.json","[]")
    if(!fs.existsSync("./lastLink.txt"))fs.writeFileSync("./lastLink.txt","")
	let latestLink = fs.readFileSync("./lastLink.txt")
	var webhooks = require("./webhooks.json")
	setInterval(async()=>{
	let regex = /"(https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/.+)"/g
		let data = await (await fetch("https://thunderstore.io/c/bopl-battle/?ordering=newest")).text()
		data = data.replaceAll("https://thunderstore.io/c/bopl-battle/p/BepInEx/BepInExPack/","")
		let modLink = regex.exec(data)[1]
		if(modLink!=latestLink){
			console.log("New mod was released! Epoch time: "+Date.now())
			let linkStuffs = /https:\/\/thunderstore\.io\/c\/bopl-battle\/p\/(.+)\/(.+)\//.exec(modLink)
			let author = linkStuffs[1]
			let name = linkStuffs[2]
			webhooks.forEach(webhook=>{
				

			fetch(webhook, {
				method: "post",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},

				//make sure to serialize your JSON body
				body: JSON.stringify({
					"embeds": [{
						"title": "A new mod was released!",
						"description": `[Mod Name: ${name}\nAuthor: ${author}](${modLink})`
					}]
				})
			})

			})
		}
		latestLink = modLink
        fs.writeFileSync("./lastLink.txt",latestLink)
	},10000)
})()
