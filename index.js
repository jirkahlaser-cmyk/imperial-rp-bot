const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Nastaví celý Imperial RP server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`✅ Imperial RP Bot je online jako ${client.user.tag}`);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('✅ Příkaz /setup byl zaregistrován.');
    } catch (error) {
        console.error('❌ Chyba při registraci příkazu:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'setup') {
        await interaction.reply({
            content: '🛠️ Imperial RP setup je připraven. Další krok bude vytvoření kategorií, kanálů, rolí a zabezpečení.',
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
