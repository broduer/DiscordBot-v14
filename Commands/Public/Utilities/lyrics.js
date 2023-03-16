const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const lyricsFinder = require("lyrics-finder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Displays information about a given song")
    .setDMPermission(false)
    .addStringOption((options) =>
      options
        .setName("song")
        .setDescription("What is the title of the song?")
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName("artist")
        .setDescription("Who is the artist of the song?")
        .setRequired(true)
    ),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const song = interaction.options.getString("song");
    const artist = interaction.options.getString("artist");

    lyricsFinder(artist, song)
      .then((lyrics) => {
        const lyricsembed = new EmbedBuilder()
          .setDescription(lyrics)
          .setTitle(`Here are the lyrics for **${song}**!`)
          .setTimestamp()
          .setFooter({
            text: "Github -> https://github.com/josephistired",
          })
          .setAuthor({
            name: `${interaction.member.user.tag}`,
            iconURL: `${interaction.user.displayAvatarURL()}`,
          })
          .setColor("Green")
          .addFields(
            {
              name: "Artist:",
              value: `\`\`\`${artist}\`\`\``,
            },
            {
              name: "Song:",
              value: `\`\`\`${song}\`\`\``,
            }
          );

        interaction.reply({
          embeds: [lyricsembed],
          ephemeral: false, // Everyone can see this embed, change this to true if you don't want that.
          components: [
            new ActionRowBuilder().setComponents(
              new ButtonBuilder()
                .setLabel("Lyrics-Finder NPM Package")
                .setStyle(ButtonStyle.Link)
                .setURL("https://www.npmjs.com/package/lyrics-finder")
            ),
          ],
        });
      })
      .catch((error) => {
        const errorEmbed = new EmbedBuilder()
          .setTitle("⛔ Error executing command")
          .setColor("Red")
          .setImage(
            "https://media.tenor.com/fzCt8ROqlngAAAAM/error-error404.gif"
          );

        return interaction.reply({
          embeds: [
            errorEmbed.addFields(
              {
                name: "User:",
                value: `\`\`\`${interaction.user.username}\`\`\``,
              },
              {
                name: "Reasons:",
                value: `\`\`\`Song not found! Try again!\`\`\``,
              }
            ),
          ],
          ephemeral: true,
        });
      });
  },
};
