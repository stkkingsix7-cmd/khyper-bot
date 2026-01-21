require("dotenv").config();
const express = require("express");
const app = express();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// Configurar el cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Servidor web con Express para mantener la aplicación viva en Render
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot Khyper activo 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor web escuchando en el puerto ${PORT}`);
});

// Canales y configuración
const CANAL_COMPRAS = "1436800312399757473";
const CANAL_BIENVENIDAS = "1339682582886879254";
const OWNER_ID = "1232431026802917467"; // Reemplaza con tu ID de dueño

// ================= READY =================
client.once("ready", async () => {
  console.log(`🤖 Khyper listo como ${client.user.tag}`);
  client.user.setActivity("KHYPER SHOP", { type: 3 });

  const commands = [
    new SlashCommandBuilder()
      .setName("ticketpanel")
      .setDescription("Mostrar panel de tickets"),
    new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Información del bot"),
    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Banear a un usuario")
      .addUserOption(opt =>
        opt.setName("usuario")
          .setDescription("Usuario a banear")
          .setRequired(true))
      .addStringOption(opt =>
        opt.setName("razon")
          .setDescription("Razón del baneo")
          .setRequired(false))
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("⏳ Registrando slash commands...");
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands listos.");
  } catch (e) {
    console.error("❌ Error registrando comandos:", e);
  }
});

// ================= BIENVENIDAS =================
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(CANAL_BIENVENIDAS);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor("#9b59b6")
    .setTitle("🎉 ¡Bienvenido a Khyper Shop!")
    .setDescription(
      `Hola ${member}, bienvenido a **Khyper Shop** 🛒\n\n` +
      `Para realizar una compra ve al canal:\n` +
      `➡️ <#${CANAL_COMPRAS}>\n\n` +
      `¡Gracias por unirte y disfruta la tienda!`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: "Khyper Shop • Tienda Oficial" });

  channel.send({ embeds: [embed] });
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    // /ticketpanel
    if (cmd === "ticketpanel") {
      const embed = new EmbedBuilder()
        .setColor("#3498db")
        .setTitle("🎫 Sistema de Tickets — Khyper Shop")
        .setDescription(
          "Selecciona una opción:\n\n" +
          "🛒 **Compras** — Soporte para pedidos\n" +
          "🛠 **Soporte** — Ayuda general"
        )
        .setFooter({ text: "Khyper Shop" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_compras")
          .setLabel("🛒 Compras")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ticket_soporte")
          .setLabel("🛠 Soporte")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // /stats
    if (cmd === "stats") {
      const embed = new EmbedBuilder()
        .setColor("#2ecc71")
        .setTitle("📊 Información del Bot")
        .addFields(
          { name: "🤖 Nombre", value: client.user.username, inline: true },
          { name: "🆔 ID", value: client.user.id, inline: true },
          { name: "👥 Servidores", value: `${client.guilds.cache.size}`, inline: true },
          { name: "⏱ Uptime", value: `${Math.floor(client.uptime / 1000)} segundos`, inline: true },
          { name: "📦 Discord.js", value: "v14", inline: true },
          { name: "⚙️ Ping", value: `${client.ws.ping}ms`, inline: true }
        )
        .setFooter({ text: "Khyper Shop Bot" });

      return interaction.reply({ embeds: [embed] });
    }

    // /ban
    if (cmd === "ban") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return interaction.reply({ content: "❌ No tienes permisos para banear.", ephemeral: true });
      }

      const user = interaction.options.getUser("usuario");
      const reason = interaction.options.getString("razon") || "Sin razón especificada";

      try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.ban({ reason });

        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("🔨 Usuario Baneado")
          .addFields(
            { name: "Usuario", value: `${user.tag}` },
            { name: "Razón", value: reason }
          )
          .setFooter({ text: "Khyper Moderación" });

        return interaction.reply({ embeds: [embed] });
      } catch (err) {
        return interaction.reply({ content: "❌ No pude banear a ese usuario.", ephemeral: true });
      }
    }
  }

  // ---------- BOTONES ----------
  if (interaction.isButton()) {
    const guild = interaction.guild;
    const user = interaction.user;

    if (interaction.customId === "ticket_compras" || interaction.customId === "ticket_soporte") {
      let nombre = "";
      let tipo = "";

      if (interaction.customId === "ticket_compras") {
        nombre = `🛒-${user.username}`;
        tipo = "Compras";
      }

      if (interaction.customId === "ticket_soporte") {
        nombre = `🛠-${user.username}`;
        tipo = "Soporte";
      }

      const channel = await guild.channels.create({
        name: nombre,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }
        ]
      });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cerrar_ticket")
          .setLabel("🔒 Cerrar Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setColor("#f1c40f")
        .setTitle(`🎫 Ticket de ${tipo}`)
        .setDescription(
          `Hola ${user}, gracias por abrir un ticket.\n\n` +
          `📌 Tipo: **${tipo}**\n\n` +
          `Un staff te atenderá pronto.\n\n` +
          `Cuando termine, pulsa **Cerrar Ticket**.`
        )
        .setFooter({ text: "Khyper Shop • Soporte" });

      channel.send({ content: `${user}`, embeds: [embed], components: [closeRow] });

      return interaction.reply({
        content: `✅ Tu ticket fue creado: ${channel}`,
        ephemeral: true
      });
    }

    if (interaction.customId === "cerrar_ticket") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
          content: "❌ Solo el staff puede cerrar tickets.",
          ephemeral: true
        });
      }

      await interaction.reply({ content: "🔒 Cerrando ticket en 5 segundos..." });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }
});

// Iniciar el bot con el token de Discord
client.login(process.env.TOKEN);
