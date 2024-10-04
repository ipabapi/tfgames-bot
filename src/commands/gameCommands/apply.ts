import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import {  MessageComponentInteraction, User} from 'discord.js';
import {Game} from "../../lib/bot.types";


// apply
// mentalEffect
// physicalEffect
// nameChange
// avatarChange
// descriptionChange
// bodySwap

export type optionalProps = {
    user: User,
    target: User,
    target2?: User,
    effect: string,
    verify: any,
    check: any,
    waitForShieldOrReverse: any
}
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
				},
                {
                    name: 'customform',
                    messageRun: 'customform',
                    chatInputRun: 'customform'
                }
                
			]
		});
        this.container.effectTypes = {
        'mental': this.mentaleffect,
        'physical': this.physicaleffect,
        'name': this.namechange,
        'avatar': this.avatarchange,
        'description': this.descriptionchange,
        'bodyswap': this.bodyswap
    }
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
                .addSubcommand((command) =>
                command
                    .setName('customform')
                    .setDescription('Apply a custom form')
                    .addUserOption((option) => option.setName('target').setDescription('The target of the avatar change').setRequired(true))
            )

		);
	}

    
        

    public async mentaleffect(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
        // @ts-ignore
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        console.log(verified, game)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'mental')) {
            await interaction.reply({ content: 'This card is not a mental effect card', ephemeral: true })
            return
        }

        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        const effect = interaction instanceof MessageComponentInteraction ? optionals?.effect : interaction.options.getString('effect')
        if (!target || !effect) {
            await interaction.reply({ content: 'Invalid target or effect', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction, {
            title: 'Effect Applied',
            description: `${target.username} has been affected by ${effect}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'mental', effect)
        if (!result) {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error', ephemeral: true })
            }
        }
        // @ts-ignore
        const [_state, passed, msg] = await container.gl.applyEffect(game, effect, target.id, false)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        // @ts-ignore
        await interaction.reply({ content: 'The effect has been applied.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Effect Applied',
                description: `${target.username} has been affected by ${effect}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
    }

    public async physicaleffect(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
        // @ts-ignore
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'physical')) {
            await interaction.reply({ content: 'This card is not a physical effect card', ephemeral: true })
            return
        }
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        const effect = interaction instanceof MessageComponentInteraction ? optionals?.effect : interaction.options.getString('effect')
        if (!target || !effect) {
            await interaction.reply({ content: 'Invalid target or effect', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction, {
            title: 'Effect Applied',
            description: `${target.username} has been affected by ${effect}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'physical', effect)
        // @ts-ignore
        const [_state, passed, msg] = await container.gl.applyEffect(game, effect, target.id, true)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        await interaction.editReply({ content: 'The effect has been applied.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Effect Applied',
                description: `${target.username} has been affected by ${effect}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
    }

    public async namechange(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
        // @ts-ignore
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'name')) {
            await interaction.reply({ content: 'This card is not a name change card', ephemeral: true })
            return
        }
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        const name = interaction instanceof MessageComponentInteraction ? optionals?.effect : interaction.options.getString('name')
        if (!target || !name) {
            await interaction.reply({ content: 'Invalid target or name', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction, {
            title: 'Name Changed',
            description: `${target.username} has been changed to ${name}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'name', name)
        if (!result) {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error', ephemeral: true })
            }
        }
        // @ts-ignore
        const [_state, passed, msg] = await container.gl.nameChange(game, name, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        await interaction.editReply({ content: 'The name has been changed.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Name Changed',
                description: `${target.username}'s name has been changed to ${name}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
    }

    public async avatarchange(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
        // @ts-ignore
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        if (!verified) {
            return
        }
        console.log("changing avatar")
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'body')) {
            await interaction.reply({ content: 'This card is not an avatar change card', ephemeral: true })
            return
        }
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        const avatar = interaction instanceof MessageComponentInteraction ? optionals?.effect : interaction.options.getString('avatar')
        console.log(avatar)
        // @ts-ignore
        console.log(target.username)
        if (!target || !avatar) {
            await interaction.reply({ content: 'Invalid target or avatar', ephemeral: true })
            return
        }
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction, {
            title: 'Avatar Changed',
            description: `${target.username} has been changed to ${avatar}`,
            color: 0x00ff00,
            image: {
                url: avatar,
            },
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'avatar', avatar)
        if (!result) {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error', ephemeral: true })
            }
        }
        // @ts-ignore
        const [_state, passed, msg] = await container.gl.avatarChange(game, avatar, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        // @ts-ignore
        await interaction.editReply({ content: 'The avatar has been changed.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Avatar Changed',
                description: `${target.username}'s avatar has been changed to ${avatar}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
    }

    public async descriptionchange(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps)  {
        // @ts-ignore
        console.log("entered")
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        if (!verified) {
            return
        }
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'description')) {
            await interaction.reply({ content: 'This card does not let you change the description', ephemeral: true })
            return
        }
        console.log("checked effect")
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        const description = interaction instanceof MessageComponentInteraction ? optionals?.effect : interaction.options.getString('description')
        console.log(description)
        if (!target || !description) {
            await interaction.reply({ content: 'Invalid target or description', ephemeral: true })
            return
        }

        // apply effect to target using gl applyEffect
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction, {
            title: 'Description Changed',
            description: `${target.username}'s description has been changed to ${description}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'description', description)
        if (!result) {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error', ephemeral: true })
            }
        }

        // @ts-ignore
        const [_state, passed, msg] = await container.gl.descriptionChange(game, description, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        await interaction.editReply({ content: 'The description has been changed.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Description Changed',
                description: `${target.username}'s description has been changed to ${description}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
        
    }

    public async bodyswap(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
        // @ts-ignore
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        console.log(verified, game)
        if (!verified) {
            return
        }
        console.log('checking effect')
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'bodyswap')) {
            await interaction.editReply({ content: 'This card is not a body swap card' })
            return
        }
        console.log('checked effect')
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        const swapTarget = interaction instanceof MessageComponentInteraction ? optionals?.target2 : interaction.options.getUser('swaptarget')
        console.log(target, swapTarget)
        if (!target || !swapTarget) {
            await interaction.editReply({ content: 'Invalid target or swap target'})
            return
        }
        console.log('applying effect')
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction,
            {
            title: 'Body Swapped',
            description: `${target.username} has been swapped with ${swapTarget.username}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'bodyswap', '', swapTarget)
        if (!result) {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error'})
            }
        }
        // @ts-ignore
        const [_state, passed, msg] = await container.gl.bodySwap(game, target.id, swapTarget.id)
        if (!passed) {
            // @ts-ignore
            await interaction.editReply({ content: msg })
            return
        }
        // defered previously
        await interaction.editReply({ content: 'The body swap has been completed.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Body Swapped',
                description: `${target.username} has been swapped with ${swapTarget.username}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
        
        
    }

    public async customform(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
        // @ts-ignore
        const [verified, _player, game] = await container.gl.verifyRequest(interaction, optionals)
        if (!verified) {
            return
        }
        //TODO fix
        // @ts-ignore
        if (!container.gl.checkEffect(game?.state.lastCard, 'custom')) {
            await interaction.reply({ content: 'This card is not a custom form card', ephemeral: true })
            return
        }
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')
        if (!target) {
            await interaction.reply({ content: 'Invalid target or effect', ephemeral: true })
            return
        }
        
        // apply effect to target using gl applyEffect
        // @ts-ignore
        const customForm = (game as Game)?.state.lastCard.customForm
        // @ts-ignore
        const result = await container.gl.waitForShieldOrReverse(game, target, interaction, {
            title: 'Effect Applied',
            description: `${target.username} has been targeted by the following custom form:\n ${customForm?.name || ""}`,
            color: 0x00ff00,
            footer: { text:`Applied by ${interaction.user.username}` }
        }, 'physical', '')
        // @ts-ignore
        const [_state, passed, msg] = await container.gl.customForm(game, customForm, target.id)
        if (!passed) {
            // @ts-ignore
            await interaction.reply({ content: msg, ephemeral: true })
            return
        }
        await interaction.editReply({ content: 'The effect has been applied.' })
        return await interaction.channel?.send({
            embeds: [{
                title: 'Effect Applied',
                description: `${target.username} has been turned into ${customForm?.name || ""}. **Since both players chose to do nothing, the effect has been applied.**`,
                color: 0x00ff00,
                footer: { text:`Applied by ${interaction.user.username}` }
            }]
        })
    }

    
}
