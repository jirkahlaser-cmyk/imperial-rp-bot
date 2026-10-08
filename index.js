const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ Chybí DISCORD_TOKEN v Railway Variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DATA_FILE = path.join(__dirname, "imperial-data.json");

let data = {
  shifts: {},
  warnings: {}
};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    console.log("⚠️ Data se nepodařilo načíst.");
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* =========================
   IMPERIAL RP ROLE
========================= */

const ROLE_DEFS = [
  ["Owner", 0xff0000, true],
  ["Vedení", 0x8e44ad, true],
  ["Head Admin", 0xe74c3c, true],

  ["TR. Admin", 0xc0392b, true],
  ["ZK. Admin", 0xd35400, true],
  ["JR. Admin", 0xf39c12, true],
  ["ADV. JR. Admin", 0xf1c40f, true],

  ["Media Admin", 0x3498db, false],
  ["Event Admin", 0x9b59b6, false],

  ["Moderátor", 0x2ecc71, false],
  ["Support", 0x1abc9c, false],

  ["Police", 0x2980b9, false],
  ["EMS", 0xe91e63, false],
  ["Fire", 0xe67e22, false],
  ["ADAC", 0xf1c40f, false],
  ["Vláda", 0x34495e, false],

  ["Verified", 0x95a5a6, false],
  ["Občan", 0x7f8c8d, false]
];

const STAFF_ROLES = [
  "Owner",
  "Vedení",
  "Head Admin",
  "TR. Admin",
  "ZK. Admin",
  "JR. Admin",
  "ADV. JR. Admin",
  "Media Admin",
  "Event Admin",
  "Moderátor",
  "Support"
];

const SENIOR_ROLES = [
  "Owner",
  "Vedení",
  "Head Admin"
];

const ADMIN_ROLES = [
  "Owner",
  "Vedení",
  "Head Admin",
  "TR. Admin",
  "ZK. Admin",
  "JR. Admin",
  "ADV. JR. Admin"
];

/* =========================
   HELPERS
========================= */

function isStaff(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    STAFF_ROLES.some(role =>
      member.roles.cache.some(r => r.name === role)
    )
  );
}

function isSenior(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    SENIOR_ROLES.some(role =>
      member.roles.cache.some(r => r.name === role)
    )
  );
}

async function createRole(guild, name, color, hoist) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      hoist,
      reason: "Imperial RP V2"
    });

    console.log(`✅ Role vytvořena: ${name}`);
  }

  return role;
}

async function createCategory(guild, name, overwrites = undefined) {
  let category = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildCategory &&
      c.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites
    });
  }

  return category;
}

async function createText(guild, name, category) {
  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildText &&
      c.name === name &&
      c.parentId === category.id
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category.id
    });
  }

  return channel;
}

async function createVoice(guild, name, category) {
  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildVoice &&
      c.name === name &&
      c.parentId === category.id
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: category.id
    });
  }

  return channel;
}

function privatePermissions(guild, roleNames) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    }
  ];

  for (const roleName of roleNames) {
    const role = guild.roles.cache.find(
      r => r.name === roleName
    );

    if (role) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }
  }

  return overwrites;
}

function embed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({
      text: "Imperial RP • Official System"
    });
}

/* =========================
   UPGRADE SERVER
========================= */

