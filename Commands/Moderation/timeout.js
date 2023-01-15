const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} = require("discord.js");
const { connection } = require("mongoose");
const Database = require("../../Schemas/infractions");
const ms = require("ms");
const logChannel = require("../../src/index.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeouts a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((options) =>
      options
        .setName("user")
        .setDescription("Select the user")
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName("duration")
        .setDescription("Give the timeout a duration (1m, 1h, 1d).")
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName("reason")
        .setDescription("The reason for the timeout of this user?")
        .setMaxLength(512)
    ),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const { options, guild, member } = interaction;

    const user = options.getMember("user");
    const duration = options.getString("duration");
    const reason = options.getString("reason") || "Not specified";

    const logChannel = interaction.guild.channels.cache.get(
      "1064030969176277073"
    ); // CHANGE TO YOUR LOGGING CHANNEL

    const errorsArray = [];

    const errorEmbed = new EmbedBuilder()
      .setTitle("⛔ Error executing command")
      .setColor("Red")
      .setImage("https://media.tenor.com/fzCt8ROqlngAAAAM/error-error404.gif");

    if (!user)
      return interaction.reply({
        embeds: [
          errorEmbed.setDescription(
            "The user has most likely abandoned the server."
          ),
        ],
        ephemeral: true,
      });

    if (!ms(duration) || ms(duration) > ms("28d"))
      errorsArray.push("Invade Duration / Also Exceeds the 28-Day Limit.");

    if (!user.manageable || !user.moderatable)
      errorsArray.push("This bot cannot moderate the selected user.");

    if (member.roles.highest.position < user.roles.highest.position)
      errorsArray.push("Selected user has a higher role than you.");

    if (errorsArray.length)
      return interaction.reply({
        embeds: [
          errorEmbed.addFields(
            {
              name: "User:",
              value: `\`\`\`${interaction.user.username}\`\`\``,
            },
            {
              name: "Reasons:",
              value: `\`\`\`${errorsArray.join("\n")}\`\`\``,
            }
          ),
        ],
        ephemeral: true,
      });

    user.timeout(ms(duration), reason).catch((err) => {
      interaction.reply({
        embeds: [
          errorEmbed.setDescription(
            "Due to an unknown error, we were unable to timeout the user."
          ),
        ],
      });
      return console.log("Error occured in timeout.js", err);
    });

    const newInfractionObject = {
      IssuerID: member.id,
      IssuerTag: member.user.tag,
      Reason: reason,
      Date: Date.now(),
    };

    let userData = await Database.findOne({ Guild: guild.id, User: user.id });
    if (!userData)
      userData = await Database.create({
        Guild: guild.id,
        User: user.id,
        Infractions: [newInfractionObject],
      });
    else
      userData.Infractions.push(newInfractionObject) && (await userData.save());

    const successEmbed = new EmbedBuilder().setColor("Green");
    const logEmbed = new EmbedBuilder()
      .setColor("Green")
      .setAuthor({ name: "⌛ Timeout Command Executed!" })
      .setTimestamp()
      .addFields(
        {
          name: "👤 User:",
          value: `\`\`\`${user.user.tag}\`\`\``,
        },
        {
          name: "🎟️ Infraction total:",
          value: `\`\`\`${userData.Infractions.length} Infractions\`\`\``,
        },
        {
          name: "⌚ Duration:",
          value: `\`\`\`${ms(ms(duration, { long: true }))}\`\`\``,
        },
        {
          name: "❔ Reason:",
          value: `\`\`\`${reason}\`\`\``,
        },
        {
          name: "👮🏻 Moderator:",
          value: `\`\`\`${member.user.username}\`\`\``,
        }
      );

    return (
      interaction.reply({
        embeds: [
          successEmbed.setDescription(
            `⌛ \n Timeouted \`${user.user.tag} for ${ms(
              ms(duration, { long: true })
            )}!\` `
          ),
        ],
        ephemeral: true,
      }),
      logChannel.send({
        embeds: [logEmbed],
      })
    );
  },
};
