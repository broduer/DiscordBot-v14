const { EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");
const Database = require("../../../schemas/welcome");

module.exports = {
  subCommand: "welcome.setup",
  /**
   * @param {ChatInputCommandInteraction} interaction
   *
   */
  async execute(interaction) {
    const { options } = interaction;

    const channelObject = options.getChannel("welcome-channel");
    const messageObject = options.getString("welcome-message");
    const colorObject = options.getString("welcome-color") || "Green";

    Database.findOne({ Guild: interaction.guild.id }, async (data) => {
      if (!data) {
        const newWelcome = await Database.create({
          Guild: interaction.guild.id,
          WelcomeChannel: channelObject.id,
          WelcomeMessage: messageObject,
          WelcomeColor: colorObject,
        });
      }
    });

    interaction.reply({
      content: `The welcome system has been successfully setup.`,
      ephemeral: true,
    });
  },
};
