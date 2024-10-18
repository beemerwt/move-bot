import Permissions from './permissions.js';
import { Discord } from './discord.js';
import { moveEveryoneVoiceChannel, moveRoleMemberVoiceChannel, getListOfMembersInVoiceChannel } from './move.js';
/** @typedef {import('./interaction.js').default} Interaction */

export const MOVE_COMMAND = {
  name: 'move',
  description: 'Moves a users of a specified role from a specified voice channel to another',
	default_member_permissions: Permissions.MOVE_MEMBERS,
	options: [
		{
			name: 'role',
			description: 'Role to be moved',
			type: 8,
			required: true,
		},
		{
			name: 'from_channel',
			description: 'Channel to move from',
			type: 7,
			channel_types: [2],
			required: true,
		},
		{
			name: 'to_channel',
			description: 'Channel to move to',
			type: 7,
			channel_types: [2],
			required: true,
		}
	],

	/** @param {Interaction} interaction */
	async execute(interaction) {
		console.log("Called Execute in Move Command");
		try {
			const role = interaction.getOption('role');
			const fromChannel = interaction.getOption('from_channel');
			const toChannel = interaction.getOption('to_channel');

			const response = interaction.deferReply({ ephemeral: true });

			let content = `Moved all <@&${role}> in <#${fromChannel}> to <#${toChannel}>.`;
			if (role === interaction.guild_id) {
				content = `Moved @everyone in <#${fromChannel}> to <#${toChannel}>.`;
				await moveEveryoneVoiceChannel(interaction.guild_id, fromChannel, toChannel);
			} else {
				await moveRoleMemberVoiceChannel(interaction.guild_id, role, fromChannel, toChannel);
			}

			await interaction.resolveReply({ content });
			return response;

		} catch (error) {
			console.error("Error executing command", error);
		}
	}
};

export const MOVE_ALL_COMMAND = {
  name: 'moveall',
  description: 'Moves all users from all voice channels with a specific role to specified voice channel',
	default_member_permissions: Permissions.MOVE_MEMBERS,
	options: [
		{
			name: 'role',
			description: 'Role to be moved',
			type: 8,
			required: true,
		},
		{
			name: 'channel',
			description: 'Channel to move to',
			type: 7,
			channel_types: [2],
			required: true,
		}
	],

	async execute(interaction) {

	}
};

export const LIST_COMMAND = {
	name: 'list',
	description: 'Lists all members currently in a voice channel',
	default_member_permissions: Permissions.VIEW_CHANNEL,
	options: [
		{
			name: 'channel',
			description: 'Channel to list members of',
			type: 7,
			channel_types: [2],
			required: true,
		}
	],

	/** @param {Interaction} interaction */
	async execute(interaction) {
		try {
			const channel = interaction.getOption('channel');
			const response = interaction.deferReply({ ephemeral: true });

			const membersInChannel = await getListOfMembersInVoiceChannel(interaction.guild_id, channel);

			let content = "";
			if (membersInChannel.length === 0)
				content = `No members in <#${channel}>.`;
			else
				content = `Members in channel <#${channel}>: ${Discord.codeBlock(membersInChannel.join('\n'), "")}`;

			await interaction.resolveReply({ content });
			return response;
		} catch (err) {
			console.error("Error executing command", err);
		}
	}
}
