import { Subcommand } from '@sapphire/plugin-subcommands';
// import { container } from "@sapphire/framework";
import { ComponentType, Message, MessageCollector } from 'discord.js';
import { Character, CharacterMode } from '../lib/bot.types';
import { initialCharacter } from '../lib/initials';
import { MessageBuilder } from '@sapphire/discord.js-utilities';

const difficulties = {
	normal: CharacterMode.NORMAL,
	hard: CharacterMode.HARD,
	harder: CharacterMode.HARDER,
	veryhard: CharacterMode.VERYHARD,
	nightmare: CharacterMode.NIGHTMARE
};

export class CharacterCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options = {}) {
		super(context, {
			...options,
			name: 'character',
			aliases: ['char'],
			description: 'Get information about a character',
			subcommands: [
				{
					name: 'info',
					messageRun: 'info',
					chatInputRun: 'info',
					default: true
				},
				{
					name: 'edit',
					messageRun: 'edit',
					chatInputRun: 'edit'
				},
				{
					name: 'create',
					messageRun: 'create',
					chatInputRun: 'create'
				},
				{
					name: 'delete',
					messageRun: 'delete',
					chatInputRun: 'delete'
				},
				{
					name: 'list',
					messageRun: 'list',
					chatInputRun: 'list'
				},
				{
					name: 'help',
					messageRun: 'help',
					chatInputRun: 'help'
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((builder) =>
					builder
						.setName('info')
						.setDescription('Get information about a character')
						.addStringOption((option) => option.setName('name').setDescription('The name of the character').setRequired(true))
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription('The user to get the character from, if none is given, it defaults to the author.')
								.setRequired(false)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName('edit')
						.setDescription('Edit your character, or a collared character of yours.')
						.addStringOption((option) => option.setName('name').setDescription('The name of the character').setRequired(true))
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription('If you want to edit a collared character, you can specify the user here.')
								.setRequired(false)
						)
				)
				.addSubcommand((builder) =>
					builder
						.setName('create')
						.setDescription('Create a character, this will start a DM conversation with you to fill out the character sheet!')
				)
				.addSubcommand((builder) =>
					builder
						.setName('delete')
						.setDescription('Delete a character')
						.addStringOption((option) => option.setName('name').setDescription('The name of the character').setRequired(true))
				)
				.addSubcommand((builder) =>
					builder
						.setName('list')
						.setDescription('List all characters')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription('The user to get the characters from, if none is given, it defaults to the author.')
								.setRequired(false)
						)
				)
		);
	}

	public async info(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.reply('info');
	}

	public async edit(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.reply('edit');
	}

