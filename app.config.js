const appConfig = require('./app.json');

module.exports = ({ config }) => ({
	...config,
	...appConfig.expo,
	extra: {
		...appConfig.expo.extra,
		EXPO_PUBLIC_2GIS_API_KEY: process.env.EXPO_PUBLIC_2GIS_API_KEY || process.env['2GIS_API1'] || '',
		EXPO_PUBLIC_YANDEX_MAP_API_KEY: process.env.EXPO_PUBLIC_YANDEX_MAP_API_KEY || process.env.YANDEX_MAP_API2 || '',
	},
});