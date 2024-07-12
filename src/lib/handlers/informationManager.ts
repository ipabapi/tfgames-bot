import { container } from "@sapphire/framework";
import { Game, Player } from "../bot.types";

export async function userData(channelId: string, userId: string) {
        return {
            game: await container.game.findOne({ channel: channelId}) as unknown as Game,
            player: await container.users.findOne({userId: userId}) as unknown as Player
        }
    }