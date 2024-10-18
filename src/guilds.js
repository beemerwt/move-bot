// All functions for the guilds are beholden to a different rate limiter
import { get, post, patch } from "./http.js";
import { rateLimitedFunction } from "./ratelimits.js";

const getMembersRateLimited = rateLimitedFunction.bind(null, "getMembers", get);
async function getMembers(guild_id) {
	try {
		const response = await getMembersRateLimited(`/guilds/${guild_id}/members`);
		const data = await response.json();
		return data;
	} catch (err) {
		console.error("Error fetching members", err);
		return [];
	}
}

const moveMemberToChannelRateLimited = rateLimitedFunction.bind(null, "moveMemberToChannel", patch);
async function moveMemberToChannel(guild_id, member_id, channel_id) {
	try {
		await moveMemberToChannelRateLimited(`/guilds/${guild_id}/members/${member_id}`, { channel_id });
	} catch (err) {
		console.error("Error moving member to channel", err);
	}
}

const getMemberVoiceStateRateLimited = rateLimitedFunction.bind(null, "getMemberVoiceState", get);
async function getMemberVoiceState(guild_id, user_id) {
	try {
		const response = await getMemberVoiceStateRateLimited(`/guilds/${guild_id}/voice-states/${user_id}`);
		const data = await response.json();
		return data;
	} catch (err) {
		console.error("Error fetching voice state for user", err);
		return null;
	}
}

export default {
	getMembers,
	moveMemberToChannel,
	getMemberVoiceState,
}
