// This file will contain the initial objects for use in the application

import { Player, PlayerPreferences, Character, Game, GameState, GameMode, CharacterMode, PlayerGuildInfo, GameStatus } from './bot.types'




export const initialPreferenceObject: PlayerPreferences = {
    FAVORED: [],
    NEUTRAL: [],
    DISLIKED: [],
    ASKFIRST: [],
    HARDNO: []
}

export const initialPlayer: Player = {
    userId: '',
    characters: [],
    decks: [],
    guilds: {},
    preferences: initialPreferenceObject
}

export const initialCharacter: Character = {
    name: '',
    avatar: '',
    description: '',
    mentalEffects: [],
    physicalEffects: [],
    originalState: {
        name: '',
        avatar: '',
        description: '',
    },
    bodySwapped: false,
    bodySwapId: null,
    mindBroken: false,
    mindControlled: null,
    mindControlLeft: 0,
    ableToDraw: true,
    collared: false,
    permaCollared: false,
    collarUnlockTime: null,
    collarer: null,
    locked: false,
    badEnd: false,
    mode: CharacterMode.NORMAL,
    creator: '',
    guilds: [],
    preferences: initialPreferenceObject
}


export const initialGuildInfo: PlayerGuildInfo = {
    games: [],
    gold: 0,
    inventory: {},
    blocked: [],
    permaCollared: false,
    collarOwner: null
}


export const initialGameState: GameState = {
    currentPlayer: null,
    turnOrder: [],
    extraTurnUsed: false,
    extraTurn: false,
    stealsActive: {},
    deck: [],
    discard: [],
    lastCard: null, 
    lastPlayer: null,
    failClaim: null,
    status: GameStatus.WAITINGFORPLAYERS,
    turn: 0,
    pass: true,
    afkPlayers: []
}

export const initialGame: Game = {
    players: {},
    channel: '',
    inThread: false,
    threadId: null,
    state: initialGameState,
    gameMode: GameMode.NORMAL,
}

