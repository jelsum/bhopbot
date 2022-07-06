const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	requireDB: true,
	data: new SlashCommandBuilder()
		.setName('wr')
		.setDescription('Retrieves the specified record')
		.addStringOption(option =>
			option.setName('map')
				.setDescription('Name of the map')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('track')
				.setDescription('Normal/Bonus')
				.addChoice('Normal', 0)
				.addChoice('Bonus', 1))
		.addIntegerOption(option =>
			option.setName('style')
				.setDescription('Style of the record')
				.addChoice('Auto', 0)
				.addChoice('Sideways', 1)
				.addChoice('W-Only', 2)
				.addChoice('Legit Scroll (100 AA)', 3)
				.addChoice('Scroll (150 AA)', 4)
				.addChoice('Half Sideways', 5)
				.addChoice('D-Only', 6)
				.addChoice('Segmented', 7)
				.addChoice('Low Gravity', 8)
				.addChoice('Slow Motion', 9)
				.addChoice('Segmented Low Gravity', 10)
				.addChoice('Easy Scroll', 11)
				.addChoice('Parkour', 12)
				.addChoice('Segmented Parkour', 13)),
	async execute(interaction, con) {
		const mapName = interaction.options.getString('map');
		const track = interaction.options.getInteger('track') || 0;
		const style = interaction.options.getInteger('style') || 0;

		const path = require('path');
		const trackMap = require(path.join(__dirname, '..', 'tracks.json'));
		const styleMap = require(path.join(__dirname, '..', 'styles.json'));
		const textTrack = trackMap[track];
		const textStyle = styleMap[style];
		let sql;

		// Match exact map name
		if (mapName.startsWith('bhop_') || mapName.startsWith('bhop_kz_') || mapName.startsWith('kz_bhop_') || mapName.startsWith('kz_')) {
			sql = 'SELECT time, jumps, sync, strafes, date, map, u.name, p.auth FROM playertimes p, users u WHERE map =  ' + con.escape(mapName) + '  AND track = ? AND style = ? AND u.auth = p.auth ORDER BY time ASC LIMIT 1';
		}
		// Match close enough
		else {
			sql = 'SELECT time, jumps, sync, strafes, date, map, u.name, p.auth FROM playertimes p, users u WHERE map LIKE ' + con.escape('%' + mapName + '%') + ' AND track = ? AND style = ? AND u.auth = p.auth ORDER BY time ASC LIMIT 1';
		}
		con.query(sql, [track, style], (err, result) => {
			if (err) {
				return interaction.reply({ content: 'There has been an issue with this query. Yell at Merz. \n' + err });
			}

			if (!result.length) {
				return interaction.reply({ content: 'Map not found.' });
			}

			return interaction.reply({ embeds: [buildEmbed(result, textTrack, textStyle)] });
		});
	},
};

function buildEmbed(result, textTrack, textStyle) {
	const hours = Math.floor(result[0].time / 60 / 60);
	const minutes = Math.floor(result[0].time / 60);
	const seconds = Math.floor(result[0].time % 60);
	let formatted;
	if (hours < 1) {
		formatted = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
	}
	else {
		formatted = hours.toString().padStart(2, '0') + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
	}

	const embed = {
		color: 'BLUE',
		title: result[0].map.toString(),
		fields: [{
			name: 'Runner: ',
			value: result[0].name.toString(),
		},
		{
			name: 'Time: ',
			value: formatted.toString(),
			inline: false,
		},
		{
			name: 'Track: ',
			value: textTrack,
		},
		{
			name: 'Style: ',
			value: textStyle,
		},
		{
			name: 'Jumps: ',
			value: result[0].jumps.toString(),
			inline: true,
		},
		{
			name: 'Sync: ',
			value: result[0].sync.toString() + '%',
			inline: true,
		},
		{
			name: 'Strafes: ',
			value: result[0].strafes.toString(),
			inline: true,
		},
		],
		timestamp: new Date(),
		footer: {
			text: 'Wrong map/style? Try using the exact name!',
		},
	};
	return embed;
}