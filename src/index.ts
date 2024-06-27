import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js'
// @ts-ignore
import dotenv from 'dotenv';

const client = new SapphireClient({ 
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    loadMessageCommandListeners: true});
dotenv.config();  // Load environment variables from .env file 
const apiKey = process.env.DISCORD_API_TOKEN;  // Retrieve the environment variable 
console.log('API Key:', apiKey)
client.login(apiKey);