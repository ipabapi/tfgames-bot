import { GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv';
import {CogClient} from "./CogClient";

const client = new CogClient({ 
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    loadMessageCommandListeners: true});
dotenv.config();  // Load environment variables from .env file 
const apiKey = process.env.DISCORD_API_TOKEN;  // Retrieve the environment variable 
console.log('API Key:', apiKey)
client.login(apiKey);