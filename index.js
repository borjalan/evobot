// ---------------------------------------------------------------- Module Imports ---------------------------------------------------

const chalk = require('chalk');
const i18n = require("i18n");
const path = require("path");
const { Client, Collection } = require("discord.js");
const { DiscordTogether } = require('discord-together');
const { TOKEN, PREFIX, LOCALE } = require("./util/EvobotUtil");
const { join } = require("path");
const { readdirSync } = require("fs");

// -------------------------------------------------------------------- Constants -------------------------------------------------------

const client = new Client({ disableMentions: "everyone", restTimeOffset: 0});
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const log = console.log;

// // ---------------------------------------------------------------- Configuration ----------------------------------------------------

client.discordTogether = new DiscordTogether(client);
client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
i18n.configure({
  locales: ["ar","de","en","es","fr","it","ko","nl","pl","pt_br","ru","sv","tr","zh_cn","zh_tw"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  objectNotation: true,
  register: global,
  logWarnFn: function (msg) {console.log("warn", msg)},
  logErrorFn: function (msg) {console.log("error", msg)},
  missingKeyFn: function (locale, value) {return value},
  mustacheConfig: {tags: ["{{", "}}"], disable: false}
});

// -------------------------------------------------------------  Helper functions ---------------------------------------------------

function setupMessage () {
  log(chalk.bold.blue(`${client.user.username} ready!`));
  log(chalk.underline.green(`\n   Commands outputs here   \n`));
  client.user.setActivity(`${PREFIX}help and ${PREFIX}play`, { type: "LISTENING" });
};

function defaultCommand(message) {
  // Test if the command has prefix
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);

  if (!prefixRegex.test(message.content)) return;

  // Test if we match a command
  const [, matchedPrefix] = message.content.match(prefixRegex);
  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  // Check cooldowns
  if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name }));
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Execute the commands
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(chalk.red(error));
    message.reply(i18n.__("common.errorCommend")).catch(console.error);
  }
}

// ---------------------------------------------------------------- Client Events ----------------------------------------------------

client.on("ready", setupMessage);
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

// ------------------------------------------------------------  Import all commands -------------------------------------------------

const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
log(chalk.underline.green(`    Now loading commands    `));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
  log(chalk.bold.yellow(`Command: ${file} loaded`));
}

// ------------------------------------------------------------  Handle all commands -------------------------------------------------

client.on("message", async (message) => {
  if (message.member.voice.channel) {
    switch (message.content) {
      case "/youtube":
        client.discordTogether.createTogetherCode(message.member.voice.channelID, "youtube").then(async (invite) => message.channel.send(`${invite.code}`));
        break;
      case "/poker":
        client.discordTogether.createTogetherCode(message.member.voice.channelID, "poker").then(async (invite) => message.channel.send(`${invite.code}`));
        break;
      case "/ajedrez":
        client.discordTogether.createTogetherCode(message.member.voice.channelID, "chess").then(async (invite) => message.channel.send(`${invite.code}`));
        break;
      case "/amogus":
        client.discordTogether.createTogetherCode(message.member.voice.channelID, "betrayal").then(async (invite) => message.channel.send(`${invite.code}`));
        break;
      case "/fishing":
        client.discordTogether.createTogetherCode(message.member.voice.channelID, "fishing").then(async (invite) => message.channel.send(`${invite.code}`));
        break;
      default:
        defaultCommand(message);
    }
  }
});
