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
        if (!Object.keys(player.guilds).includes(guildId)) {
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

    async addInventoryItem(player: Player, guildId: string, item: string, amount: number = 1) {
        if (!this.validateRequest(player, guildId, item)) {
            return false
        }
        let inventory;
        try {
         inventory = await this.getInventory(player, guildId)
        } catch (e) {
            await this.initializeInventory(player, guildId)
            inventory = await this.getInventory(player, guildId)
        }

        if (!Object.keys(inventory).includes(item)) {
            inventory[item] = amount
        } else {
            inventory[item] += amount
        }
        const final = { ...player.guilds, [guildId]: { ...player.guilds[guildId], inventory } }
        await container.users.updateOne({ userId: player.userId }, { $set: { guilds: final } })
        return true
    }

    async removeInventoryItem(player: Player, guildId: string, item: string, amount: number = 1) {
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
            inventory[item] -= amount;
        }
        const final = { ...player.guilds, [guildId]: { ...player.guilds[guildId], inventory } }
        await container.users.updateOne({ userId: player.userId }, { $set: { guilds: final } })
        return true
    }
    
    async initializeInventory(player: Player, guildId: string) {
        const newPlayer = await container.users.findOne({ userId: player.userId }) as unknown as Player
        const guilds = newPlayer.guilds
        guilds[guildId] = initialGuildInfo
        await container.users.updateOne({ userId: player.userId}, { $set:  { guilds } })
    }

    async useItem(player: Player, guildId: string, item: string, game: Game, target?: string) {
        if (!this.validateRequest(player, guildId, item)) {
            return [false, 'ITEM_NOT_FOUND', game]
        }
        console.log(player, guildId, item)
        const inventory = await this.getInventory(player, guildId)
        console.log(inventory)
        if (!Object.keys(inventory).includes(item)) {
            return [false, 'ITEM_NOT_IN_INV', game]
        }
        if (inventory[item] < 1) {
            return [false, 'NOT_ENOUGH_ITEM', game]
        }
        
        // @ts-ignore TODO: Add multiple types of items to execute in sequence
        const functionType = this.functions[items[item].types[0]]
        console.log(functionType, item, items[item])
        if (!functionType) {
            return [false, 'TYPE_ERROR', game]
        }
        const result = await functionType(player, game, target)
        console.log(result, result[2].players[player.userId])
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
        game.players[player.userId].shieldActive = true
        return [true, 'SHIELD_USED', game]
    }
    // TODO: Implement reverse

    async reverseType(_player: Player, game: Game, _target: string) {
        return [false, 'UNABLE', game]
    }

    async stealType(player: Player, game: Game, target: string) {
        if (player.userId === target) {
            return [false, 'STEAL_SELF', game]
        }
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