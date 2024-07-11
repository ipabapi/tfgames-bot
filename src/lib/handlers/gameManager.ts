import { Subcommand } from '@sapphire/plugin-subcommands';
import { userData } from './informationManager'
import { ButtonInteraction, ComponentType, InteractionResponse, Message } from 'discord.js';
import { container } from '@sapphire/framework';
import { Character, Deck, Game } from '../bot.types';
import { ObjectId } from 'mongodb';
export class GameManager {

    public async choosePlayerAndDeck(interaction: Subcommand.ChatInputCommandInteraction | ButtonInteraction) {
        if (!interaction.userData && interaction.guild) interaction.userData = await userData(interaction.channelId, interaction.user.id)
        

        /** Thinking aloud to myself here.
         * First, if it is a button command, we need to run the checks (hasCompletedSetup, hasCharacters, hasDeck, etc.)
         * Then, we need to create our base embeds and select menus.
         * After we show them the character select menu, we need to wait for them to select a character.
         * 
         */
        if (await this.backupChecks(interaction) instanceof InteractionResponse) return;
        // Create the select menu for characters
        const characters = await container.characters.find({ creator: interaction.user.id }).toArray() as unknown as Character[]
        const decks = await container.deck.find({ player: interaction.user.id }).toArray() as unknown as Deck[]

        const playerObj = {
            character: '',
            deck: '',
            shieldActive: false,
        }
        

        await interaction.reply({ content: '1️⃣. Please select a character.', components: [{
            type: 1,
            components: [{
                type: 3,
                custom_id: 'character-select',
                options: characters.map(character => ({ label: character.name, value: character._id?.toString() || '', description: character.description }))
            }]
            
        }], ephemeral: true }).then(async (m) => await this.collectorHandler(m, playerObj, 'character'))

        if (!playerObj.character) return interaction.followUp({ content: 'You took too long to select a character.', ephemeral: true })
        
        await interaction.followUp({ content: '2️⃣. Please select a deck.', components: [{
            type: 1,
            components: [{
                type: 3,
                custom_id: 'deck-select',
                options: decks.map(deck => ({ label: deck.name, value: deck._id?.toString() || '', description: deck.description }))
            }]
        }] }).then(async (m) => await this.collectorHandler(m, playerObj, 'deck'))

        if (!playerObj.deck) return interaction.followUp({ content: 'You took too long to select a deck.', ephemeral: true })
        if (!interaction.userData) return;
        const result = await container.game.updateOne({ channel: interaction.channel?.id }, { $set: {
            [`players.${interaction.user.id}`]: playerObj
        }})
        if (result.modifiedCount === 1) {
            interaction.userData.game = await container.game.findOne({ channel: interaction.channel?.id }) as unknown as Game;
            await this.changeOriginalStartEmbed(interaction)
            interaction.followUp({ content: 'You have successfully joined the game.', ephemeral: true })
            return true;
        } else {
            interaction.followUp({ content: 'There was an error joining the game.', ephemeral: true })
            return false;
        }
    }

    public async changeOriginalStartEmbed(interaction: Subcommand.ChatInputCommandInteraction | ButtonInteraction) {
        if (!interaction.userData) return;
        const playerCharacters = await Promise.all(Object.keys(interaction.userData.game.players).map(async (player) => {
            const character = await container.characters.findOne({ _id: new ObjectId(interaction.userData?.game.players[player].character) });
            return `<@${player}> using **${character?.name}**`;
            }));
        // @ts-ignore
        const message = {
            embeds: [
                {
                    title: "Experimental Game",
                    description: `This is an experimental game. Please join by clicking the button below.\n\nPlayers:\n${playerCharacters.join('\n')}`,                        
                }
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Join Game',
                            customId: 'game-join',
                            emoji: { name: '🎮' }
                        }
                    ]
                }
            ]
        }
        interaction instanceof ButtonInteraction ? interaction.message.edit(message) : interaction.channel?.send(message)
    }

    public async backupChecks(interaction: Subcommand.ChatInputCommandInteraction | ButtonInteraction) {

        if (!interaction.userData && interaction.channel) {
            interaction.userData = await userData(interaction.channelId, interaction.user.id)
        }
        if (!interaction.userData?.game) {
            // @ts-ignore
            interaction.userData.game = await container.game.findOne({ channel: interaction.channelId }) as unknown as Game
        }
        if (!interaction.userData?.player) return interaction.reply({ content: 'You need to complete the setup process first.', ephemeral: true })
        if (interaction.userData?.game) {
        if (Object.keys(interaction.userData?.game.players).includes(interaction.user.id)) return interaction.reply({ content: 'You have already joined the game.', ephemeral: true })
        } 
        if (!container.characters.find({ userId: interaction.user.id })) return interaction.reply({ content: 'You need to create a character first.', ephemeral: true })
        if (!container.deck.find({ userId: interaction.user.id })) return interaction.reply({ content: 'You need to create a deck first.', ephemeral: true })
        return true
    }
    public async collectorHandler(m: InteractionResponse | Message, playerObj: { character: string, deck: string, shieldActive: boolean }, type: 'character' | 'deck') {
        return new Promise((resolve) => {
            const collector = m.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 })
            collector.on('collect', async (selectMenu) => {
                playerObj[type] = selectMenu.values[0]
                m.delete()
                selectMenu.reply({ content: `You have selected a ${type}.`, ephemeral: true })
                collector.stop()
            })
            collector.on('end', async (_collected, reason) => {
                if (reason === 'time') {
                    m.edit({ content: `You took too long to select a ${type}.`, components: [] })
                    resolve(void 0)
                } else {
                    resolve(void 0)
                }
            })
        })
    }

}