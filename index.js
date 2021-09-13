// Import required dependencies
const { Client, Intents, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');
const fs = require('fs');
const mysql = require('mysql');

const applicationId = config.applicationId;
const guildId = config.guildId;

// Instantiate a new Discord client with permitted intents
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Create command containers
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

// Read command files and add them to containers
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command.data.value);
	commands.push(command.data.toJSON());
}

// Create a Discord.js REST API object
const rest = new REST({ version: '9' }).setToken(config.token);

// Register slash commands with Discord's API
(async () => {
	try {
		console.log('Refreshing slash commands');
		await rest.put(
			Routes.applicationGuildCommands(applicationId, guildId),
			{ body: commands },
		);
	}
	catch (err) {
		console.error(err);
	}
})();

// Interaction handler
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	}
	catch (err) {
		console.error(err);
		await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
	}
});

// Initialize database object
const con = new mysql.createConnection({
	host: config.dbhost,
	database: config.dbname,
	user: config.dbuser,
	password: config.dbpassword,
	port: config.dbport,
	insecureAuth: true,
});

// Initialize database connection
dbConnect();

// If the database connection ever has an error, end the connection and create a new one.
con.on('error', (err) => {
	console.log(err);
	console.log('Recreating database connection.');
	con.end();
	dbConnect();
});

function dbConnect() {
	con.connect((err => {
		if (err) {
			console.error(err);
		}
		else {
			console.log('Connected to database.');
		}
	}));
}

client.once('ready', () => {
	console.log('Bot ready!');
});

client.login(config.token);