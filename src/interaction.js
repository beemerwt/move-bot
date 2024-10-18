import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { rateLimitedFunction } from "./ratelimits.js";
import { json as JsonResponse } from 'itty-router';
import { post } from './http.js';

/**
 * @typedef {{
 * 	content?: string,
 * 	tts?: boolean,
 * 	embeds?: [],
 * 	allowed_mentions?: {},
 *	ephemeral?: boolean,
 *	suppress_embeds?: boolean,
 *	suppress_notifications?: boolean,
 * 	components?: [],
 * 	attachments?: [],
 * 	poll?: {},
 * }} ResponseOptions
 */
const flags = {
	ephemeral: InteractionResponseFlags.EPHEMERAL,
	suppress_embeds: InteractionResponseFlags.SUPPRESS_EMBEDS,
	suppress_notifications: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS
};

/** @param {ResponseOptions} options */
function getDataFromOptions(options) {
	const data = { ...options };

	for (const [key, value] of Object.entries(flags)) {
    if (data[key] === true)
			data.flags = (data.flags ? data.flags : 0) | value;

		// delete the value if it's a flag (regardless of true or false)
		if (data[key] !== undefined)
			delete data[key];
	}

	return Object.keys(data).length > 0 ? data : undefined;
}

export default class Interaction {
	constructor(interaction, env) {
		console.log("Created Interaction " + JSON.stringify(interaction));
		this.id = interaction.id;
		this.type = interaction.type;
		this.guild_id = interaction.guild_id;
		this.token = interaction.token;

		this.deferredResponse = null; // placeholder

		this.name = interaction.data.name;
		this.options = interaction.data.options;

		this.application_id = env.DISCORD_APPLICATION_ID;

		// Each interaction has it's own exclusive rate limits
		this.postRateLimited = rateLimitedFunction.bind(null, "interactionPost", post);

		this.deferReply = this.deferReply.bind(this);
		this.resolveReply = this.resolveReply.bind(this);
		this.reply = this.reply.bind(this);
		this.getOption = this.getOption.bind(this);
	}

	/**
	 * When deferring a reply Discord establishes a websocket connection
	 * If the reply is awaited then it will block until Discord disconnects (15 minutes)
	 * @param {ResponseOptions} options
	 * @returns {Response} */
	deferReply(options) {
		if (this.isDeferred)
			throw new Error("Cannot defer reply twice");

		const responseObject = {
			type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
			data: getDataFromOptions(options),
		};

		console.log("Deferring reply");
		this.deferredResponse = this.postRateLimited(`/interactions/${this.id}/${this.token}/callback`, responseObject);
		this.isDeferred = true;
		return JsonResponse(responseObject);
	}

	async resolveReply(data) {
		if (!this.isDeferred)
			throw new Error("Cannot resolve reply before deferring");

		console.log("Resolving reply");
		const reply = await this.postRateLimited(`/webhooks/${this.application_id}/${this.token}`, { ...data });
		return reply;
	}

	reply(content, options) {
		if (!this.isDeferred)
			throw new Error("Cannot reply after deferring");

		console.log("Replying");
		const replyObject = { ...options };
		if (content)
			replyObject.data = { content };

		return JsonResponse(replyObject);
	}

	getOption(name) {
		console.log("Getting option " + name);
		const opt = this.options.find(option => option.name === name);
		return opt ? opt.value : null;
	}
}
