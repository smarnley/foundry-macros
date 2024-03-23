/* Genie's Wrath
   Pop-up a window to ask the player to apply Genie's Wrath or not.
   Once used, will not pop-up again until the player's next turn.

   How to activate
   Install and enable Midi-QOL & "Item Macro" modules
   Configure Midi-QoL:
     Enable Workflow Settings -> Misc -> Add item on use macro to sheet
   Edit Actor's Eldritch Blast Spell
     Add this macro to the Eldritch Blast spell item macro
     Midi-QoL tab:
       Add (+) "On Use Macros"
       ItemMacro.EldritchBlast -> return a damage bonus
   */

const version = "1.0.0";
try {
  if (!game.combat.active) {
    return;
  }
  // Get currently active actor in combat
  const currentCombat = game.combat;
  const currentCombatant = currentCombat.current.combatantId;
  const actorId = currentCombat.combatants.get(currentCombatant).actorId;
  const actor = game.actors.get(actorId);
  const prof = actor.system.attributes.prof;
  const tokenId = currentCombat.current.tokenId;
  const token = game.scenes.current.tokens.get(tokenId);

  // Check that actor is a Warlock
  if (actor.classes.warlock == null || actor.classes.warlock == undefined) {
    ui.notifications.error(`${actor.name} is not a warlock`);
    return;
  }
  //console.log(`${actor.name} is a warlock!`);

  // Discover Genie Kind
  const genieKind = actor.items
    .find((item) => item.name.substring(0, 10) == "Genie Kind")
    .name.substring(12);
  if (genieKind == null || genieKind == undefined) {
    ui.notifications.error(`${actor.name} does not have a Genie Kind`);
    return;
  }
  // console.log(genieKind);

  // Work out damage type from Genie Kind
  const genies = ["Dao", "Djinni", "Efreeti", "Marid"];
  const damageType = ["bludgeoning", "thunder", "fire", "cold"][
    genies.indexOf(genieKind)
  ];
  // console.log(damageType);

  if (!damageType) {
    ui.notifications.error(
      `${actor.name}'s Genie kind (${genieKind}) is unknown`
    );
    return {};
  }

  if (!args[0].macroPass === "preDamageRoll") {
    console.log("Not a damage roll");
    return;
  }

  const flagName = "genies-wrath";
  let firedRound = 0;

  if (hasProperty(token, `flags.core.${flagName}.round`)) {
    // Flags exist so read them
    firedRound = token.getFlag("core", `${flagName}.round`);
    firedCombat = token.getFlag("core", `${flagName}.combat`);
  }

  let combatRound = currentCombat.round;
  let combatId = currentCombat.id;

  if (combatRound === firedRound && combatId === firedCombat) {
    // Genie's Wrath already used this combat round
    return {};
  }
  let useDamage = await new Promise((resolve, reject) => {
    new Dialog({
      title: "Conditional Damage",
      content: `<p>Use Genie's Wrath (${prof} ${damageType} damage)?</p>`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: "Yes",
          callback: () => resolve(true),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: "No",
          callback: () => {
            resolve(false);
          },
        },
      },
      default: "yes",
    }).render(true);
  });
  if (!useDamage) {
    return;
  }
  // console.log(
  //   `Setting flag core.${flagName} to ${combatTime} for token ${tokenId}`
  // );
  token.setFlag("core", `${flagName}.round`, combatRound);
  token.setFlag("core", `${flagName}.combat`, combatId);

  return { damageRoll: `${prof}[${damageType}]`, flavor: "Genie's Wrath" };
} catch (err) {
  console.error(`${args[0].itemData.name} - Genie's Wrath ${version}`, err);
  return {};
}