async function upgradeServer(guild) {

  console.log("🚀 Spouštím Imperial RP V2...");

  /* ROLES */

  for (const [name, color, hoist] of ROLE_DEFS) {
    await createRole(
      guild,
      name,
      color,
      hoist
    );
  }

  /* =====================
     INFORMACE
  ===================== */

  const info = await createCategory(
    guild,
    "📌 INFORMACE"
  );

  await createText(guild, "📢・oznámení", info);
  await createText(guild, "📜・pravidla", info);
  await createText(guild, "🚔・rp-pravidla", info);
  await createText(guild, "❓・jak-začít", info);
  await createText(guild, "📰・novinky", info);
  await createText(guild, "ℹ️・server-info", info);

  /* =====================
     COMMUNITY
  ===================== */

  const community = await createCategory(
    guild,
    "🌆 IMPERIAL COMMUNITY"
  );

  await createText(guild, "💬・chat", community);
  await createText(guild, "🖼️・galerie", community);
  await createText(guild, "🎥・videa", community);
  await createText(guild, "😂・memy", community);
  await createText(guild, "💡・návrhy", community);
  await createText(guild, "⭐・pochvaly", community);

  await createVoice(
    guild,
    "🔊・Komunitní místnost",
    community
  );

  /* =====================
     IMPERIAL RP
  ===================== */

  const rp = await createCategory(
    guild,
    "🎮 IMPERIAL RP"
  );

  await createText(guild, "💬・rp-chat", rp);
  await createText(guild, "🚨・report-hry", rp);
  await createText(guild, "🚗・vozidla", rp);
  await createText(guild, "🏠・nemovitosti", rp);
  await createText(guild, "🏢・firmy", rp);
  await createText(guild, "🌳・pozemky", rp);
  await createText(guild, "🏆・rp-leaderboard", rp);

  /* =====================
     FRAKCE
  ===================== */

  const factions = await createCategory(
    guild,
    "👮 STÁTNÍ SLOŽKY"
  );

  await createText(guild, "🚔・policie", factions);
  await createText(guild, "🚑・ems", factions);
  await createText(guild, "🚒・hasiči", factions);
  await createText(guild, "🚗・adac", factions);
  await createText(guild, "🏛️・vláda", factions);

  /* =====================
     NÁBOR
  ===================== */

  const recruitment = await createCategory(
    guild,
    "📝 NÁBOR"
  );

  const adminApply =
    await createText(
      guild,
      "📝・admin-přihláška",
      recruitment
    );

  await createText(
    guild,
    "🛡️・moderátor-přihláška",
    recruitment
  );

  await createText(
    guild,
    "🎫・support-přihláška",
    recruitment
  );

  await createText(
    guild,
    "🎥・media-přihláška",
    recruitment
  );

  await createText(
    guild,
    "🎉・event-přihláška",
    recruitment
  );

  await createText(
    guild,
    "🚔・frakční-přihlášky",
    recruitment
  );

  /* =====================
     SUPPORT
  ===================== */

  const support =
    await createCategory(
      guild,
      "🎫 PODPORA"
    );

  const ticket =
    await createText(
      guild,
      "🎫・vytvořit-ticket",
      support
    );

  await createText(
    guild,
    "📋・ticket-log",
    support
  );

  /* =====================
     ADMINISTRACE
  ===================== */

  const admin =
    await createCategory(
      guild,
      "🔐 ADMINISTRACE",
      privatePermissions(
        guild,
        STAFF_ROLES
      )
    );

  await createText(
    guild,
    "📢・admin-oznámení",
    admin
  );

  await createText(
    guild,
    "💬・admin-chat",
    admin
  );

  await createText(
    guild,
    "📋・admin-úkoly",
    admin
  );

  await createText(
    guild,
    "🚨・admin-reporty",
    admin
  );

  await createText(
    guild,
    "🎫・admin-tickety",
    admin
  );

  await createText(
    guild,
    "📊・admin-statistiky",
    admin
  );

  await createText(
    guild,
    "🕐・admin-směny",
    admin
  );

  /* =====================
     VEDENÍ
  ===================== */

  const leadership =
    await createCategory(
      guild,
      "👑 VEDENÍ",
      privatePermissions(
        guild,
        SENIOR_ROLES
      )
    );

  await createText(
    guild,
    "👑・vedení-chat",
    leadership
  );

  await createText(
    guild,
    "📋・vedení-úkoly",
    leadership
  );

  await createText(
    guild,
    "📊・vedení-statistiky",
    leadership
  );

  await createText(
    guild,
    "🔒・důvěrné",
    leadership
  );

  await createText(
    guild,
    "🗳️・hlasování",
    leadership
  );

  /* =====================
     SECURITY
  ===================== */

  const security =
    await createCategory(
      guild,
      "🚨 SECURITY",
      privatePermissions(
        guild,
        ADMIN_ROLES
      )
    );

  await createText(
    guild,
    "🛡️・security",
    security
  );

  const antiRaid =
    await createText(
      guild,
      "🚨・anti-raid",
      security
    );

  await createText(
    guild,
    "☢️・anti-nuke",
    security
  );

  await createText(
    guild,
    "📋・security-log",
    security
  );

  /* =====================
     MEDIA
  ===================== */

  const media =
    await createCategory(
      guild,
      "🎥 MEDIA TEAM",
      privatePermissions(
        guild,
        [
          "Owner",
          "Vedení",
          "Head Admin",
          "Media Admin"
        ]
      )
    );

  await createText(
    guild,
    "🎥・media-chat",
    media
  );

  await createText(
    guild,
    "📅・media-plánování",
    media
  );

  await createText(
    guild,
    "💡・media-návrhy",
    media
  );

  await createText(
    guild,
    "📁・media-archiv",
    media
  );

  /* =====================
     LOGY
  ===================== */

  const logs =
    await createCategory(
      guild,
      "📁 LOGY",
      privatePermissions(
        guild,
        ADMIN_ROLES
      )
    );

  await createText(
    guild,
    "👤・joins-leaves",
    logs
  );

  await createText(
    guild,
    "🔨・moderace",
    logs
  );

  await createText(
    guild,
    "🎭・role-log",
    logs
  );

  await createText(
    guild,
    "💬・message-log",
    logs
  );

  await createText(
    guild,
    "🎫・ticket-log",
    logs
  );

  await createText(
    guild,
    "🛡️・security-log",
    logs
  );

  await createText(
    guild,
    "🚨・raid-log",
    logs
  );

  await createText(
    guild,
    "⚙️・server-log",
    logs
  );

  /* =====================
     TICKET PANEL
  ===================== */

  await ticket.send({
    embeds: [
      embed(
        "🎫 IMPERIAL RP • PODPORA",
        "Potřebuješ pomoc? Vyber typ ticketu níže.\n\n" +
        "🆘 **Podpora**\n" +
        "🚨 **Report hráče**\n" +
        "⚠️ **Stížnost**\n" +
        "🔧 **Technický problém**\n\n" +
        "Prosíme, vytvářej tickety pouze pokud je opravdu potřebuješ."
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_support")
          .setLabel("🆘 Podpora")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("ticket_report")
          .setLabel("🚨 Report")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("ticket_complaint")
          .setLabel("⚠️ Stížnost")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("ticket_tech")
          .setLabel("🔧 Technický problém")
          .setStyle(ButtonStyle.Success)
      )
    ]
  });

  /* =====================
     ADMIN PŘIHLÁŠKA
  ===================== */

  await adminApply.send({
    embeds: [
      embed(
        "🛡️ IMPERIAL RP • ADMIN NÁBOR",
        "Chceš se přidat do našeho administračního týmu?\n\n" +
        "**Možné hodnosti:**\n" +
        "🟢 ADV. JR. Admin\n" +
        "🟡 JR. Admin\n" +
        "🟠 ZK. Admin\n" +
        "🔴 TR. Admin\n" +
        "🛡️ Head Admin\n\n" +
        "Klikni na tlačítko a vytvoř si vlastní přihlášku."
      )
    ],

    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("apply_admin")
          .setLabel("📝 Podat přihlášku")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });

  /* =====================
     SECURITY PANEL
  ===================== */

  await antiRaid.send({
    embeds: [
      embed(
        "🚨 IMPERIAL SECURITY",
        "Bezpečnostní centrum serveru.\n\n" +
        "🛡️ **Anti-Raid:** monitoring připojení\n" +
        "☢️ **Anti-Nuke:** ochrana serveru\n" +
        "📋 **Logs:** aktivní\n" +
        "🔒 **Lockdown:** dostupný staffu\n\n" +
        "⚠️ Při podezřelé aktivitě kontaktujte vedení."
      )
    ]
  });

  console.log("✅ Imperial RP V2 dokončeno.");
}

