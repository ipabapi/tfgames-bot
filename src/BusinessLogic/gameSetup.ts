import { Command, container } from '@sapphire/framework';
import { Game, GameStatus} from '../lib/bot.types';
import { ObjectId } from 'mongodb';


export async function gameSetup(interaction: Command.ChatInputCommandInteraction, game: Game) {
    interaction.channel?.send({ content: `Well then, seems like we have ${Object.keys(game.players).length} players ready to play! That is ${Object.keys(game.players).map(player => `<@${player}>`).join(', ')}. Let's get started!` });
    // Grab decks from the game object at players.decks, then grab the cards from the decks at their database location
    const deckIds = Object.values(game.players).map(player => player.deck);
    const decks = await Promise.all(deckIds.map(deckId => container.deck.findOne({ _id: new ObjectId(deckId) })));
    if (!decks) {
        throw new Error('Decks not found');
    }
    if (decks.some(deck => deck?.cardIds.length < 1)) {
        interaction.reply({ content: `Decks are empty`, ephemeral: true });
        console.error('Decks are empty');
        return;
    }

    interaction.channel?.send({ content: `Okay... I grabbed ${decks.length} decks, containing ${decks.reduce((acc, deck) => acc + deck?.cardIds.length, 0)} cards. Let's shuffle them up...` });

    const finalCards = decks.flatMap(deck => deck ? deck.cardIds : []);
    // Shuffle the cards
    for (let i = finalCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalCards[i], finalCards[j]] = [finalCards[j], finalCards[i]];
    }

    game.state.deck = finalCards;
    interaction.channel?.send({ content: `Now I'm going to set up the turn order...` });
    // Set up turn order, shuffle players
    const players = Object.keys(game.players);
    console.log(players);
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    // @ts-expect-error no overload matches this call
    game.state.turnOrder = await Promise.all(players.map(player => container.users.findOne({ userId: player })));
    
    game.state.status = GameStatus.TURNSTART;
    game.state.currentPlayer = game.state.turnOrder[game.state.turnOrder.length - 1]; // this is to save A SINGLE unshift and push operation, saving a few nanoseconds

    interaction.channel?.send({ content: `Looks like we'll be starting with <@${game.state.currentPlayer.userId}>!\nThe turn order after that is:\n${game.state.turnOrder.map(player => `<@${player.userId}>`).join(' =>\n')}.` });

    interaction.channel?.send({ content: `Please wait while I let Ren know we have another game starting!` });
    game.state.turn = 1;
    // Save the game state
    // TODO: Card draw function implementation
    await container.game.updateOne({ channel: game.channel }, { $set: { state: game.state } });
    interaction.channel?.send({ content: `Looks like we're all set! Let's get started!` });

    return interaction.reply({ content: `You have started the game!`, ephemeral: true });

}
