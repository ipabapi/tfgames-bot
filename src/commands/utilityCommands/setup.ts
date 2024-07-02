import {Command, container} from '@sapphire/framework';
import { Message } from 'discord.js';
import { initialPlayer } from '../../lib/initials';
import { Player } from '../../lib/bot.types';
import { MessageBuilder } from '@sapphire/discord.js-utilities';


export class SetupCommand extends Command {
    public constructor(context: Command.Context) {
        super(context, {
            name: 'setup',
            description: 'Setup the bot for your server.',
            enabled: true
        });
    }
	public override async registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
	}

	public override async messageRun(message: Message) {
		return this.setup(message);
	}

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        return this.setup(interaction);
    }

    //@ts-ignore
    private async setup(message: Message | Command.ChatInputCommandInteraction) {
        // get type of message
        const type: Boolean = message instanceof Message
        // @ts-ignore, TODO: Fix this
        const user = type ? message.author : message.user;
		const userObj: Player = initialPlayer;
		let successful = false;
		user
			.send(
				new MessageBuilder()
					.setEmbeds([
						{
							title: 'Terms of Use and Privacy Policy',
							color: 0,
							description:
								'By using this bot, you agree to our Terms of Service and Privacy Policy. You can view them [here](https://google.com). Additionally, you agree to the following:\n\n1. You are at least the age of 18 or the age of consent in your country **if it is higher than 18**.\n2. By using this bot you understand that things viewed as NSFW may occur during usage.\n3. You will not use this bot for any illegal activities.\n4. You will not use this bot to harass or harm others.\n\nPlease note that if these terms are not followed, you may be banned from using this bot and possibly reported to Discord.\n\nDo you agree to these terms?',
							footer: {
								text: `Setup for ${user.tag} | This message will expire in 5 minutes.`
							}
						}
					])
					.setComponents([
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									label: 'Accept',
									custom_id: 'accept'
								},
								{
									type: 2,
									style: 2,
									label: 'Decline',
									custom_id: 'decline'
								}
							]
						}
					])
			)
			.then(async (msg: Message) => {
				const collector = msg.createMessageComponentCollector({
					filter: (interaction) => interaction.user.id === user.id,
					time: 300000
				});
				collector.on('collect', async (interaction) => {
					if (interaction.customId === 'accept') {
						successful = true;
						// Fill in the user object with the user's ID
						userObj.userId = user.id;
                        this.container.mongoClient.db('test').collection('users').insertOne(userObj);
						await user.send('You have accepted the terms. You can now use the bot. You can review the terms at any time by running `/policy`.\nHappy Transforming!');
						container.deckBusinessLogic.CreateBaseDeck(userObj.userId);
						collector.stop();
					} else {
						await user.send('You have declined the terms. You will not be able to use the bot until you accept the terms. If you would like to accept the terms, please run the command again.')
						collector.stop();
					}
				});
				collector.on('end', async () => {
					if (!successful) {
						await user.send('You did not respond in time. Please run the command again to accept the terms.');
					}
				});
			});

        return await message.reply('Check your DMs!');
    }
}
