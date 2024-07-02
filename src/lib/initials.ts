// This file will contain the initial objects for use in the application

import { Player, PlayerPreferences, Character, Game, GameState, GameMode, CharacterMode, Inventory, PlayerGuildInfo, GameStatus } from './bot.types'




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

export const initialInventory: Inventory = {
    shield: 0,
    reverse: 0,
    extraTurn: 0,
    cleanse: 0,
    steal: 0,
    tempLock: 0,
    tempCollar: 0,
    permaCollar: 0,
    collarKey: 0,
}

export const initialGuildInfo: PlayerGuildInfo = {
    games: [],
    gold: 0,
    inventory: initialInventory,
    blocked: [],
    permaCollared: false,
    collarOwner: null
}


export const initialGameState: GameState = {
    currentPlayer: null,
    turnOrder: [],
    deck: [],
    discard: [],
    lastCard: null, 
    lastPlayer: null,
    lastAction: null,
    status: GameStatus.WAITINGFORPLAYERS,
    turn: 0,
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