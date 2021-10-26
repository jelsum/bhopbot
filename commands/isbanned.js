const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('isbanned')
		.setDescription('Checks if a given SteamID3 ([U:1:1234]) is SJ banned.')
		.addStringOption(option =>
			option.setName('id')
				.setDescription('SteamId3 of the user')
				.setRequired(true)),
	async execute(interaction) {
		const path = require('path');
		const config = require(path.join(__dirname, '..', 'config.json'));
		const SOURCEJUMP_API_URL = 'https://sourcejump.net/api';
		const fetch = require('node-fetch');
		const id = interaction.options.getString('id');

		const apiOptions = {
			method: 'GET',
			headers: {
				'api-key': config.SJ_API_KEY,
			},
		};

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
			});
	},
};