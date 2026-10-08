const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    PermissionOverwrites
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

        console.log('✅ /setup zaregistrován.');
    } catch (error) {
        console.error('❌ Chyba registrace příkazu:', error);
    }
});

function textChannel(name, category, overwrites = []) {
    return {
        name,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: overwrites
    };
}

function voiceChannel(name, category, overwrites = []) {
    return {
        name,
        type: ChannelType.GuildVoice,
        parent: category,
        permissionOverwrites: overwrites
    };
}

async function createRole(guild, name, color = null, hoist = false) {
    const role = await guild.roles.create({
        name,
        color: color || undefined,
        hoist,
        reason: 'Imperial RP server setup'
    });

    return role;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== 'setup') return;

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Tento příkaz může použít pouze administrátor.',
            ephemeral: true
        });
    }

    await interaction.reply({
        content:
            '⚠️ **POZOR!**\n\n' +
            'Tento setup smaže **všechny současné textové, hlasové a kategorické kanály** na tomto serveru.\n\n' +
            'Za chvíli začne vytváření struktury **Imperial RP**.',
        ephemeral: true
    });

    const guild = interaction.guild;

    try {
        // ==========================================
        // 1. SMAZÁNÍ SOUČASNÝCH KANÁLŮ
        // ==========================================

        console.log('🗑️ Mažu současné kanály...');

        for (const channel of guild.channels.cache.values()) {
            try {
                await channel.delete('Imperial RP server setup');
            } catch (error) {
                console.log(`Nelze smazat ${channel.name}`);
            }
        }

        // ==========================================
        // 2. ROLE
        // ==========================================

        console.log('👑 Vytvářím role...');

        const roles = {};

        roles.owner = await createRole(guild, '👑 Majitel', '#8B0000', true);
        roles.management = await createRole(guild, '🏛️ Vedení', '#8B0000', true);
        roles.headAdmin = await createRole(guild, '🛡️ Head Admin', '#FF0000', true);
        roles.admin = await createRole(guild, '🔨 Administrátor', '#FF4500');
        roles.mod = await createRole(guild, '🔧 Moderátor', '#FFA500');
        roles.support = await createRole(guild, '🎫 Support', '#00AEEF');

        roles.police = await createRole(guild, '👮 Policie', '#0066FF');
        roles.ems = await createRole(guild, '🚑 ZZS EMS', '#FFFFFF');
        roles.fire = await createRole(guild, '🚒 Hasiči', '#FF3300');
        roles.adac = await createRole(guild, '🚗 ADAC', '#FFD700');
        roles.gov = await createRole(guild, '🏛️ Vláda', '#800080');

        roles.verified = await createRole(guild, '✅ Ověřený hráč', '#00AA55');
        roles.member = await createRole(guild, '👤 Občan', '#808080');

        // ==========================================
        // 3. KATEGORIE
        // ==========================================

        console.log('🏗️ Vytvářím kategorie...');

        const categories = {};

        categories.info = await guild.channels.create({
            name: '📌・INFORMACE',
            type: ChannelType.GuildCategory
        });

        categories.community = await guild.channels.create({
            name: '💬・KOMUNITA',
            type: ChannelType.GuildCategory
        });

        categories.rp = await guild.channels.create({
            name: '🎮・IMPERIAL RP',
            type: ChannelType.GuildCategory
        });

        categories.factions = await guild.channels.create({
            name: '👮・FRAKCE',
            type: ChannelType.GuildCategory
        });

        categories.applications = await guild.channels.create({
            name: '📝・PŘIHLÁŠKY',
            type: ChannelType.GuildCategory
        });

        categories.tickets = await guild.channels.create({
            name: '🎫・TICKETY',
            type: ChannelType.GuildCategory
        });

        categories.events = await guild.channels.create({
            name: '🎉・EVENTY',
            type: ChannelType.GuildCategory
        });

        categories.staff = await guild.channels.create({
            name: '🛡️・STAFF',
            type: ChannelType.GuildCategory
        });

        categories.logs = await guild.channels.create({
            name: '📁・LOGY',
            type: ChannelType.GuildCategory
        });

        categories.voice = await guild.channels.create({
            name: '🔊・HLASOVÉ MÍSTNOSTI',
            type: ChannelType.GuildCategory
        });

        // ==========================================
        // 4. INFORMACE
        // ==========================================

        const infoChannels = [
            '📢・oznámení',
            '📜・pravidla',
            '📕・rp-pravidla',
            '📖・jak-začít',
            '📰・novinky',
            '📅・kalendář-eventů',
            '🗺️・mapa-a-info',
            '❓・časté-dotazy'
        ];

        for (const name of infoChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.info.id
            });
        }

        // ==========================================
        // 5. KOMUNITA
        // ==========================================

        const communityChannels = [
            '💬・chat',
            '📸・screeny',
            '🎥・videa',
            '😂・memes',
            '🎵・hudba',
            '💡・návrhy',
            '⭐・pochvaly'
        ];

        for (const name of communityChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.community.id
            });
        }

        // ==========================================
        // 6. IMPERIAL RP
        // ==========================================

        const rpChannels = [
            '🎮・rp-chat',
            '🚗・vozidla',
            '🏢・podniky',
            '🏠・nemovitosti',
            '🗺️・pozemky',
            '📸・rp-media',
            '📋・hlášení',
            '🏆・leaderboard'
        ];

        for (const name of rpChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.rp.id
            });
        }

        // ==========================================
        // 7. FRAKCE
        // ==========================================

        const factionChannels = [
            '🚔・policie',
            '🚑・zzs-ems',
            '🚒・hasiči',
            '🚗・adac',
            '🏛️・vláda',
            '📋・frakční-oznámení'
        ];

        for (const name of factionChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.factions.id
            });
        }

        // ==========================================
        // 8. PŘIHLÁŠKY
        // ==========================================

        const applicationChannels = [
            '📋・přihlášky',
            '👮・policie-nábor',
            '🚑・ems-nábor',
            '🚒・hasiči-nábor',
            '🚗・adac-nábor',
            '🏛️・vláda-nábor',
            '🛡️・staff-nábor'
        ];

        for (const name of applicationChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.applications.id
            });
        }

        // ==========================================
        // 9. TICKETY
        // ==========================================

        const ticketChannels = [
            '🎫・vytvořit-ticket',
            '🆘・podpora',
            '🚨・nahlásit-hráče',
            '⚖️・stížnosti',
            '🔧・technická-podpora',
            '📝・přihlášky'
        ];

        for (const name of ticketChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.tickets.id
            });
        }

        // ==========================================
        // 10. EVENTY
        // ==========================================

        const eventChannels = [
            '🎉・eventy',
            '📅・plánování-eventů',
            '🏆・soutěže',
            '🎁・giveaway'
        ];

        for (const name of eventChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.events.id
            });
        }

        // ==========================================
        // 11. STAFF
        // ==========================================

        const staffChannels = [
            '📢・staff-oznámení',
            '💬・staff-chat',
            '📋・staff-úkoly',
            '📊・staff-statistiky',
            '⚖️・staff-rozhodnutí',
            '🚨・bezpečnost',
            '🔒・vedení'
        ];

        for (const name of staffChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.staff.id
            });
        }

        // ==========================================
        // 12. LOGY
        // ==========================================

        const logChannels = [
            '📥・join-log',
            '📤・leave-log',
            '🔨・moderation-log',
            '🛡️・security-log',
            '🎫・ticket-log',
            '👤・role-log',
            '💬・message-log',
            '⚙️・server-log',
            '🚨・raid-log'
        ];

        for (const name of logChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: categories.logs.id
            });
        }

        // ==========================================
        // 13. HLASOVÉ KANÁLY
        // ==========================================

        const voiceChannels = [
            '🔊・Lobby',
            '🎮・RP 1',
            '🎮・RP 2',
            '🎮・RP 3',
            '🚔・Police RP',
            '🚑・EMS RP',
            '🚒・Hasiči RP',
            '🚗・ADAC RP',
            '🏛️・Vláda RP',
            '🎉・Event 1',
            '🎉・Event 2',
            '🎧・Hudební místnost',
            '🔒・Staff',
            '👑・Vedení'
        ];

        for (const name of voiceChannels) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildVoice,
                parent: categories.voice.id
            });
        }

        // ==========================================
        // 14. UVÍTACÍ ZPRÁVA
        // ==========================================

        const announcement = guild.channels.cache.find(
            c => c.name === '📢・oznámení'
        );

        if (announcement) {
            await announcement.send(
                '╔══════════════════════════════╗\n' +
                '        🏙️ **IMPERIAL RP**\n' +
                '╚══════════════════════════════╝\n\n' +
                'Vítej na oficiálním Discord serveru **Imperial RP**! 🇨🇿\n\n' +
                '🎮 **Emergency Hamburg RP**\n' +
                '👮 Realistické RP\n' +
                '🎉 Komunitní eventy\n' +
                '🛡️ Aktivní staff\n' +
                '🚨 Bezpečný server\n\n' +
                '📜 Nejdříve si přečti pravidla a RP pravidla.\n\n' +
                'Užij si hru a bav se! ❤️'
            );
        }

        console.log('======================================');
        console.log('🎉 IMPERIAL RP SETUP DOKONČEN!');
        console.log('======================================');

        await interaction.followUp({
            content:
                '✅ **HOTOVO!**\n\n' +
                '🏙️ Imperial RP server byl úspěšně vytvořen.\n\n' +
                '🗑️ Staré kanály odstraněny\n' +
                '🏗️ Nové kategorie vytvořeny\n' +
                '💬 Textové kanály vytvořeny\n' +
                '🔊 Hlasové kanály vytvořeny\n' +
                '👑 Role vytvořeny\n' +
                '🎫 Ticket sekce připravena\n' +
                '📁 Logy připraveny\n' +
                '🛡️ Základ zabezpečení připraven\n\n' +
                '🚀 **Imperial RP je připraven!**',
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ SETUP ERROR:', error);

        try {
            await interaction.followUp({
                content:
                    '❌ **Setup se nepodařilo dokončit.**\n\n' +
                    'Zkontroluj, že bot má na serveru oprávnění **Administrator**.\n\n' +
                    'Chyba byla zaznamenána v Railway logu.',
                ephemeral: true
            });
        } catch {}
    }
});

client.login(process.env.DISCORD_TOKEN);
