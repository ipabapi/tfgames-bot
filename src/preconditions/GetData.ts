import { AllFlowsPrecondition } from "@sapphire/framework";
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js";
import { Game, Player } from "../lib/bot.types";

export class ApplyContextPrecondition extends AllFlowsPrecondition {
    public constructor(context: AllFlowsPrecondition.LoaderContext, options: AllFlowsPrecondition.Options) {
        super(context, {
            ...options,
            position: 20,
        })
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (interaction.commandName == 'ping') return this.ok();
        return await this.getData(interaction).then(() => {
            return this.ok()
        })
    }

    public override async messageRun(_message: Message) {
        
        return this.ok()
    }

    public override async contextMenuRun(_contextMenu: ContextMenuCommandInteraction) {
        return this.ok()
    }

    private async getData(interaction: ChatInputCommandInteraction) {
        return new Promise(async (resolve) => {
        let userDataObj = {
            game: {},
            player: {}
        } as {
            game: Game;
            player: Player;
        };;
        if (interaction.channel && interaction.user) {
            userDataObj.game = (await this.container.game.findOne({ channel: interaction.channel?.id })) as unknown as Game;
            userDataObj.player = (await this.container.users.findOne({ userId: interaction.user.id })) as unknown as Player;


            interaction.userData = userDataObj;
            resolve(void 0);
        }
        resolve(void 0);
    })
    }
}