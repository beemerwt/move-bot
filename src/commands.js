export const MOVE_COMMAND = {
	name: 'move',
	description: 'Moves a users of a specified role from a specified voice channel to another',
	usage: "/move <role> <from_channel> <to_channel>",
};

export const MOVE_ALL_COMMAND = {
	name: 'moveall',
	description: 'Moves all users from all voice channels with a specific role to specified voice channel',
	usage: "/moveall <role> <to_channel>",
}
