import { container } from '@sapphire/framework';
import { initialGuildInfo } from '../lib/initials';
import { Player } from '../lib/bot.types';

export async function makeInv() {
	return initialGuildInfo;
}

export async function recieveItem(playerId: string, item: string, guildId: string, goldCost?: number) {
    const user = (await container.users.findOne({ userId: playerId })) as unknown as Player;
    const result = user.guilds[guildId];
    if (!Object.keys(result.inventory).includes(item)) {
        return [false, 'ITEM_NOT_FOUND'];
    }
    if (typeof goldCost !== 'undefined') {
        // if the item is a shop transaction
        if (result.gold < goldCost) {
            return [false, 'GOLD_NOT_ENOUGH'];
        } else {
            result.gold -= goldCost;
        }
    }
    // @ts-ignore
    result.inventory[item] += 1;
    const final = { ...user.guilds, [guildId]: result };
    await container.users.updateOne({ userId: playerId }, { $set: { guilds: final } });
    return [true, null];
}

export async function addGold(playerId: string, amount: number, guildId: string) {
	const result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    if (!Object.keys(result.guilds).includes(guildId)) {
        return false;
    }
    const guild = result.guilds[guildId];
    guild.gold += amount;
    const final = { ...result.guilds, [guildId]: guild };
    await container.users.updateOne({ userId: playerId }, { $set: { guilds: final } });
    return true;
}

export async function showInventory(playerId: string, guildId: string) {
	const result = await container.users.findOne({ userId: playerId }) as unknown as Player;
    console.log(result.guilds)
    if (!Object.keys(result.guilds).includes(guildId)) {
        return [false, {}]
    }
    console.log(result.guilds[guildId].inventory)
    return [true, result.guilds[guildId].inventory];
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
