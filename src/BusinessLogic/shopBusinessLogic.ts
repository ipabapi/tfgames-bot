import { container } from '@sapphire/framework';
import { initialGuildInfo } from '../lib/initials';
import { Player } from '../lib/bot.types';
import { items } from '../lib/items';

export async function makeInv() {
	return initialGuildInfo;
}

export async function recieveItem(playerId: string, item: string, guildId: string, shop: boolean) {
    const user = (await container.users.findOne({ userId: playerId })) as unknown as Player;
    if (!Object.keys(user.guilds).includes(guildId)) {
        await container.InventoryManager.initializeInventory(user, guildId);
    }
    // If goldCost is provided, check if the user has enough gold
    if (shop) {
        if (!Object.keys(items).includes(item)) {
            return [false, 'ITEM_NOT_FOUND'];
        }
        // @ts-ignore   
        if (user.guilds[guildId].gold < items[item].price) {
            return [false, 'GOLD_NOT_ENOUGH'];
        }
        // @ts-ignore
        user.guilds[guildId].gold -= items[item].price;
    }
    const result = container.InventoryManager.addInventoryItem(user, guildId, item);
    return [result, null];
}

export async function addGold(playerId: string, amount: number, guildId: string) {
	let result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    if (!Object.keys(result.guilds).includes(guildId)) {
       await container.InventoryManager.initializeInventory(result, guildId);
        result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    }
    const guild = result.guilds[guildId];
    guild.gold += amount;
    const final = { ...result.guilds, [guildId]: guild };
    console.log("uwu:",final[guildId].gold)
    await container.users.updateOne({ userId: playerId }, { $set: { guilds: final } });
    return true;
}

export async function removeGold(playerId: string, amount: number, guildId: string) {
    let result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    if (!Object.keys(result.guilds).includes(guildId)) {
        await container.InventoryManager.initializeInventory(result, guildId);
        result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    }
    const guild = result.guilds[guildId];
    guild.gold -= Math.abs(amount);
    const final = { ...result.guilds, [guildId]: guild };
    await container.users.updateOne({ userId: playerId }, { $set: { guilds: final } });
    return true;
}

export async function showInventory(playerId: string, guildId: string) {
	const result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    if (!Object.keys(result.guilds).includes(guildId)) {
        await container.InventoryManager.initializeInventory(result, guildId);
        return [{}, 0];
    }
    return [result.guilds[guildId].inventory, result.guilds[guildId].gold];
}

export async function useItem(playerId: string, item: string, guildId: string) {
	let result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    if (!Object.keys(result.guilds).includes(item)) {
        return [false, 'ITEM_NOT_FOUND'];
    }
    // @ts-ignore
    if (result.guilds[guildId].inventory[item] < 1) {
        return [false, 'NOT_ENOUGH_ITEM'];
    }

    // @ts-ignore
    result.guilds[guildId].inventory[item] -= 1;
    const final = { ...result.guilds, [guildId]: result.guilds[guildId] };
    await container.users.updateOne({ userId: playerId }, { $set: { guilds: final } });
    return [true, null];
}
