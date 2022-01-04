const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require('path');
const config = require(path.join(__dirname, '..', 'config.json'));
const SOURCEJUMP_API_URL = 'https://sourcejump.net/api';
const fetch = require('node-fetch');
const apiOptions = {
	method: 'GET',
	headers: {
		'api-key': config.SJ_API_KEY,
	},
};
const SteamID = require('steamid');
const SteamIDResolver = require('steamid-resolver');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('isbanned')
		.setDescription('Check if a user is banned on SourceJump')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('SteamID or profile url of the user')
				.setRequired(true)),
	async execute(interaction) {
		const profile = interaction.options.getString('user');
		getSteamID(profile, (err, result) => {
			if (err) return interaction.reply({ content: 'There is an issue with the provided Steam ID/URL.' });
			const sid = new SteamID(result);
			const id = sid.getSteam3RenderedID();

			fetch(`${SOURCEJUMP_API_URL}/players/banned`, apiOptions)
				.then(response => response.text())
				.then(body => {
				// Check if the body is empty
					if (body.length === 2) {
						return interaction.reply({ content: 'Either Tony has unbanned all players, or there is an issue with the API. Try again later.' });
					}
					body = JSON.parse(body);
					for (let i = 0; i < body.length; i++) {
						if (body[i].steamid == id) {
							const embed = {
								color: 'RED',
								title: 'Player is banned.',
								fields: [
									{
										name: 'Player: ',
										value: '[' + body[i].name + `](https://steamcommunity.com/profiles/${id})`,
									},
									{
										name: 'Ban Date: ',
										value: body[i].ban_date.toString(),
									},
								],
								timestamp: new Date(),
							};
							return interaction.reply({ embeds: [embed] });
						}
					}
					return interaction.reply({ content: `https://steamcommunity.com/profiles/${id} is not banned.` });
				});
		});
	},
};

function getSteamID(profile, callback) {
	if (profile.includes('steamcommunity.com/profiles')) {
		// split url, check for trailing space, and use the end of the url as steamid to convert
		profile = profile.split('/');
		if (profile[profile.length - 1] === '') profile.pop();
		return callback(null, profile[profile.length - 1]);
	}
	else if (profile.includes('steamcommunity.com/id')) {
		if (profile.charAt(profile.length - 1) == '/') profile = profile.slice(0, -1);
		SteamIDResolver.customUrlTosteamID64(profile, (err, res) => {
			if (err) return callback(err, null);
			return callback(null, res);
		});
	}
	else {
		try {
			const testSid = new SteamID(profile);
			if (!testSid.isValid()) {
				// doesnt matter what the error message is, just that there is one lol
				return callback('a', null);
			}
			return callback(null, profile);
		}
		catch (err) {
			return callback('a', null);
		}
	}
}