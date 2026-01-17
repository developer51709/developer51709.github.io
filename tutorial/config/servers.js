window.SERVERS = {
  testing: {
    name: "Testing Server",
    channels: [
      { name: "bot-testing", type: "text" }
    ]
  },

  main: {
    name: "Lucid Raiding™",
    categories: [
      {
        name: "General",
        channels: [
          { name: "welcome", type: "text" },
          { name: "rules", type: "text" },
          { name: "general-chat", type: "text" }
        ]
      },
      {
        name: "Voice Channels",
        channels: [
          { name: "General Voice", type: "voice" },
          { name: "AFK", type: "voice" }
        ]
      },
      {
        name: "Bot",
        channels: [
          { name: "bot-commands", type: "text" }
        ]
      }
    ]
  }
};
