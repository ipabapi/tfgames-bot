import { container } from "@sapphire/framework"
import { Player, Game } from "../lib/bot.types"
import { initialGuildInfo } from "../lib/initials"
import { items } from "../lib/items"

export class InventoryManager {
    constructor() {
        
    }
    functions = {
            'shield': this.shieldType,
            'reverse': this.reverseType,
            'steal': this.stealType,
            'extraTurn': this.extraTurnType,
            'cleanse': this.cleanseType
        }
    // This class will contain the functions for managing the player's inventory
    // Including adding, removing, and using items

    async validateRequest(player: Player, guildId: string, item: string) {
        // This function will validate the request to make sure the player has an inventory and the item exists
        // If the item does not exist, return false
        // If the player does not have an inventory, do initializeInventory and return true
        // otherwise return true
        const inventory = player.guilds[guildId].inventory
        if (Object.keys(inventory).length === 0) {
            await this.initializeInventory(player, guildId)
            return true
        }
        if (!Object.keys(items).includes(item)) {
            return false
        }
        return true
    }   

    async getInventory(player: Player, guildId: string) {
        const newPlayer = await container.users.findOne({ userId: player.userId }) as unknown as Player
        return newPlayer.guilds[guildId].inventory
    }

    async addInventoryItem(player: Player, guildId: string, item: string) {
        if (!this.validateRequest(player, guildId, item)) {
            return false
        }
        const inventory = await this.getInventory(player, guildId)
        if (!Object.keys(inventory).includes(item)) {
            inventory[item] = 1
        } else {
            inventory[item] += 1
        }
        const final = { ...player.guilds, [guildId]: { ...player.guilds[guildId], inventory } }
        await container.users.updateOne({ userId: player.userId }, { $set: { guilds: final } })
        return true
    }

    async removeInventoryItem(player: Player, guildId: string, item: string) {
        if (!this.validateRequest(player, guildId, item)) {
            return false
        }
        const inventory = await this.getInventory(player, guildId)
        if (!Object.keys(inventory).includes(item)) {
            return false
        }
        if (inventory[item] === 1) {
            delete inventory[item]
        } else {
            inventory[item] -= 1
        }
        const final = { ...player.guilds, [guildId]: { ...player.guilds[guildId], inventory } }
        await container.users.updateOne({ userId: player.userId }, { $set: { guilds: final } })
        return true
    }
    
    async initializeInventory(player: Player, guildId: string) {
        await container.users.updateOne({ userId: player.userId}, { $set: { guilds: { [guildId]:  initialGuildInfo } } });
    }

    async useItem(player: Player, guildId: string, item: string, game: Game) {
        if (!this.validateRequest(player, guildId, item)) {
            return [false, 'ITEM_NOT_FOUND', game]
        }
        const inventory = await this.getInventory(player, guildId)
        if (!Object.keys(inventory).includes(item)) {
            return [false, 'ITEM_NOT_IN_INV', game]
        }
        if (inventory[item] < 1) {
            return [false, 'NOT_ENOUGH_ITEM', game]
        }
        
        // @ts-ignore
        const result = this.functions[items[item].type](player, guildId, game)
        if (result === undefined) {
            return [false, 'TYPE_ERROR', game]
        }
        if (!result[0]) {
            return result
        }
        inventory[item] -= 1
        const final = { ...player.guilds, [guildId]: { ...player.guilds[guildId], inventory } }
        await container.users.updateOne({ userId: player.userId }, { $set: { guilds: final } })
        return [true, null, game]
    }

    async shieldType(player: Player, game: Game, _target: string) {
        if (game.players[player.userId].shieldActive) {
            return [false, 'SHIELD_ACTIVE', game]
        }
        return [true, 'SHIELD_USED', game]
    }
    // TODO: Implement reverse

    async reverseType(_player: Player, game: Game, _target: string) {
        return [true, 'REVERSE_USED', game]
    }

    async stealType(player: Player, game: Game, target: string) {
        if (!game.state.stealsActive[target]) {
            game.state.stealsActive[target] = player.userId
            return [true, 'STEAL_USED', game]
        } 
        return [false, 'STEAL_ACTIVE', game]
    }

    async extraTurnType(_player: Player, game: Game, _target: string) {
        if (!game.state.extraTurnUsed) {
            game.state.extraTurn = true
            return [true, 'EXTRA_TURN_USED', game]
        }
        return [false, 'EXTRA_TURN_ACTIVE', game]
    }
    // TODO: Implement cleanse
    async cleanseType(_player: Player, game: Game, _target: string) {
        return [true, 'CLEANSED', game]
    }
}