/* =========================
   SHIFT SYSTEM
========================= */

function getShift(userId) {
  if (!data.shifts[userId]) {
    data.shifts[userId] = {
      total: 0,
      shifts: 0,
      active: null
    };
  }

  return data.shifts[userId];
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  return `${hours} h ${minutes % 60} min`;
}

/* =========================
   SLASH COMMANDS
========================= */

const commands = [

  new SlashCommandBuilder()
    .setName("upgrade")
    .setDescription("Vylepší Imperial RP server."),

  new SlashCommandBuilder()
    .setName("startshift")
    .setDescription("Spustí staff směnu."),

  new SlashCommandBuilder()
    .setName("endshift")
    .setDescription("Ukončí staff směnu."),

  new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Zobrazí tvoje statistiky."),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Zobrazí staff leaderboard."),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Udělí varování.")
    .addUserOption(option =>
      option
        .setName("uživatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("důvod")
        .setDescription("Důvod")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Smaže zprávy.")
    .addIntegerOption(option =>
      option
        .setName("počet")
        .setDescription("1–100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Vyhodí uživatele.")
    .addUserOption(option =>
      option
        .setName("uživatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("důvod")
        .setDescription("Důvod")
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Zabanuje uživatele.")
    .addUserOption(option =>
      option
        .setName("uživatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("důvod")
        .setDescription("Důvod")
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Dá timeout.")
    .addUserOption(option =>
      option
        .setName("uživatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minuty")
        .setDescription("Počet minut")
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Uzamkne aktuální kanál.")
    .addBooleanOption(option =>
      option
        .setName("zapnout")
        .setDescription("true = zamknout")
        .setRequired(true)
    )

].map(command => command.toJSON());

/* =========================
   READY
========================= */

client.once(Events.ClientReady, async () => {

  console.log(
    `🟢 Imperial RP online jako ${client.user.tag}`
  );

  const rest = new REST({ version: "10" })
    .setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    {
      body: commands
    }
  );

  console.log("✅ Slash commands registrovány.");
});

/* =========================
   INTERACTIONS
========================= */

client.on(
  Events.InteractionCreate,
  async interaction => {

    try {

      /* COMMANDS */

      if (interaction.isChatInputCommand()) {

        const command = interaction.commandName;

        /* UPGRADE */

        if (command === "upgrade") {

          if (!isSenior(interaction.member)) {
            return interaction.reply({
              content:
                "❌ Tento příkaz je pouze pro vedení.",
              ephemeral: true
            });
          }

          await interaction.deferReply({
            ephemeral: true
          });

          await upgradeServer(
            interaction.guild
          );

          return interaction.editReply(
            "🚀 **Imperial RP V2 je hotové!**\n\n" +
            "Byla vytvořena staff hierarchie, nábor, směny, tickety, Security, logy, Media Team a další systémy."
          );
        }

        /* STAFF CHECK */

        if (
          [
            "startshift",
            "endshift",
            "shift",
            "leaderboard"
          ].includes(command)
        ) {

          if (!isStaff(interaction.member)) {
            return interaction.reply({
              content:
                "❌ Tento příkaz je pouze pro staff.",
              ephemeral: true
            });
          }
        }

        /* START SHIFT */

        if (command === "startshift") {

          const shift =
            getShift(interaction.user.id);

          if (shift.active) {
            return interaction.reply({
              content:
                "🟢 Směnu už máš spuštěnou.",
              ephemeral: true
            });
          }

          shift.active = Date.now();

          saveData();

          return interaction.reply({
            embeds: [
              embed(
                "🟢 SMĚNA SPUŠTĚNA",
                `${interaction.user}\n\n` +
                "Tvoje staff směna právě začala."
              )
            ]
          });
        }

        /* END SHIFT */

        if (command === "endshift") {

          const shift =
            getShift(interaction.user.id);

          if (!shift.active) {
            return interaction.reply({
              content:
                "🔴 Nemáš aktivní směnu.",
              ephemeral: true
            });
          }

          const time =
            Date.now() - shift.active;

          shift.total += time;
          shift.shifts++;
          shift.active = null;

          saveData();

          return interaction.reply({
            embeds: [
              embed(
                "🔴 SMĚNA UKONČENA",
                `${interaction.user}\n\n` +
                `⏱️ Tato směna: **${formatTime(time)}**\n` +
                `📊 Celkem: **${formatTime(shift.total)}**\n` +
                `📋 Směn: **${shift.shifts}**`
              )
            ]
          });
        }

        /* SHIFT */

        if (command === "shift") {

          const shift =
            getShift(interaction.user.id);

          let total = shift.total;

          if (shift.active) {
            total +=
              Date.now() - shift.active;
          }

          return interaction.reply({
            embeds: [
              embed(
                "📊 TVOJE STAFF STATISTIKY",
                `🕐 Celkový čas: **${formatTime(total)}**\n` +
                `📋 Počet směn: **${shift.shifts}**\n\n` +
                (
                  shift.active
                    ? "🟢 Aktuálně jsi na směně."
                    : "🔴 Aktuálně nejsi na směně."
                )
              )
            ],
            ephemeral: true
          });
        }

        /* LEADERBOARD */

        if (command === "leaderboard") {

          const users =
            Object.entries(data.shifts)
              .sort(
                (a, b) =>
                  b[1].total -
                  a[1].total
              )
              .slice(0, 10);

          let text = "";

          users.forEach(
            ([id, shift], index) => {

              text +=
                `**${index + 1}.** <@${id}> — ` +
                `**${formatTime(shift.total)}** ` +
                `(${shift.shifts} směn)\n`;
            }
          );

          if (!text) {
            text =
              "Zatím nejsou žádné směnové statistiky.";
          }

          return interaction.reply({
            embeds: [
              embed(
                "🏆 IMPERIAL RP • STAFF LEADERBOARD",
                text
              )
            ]
          });
        }

        /* MODERATION */

        if (
          [
            "warn",
            "clear",
            "kick",
            "ban",
            "timeout",
            "lockdown"
          ].includes(command)
        ) {

          if (!isStaff(interaction.member)) {
            return interaction.reply({
              content:
                "❌ Tento příkaz je pouze pro staff.",
              ephemeral: true
            });
          }
        }

        /* WARN */

        if (command === "warn") {

          const user =
            interaction.options.getUser(
              "uživatel"
            );

          const reason =
            interaction.options.getString(
              "důvod"
            );

          if (!data.warnings[user.id]) {
            data.warnings[user.id] = [];
          }

          data.warnings[user.id].push({
            reason,
            staff: interaction.user.id,
            date: Date.now()
          });

          saveData();

          return interaction.reply({
            embeds: [
              embed(
                "⚠️ VAROVÁNÍ",
                `${user} dostal/a varování.\n\n` +
                `**Důvod:** ${reason}\n` +
                `**Staff:** ${interaction.user}`
              )
            ]
          });
        }

        /* CLEAR */

        if (command === "clear") {

          const amount =
            interaction.options.getInteger(
              "počet"
            );

          const messages =
            await interaction.channel.bulkDelete(
              amount,
              true
            );

          return interaction.reply({
            content:
              `🧹 Smazáno **${messages.size}** zpráv.`,
            ephemeral: true
          });
        }

        /* KICK */

        if (command === "kick") {

          const user =
            interaction.options.getUser(
              "uživatel"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member || !member.kickable) {
            return interaction.reply({
              content:
                "❌ Toho uživatele nemohu vyhodit.",
              ephemeral: true
            });
          }

          const reason =
            interaction.options.getString(
              "důvod"
            ) || "Bez důvodu";

          await member.kick(reason);

          return interaction.reply({
            embeds: [
              embed(
                "👢 KICK",
                `${user} byl/a vyhozen/a.\n\n` +
                `**Důvod:** ${reason}`
              )
            ]
          });
        }

        /* BAN */

        if (command === "ban") {

          const user =
            interaction.options.getUser(
              "uživatel"
            );

          const reason =
            interaction.options.getString(
              "důvod"
            ) || "Bez důvodu";

          await interaction.guild.members.ban(
            user.id,
            { reason }
          );

          return interaction.reply({
            embeds: [
              embed(
                "🔨 BAN",
                `${user} byl/a zabanován/a.\n\n` +
                `**Důvod:** ${reason}`
              )
            ]
          });
        }

        /* TIMEOUT */

        if (command === "timeout") {

          const user =
            interaction.options.getUser(
              "uživatel"
            );

          const minutes =
            interaction.options.getInteger(
              "minuty"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member || !member.moderatable) {
            return interaction.reply({
              content:
                "❌ Tohoto uživatele nemohu timeoutovat.",
              ephemeral: true
            });
          }

          await member.timeout(
            minutes * 60 * 1000,
            "Imperial RP staff"
          );

          return interaction.reply(
            `🔇 ${user} dostal/a timeout na **${minutes} minut**.`
          );
        }

        /* LOCKDOWN */

        if (command === "lockdown") {

          const enabled =
            interaction.options.getBoolean(
              "zapnout"
            );

          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
              SendMessages: !enabled
            }
          );

          return interaction.reply({
            embeds: [
              embed(
                enabled
                  ? "🔒 LOCKDOWN"
                  : "🔓 LOCKDOWN UKONČEN",
                enabled
                  ? "Tento kanál byl uzamčen."
                  : "Tento kanál byl znovu otevřen."
              )
            ]
          });
        }
      }

      /* =========================
         BUTTONS
      ========================= */

      if (interaction.isButton()) {

        const id =
          interaction.customId;

        /* TICKET */

        if (
          [
            "ticket_support",
            "ticket_report",
            "ticket_complaint",
            "ticket_tech"
          ].includes(id)
        ) {

          const names = {
            ticket_support:
              "podpora",
            ticket_report:
              "report",
            ticket_complaint:
              "stiznost",
            ticket_tech:
              "technicky-problem"
          };

          const existing =
            interaction.guild.channels.cache.find(
              c =>
                c.topic ===
                `ticket:${interaction.user.id}`
            );

          if (existing) {
            return interaction.reply({
              content:
                `❌ Už máš otevřený ticket: ${existing}`,
              ephemeral: true
            });
          }

          const category =
            interaction.guild.channels.cache.find(
              c =>
                c.type ===
                  ChannelType.GuildCategory &&
                c.name ===
                  "🎫 PODPORA"
            );

          const overwrites = [
            {
              id:
                interaction.guild.roles.everyone.id,
              deny: [
                PermissionFlagsBits.ViewChannel
              ]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            }
          ];

          for (const roleName of STAFF_ROLES) {

            const role =
              interaction.guild.roles.cache.find(
                r =>
                  r.name === roleName
              );

            if (role) {

              overwrites.push({
                id: role.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory
                ]
              });

            }
          }

          const channel =
            await interaction.guild.channels.create(
              {
                name:
                  `ticket-${names[id]}`,
                type:
                  ChannelType.GuildText,
                parent:
                  category?.id,
                topic:
                  `ticket:${interaction.user.id}`,
                permissionOverwrites:
                  overwrites
              }
            );

          await channel.send({
            embeds: [
              embed(
                "🎫 IMPERIAL RP • TICKET",
                `Ahoj ${interaction.user}!\n\n` +
                "Popiš svůj problém co nejpodrobněji.\n" +
                "Staff se ti co nejdříve ozve."
              )
            ],
            components: [
              new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(
                      "close_ticket"
                    )
                    .setLabel(
                      "🔒 Zavřít ticket"
                    )
                    .setStyle(
                      ButtonStyle.Danger
                    )
                )
            ]
          });

          return interaction.reply({
            content:
              `✅ Ticket vytvořen: ${channel}`,
            ephemeral: true
          });
        }

        /* CLOSE TICKET */

        if (id === "close_ticket") {

          if (
            !isStaff(
              interaction.member
            )
          ) {

            return interaction.reply({
              content:
                "❌ Ticket může zavřít pouze staff.",
              ephemeral: true
            });

          }

          await interaction.reply(
            "🔒 Ticket bude za 5 sekund uzavřen."
          );

          setTimeout(
            () =>
              interaction.channel
                .delete()
                .catch(() => {}),
            5000
          );

          return;
        }

        /* ADMIN APPLICATION */

        if (id === "apply_admin") {

          const existing =
            interaction.guild.channels.cache.find(
              c =>
                c.topic ===
                `application:${interaction.user.id}`
            );

          if (existing) {

            return interaction.reply({
              content:
                `❌ Přihlášku už máš: ${existing}`,
              ephemeral: true
            });

          }

          const recruitment =
            interaction.guild.channels.cache.find(
              c =>
                c.type ===
                  ChannelType.GuildCategory &&
                c.name ===
                  "📝 NÁBOR"
            );

          const overwrites = [
            {
              id:
                interaction.guild.roles.everyone.id,
              deny: [
                PermissionFlagsBits.ViewChannel
              ]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            }
          ];

          for (const roleName of STAFF_ROLES) {

            const role =
              interaction.guild.roles.cache.find(
                r =>
                  r.name === roleName
              );

            if (role) {

              overwrites.push({
                id: role.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory
                ]
              });

            }
          }

          const application =
            await interaction.guild.channels.create(
              {
                name:
                  `prihlaska-${interaction.user.username}`
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9-]/g,
                      ""
                    )
                    .slice(0, 70),
                type:
                  ChannelType.GuildText,
                parent:
                  recruitment?.id,
                topic:
                  `application:${interaction.user.id}`,
                permissionOverwrites:
                  overwrites
              }
            );

          await application.send({
            embeds: [
              embed(
                "📝 ADMIN PŘIHLÁŠKA",
                `${interaction.user}\n\n` +

                "**1️⃣ Kolik ti je let?**\n\n" +
                "**2️⃣ Jak dlouho hraješ Emergency Hamburg?**\n\n" +
                "**3️⃣ Máš zkušenosti s administrací?**\n\n" +
                "**4️⃣ Proč chceš být adminem?**\n\n" +
                "**5️⃣ Jak bys řešil konflikt mezi hráči?**\n\n" +
                "**6️⃣ Kolik času můžeš věnovat Imperial RP?**\n\n" +
                "**7️⃣ O jakou hodnost žádáš?**\n\n" +

                "Po vyplnění přihlášku posoudí vedení."
              )
            ]
          });

          return interaction.reply({
            content:
              `✅ Tvoje přihláška byla vytvořena: ${application}`,
            ephemeral: true
          });
        }

      }

    } catch (error) {

      console.error(
        "❌ ERROR:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({
          content:
            "❌ Nastala chyba. Podívej se do Railway Logs.",
          ephemeral: true
        }).catch(() => {});

      }

    }

  }
);

