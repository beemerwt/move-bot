import Interaction from './interaction.js';
import Guilds from './guilds.js';
import { setToken } from './http.js';

function codeBlock(code, language = "") {
	return `\`\`\`${language}\n${code}\`\`\``;
}

export const Discord = {
	guilds: Guilds,
	codeBlock,
	setToken,
}

export {
	Interaction
};
