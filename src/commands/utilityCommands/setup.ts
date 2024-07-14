import {Command, container} from '@sapphire/framework';
import { InteractionResponse } from 'discord.js';
import { initialPlayer } from '../../lib/initials';
import { Player } from '../../lib/bot.types';


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

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        return this.setup(interaction);
    }

    private async setup(message: Command.ChatInputCommandInteraction) {
        const user = message.user;
		const userObj: Player = initialPlayer;
		return message.reply({
				embeds: [
						{
							title: 'Terms of Use and Privacy Policy',
							color: 0,
							description:
								'By using this bot, you agree to our Terms of Service and Privacy Policy, which has not been fully drafted yet. Additionally, you agree to the following:\n\n1. You are at least the age of 18 or the age of consent in your country **if it is higher than 18**.\n2. By using this bot you understand that things viewed as NSFW may occur during usage.\n3. You will not use this bot for any illegal activities.\n4. You will not use this bot to harass or harm others.\n5. You understand that this is a trial period and any data accrued during this test run will be deleted.\n\nPlease note that if these terms are not followed, you may be banned from using this bot and possibly reported to Discord.\n\nDo you agree to these terms?',
							footer: {
								text: `Setup for ${user.tag} | This message will expire in 5 minutes.`
							}
						}
					],
					components: [
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
					],
					ephemeral: true
				}
					
			)
			.then(async (msg: InteractionResponse) => {
				const collector = msg.createMessageComponentCollector({
					filter: (interaction) => interaction.user.id === user.id,
					time: 300000
				});
				collector.on('collect', async (interaction) => {
					if (interaction.customId === 'accept') {
						// Fill in the user object with the user's ID
						userObj.userId = user.id;
                        const userExists = await container.users.find({userId: userObj.userId});
						if (userExists) {
							await interaction.reply({content: 'You have already accepted the terms. You can now use the bot. You can review the terms at any time by running `/policy`.\nHappy Transforming!', ephemeral: true});
							collector.stop();
							return
						}
						await container.users.insertOne(userObj)
						await interaction.reply({content: 'You have accepted the terms. You can now use the bot. You can review the terms at any time by running `/policy`.\nHappy Transforming!', ephemeral: true});
						container.deckBusinessLogic.CreateBaseDeck(userObj.userId);
						collector.stop();
						return;
					} else {
						await interaction.reply({content: 'You have declined the terms. You will not be able to use the bot until you accept the terms. If you would like to accept the terms, please run the command again.', ephemeral: true});
						collector.stop();
						return;
					}
				});
				collector.on('end', async (_collected, reason) => {
					if (reason === 'time') {
						await message.followUp({content: 'You took too long to respond. Please run the command again to accept the terms.', ephemeral: true});
					}
				});
			});
    }
}
