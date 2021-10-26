const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('global')
		.setDescription('Retrieves global world record for the map from the SourceJump database')
		.addStringOption(option =>
			option.setName('map')
				.setDescription('Name of the map')
				.setRequired(true)),
	async execute(interaction) {
		const path = require('path');
		const config = require(path.join(__dirname, '..', 'config.json'));
		const SOURCEJUMP_API_URL = 'https://sourcejump.net/api';
		const fetch = require('node-fetch');
		const mapName = interaction.options.getString('map');

		const apiOptions = {
			method: 'GET',
			headers: {
				'api-key': config.SJ_API_KEY,
			},
		};

		fetch (`${SOURCEJUMP_API_URL}/records/${mapName}`, apiOptions)
			.then(response => response.text())
			.then(body => {
				// Check if there is a valid response.
				if (body.length === 2) {
					return interaction.reply({ content: `No times found for ${mapName}` });
				}

				// Parse the response data
				body = JSON.parse(body);
				body = body[0];

				const embed = {
					color: 'BLUE',
					title: body.map.toString(),
					fields: [{
						name: 'Runner: ',
						value: body.name.toString(),
					},
					{
						name: 'Time: ',
						value: body.time.toString(),
						inline: true,
					},
					{
						name: 'Server: ',
						value: body.hostname.toString(),
					},
					{
						name: 'Run Date: ',
						value: body.date.toString(),
						inline: true,
					},
					{
						name: 'Jumps: ',
						value: body.jumps.toString(),
						inline: true,
					},
					{
						name: 'Sync: ',
						value: body.sync.toString(),
						inline: true,
					},
					{
						name: 'Strafes: ',
						value: body.strafes.toString(),
						inline: true,
					},
					],
					timestamp: new Date(),
				};
				return interaction.reply({ embeds: [embed] });
			});
	},
};