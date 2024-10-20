import { MOVE_COMMAND, LIST_COMMAND } from './commands.js';
import fetch from 'node-fetch';

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!token) {
  throw new Error('The DISCORD_TOKEN environment variable is required.');
}

if (!applicationId) {
  throw new Error('The DISCORD_APPLICATION_ID environment variable is required.');
}

async function registerGlobalCommands() {
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;
  await registerCommands(url);
}

function parseCommand(command) {
	return {
		name: command.name,
		description: command.description,
		default_member_permissions: command.default_member_permissions,
		options: command.options,
	};
}

async function registerCommands(url) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    method: 'PUT',
    body: JSON.stringify([
			parseCommand(MOVE_COMMAND),
			parseCommand(LIST_COMMAND)
		]),
  });

  if (response.ok) {
    console.log('Registered all commands');
  } else {
    console.error('Error registering commands');
    const text = await response.text();
    console.error(text);
  }
  return response;
}

await registerGlobalCommands();
