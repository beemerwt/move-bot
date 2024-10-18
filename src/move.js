import { Discord } from "./discord.js";

export async function moveRoleMemberVoiceChannel(guild_id, role, from_channel, to_channel) {
	const members = await Discord.guilds.getMembers(guild_id);

	console.log(JSON.stringify(members));

	if (!members) {
		console.error("No members found?");
		return;
	}

	// filter all members who have the role_id
	const roleMembers = members.filter(member => member.roles.includes(role));

	const roleMemberVoiceStates = roleMembers.map(member => Discord.guilds.getMemberVoiceState(guild_id, member.user.id));
	const voiceStates = await Promise.all(roleMemberVoiceStates);

	// filter all members who are in the from_channel
	const memberUidsFromChannel = voiceStates.filter(state => state !== null && state.channel_id === from_channel).map(state => state.user_id);
	const promises = memberUidsFromChannel.map(uid => Discord.guilds.moveMemberToChannel(guild_id, uid, to_channel));
	await Promise.all(promises);
}

export async function moveEveryoneVoiceChannel(guild_id, from_channel, to_channel) {
	const members = await Discord.guilds.getMembers(guild_id);
	const memberVoiceStates = members.map(member => Discord.guilds.getMemberVoiceState(guild_id, member.user.id));
	const voiceStates = await Promise.all(memberVoiceStates);

	const memberUidsFromChannel = voiceStates.filter(state => state !== null && state.channel_id === from_channel).map(state => state.user_id);
	const promises = memberUidsFromChannel.map(uid => Discord.guilds.moveMemberToChannel(guild_id, uid, to_channel));
	await Promise.all(promises);
}

export async function getListOfMembersInVoiceChannel(guild_id, channel) {
	const members = await Discord.guilds.getMembers(guild_id);

	const memberVoiceStates = members.map(member => Discord.guilds.getMemberVoiceState(guild_id, member.user.id));
	const voiceStates = await Promise.all(memberVoiceStates);

	const memberUidsFromChannel = voiceStates.filter(state => state !== null && state.channel_id === channel)
		.map(state => state.user_id);

	return members.filter(member => memberUidsFromChannel.includes(member.user.id)).map(member => {
		if (member.nick)
			return member.nick;

		if (member.user.global_name)
			return member.user.global_name;

		return member.user.username;
	});
}
