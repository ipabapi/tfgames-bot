import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js'
// @ts-ignore
import dotenv from 'dotenv';

const client = new SapphireClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
dotenv.config();  // Load environment variables from .env file 
const apiKey = process.env.DISCORD_API_TOKEN;  // Retrieve the environment variable 
console.log('API Key:', apiKey)
client.login('your-token-goes-here');