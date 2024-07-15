import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedType } from 'discord.js'
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
					chatInputRun: 'edit',
					preconditions: ['CompletedSetup', 'HasCharacter']
				},
				{
					name: 'create',
					messageRun: 'create',
					chatInputRun: 'create',
					preconditions: ['CompletedSetup']
				},
				{
					name: 'delete',
					messageRun: 'delete',
					chatInputRun: 'delete',
					preconditions: ['CompletedSetup', 'HasCharacter']
				},
				{
					name: 'list',
					messageRun: 'list',
					chatInputRun: 'list'
				},
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
				.addSubcommand((builder) =>
					builder
						.setName('experiment')
						.setDescription('Test the new modal system')
				)
		);
	}

	public async info(interaction: Subcommand.ChatInputCommandInteraction) {
		let user;
		if (interaction.options.getUser('user')) {
			user = await this.container
				.users
				// @ts-ignore
				.findOne({ userId: interaction.options.getUser('user').id });
			if (!user) {
				interaction.reply({ content: "I'm sorry, I couldn't find that user in the database.", ephemeral: true });
				return;
			}
		} else {
			user = await this.container.users.findOne({ userId: interaction.user.id });
			if (!user) {
				interaction.reply({ content: "I'm sorry, you need to set up your account first. Please use the /setup command.", ephemeral: true });
				return;
			}
		}

		const character = await this.container
			.characters
			.findOne({ name: interaction.options.getString('name'), creator: user.userId });
		if (!character) {
			interaction.reply({ content: "I'm sorry, I couldn't find a character with that name.", ephemeral: true });
			return;
		}
		const username = interaction.options.getUser('user')?.displayName || interaction.user.username;

		interaction.reply({
			embeds: [
				{
					title: character.name,
					type: EmbedType.Rich,
					description: character.description,
					image: {
						url: character.avatar
					},
					fields: [
						{
							name: 'Mode',
							value: character.mode
						},
						{
							name: 'Creator',
							value: username
						},
						{
							name: 'Mental Effects',
							value: character.mentalEffects.join(', ') || 'None'
						},
						{
							name: 'Physical Effects',
							value: character.physicalEffects.join(', ') || 'None'
						},
						{
							name: 'Mind Broken',
							value: character.mindBroken ? 'Yes' : 'No'
						},
						{
							name: 'Collared',
							value: character.collared ? `Yes, by ${character.collarer}` : 'No'
						}
					],
					footer: {
						text: `Created by ${username}. | Requested by ${interaction.user.username}`,
						icon_url: interaction.user.displayAvatarURL()
					}
				}
			]
		});
	}

	public async edit(interaction: Subcommand.ChatInputCommandInteraction) {
		// grab character from database
		const character = await this.container
			.characters
			.findOne({ name: interaction.options.getString('name'), creator: interaction.user.id });
		if (!character) {
			return interaction.reply({ content: "I'm sorry, I couldn't find a character with that name.", ephemeral: true });
		}

		return interaction.reply({ embeds: [
			{
				title: 'Character Editing',
				description: `Looks like you want to edit ${character.name}. Let's get started by clicking the button below. (This will open a Discord popup.)`,
				color: 0x00ff00
			}
		],
		components: [{
			type: 1,
			components: [
				{
				type: 2,
				style: 1,
				label: 'Edit Character',
				customId: `edit-character-${character._id.toString()}`,
				}
			]
		}],
		ephemeral: true
		});
		
	}

	public async delete(interaction: Subcommand.ChatInputCommandInteraction) {
		// Check if the user is in the database
		const user = await this.container.users.findOne({ userId: interaction.user.id });
		if (!user) {
			interaction.reply({ content: "I'm sorry, you need to set up your account first. Please use the /setup command.", ephemeral: true });
			return;
		}

		// check if the character exists
		const character = await this.container
            .characters
			.findOne({ name: interaction.options.getString('name'), creator: interaction.user.id });
		if (!character) {
			interaction.reply({ content: "I'm sorry, I couldn't find a character with that name.", ephemeral: true });
			return;
		} else {
			const result = await this.container
				.characters
				.deleteOne({ name: interaction.options.getString('name'), creator: interaction.user.id });
			if (result.deletedCount === 1) {
				const newCharaList = user.characters.filter((c: string) => c !== character._id.toString());
				await this.container
					.users
					.updateOne({ userId: interaction.user.id }, { $set: { characters: newCharaList } });
				interaction.reply({ content: 'Character deleted successfully!', ephemeral: true });
			} else {
				interaction.reply({ content: "I'm sorry, I couldn't delete that character. Please try again.", ephemeral: true });
			}
		}
	}

	public async list(interaction: Subcommand.ChatInputCommandInteraction) {
		// Check if the user is in the database
		let user;
		if (interaction.options.getUser('user')) {
			user = await this.container
				.users
				// @ts-ignore
				.findOne({ userId: interaction.options.getUser('user').id });
			if (!user) {
				interaction.reply({ content: "I'm sorry, I couldn't find that user in the database.", ephemeral: true });
				return;
			}
		} else {
			user = await this.container.users.findOne({ userId: interaction.user.id });
			if (!user) {
				interaction.reply({ content: "I'm sorry, you need to set up your account first. Please use the /setup command.", ephemeral: true });
				return;
			}
		}

		const characters = await this.container.characters.find({ creator: user.userId }).toArray();
		if (characters.length === 0) {
			interaction.reply({
				content: `${user.userId == interaction.user.id ? "You don't" : "This user doesn't"} have any characters yet! Use /character create to make one.`,
				ephemeral: true
			});
			return;
		}

		// Create embed containing list of character name and description
		const charList = characters.map((c) => {
			return {
				name: c.name,
				value: c.description
			};
		});
		// get user name if it's not the author
		const username = interaction.options.getUser('user')?.displayName || interaction.user.username;
		interaction.reply({
			embeds: [
				{
					title: `${username}\'s Characters`,
					fields: charList,
					footer: {
						text: 'Use /character info <name> to get more information about a character.'
					}
				}
			]
		});
	}

	public async create(interaction: Subcommand.ChatInputCommandInteraction) {
		return await interaction.reply({ embeds: [
            {
                title: 'Character Creation',
                description: 'Welcome to character creation! Make sure to have an **IMAGE URL** ready for your character. If you don\'t have one, you can always add one later. Let\'s get started by clicking the button below. (This will open a Discord popup.)',
                color: 0x00ff00
            }
        ],
        components: [{
            type: 1,
            components: [
                {
                type: 2,
                style: 1,
                label: 'Create Character',
                customId: 'create-character',
                }
            ]
        }],
        ephemeral: true
        })
	}
}
