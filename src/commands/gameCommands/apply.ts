import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import { Player, Game, GameStatus, CardType, Card } from '../../lib/bot.types';
import { MessageBuilder } from '@sapphire/discord.js-utilities';

// apply
// mentalEffect
// physicalEffect
// nameChange
// avatarChange
// descriptionChange
// bodySwap
export class Apply extends Subcommand {
	constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			name: 'apply',
			description: 'Apply command',
			subcommands: [
				{
					name: 'mentaleffect',
					messageRun: 'mentaleffect',
					chatInputRun: 'mentaleffect'
				},
				{
					name: 'physicaleffect',
					messageRun: 'physicaleffect',
					chatInputRun: 'physicaleffect'
				},
				{
					name: 'namechange',
					messageRun: 'namechange',
					chatInputRun: 'namechange'
				},
				{
					name: 'avatarchange',
					messageRun: 'avatarchange',
					chatInputRun: 'avatarchange'
				},
				{
					name: 'descriptionchange',
					messageRun: 'descriptionchange',
					chatInputRun: 'descriptionchange'
				},
				{
					name: 'bodyswap',
					messageRun: 'bodyswap',
					chatInputRun: 'bodyswap'
				}
			]
		});
	}

	public override async registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((command) =>
					command
						.setName('mentaleffect')
						.setDescription('Apply a mental effect to a character')
						.addUserOption((option) => option.setName('target').setDescription('The target of the mental effect').setRequired(true))
						.addStringOption((option) => option.setName('effect').setDescription('The effect to apply').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('physicaleffect')
						.setDescription('Apply a physical effect to a character')
						.addUserOption((option) => option.setName('target').setDescription('The target of the physical effect').setRequired(true))
						.addStringOption((option) => option.setName('effect').setDescription('The effect to apply').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('namechange')
						.setDescription('Change the name of a character')
						.addUserOption((option) => option.setName('target').setDescription('The target of the name change').setRequired(true))
                        .addStringOption((option) => option.setName('name').setDescription('The new name').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('avatarchange')
						.setDescription('Change the avatar of a character')
						.addUserOption((option) => option.setName('target').setDescription('The target of the avatar change').setRequired(true))
                        .addStringOption((option) => option.setName('avatar').setDescription('The new avatar').setRequired(true))
				)
				.addSubcommand((command) => command.setName('descriptionchange').setDescription('Change the description of a character')
                    .addUserOption((option) => option.setName('target').setDescription('The target of the description change').setRequired(true))
                    .addStringOption((option) => option.setName('description').setDescription('The new description').setRequired(true))
                )
				.addSubcommand((command) => command.setName('bodyswap').setDescription('Swap the body of a character with another character')
                    .addUserOption((option) => option.setName('target').setDescription('The target of the body swap').setRequired(true))
                    .addUserOption((option) => option.setName('swaptarget').setDescription('The target to swap with').setRequired(true))
                )

		);
	}

    public async verifyRequest(interaction: Subcommand.ChatInputCommandInteraction) {
        const player = await container.users.findOne({ userId: interaction.user.id }) as unknown as Player
        if (!player) {
            await interaction.reply({ content: 'You have not accepted our Privacy Policy and Terms of Service yet. Please use `/setup`.', ephemeral: true })
            return [false, null, null]
        }
        const game = await container.game.findOne({ channel: interaction.channel?.id }) as unknown as Game
        if (!game) {
            await interaction.reply({ content: 'This channel does not have a game associated with it', ephemeral: true })
            return [false, null, null]
        }
        // check if the player is in the game
        if (!Object.keys(game.players).includes(interaction.user.id)) {
            await interaction.reply({ content: 'You are not in the game associated with this channel', ephemeral: true })
            return [false, null, null]
        }
        if (game.state.status !== GameStatus.WAITING) {
            await interaction.reply({ content: 'We are not in a state to apply effects to a player', ephemeral: true })
            return [false, null, null]
        }
        if (game.state.failClaim != null) {
            if (game.state.currentPlayer?.userId == interaction.user.id) {
                await interaction.reply({ content: 'You can\'t apply any effects while under a fail!', ephemeral: true })
                return [false, null, null]
            }
            if (game.state.failClaim != interaction.user.id) {
                await interaction.reply({ content: 'You are not the user who claimed this fail!', ephemeral: true })
                return [false, null, null]
            }
        if (game.state.currentPlayer?.userId != interaction.options.getUser('target')?.id) {
            if (game.state.currentPlayer?.userId != interaction.options.getUser('target')?.id) {
                await interaction.reply({ content: 'You are applying to a failed user, please select them.', ephemeral: true })
                return [false, null, null]
            }
        }
        } else if (game.state.currentPlayer?.userId != interaction.user.id) {
            await interaction.reply({ content: 'It is not your turn', ephemeral: true })
            return [false, null, null]
        }
        return [true, player, game]
    }   

    public async checkEffect(card: Card, type: string) {
        if (card.effect.tags.includes('fail') || card.effect.tags.includes('luck')) {
            return true
        }
        if (card.type != CardType.TF) {
            return false
        }
        if (card.effect.tags.includes(type)) {
            return true
        }
        return false
    }
        

    public async mentaleffect(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        const [verified, _player, game] = await this.verifyRequest(interaction)
        console.log(verified, game)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!this.checkEffect(game?.state.lastCard, 'mental')) {
            await interaction.reply({ content: 'This card is not a mental effect card', ephemeral: true })
            return
        }

        const target = interaction.options.getUser('target')
        const effect = interaction.options.getString('effect')
        if (!target || !effect) {
            await interaction.reply({ content: 'Invalid target or effect', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const [_state, passed, msg] = await this.container.gl.applyEffect(game, effect, target.id, false)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        return await interaction.reply(
            new MessageBuilder()
        .setEmbeds([{
            title: 'Effect Applied',
            description: `${target.username} has been affected by ${effect}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }]))
    }

    public async physicaleffect(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        const [verified, _player, game] = await this.verifyRequest(interaction)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!this.checkEffect(game?.state.lastCard, 'physical')) {
            await interaction.reply({ content: 'This card is not a physical effect card', ephemeral: true })
            return
        }
        const target = interaction.options.getUser('target')
        const effect = interaction.options.getString('effect')
        if (!target || !effect) {
            await interaction.reply({ content: 'Invalid target or effect', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const [_state, passed, msg] = await this.container.gl.applyEffect(game, effect, target.id, true)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        return await interaction.reply(
            new MessageBuilder()
        .setEmbeds([{
            title: 'Effect Applied',
            description: `${target.username} has been affected by ${effect}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }]))
    }

    public async namechange(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        const [verified, _player, game] = await this.verifyRequest(interaction)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!this.checkEffect(game?.state.lastCard, 'name')) {
            await interaction.reply({ content: 'This card is not a name change card', ephemeral: true })
            return
        }
        const target = interaction.options.getUser('target')
        const name = interaction.options.getString('name')
        if (!target || !name) {
            await interaction.reply({ content: 'Invalid target or name', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const [_state, passed, msg] = await this.container.gl.nameChange(game, name, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        return await interaction.reply(
            new MessageBuilder()
        .setEmbeds([{
            title: 'Name Changed',
            description: `${target.username} has been changed to ${name}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }]))
    }

    public async avatarchange(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        const [verified, _player, game] = await this.verifyRequest(interaction)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!this.checkEffect(game?.state.lastCard, 'name') || this.checkEffect(game?.state.lastCard, 'mental')) {
            await interaction.reply({ content: 'This card is not an avatar change card', ephemeral: true })
            return
        }
        const target = interaction.options.getUser('target')
        const avatar = interaction.options.getString('avatar')
        if (!target || !avatar) {
            await interaction.reply({ content: 'Invalid target or avatar', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const [_state, passed, msg] = await this.container.gl.avatarChange(game, avatar, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        return await interaction.reply(
            new MessageBuilder()
        .setEmbeds([{
            title: 'Avatar Changed',
            description: `${target.username} has been changed to ${avatar}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }]))
    }

    public async descriptionchange(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        const [verified, _player, game] = await this.verifyRequest(interaction)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (this.checkEffect(game?.state.lastCard, 'name')) {
            await interaction.reply({ content: 'This card does not let you change descriptions.', ephemeral: true })
            return
        }
        const target = interaction.options.getUser('target')
        const description = interaction.options.getString('description')
        if (!target || !description) {
            await interaction.reply({ content: 'Invalid target or description', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const [_state, passed, msg] = await this.container.gl.descriptionChange(game, description, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        return await interaction.reply(
            new MessageBuilder()
        .setEmbeds([{
            title: 'Description Changed',
            description: `${target.username} has been changed to ${description}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }]))
    }

    public async bodyswap(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        const [verified, _player, game] = await this.verifyRequest(interaction)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!this.checkEffect(game?.state.lastCard, 'bodyswap')) {
            await interaction.reply({ content: 'This card is not a body swap card', ephemeral: true })
            return
        }
        const target = interaction.options.getUser('target')
        const swapTarget = interaction.options.getUser('swapTarget')
        if (!target || !swapTarget) {
            await interaction.reply({ content: 'Invalid target or swap target', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const [_state, passed, msg] = await this.container.gl.bodySwap(game, target.id, swapTarget.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        return await interaction.reply(
            new MessageBuilder()
        .setEmbeds([{
            title: 'Body Swapped',
            description: `${target.username} has been swapped with ${swapTarget.username}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }]))
    }
}