	public async create(interaction: Subcommand.ChatInputCommandInteraction) {
		// Start by checking if the user is in our database
		// If not, prompt them to do setup

		const user = await this.container.mongoClient.db('test').collection('users').findOne({ userId: interaction.user.id });

		if (!user) {
			interaction.reply("I'm sorry, you need to set up your account first. Please use the /setup command.");
			return;
		}

		let successful = false;
		let character: Character = initialCharacter;
		interaction.user
			.send("Hello! Let's create a character! What is the name of your character?")
			.then(async (msg) => {
				let currentStep = 0;
				const collector = new MessageCollector(msg.channel, { filter: (m) => m.author.id == interaction.user.id, time: 60000 });
				collector.on('collect', async (message: Message) => {
					if (message.content.toLowerCase() === 'cancel') {
						message.channel.send('Character creation cancelled.');
						collector.stop();
						return;
					}
					switch (currentStep) {
						case 0:
							// Name
							character.name = message.content;
							// Check if the name is already taken for this user
							const checkName = await this.container.mongoClient
								.db('test')
								.collection('characters')
								.findOne({ name: message.content, creator: interaction.user.id });
							if (checkName) {
								message.channel.send("I'm sorry, you already have a character with that name. Please choose a different name.");
								return;
							}
							currentStep++;
							// console.log(name, currentStep, msg.author.id);
							message.channel.send(
								`Great! Your character's name is ${message.content}. What does your character look like? Please provide an image or URL. If you don't have one, simply type "none".`
							);
							break;
						case 1:
							// Avatar
							if (message.content.toLowerCase() === 'none') {
								currentStep++;
								message.channel.send("That's okay! We can always add one later. How would you describe your character?");
							} else {
								// Check if user provided an attachment
                                if (message.attachments.size > 0) {
                                    // @ts-ignore
                                    character.avatar = message.attachments.first().url;
                                } else {
                                    // Check if user provided a URL
                                    if (message.content.startsWith('http')) {
                                        character.avatar = message.content;
                                    } else {
                                        message.channel.send('I need an image or URL. Please try again.');
                                        return;
                                    }
                                }
								currentStep++;
								message.channel.send('Great! How would you describe your character?');
							}
							break;
						case 2:
							// Description
							character.description = message.content;
							currentStep++;
							message.channel
								.send(
									new MessageBuilder()
										.setEmbeds([
											{
												title: 'Difficulty Selection',
												description:
													'Okay, last step! Please select the difficulty you would like to play on.\n\n- **Normal**: Base mode, character can gain and store gold, as well as use items.\n- **Hard**: Character cannot gain or store gold, but can use items.\n- **Harder**: Character *CAN* gain and store gold, but cannot use items.\n- **Very Hard**: Character cannot gain or store gold, and cannot use items.\n**Nightmare**: Character cannot gain or store gold, cannot use items, and will rely on the bot to draw for them, as well as decide if they pass, reroll, or play.\n\nPlease select a difficulty.',
												color: 0x00ff00
											}
										])
										.setComponents([
											{
												type: 1,
												components: [
													{
														type: 3,
														customId: 'difficulty',
														options: [
															{
																label: 'Normal',
																value: 'normal'
															},
															{
																label: 'Hard',
																value: 'hard'
															},
															{
																label: 'Harder',
																value: 'harder'
															},
															{
																label: 'Very Hard',
																value: 'veryhard'
															},
															{
																label: 'Nightmare',
																value: 'nightmare'
															}
														]
													}
												]
											}
										])
								)
								.then((m) => {
									let success = false;
									const collector = m.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });
									collector.on('collect', async (i) => {
										//@ts-ignore
										character.mode = difficulties[i.values[0]];
										character.creator = interaction.user.id;
										success = true;
										const newCharaId = await this.container.mongoClient.db('test').collection('characters').insertOne(character);
										const successCheck = await this.container.mongoClient
											.db('test')
											.collection('users')
                                            // @ts-ignore
											.updateOne({ userId: interaction.user.id }, { $push: { characters: newCharaId.insertedId.toString() } });
										if (successCheck.modifiedCount === 1) {
											message.channel.send('Character creation complete! You can now use this character in games.');
										} else {
											message.channel.send('Character creation failed. Please try again.');
										}
										m.delete();

										collector.stop();
									});
									collector.on('end', () => {
										if (!success) {
											message.channel.send('Character creation timed out. Please try again.');
											collector.stop();
										}
									});
								});
							break;

						default:
							message.channel.send("I'm sorry, I didn't understand that. Please try again.");
							console.error('Invalid step reached in character creation.');
							successful = false;
							collector.stop();
							break;
					}
					if (currentStep > 2) {
						successful = true;
						collector.stop();
					}
				});

				collector.on('end', (collected) => {
					if (!successful) {
						msg.channel.send('Character creation timed out. Please try again.');
					}
					console.log(`Collected ${collected.size} messages. Successful: ${successful}.`);
				});
			})
			.catch((err) => {
				console.error(err);
				interaction.reply("I'm sorry, I couldn't send you a DM. Please make sure your DMs are open and try again.");
			});

		await interaction.reply({ content: "I've sent you a DM to start character creation!", ephemeral: true });
	}

	public async delete(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.reply('delete');
	}

	public async list(interaction: Subcommand.ChatInputCommandInteraction) {
		// Check if the user is in the database
		const user = await this.container.mongoClient.db('test').collection('users').findOne({ userId: interaction.user.id });
		if (!user) {
			interaction.reply({ content: "I'm sorry, you need to set up your account first. Please use the /setup command.", ephemeral: true });
			return;
		}

		const characters = await this.container.mongoClient.db('test').collection('characters').find({ creator: interaction.user.id }).toArray();
		if (characters.length === 0) {
			interaction.reply({ content: "You don't have any characters yet! Use /character create to make one.", ephemeral: true });
			return;
		}

		// Create embed containing list of character name and description
		const charList = characters.map((c) => {
			return {
				name: c.name,
				value: c.description
			};
		});

		interaction.reply({
			embeds: [
				{
					title: 'Your Characters',
					fields: charList,
					footer: {
						text: 'Use /character info <name> to get more information about a character.'
					}
				}
			]
		});
	}
}
