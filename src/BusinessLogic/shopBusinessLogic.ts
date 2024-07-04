import {container} from "@sapphire/framework";
export async function recieveItem(playerId: string, item: string) {

    let result = await container.inventory.find({playerId: playerId}).toArray();
    if (result.length == 0) {
        const dict: { [key: string]: number } = {};
        dict[item] = 1
        await container.inventory.insertOne({playerId: playerId, item: dict, gold:0});
    } else {
        const dict: { [key: string]: number } = result[0].item;
        console.log(dict);
        if (Object.keys(dict).includes(item)){
            dict[item] = dict[item] + 1;
        } else{
            dict[item] = 1;
        }
        console.log(dict);
        await container.inventory.updateOne({playerId:playerId},{$set:{playerId: playerId, item: dict, gold: result[0].gold}});
    }
}

export async function addGold(playerId: string, amount: number) {

    let result = await container.inventory.find({playerId: playerId}).toArray();
    if (result.length == 0) {
        const dict: { [key: string]: number } = {};
        await container.inventory.insertOne({playerId: playerId, item: dict, gold:amount});
    } else {
        const dict: { [key: string]: number } = result[0].item;
        await container.inventory.updateOne({playerId: playerId},{$set: {playerId: playerId, item: dict, gold: result[0].gold+=amount}});
    }
}

    export async function showInventory(playerId: string){
        let result = await container.inventory.find({playerId: playerId}).toArray();
        if (result.length == 0){
            return "Its as empty as my soul..."
        }else{
        const dict = result[0].item;
        let keys = Object.keys(dict);
        let itemString = '';
        for (const item of keys){
            var card = await container.cards.find({stringID: item}).toArray()
            itemString += "- "+card[0].name +" - "+ dict[item]+"x\n"
        }
        itemString += 'Gold: '+ result[0].gold
        return itemString
        }
}