/* =========================
   JOIN / LEAVE LOG
========================= */

client.on(
  Events.GuildMemberAdd,
  async member => {

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "👤・joins-leaves"
      );

    if (channel) {

      await channel.send(
        `🟢 **JOIN**\n${member.user.tag}\nID: ${member.id}`
      ).catch(() => {});

    }
  }
);

client.on(
  Events.GuildMemberRemove,
  async member => {

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "👤・joins-leaves"
      );

    if (channel) {

      await channel.send(
        `🔴 **LEAVE**\n${member.user.tag}\nID: ${member.id}`
      ).catch(() => {});

    }
  }
);

/* =========================
   ANTI RAID ALERT
========================= */

const joins = new Map();

client.on(
  Events.GuildMemberAdd,
  async member => {

    const now = Date.now();

    let list =
      joins.get(
        member.guild.id
      ) || [];

    list =
      list.filter(
        time =>
          now - time < 15000
      );

    list.push(now);

    joins.set(
      member.guild.id,
      list
    );

    if (list.length >= 8) {

      const channel =
        member.guild.channels.cache.find(
          c =>
            c.name ===
            "🚨・anti-raid"
        );

      if (channel) {

        await channel.send({
          embeds: [
            embed(
              "🚨 ANTI-RAID ALERT",
              `Během posledních 15 sekund se připojilo **${list.length} členů**.\n\n` +
              "⚠️ Doporučení: vedení by mělo situaci zkontrolovat."
            )
          ]
        }).catch(() => {});

      }

    }

  }
);

/* =========================
   START BOT
========================= */

client.login(TOKEN);
