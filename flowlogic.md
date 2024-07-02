# Game Logic

This document describes the game logic of the game. It is a high-level overview of the game logic, and is intended to be a reference for developers working on the game, as well as what checks are needed at what points in the game.

## Game Flow

The game is divided into two main phases: the setup phase and the gameplay phase. The setup phase is where the game is initialized, and the gameplay phase is where the game is played.

### Setup Phase

A user would start the game by using `/game start` in an eligible channel.

An eligible channel is a channel that is not already in a game, and (once this is added) a channel specified by Server Admins as a channel that can host games.

So when a user uses `/game start mode:<"Normal"|"Hardcore">`:

- The bot will first make sure the Player has accepted terms using `/setup` (aka in the database).
- The bot will then check if the Player has a character for use in the game. If the user has no character, the bot will prompt the user to create a character using `/character create`.
- Bot will ping the database for the guild at Guild ID and check if the channel is not already in a game.
- If the channel is in a game, the bot will prompt the user to use `/game join` in the channel instead.
- If the normalChannels and hardcoreChannels are set, the bot will check if the channel is in the list of normalChannels or hardcoreChannels, otherwise, the bot will now begin game setup.
- If the channel is not in the list of normalChannels or hardcoreChannels, the bot will prompt the user to use `/game start` in an eligible channel.

Once the bot has confirmed that the channel is eligible for a game, the bot will then create a new game in the database. Reference `./src/lib/bot.types.ts:87` for the Game object.

The game status will start as "Waiting for Players" and the game mode will be set to the mode specified by the user. This is also where we add thread information in case of being in a thread. While the bot is setting up the game, a dm will be sent to the user who started the game with a select for the user to select a character to use in the game. The bot will also send a message in the channel confirming who joined and with what character.

The bot will send a message in the cannel confirming successful setup, now in Character.

During setup, the bot will also check if the user has a character, if not, the bot will prompt the user to create a character using `/character create`. Otherwise, once a player uses `/game join`, the bot will send a dm to the player with a select for characters of theirs to use in the game, and then a second select for the deck they wish to use.

Players can use `/game edit` to change their character or deck at any time during the setup phase. Once it is no longer 'Waiting for Players', players can no longer edit their character or deck.

Once all players have joined, any player can use `/game start` to start the game.

### Gameplay Phase

- The bot starts by taking all of the decks submitted by the players and shuffling them together to create the game deck, as well as adding in some system cards.
- Game status is now set to "Turn Processing", which is used to indicate that the bot is processing the current turn and preparing.
- The bot will then randomize the turn order and set the current player to the first player in the turn order.

#### Turn Processing

- The bot will check if the current player is active, if not, the bot will skip the player's turn.
- First the bot will check if the player is mindbroken, if so, the bot will roll 2d6 for doubles, if the player rolls doubles, the player is no longer mindbroken, otherwise, the player will skip their turn.
- If the player is mindcontrolled, the bot will check if the player is mindcontrolled and then give it to the mindcontroller and decrement the mindcontrol counter.
- The bot will then check if the given user (whether that be the original turn or the mindcontrolled turn) is able to draw. If so, they will prompt the user to draw a card.
- If not, the bot will draw a card for the player, teasing them while doing so.
- After that the card gets shown to the whole channel.
- If it is normal mode, they can do `/pass` to pass their turn.
- If it is hardcore mode, they can do `/pass` to pass their turn, but they will be penalized for doing so. After penalty is finished, the next player will have to do `/advance` to continue the game.
- Once effects have been resolved, the player can then use `/advance` to advance to the next player's turn.

Other commands that can be used during the gameplay phase are:
/check character:(string) - Check a character's stats.
/check card:(string) - Check a card's stats.
/check turn - Check whose turn it is.
/apply user:(string) - Pops up a modal with type and value to apply to a user.
/skip - Skips the current player's turn, requires vote from all players except the current player.
/kick user:(Mention) - Kicks a user from the game, requires vote from all players.
/end - Ends the game, requires vote from all players.
/afk user:(mention)(optional) - Sets a user as afk, requires vote from all players if not the author.
/check deck - Checks the current deck, doesnt show the status of the cards, just which are shuffled in at start.
/shop - Opens the shop for the player to buy items, if the player is in a mode to do so.
/gold - Checks the player's gold, ephemeral.

#### Maybe commands later

/flirt - Flirt with Heart or Spade, depending on mode.
/talk - Talk to Heart or Spade, depending on mode.


## Game End

The game ends when one of the following conditions are met:

- All players have voted to end.
- No activity in the game for 30 minutes.

When the game ends, the bot will send a message in the channel to tell the players that the game has ended, and then the bot will remove the active game from the list on guild.

