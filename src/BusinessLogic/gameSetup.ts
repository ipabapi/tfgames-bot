import { Command, container } from '@sapphire/framework';
import { Card, CardType, Deck, Game, GameStatus} from '../lib/bot.types';
import { ObjectId } from 'mongodb';


export async function gameSetup(interaction: Command.ChatInputCommandInteraction) {
    const game = interaction.userData?.game as Game;
    if (!game) {
        throw new Error('Game not found');
    }
    const players = Object.keys(game.players);

    let decks: Deck[] = await Promise.all(players.map(player => container.deck.findOne({ _id: new ObjectId(game.players[player].deck) }) as unknown as Deck))
    let embedDescription = `Starting game setup!\n\nLooks like we have ${players.length} players in this game.\n\nThat means we have ${decks.length} decks to shuffle!`;
    await interaction.reply({
        embeds: [
            {
                title: 'Game Setup',
                description: `${embedDescription}`,
                fields: players.map((player, index) => ({
                    name: `Player ${index + 1}`,
                    value: `<@${player}>`,
                    inline: true
                })),
                color: 0x00ff00
            }
        ]
    });

    const systemCards = await container.cards.find({ type: CardType.SYSTEM }).toArray() as unknown as Card[];

    const finalCards = decks.flatMap(deck => deck ? deck.cardIds : []);
    game.state.deck = shuffle(addSystemCards(finalCards, systemCards));
    embedDescription += `\n\nI shuffled a total of ${game.state.deck.length}, that's ${finalCards.length} player cards and ${game.state.deck.length - finalCards.length} system cards!\nNow, I'll determine the turn order.`;
    console.log(players)
    interaction.editReply({
        embeds: [
            {
                title: 'Game Setup',
                description: `${embedDescription}`,
                fields: players.map((player, index) => ({
                    name: `Player ${index + 1}`,
                    value: `<@${player}>`,
                    inline: true
                })),
                color: 0x00ff00
            }
        ]
    });

    game.state.turnOrder = shuffle(Object.keys(game.players));    
    game.state.status = GameStatus.TURNSTART;
    game.state.currentPlayer = game.state.turnOrder[game.state.turnOrder.length - 1]; // this is to save A SINGLE unshift and push operation, saving a few nanoseconds
    console.log(game.state.currentPlayer, game.state.turnOrder)
    embedDescription += `\n\nI shuffled the players and the turn order! Looks like we'll start with <@${game.state.currentPlayer}>!\n\nThen it'll go in this order:\n${game.state.turnOrder.map((player, index) => `${index + 1}. <@${player}>`).join('\n')}.\n\nI'll save the game state now.`;

    await interaction.editReply({
        embeds: [
            {
                title: 'Game Setup',
                description: `${embedDescription}`,
                color: 0x00ff00
            }
        ]
    });
    
    game.state.turn = 1;
    // Save the game state
    // TODO: Card draw function implementation
    await container.game.updateOne({ channel: game.channel }, { $set: { state: game.state } });
    embedDescription += `\n\nGame state saved! We're ready to start the game!`;
    await interaction.editReply({
        embeds: [
            {
                title: 'Game Setup',
                description: `${embedDescription}`,
                color: 0x00ff00
            }
        ]
    });

    interaction.channel?.send({
        content: `<@${game.state.currentPlayer}>, it's your turn!`,
        embeds: [
            {
                title: 'Game Start',
                description: `It's <@${game.state.currentPlayer}>'s turn!`,
                color: 0x00ff00
            }
        ]
    });

    return game;

}

const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const addSystemCards = (deck: string[], systemCards: Card[]) => {
    const systemCardCount = Math.floor(deck.length / 5);
    for (let i = 0; i < systemCardCount; i++) {
        deck.push(systemCards[Math.floor(Math.random() * systemCards.length)].stringID);
    }
    return deck;
}