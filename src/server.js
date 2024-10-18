/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter, error as ErrorResponse, json as JsonResponse } from 'itty-router';
import { InteractionResponseType, InteractionResponseFlags, InteractionType, verifyKey } from 'discord-interactions';
import { MOVE_COMMAND, MOVE_ALL_COMMAND, LIST_COMMAND } from './commands.js';
import { Discord, Interaction } from './discord.js';

const app = AutoRouter();

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
		return ErrorResponse(401, 'Bad request signature.');
  }

	Discord.setToken(env.DISCORD_TOKEN);

	try {
		const jsonInteraction = JSON.parse(body);
		const interaction = new Interaction(jsonInteraction, env);
		request.interaction = interaction;

	} catch (err) {
		return ErrorResponse(400, 'Bad request body.');
	}
}

/** @param { { interaction: Interaction } } param0 */
async function commandHandler({ interaction }, env, context) {
  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
		return interaction.reply(null, { type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // Most user commands will come as `APPLICATION_COMMAND`.
		let response;
    switch (interaction.name.toLowerCase()) {
      case MOVE_COMMAND.name.toLowerCase():
				console.log("Move command received");
				response = MOVE_COMMAND.execute(interaction);
				context.waitUntil(response);
				return response;

      case MOVE_ALL_COMMAND.name.toLowerCase():
				return JsonResponse({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: `Command is not yet ready for use.`,
            flags: InteractionResponseFlags.EPHEMERAL,
					},
				});

			case LIST_COMMAND.name.toLowerCase():
				console.log("List command received");
				response = LIST_COMMAND.execute(interaction);
				context.waitUntil(response);
				return response;

      default:
        return JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }
}


/**
 * Main route for all requests sent from Discord.
 * All incoming messages will include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
app.post('/', verifyDiscordRequest, commandHandler);

app.all('*', () => new Response('Not Found.', { status: 404 }));


const server = {
  verifyDiscordRequest,
  fetch: app.fetch,
};

export default server;
