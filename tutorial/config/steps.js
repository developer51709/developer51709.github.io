window.TUTORIAL_STEPS = [
  {
    id: 1,
    message: "Click below to add the external app to your account.",
    button: {
      text: "Add External App",
      action: "openExternalAppLink"
    }
  },
  {
    id: 2,
    message: "Now switch to the testing server.",
    action: "highlightTestingServer"
  },
  {
    id: 3,
    message: "Run the required command in #bot-testing:",
    highlightCommand: true
  },
  {
    id: 4,
    message: "Great! Now switch to the main server.",
    action: "highlightMainServer"
  }
];
