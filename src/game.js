"use strict";

(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 16;
  const MAP_W = 44;
  const MAP_H = 34;
  const SAVE_KEY = "pocket-beasts-forest-journey-v1";

  const TILE_KIND = {
    GRASS: 0,
    PATH: 1,
    TALL: 2,
    TREE: 3,
    WATER: 4,
    HOUSE: 5,
    ROCK: 6,
    FLOWER: 7,
    CAVE: 8,
    ARENA: 9,
    FENCE: 10,
  };

  const DIRS = {
    down: { x: 0, y: 1 },
    up: { x: 0, y: -1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const DIR_ORDER = ["down", "left", "right", "up"];
  const BLOCKING_TILES = new Set([
    TILE_KIND.TREE,
    TILE_KIND.WATER,
    TILE_KIND.HOUSE,
    TILE_KIND.ROCK,
    TILE_KIND.FENCE,
  ]);

  const ELEMENT_COLOR = {
    Fire: "#f26a3d",
    Water: "#4ca6e8",
    Leaf: "#4dbb6d",
    Electric: "#ffd84f",
    Rock: "#9a9485",
    Shadow: "#7150a8",
    Neutral: "#e6dec2",
  };

  const ITEMS = [
    {
      id: "capsule",
      name: "Beast Capsule",
      label: "Capsule",
      desc: "Captures a weakened wild beast.",
    },
    {
      id: "tonic",
      name: "Berry Tonic",
      label: "Tonic",
      desc: "Restores 24 HP.",
    },
  ];

  const SPECIES = {
    flameling: {
      name: "Flameling",
      element: "Fire",
      flavor: "A bright fox cub with a candle-tail and brave little paws.",
      base: { hp: 27, attack: 8, defense: 4, speed: 7 },
      skills: [
        { name: "Cinder Nip", element: "Fire", power: 6 },
        { name: "Quick Paw", element: "Neutral", power: 4 },
      ],
    },
    aquabbit: {
      name: "Aquabbit",
      element: "Water",
      flavor: "A blue river rabbit that splashes with its long ears.",
      base: { hp: 30, attack: 6, defense: 5, speed: 7 },
      skills: [
        { name: "Bubble Hop", element: "Water", power: 5 },
        { name: "Nimble Kick", element: "Neutral", power: 4 },
      ],
    },
    leafawn: {
      name: "Leafawn",
      element: "Leaf",
      flavor: "A shy green fawn with leaf-antlers that glow at dawn.",
      base: { hp: 29, attack: 7, defense: 6, speed: 5 },
      skills: [
        { name: "Sprout Rush", element: "Leaf", power: 5 },
        { name: "Gentle Horn", element: "Neutral", power: 4 },
      ],
    },
    sparkit: {
      name: "Sparkit",
      element: "Electric",
      flavor: "A tiny cat that stores static in its zigzag tail.",
      base: { hp: 24, attack: 8, defense: 3, speed: 10 },
      skills: [
        { name: "Jolt Scratch", element: "Electric", power: 6 },
        { name: "Pounce", element: "Neutral", power: 4 },
      ],
    },
    rockub: {
      name: "Rockub",
      element: "Rock",
      flavor: "A stone bear cub that naps beside warm cave walls.",
      base: { hp: 34, attack: 7, defense: 9, speed: 3 },
      skills: [
        { name: "Pebble Bash", element: "Rock", power: 5 },
        { name: "Cub Tackle", element: "Neutral", power: 4 },
      ],
    },
    shadewisp: {
      name: "Shadewisp",
      element: "Shadow",
      flavor: "A quiet forest spirit wrapped in moonlit mist.",
      base: { hp: 31, attack: 11, defense: 2, speed: 8 },
      skills: [
        { name: "Night Flicker", element: "Shadow", power: 7 },
        { name: "Mist Bite", element: "Neutral", power: 5 },
      ],
    },
  };

  const TRAINERS = {
    mira: {
      name: "Mira",
      title: "Sprout Scout",
      x: 11,
      y: 17,
      color: "#6fbd5e",
      reward: { capsule: 1, tonic: 0 },
      intro: [
        "Mira: The grass listens when you step softly.",
        "Mira: Let me see if your partner can keep pace!",
      ],
      defeated: "Mira: Your footwork is gentle. The forest will notice.",
      team: [{ id: "leafawn", level: 4 }],
    },
    orin: {
      name: "Orin",
      title: "Creek Runner",
      x: 23,
      y: 17,
      color: "#4ca6e8",
      reward: { capsule: 1, tonic: 1 },
      intro: [
        "Orin: The stream is running backward today.",
        "Orin: A quick match might shake the strange chill away.",
      ],
      defeated: "Orin: I heard the water laugh again. That's better.",
      team: [
        { id: "aquabbit", level: 4 },
        { id: "sparkit", level: 4 },
      ],
    },
    bram: {
      name: "Bram",
      title: "Cave Watcher",
      x: 31,
      y: 13,
      color: "#9a9485",
      reward: { capsule: 2, tonic: 1 },
      intro: [
        "Bram: The cave stones have been humming at night.",
        "Bram: If you can handle Rockub, you can handle the path ahead.",
      ],
      defeated: "Bram: The stones are calmer around you.",
      team: [
        { id: "rockub", level: 5 },
        { id: "flameling", level: 5 },
      ],
    },
  };

  const SAVE_FIELDS = [
    "player",
    "party",
    "inventory",
    "story",
    "trainers",
    "encounterCooldown",
  ];

  const keys = new Set();
  const touchHolds = new Map();
  const map = buildMap();
  let game = createGameState();
  let lastTime = 0;
  let titlePulse = 0;

  function createGameState() {
    return {
      mode: "title",
      titleIndex: hasSave() ? 1 : 0,
      player: {
        x: 7,
        y: 27,
        dir: "down",
        moving: false,
        fromX: 7,
        fromY: 27,
        toX: 7,
        toY: 27,
        moveT: 0,
      },
      party: [],
      inventory: { capsule: 0, tonic: 0 },
      story: { starterChosen: false, shadowCalmed: false, bossSeen: false },
      trainers: { mira: false, orin: false, bram: false },
      encounterCooldown: 0,
      dialog: null,
      menu: { screen: "main", index: 0, partyIndex: 0, bagIndex: 0 },
      battle: null,
      messageFlash: 0,
      shake: 0,
    };
  }

  function buildMap() {
    const grid = Array.from({ length: MAP_H }, () =>
      Array.from({ length: MAP_W }, () => TILE_KIND.GRASS)
    );
    const rect = (x, y, w, h, tile) => {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) {
          if (xx >= 0 && yy >= 0 && xx < MAP_W && yy < MAP_H) grid[yy][xx] = tile;
        }
      }
    };
    const lineH = (x1, x2, y, tile) => rect(x1, y, x2 - x1 + 1, 1, tile);
    const lineV = (x, y1, y2, tile) => rect(x, y1, 1, y2 - y1 + 1, tile);

    rect(0, 0, MAP_W, 1, TILE_KIND.TREE);
    rect(0, MAP_H - 1, MAP_W, 1, TILE_KIND.TREE);
    rect(0, 0, 1, MAP_H, TILE_KIND.TREE);
    rect(MAP_W - 1, 0, 1, MAP_H, TILE_KIND.TREE);

    rect(3, 23, 14, 8, TILE_KIND.PATH);
    lineV(9, 12, 30, TILE_KIND.PATH);
    lineV(10, 12, 30, TILE_KIND.PATH);
    lineH(9, 34, 17, TILE_KIND.PATH);
    lineH(29, 38, 12, TILE_KIND.PATH);
    lineV(35, 7, 17, TILE_KIND.PATH);
    lineH(34, 39, 7, TILE_KIND.PATH);

    rect(5, 20, 3, 2, TILE_KIND.FLOWER);
    rect(13, 27, 2, 2, TILE_KIND.FLOWER);
    rect(3, 31, 12, 1, TILE_KIND.FENCE);
    rect(2, 23, 1, 8, TILE_KIND.FENCE);
    rect(16, 23, 1, 8, TILE_KIND.FENCE);
    grid[31][9] = TILE_KIND.PATH;
    grid[31][10] = TILE_KIND.PATH;

    rect(4, 24, 3, 3, TILE_KIND.HOUSE);
    rect(12, 23, 3, 3, TILE_KIND.HOUSE);
    rect(4, 27, 1, 1, TILE_KIND.PATH);
    rect(13, 26, 1, 1, TILE_KIND.PATH);

    rect(4, 12, 4, 6, TILE_KIND.TALL);
    rect(12, 11, 6, 5, TILE_KIND.TALL);
    rect(17, 18, 6, 5, TILE_KIND.TALL);
    rect(26, 15, 4, 6, TILE_KIND.TALL);
    rect(7, 7, 8, 4, TILE_KIND.TALL);
    rect(20, 7, 8, 4, TILE_KIND.TALL);

    rect(18, 22, 4, 3, TILE_KIND.WATER);
    rect(21, 20, 3, 3, TILE_KIND.WATER);
    rect(24, 18, 3, 2, TILE_KIND.WATER);
    rect(27, 19, 2, 3, TILE_KIND.WATER);

    rect(30, 14, 9, 6, TILE_KIND.CAVE);
    rect(30, 14, 9, 1, TILE_KIND.ROCK);
    rect(30, 19, 9, 1, TILE_KIND.ROCK);
    rect(30, 14, 1, 6, TILE_KIND.ROCK);
    rect(38, 14, 1, 6, TILE_KIND.ROCK);
    grid[17][30] = TILE_KIND.PATH;
    grid[17][31] = TILE_KIND.CAVE;
    grid[13][35] = TILE_KIND.PATH;
    grid[14][35] = TILE_KIND.CAVE;

    rect(31, 3, 10, 8, TILE_KIND.ARENA);
    rect(30, 2, 12, 1, TILE_KIND.TREE);
    rect(30, 11, 12, 1, TILE_KIND.TREE);
    rect(30, 2, 1, 10, TILE_KIND.TREE);
    rect(41, 2, 1, 10, TILE_KIND.TREE);
    grid[11][35] = TILE_KIND.PATH;
    grid[10][35] = TILE_KIND.ARENA;

    for (let y = 2; y < MAP_H - 2; y += 1) {
      for (let x = 2; x < MAP_W - 2; x += 1) {
        const nearVillage = x < 18 && y > 21;
        const onPath = grid[y][x] === TILE_KIND.PATH || grid[y][x] === TILE_KIND.TALL;
        const caveOrArena = grid[y][x] === TILE_KIND.CAVE || grid[y][x] === TILE_KIND.ARENA;
        const noise = (x * 37 + y * 53 + x * y * 7) % 29;
        if (!nearVillage && !onPath && !caveOrArena && grid[y][x] === TILE_KIND.GRASS && noise < 4) {
          grid[y][x] = TILE_KIND.TREE;
        }
      }
    }

    const clear = [
      [9, 12],
      [10, 12],
      [9, 13],
      [10, 13],
      [9, 17],
      [10, 17],
      [23, 17],
      [31, 13],
      [35, 13],
      [35, 12],
      [35, 11],
      [36, 6],
      [35, 7],
      [34, 7],
      [37, 7],
    ];
    for (const [x, y] of clear) grid[y][x] = TILE_KIND.PATH;
    grid[36] = grid[36] || [];
    return grid;
  }

  function hasSave() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  function newGame() {
    game = createGameState();
    game.mode = "overworld";
    beginIntro();
  }

  function beginIntro() {
    startDialog(
      [
        "Elder Brindle: Our village lanterns flicker even when the air is still.",
        "Elder Brindle: Strange shadows wander the Whispering Forest. Take a partner and find their source.",
        "Elder Brindle: Choose the friend whose heart answers yours.",
      ],
      null,
      [
        { label: "Flameling", action: () => chooseStarter("flameling") },
        { label: "Aquabbit", action: () => chooseStarter("aquabbit") },
        { label: "Leafawn", action: () => chooseStarter("leafawn") },
      ]
    );
  }

  function chooseStarter(id) {
    const chosen = createCreature(id, 3);
    game.party = [chosen];
    game.inventory.capsule = 5;
    game.inventory.tonic = 2;
    game.story.starterChosen = true;
    game.player.x = 7;
    game.player.y = 27;
    game.player.fromX = 7;
    game.player.fromY = 27;
    game.player.toX = 7;
    game.player.toY = 27;
    startDialog([
      `You received ${chosen.name}!`,
      "Elder Brindle: Beast Capsules may calm wild creatures if they are weakened first.",
      "Elder Brindle: Follow the north path. The forest will test you, but it is not cruel.",
    ]);
  }

  function createCreature(speciesId, level, overrides = {}) {
    const species = SPECIES[speciesId];
    const stats = statsFor(speciesId, level);
    return {
      uid: `${speciesId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      speciesId,
      name: species.name,
      element: species.element,
      level,
      exp: overrides.exp || 0,
      currentHp: overrides.currentHp ?? stats.hp,
      displayHp: overrides.currentHp ?? stats.hp,
      stats,
    };
  }

  function reviveCreature(raw) {
    const creature = createCreature(raw.speciesId, raw.level, {
      exp: raw.exp || 0,
      currentHp: raw.currentHp,
    });
    creature.uid = raw.uid || creature.uid;
    creature.name = raw.name || SPECIES[raw.speciesId].name;
    creature.currentHp = clamp(creature.currentHp, 0, creature.stats.hp);
    creature.displayHp = creature.currentHp;
    return creature;
  }

  function statsFor(speciesId, level) {
    const base = SPECIES[speciesId].base;
    return {
      hp: base.hp + level * 5,
      attack: base.attack + level * 2,
      defense: base.defense + Math.floor(level * 1.25),
      speed: base.speed + level,
    };
  }

  function expToNext(level) {
    return 12 + level * 10;
  }

  function gainExp(creature, amount) {
    const lines = [`${creature.name} gained ${amount} EXP.`];
    creature.exp += amount;
    while (creature.exp >= expToNext(creature.level)) {
      creature.exp -= expToNext(creature.level);
      const oldHp = creature.stats.hp;
      creature.level += 1;
      creature.stats = statsFor(creature.speciesId, creature.level);
      creature.currentHp = clamp(creature.currentHp + (creature.stats.hp - oldHp) + 8, 1, creature.stats.hp);
      creature.displayHp = creature.currentHp;
      lines.push(`${creature.name} grew to Lv. ${creature.level}!`);
    }
    return lines;
  }

  function healParty() {
    for (const creature of game.party) {
      creature.stats = statsFor(creature.speciesId, creature.level);
      creature.currentHp = creature.stats.hp;
      creature.displayHp = creature.currentHp;
    }
  }

  function saveGame() {
    try {
      const data = {};
      for (const field of SAVE_FIELDS) data[field] = game[field];
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const loaded = createGameState();
      loaded.mode = "overworld";
      loaded.player = { ...loaded.player, ...data.player, moving: false, moveT: 0 };
      loaded.player.fromX = loaded.player.x;
      loaded.player.fromY = loaded.player.y;
      loaded.player.toX = loaded.player.x;
      loaded.player.toY = loaded.player.y;
      loaded.party = Array.isArray(data.party) ? data.party.map(reviveCreature) : [];
      loaded.inventory = { capsule: 0, tonic: 0, ...(data.inventory || {}) };
      loaded.story = { ...loaded.story, ...(data.story || {}) };
      loaded.trainers = { ...loaded.trainers, ...(data.trainers || {}) };
      loaded.encounterCooldown = data.encounterCooldown || 0;
      game = loaded;
      return true;
    } catch {
      return false;
    }
  }

  function currentNpcs() {
    const npcs = [
      {
        id: "elder",
        name: "Elder Brindle",
        x: 7,
        y: 25,
        type: "elder",
        color: "#b89058",
      },
      {
        id: "lina",
        name: "Lina",
        x: 5,
        y: 28,
        type: "villager",
        color: "#e08ac3",
      },
      {
        id: "keeper",
        name: "Lantern Keeper",
        x: 14,
        y: 27,
        type: "villager",
        color: "#f0c95a",
      },
    ];

    for (const [id, trainer] of Object.entries(TRAINERS)) {
      npcs.push({
        id,
        name: trainer.name,
        x: trainer.x,
        y: trainer.y,
        type: "trainer",
        color: trainer.color,
      });
    }

    if (!game.story.shadowCalmed) {
      npcs.push({
        id: "shadewisp",
        name: "Shadewisp",
        x: 36,
        y: 6,
        type: "boss",
        color: "#6a4aa0",
      });
    }
    return npcs;
  }

  function npcAt(x, y) {
    return currentNpcs().find((npc) => npc.x === x && npc.y === y);
  }

  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return TILE_KIND.TREE;
    return map[y][x];
  }

  function isBlocked(x, y) {
    if (BLOCKING_TILES.has(tileAt(x, y))) return true;
    return Boolean(npcAt(x, y));
  }

  function interact() {
    const d = DIRS[game.player.dir];
    const tx = game.player.x + d.x;
    const ty = game.player.y + d.y;
    const npc = npcAt(tx, ty);
    if (npc) {
      handleNpc(npc);
      return;
    }

    const tile = tileAt(tx, ty);
    if (tile === TILE_KIND.WATER) {
      startDialog(["The stream is chilly and oddly quiet."]);
    } else if (tile === TILE_KIND.TREE) {
      startDialog(["Leaves whisper like they are sharing a secret."]);
    } else if (tile === TILE_KIND.ROCK) {
      startDialog(["The stone hums with a soft, shadowy note."]);
    } else {
      startDialog(["The forest air smells of moss and rain."]);
    }
  }

  function handleNpc(npc) {
    if (npc.type === "elder") {
      if (!game.story.starterChosen) {
        beginIntro();
      } else if (game.story.shadowCalmed) {
        startDialog([
          "Elder Brindle: The lanterns burn steady again.",
          "Elder Brindle: You listened to the forest when it needed a friend.",
        ]);
      } else {
        startDialog([
          "Elder Brindle: North through the grass, east past the stream, and up to the moonlit clearing.",
          "Elder Brindle: Keep Beast Capsules ready. Kindness works best after courage.",
        ]);
      }
      return;
    }

    if (npc.id === "lina") {
      startDialog([
        "Lina: I saw a tiny Sparkit leap between the tall grass blades.",
        "Lina: It sneezed sparks, then looked very proud of itself.",
      ]);
      return;
    }

    if (npc.id === "keeper") {
      startDialog([
        "Lantern Keeper: Berry Tonics wake sleepy paws and mend bruises.",
        "Lantern Keeper: The forest path is small, but it has a big memory.",
      ]);
      return;
    }

    if (npc.type === "trainer") {
      const trainer = TRAINERS[npc.id];
      if (game.trainers[npc.id]) {
        startDialog([trainer.defeated]);
        return;
      }
      startDialog(trainer.intro, () => startTrainerBattle(npc.id));
      return;
    }

    if (npc.type === "boss") {
      const defeatedCount = Object.values(game.trainers).filter(Boolean).length;
      if (defeatedCount < 2) {
        startDialog([
          "The shadow spirit flickers beyond your reach.",
          "A hush rolls across the arena: face more of the forest before stepping closer.",
        ]);
        return;
      }
      game.story.bossSeen = true;
      startDialog(
        [
          "The moonlit mist gathers into a small, trembling shape.",
          "Shadewisp: ...lost...too loud...",
          "Your partner steps forward. The forest holds its breath.",
        ],
        () => startBossBattle()
      );
    }
  }

  function startDialog(lines, onComplete = null, choices = null) {
    game.dialog = {
      lines: Array.isArray(lines) ? lines : [lines],
      index: 0,
      chars: 0,
      onComplete,
      choices,
      choiceIndex: 0,
    };
    game.mode = "dialog";
  }

  function completeDialog() {
    const dialog = game.dialog;
    const callback = dialog.onComplete;
    game.dialog = null;
    game.mode = "overworld";
    if (callback) callback();
  }

  function handleDialogKey(code) {
    const dialog = game.dialog;
    if (!dialog) return;
    const line = dialog.lines[dialog.index] || "";
    const isComplete = dialog.chars >= line.length;
    const hasChoices = dialog.choices && dialog.index >= dialog.lines.length - 1 && isComplete;

    if (hasChoices && code === "ArrowUp") {
      dialog.choiceIndex = wrap(dialog.choiceIndex - 1, dialog.choices.length);
      return;
    }
    if (hasChoices && code === "ArrowDown") {
      dialog.choiceIndex = wrap(dialog.choiceIndex + 1, dialog.choices.length);
      return;
    }
    if (!isConfirm(code)) return;
    if (!isComplete) {
      dialog.chars = line.length;
      return;
    }
    if (hasChoices) {
      const choice = dialog.choices[dialog.choiceIndex];
      game.dialog = null;
      game.mode = "overworld";
      choice.action();
      return;
    }
    if (dialog.index < dialog.lines.length - 1) {
      dialog.index += 1;
      dialog.chars = 0;
      return;
    }
    completeDialog();
  }

  function openMenu() {
    game.menu = { screen: "main", index: 0, partyIndex: 0, bagIndex: 0 };
    game.mode = "menu";
  }

  function handleMenuKey(code) {
    const menu = game.menu;
    if (isCancel(code)) {
      if (menu.screen === "main") {
        game.mode = "overworld";
      } else {
        menu.screen = "main";
        menu.index = 0;
      }
      return;
    }

    if (menu.screen === "main") {
      const options = ["Party", "Bag", "Save", "Load", "Close"];
      if (code === "ArrowUp") menu.index = wrap(menu.index - 1, options.length);
      if (code === "ArrowDown") menu.index = wrap(menu.index + 1, options.length);
      if (isConfirm(code)) {
        const selected = options[menu.index];
        if (selected === "Party") {
          menu.screen = "party";
          menu.partyIndex = 0;
        } else if (selected === "Bag") {
          menu.screen = "bag";
          menu.bagIndex = 0;
        } else if (selected === "Save") {
          const ok = saveGame();
          startDialog([ok ? "Journey saved." : "The save crystal stayed dim."]);
        } else if (selected === "Load") {
          const ok = loadGame();
          startDialog([ok ? "Journey loaded." : "No saved journey was found."]);
        } else {
          game.mode = "overworld";
        }
      }
      return;
    }

    if (menu.screen === "party") {
      if (code === "ArrowUp") menu.partyIndex = wrap(menu.partyIndex - 1, Math.max(1, game.party.length));
      if (code === "ArrowDown") menu.partyIndex = wrap(menu.partyIndex + 1, Math.max(1, game.party.length));
      return;
    }

    if (menu.screen === "bag") {
      if (code === "ArrowUp") menu.bagIndex = wrap(menu.bagIndex - 1, ITEMS.length);
      if (code === "ArrowDown") menu.bagIndex = wrap(menu.bagIndex + 1, ITEMS.length);
      if (isConfirm(code)) {
        const item = ITEMS[menu.bagIndex];
        if (item.id === "capsule") {
          startDialog(["A Beast Capsule needs a wild creature in front of you."]);
        } else if (item.id === "tonic") {
          if ((game.inventory.tonic || 0) <= 0) {
            startDialog(["No Berry Tonics remain."]);
          } else {
            menu.screen = "bagTarget";
            menu.partyIndex = 0;
          }
        }
      }
      return;
    }

    if (menu.screen === "bagTarget") {
      if (code === "ArrowUp") menu.partyIndex = wrap(menu.partyIndex - 1, Math.max(1, game.party.length));
      if (code === "ArrowDown") menu.partyIndex = wrap(menu.partyIndex + 1, Math.max(1, game.party.length));
      if (isConfirm(code) && game.party.length) {
        const creature = game.party[menu.partyIndex];
        if (creature.currentHp >= creature.stats.hp) {
          startDialog([`${creature.name} is already feeling bright.`]);
        } else {
          game.inventory.tonic -= 1;
          healCreature(creature, 24);
          startDialog([`${creature.name} recovered HP. Berry Tonic x${game.inventory.tonic}`]);
        }
      }
    }
  }

  function startTrainerBattle(id) {
    const trainer = TRAINERS[id];
    const enemyTeam = trainer.team.map((entry) => createCreature(entry.id, entry.level));
    game.battle = makeBattle({
      kind: "trainer",
      trainerId: id,
      title: `${trainer.title} ${trainer.name}`,
      enemyTeam,
      canCapture: false,
    });
    game.mode = "battle";
    battleMessages([`${trainer.title} ${trainer.name} challenges you!`, `${trainer.name} sends out ${enemyTeam[0].name}!`], () => {
      game.battle.phase = "menu";
    });
  }

  function startBossBattle() {
    const enemyTeam = [createCreature("shadewisp", 8)];
    game.battle = makeBattle({
      kind: "boss",
      title: "Moonlit Disturbance",
      enemyTeam,
      canCapture: true,
      boss: true,
    });
    game.mode = "battle";
    battleMessages(["Shadewisp appeared!", "Its shadow is fierce, but its eyes look frightened."], () => {
      game.battle.phase = "menu";
    });
  }

  function startWildBattle(speciesId, level) {
    const enemyTeam = [createCreature(speciesId, level)];
    game.battle = makeBattle({
      kind: "wild",
      title: "Wild Encounter",
      enemyTeam,
      canCapture: true,
    });
    game.mode = "battle";
    battleMessages([`A wild ${enemyTeam[0].name} appeared!`], () => {
      game.battle.phase = "menu";
    });
  }

  function makeBattle(config) {
    const activeIndex = firstLivingPartyIndex();
    return {
      ...config,
      phase: "message",
      activeIndex,
      enemyIndex: 0,
      mainIndex: 0,
      skillIndex: 0,
      itemIndex: 0,
      switchIndex: activeIndex,
      message: "",
      messageChars: 0,
      queue: [],
      onMessageDone: null,
      anim: null,
      ended: false,
    };
  }

  function firstLivingPartyIndex() {
    const index = game.party.findIndex((creature) => creature.currentHp > 0);
    return index >= 0 ? index : 0;
  }

  function activeCreature() {
    return game.party[game.battle.activeIndex];
  }

  function enemyCreature() {
    return game.battle.enemyTeam[game.battle.enemyIndex];
  }

  function battleMessages(lines, onDone = null) {
    const battle = game.battle;
    battle.phase = "message";
    battle.message = lines[0] || "";
    battle.messageChars = 0;
    battle.queue = lines.slice(1);
    battle.onMessageDone = onDone;
  }

  function advanceBattleMessage() {
    const battle = game.battle;
    if (!battle || battle.phase !== "message") return;
    if (battle.messageChars < battle.message.length) {
      battle.messageChars = battle.message.length;
      return;
    }
    if (battle.queue.length) {
      battle.message = battle.queue.shift();
      battle.messageChars = 0;
      return;
    }
    const callback = battle.onMessageDone;
    battle.onMessageDone = null;
    if (callback) callback();
  }

  function handleBattleKey(code) {
    const battle = game.battle;
    if (!battle) return;

    if (battle.phase === "message") {
      if (isConfirm(code)) advanceBattleMessage();
      return;
    }

    if (battle.phase === "locked") return;

    if (battle.phase === "menu") {
      if (code === "ArrowLeft") battle.mainIndex = battle.mainIndex % 2 === 1 ? battle.mainIndex - 1 : battle.mainIndex + 1;
      if (code === "ArrowRight") battle.mainIndex = battle.mainIndex % 2 === 0 ? battle.mainIndex + 1 : battle.mainIndex - 1;
      if (code === "ArrowUp") battle.mainIndex = battle.mainIndex >= 2 ? battle.mainIndex - 2 : battle.mainIndex + 2;
      if (code === "ArrowDown") battle.mainIndex = battle.mainIndex < 2 ? battle.mainIndex + 2 : battle.mainIndex - 2;
      battle.mainIndex = clamp(battle.mainIndex, 0, 3);
      if (isConfirm(code)) {
        if (battle.mainIndex === 0) {
          battle.phase = "skill";
          battle.skillIndex = 0;
        } else if (battle.mainIndex === 1) {
          battle.phase = "item";
          battle.itemIndex = 0;
        } else if (battle.mainIndex === 2) {
          battle.phase = "switch";
          battle.switchIndex = firstLivingPartyIndex();
        } else {
          attemptCapture();
        }
      }
      return;
    }

    if (battle.phase === "skill") {
      const skills = SPECIES[activeCreature().speciesId].skills;
      if (code === "ArrowUp" || code === "ArrowLeft") battle.skillIndex = wrap(battle.skillIndex - 1, skills.length);
      if (code === "ArrowDown" || code === "ArrowRight") battle.skillIndex = wrap(battle.skillIndex + 1, skills.length);
      if (isCancel(code)) battle.phase = "menu";
      if (isConfirm(code)) runAttackTurn(skills[battle.skillIndex]);
      return;
    }

    if (battle.phase === "item") {
      if (code === "ArrowUp" || code === "ArrowLeft") battle.itemIndex = wrap(battle.itemIndex - 1, ITEMS.length);
      if (code === "ArrowDown" || code === "ArrowRight") battle.itemIndex = wrap(battle.itemIndex + 1, ITEMS.length);
      if (isCancel(code)) battle.phase = "menu";
      if (isConfirm(code)) {
        const item = ITEMS[battle.itemIndex];
        if (item.id === "capsule") attemptCapture();
        if (item.id === "tonic") useBattleTonic();
      }
      return;
    }

    if (battle.phase === "switch" || battle.phase === "forcedSwitch") {
      if (code === "ArrowUp") battle.switchIndex = wrap(battle.switchIndex - 1, game.party.length);
      if (code === "ArrowDown") battle.switchIndex = wrap(battle.switchIndex + 1, game.party.length);
      if (isCancel(code) && battle.phase === "switch") battle.phase = "menu";
      if (isConfirm(code)) chooseSwitch(battle.phase === "forcedSwitch");
    }
  }

  function runAttackTurn(playerSkill) {
    const battle = game.battle;
    battle.phase = "locked";
    const enemy = enemyCreature();
    const enemySkill = chooseEnemySkill(enemy);
    const playerFirst = activeCreature().stats.speed >= enemy.stats.speed;
    const order = playerFirst
      ? [
          { side: "player", skill: playerSkill },
          { side: "enemy", skill: enemySkill },
        ]
      : [
          { side: "enemy", skill: enemySkill },
          { side: "player", skill: playerSkill },
        ];
    processBattleAction(order, 0);
  }

  function processBattleAction(order, index) {
    const battle = game.battle;
    if (!battle || battle.ended) return;
    if (index >= order.length) {
      battle.phase = "menu";
      return;
    }
    const action = order[index];
    const attacker = action.side === "player" ? activeCreature() : enemyCreature();
    const defender = action.side === "player" ? enemyCreature() : activeCreature();
    if (!attacker || !defender || attacker.currentHp <= 0 || defender.currentHp <= 0) {
      processBattleAction(order, index + 1);
      return;
    }
    performAttack(action.side, action.skill, () => processBattleAction(order, index + 1));
  }

  function performAttack(side, skill, continueTurn) {
    const attacker = side === "player" ? activeCreature() : enemyCreature();
    const defender = side === "player" ? enemyCreature() : activeCreature();
    const targetSide = side === "player" ? "enemy" : "player";
    const result = calculateDamage(attacker, defender, skill);
    defender.currentHp = clamp(defender.currentHp - result.damage, 0, defender.stats.hp);
    game.shake = Math.max(game.shake, result.multiplier > 1 ? 7 : 4);
    game.battle.anim = {
      kind: "attack",
      side,
      element: skill.element,
      t: 0,
      duration: 0.48,
    };

    const lines = [`${attacker.name} used ${skill.name}!`, `${defender.name} took ${result.damage} damage.`];
    if (result.multiplier > 1.1) lines.push("It struck true!");
    if (result.multiplier < 0.95) lines.push("The hit was softened.");
    if (defender.currentHp <= 0) lines.push(`${defender.name} fainted!`);

    battleMessages(lines, () => {
      if (defender.currentHp <= 0) {
        if (targetSide === "enemy") handleEnemyFaint();
        else handlePlayerFaint();
      } else {
        continueTurn();
      }
    });
  }

  function calculateDamage(attacker, defender, skill) {
    const base = Math.max(1, attacker.stats.attack + skill.power - defender.stats.defense);
    const multiplier = elementMultiplier(skill.element, defender.element);
    return {
      damage: Math.max(1, Math.round(base * multiplier)),
      multiplier,
    };
  }

  function elementMultiplier(attack, defender) {
    if (attack === "Fire" && defender === "Leaf") return 1.5;
    if (attack === "Leaf" && defender === "Water") return 1.5;
    if (attack === "Water" && defender === "Fire") return 1.5;
    if (attack === "Electric" && defender === "Water") return 1.5;
    if (attack === "Electric" && defender === "Rock") return 0.55;
    if (attack === "Shadow" && defender !== "Shadow") return 1.35;
    return 1;
  }

  function chooseEnemySkill(creature) {
    const skills = SPECIES[creature.speciesId].skills;
    return skills[Math.floor(Math.random() * skills.length)];
  }

  function handleEnemyFaint() {
    const battle = game.battle;
    const defeated = enemyCreature();
    const exp = 8 + defeated.level * 9 + (battle.boss ? 12 : 0);
    const lines = gainExp(activeCreature(), exp);

    if (battle.kind === "trainer" && battle.enemyIndex < battle.enemyTeam.length - 1) {
      battle.enemyIndex += 1;
      lines.push(`${TRAINERS[battle.trainerId].name} sends out ${enemyCreature().name}!`);
      battleMessages(lines, () => {
        battle.phase = "menu";
      });
      return;
    }

    if (battle.kind === "trainer") {
      const trainer = TRAINERS[battle.trainerId];
      game.trainers[battle.trainerId] = true;
      if (trainer.reward.capsule) {
        game.inventory.capsule += trainer.reward.capsule;
        lines.push(`You received Beast Capsule x${trainer.reward.capsule}.`);
      }
      if (trainer.reward.tonic) {
        game.inventory.tonic += trainer.reward.tonic;
        lines.push(`You received Berry Tonic x${trainer.reward.tonic}.`);
      }
      lines.push(`${trainer.name}: ${trainer.defeated.replace(`${trainer.name}: `, "")}`);
      lines.push("You won the trainer battle!");
      battleMessages(lines, () => endBattle());
      return;
    }

    if (battle.kind === "boss") {
      lines.push("Shadewisp's stormy glow softens.");
      battleMessages(lines, () => calmShadow("defeated"));
      return;
    }

    lines.push("The wild beast scampered away.");
    battleMessages(lines, () => endBattle());
  }

  function handlePlayerFaint() {
    const battle = game.battle;
    const hasOther = game.party.some((creature) => creature.currentHp > 0);
    if (!hasOther) {
      battleMessages(["Your team is worn out.", "Elder Brindle guides you back to the village lanterns."], () => {
        healParty();
        game.player.x = 7;
        game.player.y = 27;
        game.player.fromX = 7;
        game.player.fromY = 27;
        game.player.toX = 7;
        game.player.toY = 27;
        endBattle();
      });
      return;
    }
    battleMessages(["Choose another partner."], () => {
      battle.phase = "forcedSwitch";
      battle.switchIndex = firstLivingPartyIndex();
    });
  }

  function attemptCapture() {
    const battle = game.battle;
    if (!battle.canCapture) {
      battleMessages(["Trainer partners already have a home."], () => {
        battle.phase = "menu";
      });
      return;
    }
    if ((game.inventory.capsule || 0) <= 0) {
      battleMessages(["No Beast Capsules remain."], () => {
        battle.phase = "menu";
      });
      return;
    }
    if (game.party.length >= 6) {
      battleMessages(["Your travel team is full."], () => {
        battle.phase = "menu";
      });
      return;
    }

    const enemy = enemyCreature();
    game.inventory.capsule -= 1;
    const hpRatio = enemy.currentHp / enemy.stats.hp;
    const levelGap = activeCreature().level - enemy.level;
    let chance = 0.25 + (1 - hpRatio) * 0.55 + levelGap * 0.035;
    if (battle.boss) chance -= 0.12;
    chance = clamp(chance, battle.boss ? 0.08 : 0.12, battle.boss ? 0.62 : 0.88);
    battle.anim = {
      kind: "capsule",
      t: 0,
      duration: 1.15,
      success: Math.random() < chance,
    };
    game.shake = 4;
    battle.phase = "locked";
    const success = battle.anim.success;
    const firstLine = `You threw a Beast Capsule! (${game.inventory.capsule} left)`;
    if (success) {
      battleMessages([firstLine, "Click... click... glow!", `${enemy.name} joined your team!`], () => {
        const captured = createCreature(enemy.speciesId, enemy.level, {
          currentHp: Math.max(1, enemy.currentHp),
        });
        game.party.push(captured);
        if (battle.kind === "boss") calmShadow("captured");
        else endBattle();
      });
      return;
    }
    battleMessages([firstLine, `${enemy.name} broke free!`], () => enemyTurnOnly());
  }

  function useBattleTonic() {
    const creature = activeCreature();
    if ((game.inventory.tonic || 0) <= 0) {
      battleMessages(["No Berry Tonics remain."], () => {
        game.battle.phase = "item";
      });
      return;
    }
    if (creature.currentHp >= creature.stats.hp) {
      battleMessages([`${creature.name} is already at full HP.`], () => {
        game.battle.phase = "item";
      });
      return;
    }
    game.inventory.tonic -= 1;
    healCreature(creature, 24);
    battleMessages([`You used a Berry Tonic on ${creature.name}.`, `${creature.name} recovered HP.`], () => {
      enemyTurnOnly();
    });
  }

  function healCreature(creature, amount) {
    creature.currentHp = clamp(creature.currentHp + amount, 0, creature.stats.hp);
  }

  function chooseSwitch(forced) {
    const battle = game.battle;
    const index = battle.switchIndex;
    const creature = game.party[index];
    if (!creature || creature.currentHp <= 0) {
      battleMessages(["That partner needs rest."], () => {
        battle.phase = forced ? "forcedSwitch" : "switch";
      });
      return;
    }
    if (index === battle.activeIndex && !forced) {
      battleMessages([`${creature.name} is already out.`], () => {
        battle.phase = "switch";
      });
      return;
    }
    battle.activeIndex = index;
    battleMessages([`Go, ${creature.name}!`], () => {
      if (forced) battle.phase = "menu";
      else enemyTurnOnly();
    });
  }

  function enemyTurnOnly() {
    const battle = game.battle;
    if (!battle || battle.ended) return;
    battle.phase = "locked";
    performAttack("enemy", chooseEnemySkill(enemyCreature()), () => {
      if (game.battle && !game.battle.ended) game.battle.phase = "menu";
    });
  }

  function calmShadow(outcome) {
    const lines =
      outcome === "captured"
        ? [
            "Shadewisp curls into the capsule's warm light.",
            "The forest exhales. The village lanterns glow steady in the distance.",
            "Whispering Forest is peaceful again.",
          ]
        : [
            "Shadewisp's sharp edges melt into a soft violet spark.",
            "It bows, then drifts quietly into the moonlit trees.",
            "Whispering Forest is peaceful again.",
          ];
    game.story.shadowCalmed = true;
    battleMessages(lines, () => endBattle());
  }

  function endBattle() {
    if (game.battle) game.battle.ended = true;
    game.battle = null;
    game.mode = "overworld";
    game.encounterCooldown = 5;
  }

  function checkEncounter() {
    if (!game.story.starterChosen || game.story.shadowCalmed) return;
    if (game.encounterCooldown > 0) {
      game.encounterCooldown -= 1;
      return;
    }
    if (tileAt(game.player.x, game.player.y) !== TILE_KIND.TALL) return;
    if (Math.random() > 0.17) return;

    const pool = encounterPoolFor(game.player.x, game.player.y);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    startWildBattle(pick.id, pick.level);
  }

  function encounterPoolFor(x, y) {
    if (x > 24) {
      return [
        { id: "rockub", level: 4 },
        { id: "sparkit", level: 4 },
        { id: "flameling", level: 5 },
      ];
    }
    if (y < 12) {
      return [
        { id: "leafawn", level: 3 },
        { id: "sparkit", level: 3 },
        { id: "aquabbit", level: 4 },
      ];
    }
    return [
      { id: "leafawn", level: 2 },
      { id: "sparkit", level: 3 },
      { id: "aquabbit", level: 3 },
      { id: "flameling", level: 3 },
    ];
  }

  function update(dt) {
    titlePulse += dt;
    if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 18);

    if (game.mode === "dialog" && game.dialog) {
      const line = game.dialog.lines[game.dialog.index] || "";
      game.dialog.chars = Math.min(line.length, game.dialog.chars + dt * 48);
    }

    if (game.mode === "battle" && game.battle) {
      updateBattle(dt);
    }

    if (game.mode === "overworld") {
      updateOverworld(dt);
    }

    updatePartyDisplays(dt);
  }

  function updatePartyDisplays(dt) {
    for (const creature of game.party) smoothHp(creature, dt);
    if (game.battle) {
      for (const creature of game.battle.enemyTeam) smoothHp(creature, dt);
    }
  }

  function smoothHp(creature, dt) {
    if (!creature) return;
    const diff = creature.currentHp - creature.displayHp;
    if (Math.abs(diff) < 0.08) {
      creature.displayHp = creature.currentHp;
    } else {
      creature.displayHp += diff * Math.min(1, dt * 8);
    }
  }

  function updateBattle(dt) {
    const battle = game.battle;
    if (battle.message) {
      battle.messageChars = Math.min(battle.message.length, battle.messageChars + dt * 46);
    }
    if (battle.anim) {
      battle.anim.t += dt;
      if (battle.anim.t >= battle.anim.duration) battle.anim = null;
    }
  }

  function updateOverworld(dt) {
    const p = game.player;
    if (p.moving) {
      p.moveT += dt * 7.5;
      if (p.moveT >= 1) {
        p.x = p.toX;
        p.y = p.toY;
        p.fromX = p.x;
        p.fromY = p.y;
        p.moving = false;
        p.moveT = 0;
        checkEncounter();
      }
      return;
    }

    for (const dir of DIR_ORDER) {
      const code = dirToCode(dir);
      if (keys.has(code)) {
        tryMove(dir);
        return;
      }
    }
  }

  function dirToCode(dir) {
    if (dir === "up") return "ArrowUp";
    if (dir === "down") return "ArrowDown";
    if (dir === "left") return "ArrowLeft";
    return "ArrowRight";
  }

  function tryMove(dir) {
    const p = game.player;
    const d = DIRS[dir];
    const tx = p.x + d.x;
    const ty = p.y + d.y;
    p.dir = dir;
    if (isBlocked(tx, ty)) return;
    p.moving = true;
    p.fromX = p.x;
    p.fromY = p.y;
    p.toX = tx;
    p.toY = ty;
    p.moveT = 0;
  }

  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const shakeX = game.shake > 0 ? Math.round(Math.sin(titlePulse * 70) * game.shake * 0.25) : 0;
    const shakeY = game.shake > 0 ? Math.round(Math.cos(titlePulse * 64) * game.shake * 0.2) : 0;
    ctx.translate(shakeX, shakeY);

    if (game.mode === "title") drawTitle();
    else if (game.mode === "battle") drawBattle();
    else {
      drawOverworld();
      if (game.mode === "menu") drawMenu();
      if (game.mode === "dialog") drawDialog();
    }

    ctx.restore();
  }

  function drawTitle() {
    const t = titlePulse;
    fill(0, 0, W, H, "#7ecf7f");
    for (let y = 0; y < H; y += TILE) {
      for (let x = 0; x < W; x += TILE) {
        drawTile(TILE_KIND.GRASS, x, y, x / TILE, y / TILE);
      }
    }
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 29 + 7) % W;
      const y = (i * 47 + 12) % 170;
      drawTreeTile(x - (i % 3) * 2, y);
    }
    fill(0, 171, W, 117, "#254159");
    fill(0, 171, W, 6, "#517d65");
    drawCreature("flameling", 34, 168 + Math.sin(t * 2) * 2, 3, { flip: false });
    drawCreature("aquabbit", 136, 169 + Math.sin(t * 2 + 1) * 2, 3, { flip: false });
    drawCreature("leafawn", 238, 168 + Math.sin(t * 2 + 2) * 2, 3, { flip: true });

    panel(28, 30, 264, 88, "#fff3cc", "#2d4152");
    text("Pocket Beasts", 160, 45, "#26384a", 20, "center", "bold");
    text("Forest Journey", 160, 72, "#3f7f5c", 15, "center", "bold");
    text("An original mini RPG", 160, 96, "#6b685a", 8, "center");

    const options = hasSave() ? ["Start Journey", "Continue"] : ["Start Journey"];
    panel(91, 126, 138, 45 + options.length * 18, "#f9edc9", "#2d4152");
    for (let i = 0; i < options.length; i += 1) {
      const y = 143 + i * 18;
      if (game.titleIndex === i) {
        fill(104, y - 2, 112, 14, "#f0c95a");
        text(">", 112, y, "#26384a", 9);
      }
      text(options[i], 160, y, "#26384a", 9, "center", "bold");
    }
  }

  function drawOverworld() {
    const p = game.player;
    const renderX = lerp(p.fromX, p.toX, p.moving ? p.moveT : 1);
    const renderY = lerp(p.fromY, p.toY, p.moving ? p.moveT : 1);
    const cameraX = clamp(renderX * TILE - W / 2 + TILE / 2, 0, MAP_W * TILE - W);
    const cameraY = clamp(renderY * TILE - H / 2 + TILE / 2, 0, MAP_H * TILE - H);

    fill(0, 0, W, H, "#79c96c");
    const startX = Math.floor(cameraX / TILE) - 1;
    const endX = Math.ceil((cameraX + W) / TILE) + 1;
    const startY = Math.floor(cameraY / TILE) - 1;
    const endY = Math.ceil((cameraY + H) / TILE) + 1;

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const sx = Math.round(x * TILE - cameraX);
        const sy = Math.round(y * TILE - cameraY);
        drawTile(tileAt(x, y), sx, sy, x, y);
      }
    }

    const sprites = currentNpcs()
      .map((npc) => ({ kind: "npc", y: npc.y, npc }))
      .concat([{ kind: "player", y: renderY, x: renderX }])
      .sort((a, b) => a.y - b.y);

    for (const sprite of sprites) {
      if (sprite.kind === "npc") {
        drawNpc(sprite.npc, sprite.npc.x * TILE - cameraX, sprite.npc.y * TILE - cameraY);
      } else {
        drawPlayer(renderX * TILE - cameraX, renderY * TILE - cameraY, p.dir);
      }
    }

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        if (tileAt(x, y) === TILE_KIND.TALL) {
          const sx = Math.round(x * TILE - cameraX);
          const sy = Math.round(y * TILE - cameraY);
          drawGrassOverlay(sx, sy, x, y);
        }
      }
    }

    drawOverworldHud();
  }

  function drawTile(tile, x, y, worldX, worldY) {
    if (tile === TILE_KIND.GRASS) {
      fill(x, y, TILE, TILE, "#73c768");
      const n = (worldX * 19 + worldY * 31) % 5;
      fill(x + 2 + n, y + 10, 2, 3, "#4aa95d");
      fill(x + 11 - n, y + 5, 1, 3, "#8de079");
      return;
    }
    if (tile === TILE_KIND.PATH) {
      fill(x, y, TILE, TILE, "#d7bc72");
      fill(x + 1, y + 2, 3, 2, "#c6a85e");
      fill(x + 10, y + 9, 4, 2, "#e8cf89");
      fill(x + 6, y + 14, 2, 1, "#b99a56");
      return;
    }
    if (tile === TILE_KIND.TALL) {
      fill(x, y, TILE, TILE, "#68bf62");
      fill(x + 1, y + 3, 3, 11, "#3c9d55");
      fill(x + 5, y + 1, 3, 13, "#4aad5b");
      fill(x + 10, y + 4, 3, 10, "#2f8d4d");
      fill(x + 13, y + 2, 2, 12, "#5ec968");
      return;
    }
    if (tile === TILE_KIND.TREE) {
      drawTreeTile(x, y);
      return;
    }
    if (tile === TILE_KIND.WATER) {
      fill(x, y, TILE, TILE, "#4ca6e8");
      fill(x + 1, y + 4, 6, 2, "#83c9f3");
      fill(x + 8, y + 10, 7, 2, "#2f7fc2");
      fill(x + ((worldX + worldY) % 4), y + 1, 3, 1, "#b7e8ff");
      return;
    }
    if (tile === TILE_KIND.HOUSE) {
      fill(x, y, TILE, TILE, "#8f4d43");
      fill(x, y, TILE, 5, "#d0645d");
      fill(x + 2, y + 5, 12, 9, "#f2d18f");
      fill(x + 6, y + 9, 4, 5, "#6e4f3b");
      return;
    }
    if (tile === TILE_KIND.ROCK) {
      fill(x, y, TILE, TILE, "#6f6f72");
      fill(x + 2, y + 2, 10, 4, "#9a9485");
      fill(x + 5, y + 8, 9, 5, "#55585f");
      fill(x + 1, y + 13, 14, 2, "#44474e");
      return;
    }
    if (tile === TILE_KIND.FLOWER) {
      drawTile(TILE_KIND.GRASS, x, y, worldX, worldY);
      fill(x + 4, y + 5, 2, 2, "#ffdf65");
      fill(x + 3, y + 4, 1, 1, "#e86fa8");
      fill(x + 6, y + 4, 1, 1, "#e86fa8");
      fill(x + 11, y + 10, 2, 2, "#fff3cc");
      fill(x + 10, y + 9, 1, 1, "#d94f8c");
      return;
    }
    if (tile === TILE_KIND.CAVE) {
      fill(x, y, TILE, TILE, "#8d866f");
      fill(x + 1, y + 1, 5, 2, "#a69e86");
      fill(x + 9, y + 7, 5, 2, "#6f6759");
      fill(x + 4, y + 13, 6, 1, "#575246");
      return;
    }
    if (tile === TILE_KIND.ARENA) {
      fill(x, y, TILE, TILE, "#51446a");
      fill(x + 2, y + 3, 4, 1, "#7e6da4");
      fill(x + 10, y + 9, 3, 2, "#392f4e");
      fill(x + ((worldX * 3 + worldY) % 9), y + 13, 2, 1, "#a4d1e6");
      return;
    }
    if (tile === TILE_KIND.FENCE) {
      fill(x, y, TILE, TILE, "#73c768");
      fill(x + 1, y + 6, 14, 3, "#8b5b3d");
      fill(x + 3, y + 3, 2, 10, "#6e452f");
      fill(x + 11, y + 3, 2, 10, "#6e452f");
    }
  }

  function drawTreeTile(x, y) {
    fill(x, y, TILE, TILE, "#2f7b4b");
    fill(x + 2, y + 1, 12, 10, "#3d9d56");
    fill(x + 1, y + 5, 14, 8, "#256f43");
    fill(x + 6, y + 9, 4, 7, "#6e452f");
    fill(x + 4, y + 12, 8, 3, "#8b5b3d");
    fill(x + 5, y + 2, 3, 2, "#74cf68");
  }

  function drawGrassOverlay(x, y, worldX, worldY) {
    const sway = Math.round(Math.sin(titlePulse * 4 + worldX + worldY) * 1);
    fill(x + 1 + sway, y + 10, 3, 6, "#2f8d4d");
    fill(x + 6 - sway, y + 9, 3, 7, "#3c9d55");
    fill(x + 12 + sway, y + 10, 2, 6, "#2f8d4d");
  }

  function drawNpc(npc, sx, sy) {
    if (sx < -20 || sy < -24 || sx > W + 20 || sy > H + 20) return;
    if (npc.type === "boss") {
      drawCreature("shadewisp", sx - 8, sy - 18 + Math.sin(titlePulse * 3) * 2, 2, {});
      return;
    }
    fill(sx + 4, sy + 13, 8, 3, "rgba(20, 33, 31, 0.22)");
    fill(sx + 5, sy + 4, 6, 6, "#f0c9a0");
    fill(sx + 4, sy + 2, 8, 4, npc.color);
    fill(sx + 4, sy + 9, 8, 6, npc.color);
    fill(sx + 3, sy + 10, 2, 5, "#f0c9a0");
    fill(sx + 11, sy + 10, 2, 5, "#f0c9a0");
    fill(sx + 6, sy + 6, 1, 1, "#26384a");
    fill(sx + 9, sy + 6, 1, 1, "#26384a");
    fill(sx + 5, sy + 15, 2, 2, "#32364a");
    fill(sx + 9, sy + 15, 2, 2, "#32364a");
  }

  function drawPlayer(sx, sy, dir) {
    fill(sx + 4, sy + 13, 8, 3, "rgba(20, 33, 31, 0.22)");
    fill(sx + 5, sy + 4, 6, 6, "#f3caa5");
    fill(sx + 3, sy + 2, 10, 4, "#e45757");
    fill(sx + 5, sy + 1, 6, 2, "#f0c95a");
    fill(sx + 4, sy + 9, 8, 6, "#4f7fc7");
    fill(sx + 3, sy + 10, 2, 5, "#f3caa5");
    fill(sx + 11, sy + 10, 2, 5, "#f3caa5");
    if (dir === "up") {
      fill(sx + 5, sy + 6, 6, 2, "#7d4b36");
    } else {
      fill(sx + 6, sy + 6, 1, 1, "#26384a");
      fill(sx + 9, sy + 6, 1, 1, "#26384a");
    }
    fill(sx + 5, sy + 15, 2, 2, "#26384a");
    fill(sx + 9, sy + 15, 2, 2, "#26384a");
  }

  function drawOverworldHud() {
    const active = game.party[firstLivingPartyIndex()];
    panel(6, 6, 134, 30, "#fff3cc", "#2d4152");
    text(locationName(), 12, 11, "#26384a", 8, "left", "bold");
    if (active) {
      text(`${active.name} Lv.${active.level}`, 12, 21, "#3f4f58", 7);
      drawHpBar(78, 22, 52, 5, active.displayHp, active.stats.hp);
    }
    if (game.story.shadowCalmed) {
      panel(177, 6, 137, 22, "#dcfff2", "#2d6a58");
      text("Forest Calmed", 245, 13, "#2d6a58", 8, "center", "bold");
    }
  }

  function locationName() {
    const x = game.player.x;
    const y = game.player.y;
    if (x < 18 && y > 21) return "Lanternroot Village";
    if (x > 30 && y < 12) return "Moonlit Arena";
    if (x > 29 && y > 13) return "Pebble Cave";
    return "Whispering Forest";
  }

  function drawDialog() {
    const dialog = game.dialog;
    if (!dialog) return;
    panel(10, 205, 300, 72, "#fff3cc", "#2d4152");
    const line = dialog.lines[dialog.index] || "";
    const visible = line.slice(0, Math.floor(dialog.chars));
    wrappedText(visible, 20, 215, 280, "#26384a", 9, 13);
    const isComplete = dialog.chars >= line.length;
    const hasChoices = dialog.choices && dialog.index >= dialog.lines.length - 1 && isComplete;
    if (hasChoices) {
      const choiceY = 215 + Math.min(34, Math.ceil(wrapLines(line, 280, 9).length * 13));
      for (let i = 0; i < dialog.choices.length; i += 1) {
        const y = choiceY + i * 12;
        if (dialog.choiceIndex === i) {
          fill(185, y - 1, 104, 10, "#f0c95a");
          text(">", 193, y, "#26384a", 8);
        }
        text(dialog.choices[i].label, 206, y, "#26384a", 8, "left", "bold");
      }
    } else if (isComplete) {
      text("v", 294, 260 + Math.sin(titlePulse * 8) * 1, "#26384a", 8, "center", "bold");
    }
  }

  function drawMenu() {
    dim();
    const menu = game.menu;
    if (menu.screen === "main") {
      panel(203, 40, 101, 123, "#fff3cc", "#2d4152");
      text("Menu", 253, 51, "#26384a", 10, "center", "bold");
      const options = ["Party", "Bag", "Save", "Load", "Close"];
      for (let i = 0; i < options.length; i += 1) {
        const y = 70 + i * 17;
        if (menu.index === i) fill(216, y - 2, 73, 13, "#f0c95a");
        text(options[i], 253, y, "#26384a", 9, "center", "bold");
      }
      return;
    }

    if (menu.screen === "party" || menu.screen === "bagTarget") {
      panel(24, 34, 272, 202, "#fff3cc", "#2d4152");
      text(menu.screen === "party" ? "Party" : "Use Berry Tonic", 160, 45, "#26384a", 10, "center", "bold");
      drawPartyList(42, 64, 236, menu.partyIndex);
      return;
    }

    if (menu.screen === "bag") {
      panel(38, 46, 244, 178, "#fff3cc", "#2d4152");
      text("Bag", 160, 58, "#26384a", 10, "center", "bold");
      for (let i = 0; i < ITEMS.length; i += 1) {
        const item = ITEMS[i];
        const y = 82 + i * 28;
        if (menu.bagIndex === i) fill(54, y - 4, 212, 22, "#f0c95a");
        text(item.name, 66, y, "#26384a", 9, "left", "bold");
        text(`x${game.inventory[item.id] || 0}`, 250, y, "#26384a", 9, "right", "bold");
        text(item.desc, 66, y + 11, "#5b6258", 7);
      }
    }
  }

  function drawPartyList(x, y, width, selected) {
    if (!game.party.length) {
      text("No partners yet.", x, y, "#26384a", 9);
      return;
    }
    for (let i = 0; i < game.party.length; i += 1) {
      const creature = game.party[i];
      const rowY = y + i * 27;
      if (selected === i) fill(x - 5, rowY - 4, width, 24, "#f0c95a");
      drawCreature(creature.speciesId, x, rowY - 6, 1, {});
      text(`${creature.name} Lv.${creature.level}`, x + 28, rowY, "#26384a", 8, "left", "bold");
      text(creature.element, x + 151, rowY, ELEMENT_COLOR[creature.element], 8, "left", "bold");
      drawHpBar(x + 28, rowY + 11, 96, 6, creature.displayHp, creature.stats.hp);
      text(`${Math.ceil(creature.currentHp)}/${creature.stats.hp}`, x + 133, rowY + 10, "#26384a", 7);
    }
  }

  function drawBattle() {
    const battle = game.battle;
    if (!battle) return;
    drawBattleBackground(battle);
    const player = activeCreature();
    const enemy = enemyCreature();

    drawCreature(enemy.speciesId, 211, 54, 4, {
      flip: true,
      faint: enemy.currentHp <= 0,
      flash: battle.anim && battle.anim.kind === "attack" && battle.anim.side === "player",
    });
    drawCreature(player.speciesId, 43, 132, 4, {
      flip: false,
      faint: player.currentHp <= 0,
      flash: battle.anim && battle.anim.kind === "attack" && battle.anim.side === "enemy",
    });

    drawBattleEffects();
    drawBattleStatus(enemy, 12, 18, false);
    drawBattleStatus(player, 168, 123, true);
    drawBattleCommandArea();
  }

  function drawBattleBackground(battle) {
    fill(0, 0, W, H, battle.boss ? "#4e4a78" : "#80c778");
    fill(0, 0, W, 100, battle.boss ? "#6d6598" : "#8bd180");
    fill(0, 96, W, 64, battle.boss ? "#53436b" : "#74bf67");
    fill(0, 150, W, 56, battle.boss ? "#3b314e" : "#5aa75b");
    for (let x = 0; x < W; x += 16) {
      fill(x, 86 + ((x / 16) % 2) * 3, 18, 12, battle.boss ? "#7664a1" : "#4d9954");
      fill(x + 5, 145, 20, 9, battle.boss ? "#625284" : "#448f4e");
    }
    ellipse(236, 119, 48, 12, battle.boss ? "#372b4b" : "#477a49");
    ellipse(79, 199, 56, 14, battle.boss ? "#372b4b" : "#477a49");
    panel(88, 5, 144, 18, battle.boss ? "#efe5ff" : "#fff3cc", "#2d4152");
    text(battle.title, 160, 10, "#26384a", 8, "center", "bold");
  }

  function drawBattleStatus(creature, x, y, playerSide) {
    panel(x, y, 140, 42, "#fff3cc", "#2d4152");
    drawCreature(creature.speciesId, x + 6, y + 6, 1, {});
    text(creature.name, x + 30, y + 8, "#26384a", 8, "left", "bold");
    text(`Lv.${creature.level}`, x + 112, y + 8, "#26384a", 8, "left", "bold");
    drawHpBar(x + 30, y + 23, 86, 6, creature.displayHp, creature.stats.hp);
    if (playerSide) {
      text(`${Math.ceil(creature.currentHp)}/${creature.stats.hp}`, x + 119, y + 21, "#26384a", 7, "left");
    }
  }

  function drawBattleCommandArea() {
    const battle = game.battle;
    panel(8, 212, 304, 68, "#fff3cc", "#2d4152");
    if (battle.phase === "message" || battle.phase === "locked") {
      const msg = battle.message.slice(0, Math.floor(battle.messageChars));
      wrappedText(msg, 20, 225, 276, "#26384a", 9, 14);
      if (battle.phase === "message" && battle.messageChars >= battle.message.length) {
        text("v", 296, 264 + Math.sin(titlePulse * 8) * 1, "#26384a", 8, "center", "bold");
      }
      return;
    }

    if (battle.phase === "menu") {
      const options = ["Attack", "Item", "Switch", "Capture"];
      for (let i = 0; i < options.length; i += 1) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 32 + col * 136;
        const y = 226 + row * 25;
        if (battle.mainIndex === i) fill(x - 8, y - 4, 112, 17, "#f0c95a");
        text(options[i], x + 46, y, "#26384a", 9, "center", "bold");
      }
      return;
    }

    if (battle.phase === "skill") {
      const skills = SPECIES[activeCreature().speciesId].skills;
      for (let i = 0; i < skills.length; i += 1) {
        const skill = skills[i];
        const y = 227 + i * 24;
        if (battle.skillIndex === i) fill(20, y - 4, 150, 17, "#f0c95a");
        text(skill.name, 31, y, "#26384a", 9, "left", "bold");
        text(`${skill.element} ${skill.power}`, 190, y, ELEMENT_COLOR[skill.element], 8, "left", "bold");
      }
      return;
    }

    if (battle.phase === "item") {
      for (let i = 0; i < ITEMS.length; i += 1) {
        const item = ITEMS[i];
        const y = 227 + i * 24;
        if (battle.itemIndex === i) fill(20, y - 4, 190, 17, "#f0c95a");
        text(`${item.name} x${game.inventory[item.id] || 0}`, 31, y, "#26384a", 9, "left", "bold");
        text(item.desc, 31, y + 11, "#5b6258", 7);
      }
      return;
    }

    if (battle.phase === "switch" || battle.phase === "forcedSwitch") {
      text("Choose a partner", 20, 221, "#26384a", 8, "left", "bold");
      const maxRows = Math.min(3, game.party.length);
      for (let row = 0; row < maxRows; row += 1) {
        const i = row;
        const creature = game.party[i];
        const y = 237 + row * 14;
        if (battle.switchIndex === i) fill(18, y - 2, 145, 12, "#f0c95a");
        text(`${creature.name} Lv.${creature.level}`, 26, y, "#26384a", 7, "left", "bold");
        drawHpBar(118, y + 2, 40, 4, creature.displayHp, creature.stats.hp);
      }
      if (game.party.length > 3) {
        for (let row = 3; row < game.party.length; row += 1) {
          const creature = game.party[row];
          const y = 237 + (row - 3) * 14;
          if (battle.switchIndex === row) fill(171, y - 2, 129, 12, "#f0c95a");
          text(`${creature.name} Lv.${creature.level}`, 178, y, "#26384a", 7, "left", "bold");
          drawHpBar(258, y + 2, 36, 4, creature.displayHp, creature.stats.hp);
        }
      }
    }
  }

  function drawBattleEffects() {
    const battle = game.battle;
    if (!battle || !battle.anim) return;
    const anim = battle.anim;
    const t = clamp(anim.t / anim.duration, 0, 1);

    if (anim.kind === "attack") {
      const from = anim.side === "player" ? { x: 100, y: 155 } : { x: 238, y: 83 };
      const to = anim.side === "player" ? { x: 238, y: 82 } : { x: 91, y: 157 };
      const x = lerp(from.x, to.x, easeOut(t));
      const y = lerp(from.y, to.y, easeOut(t));
      const color = ELEMENT_COLOR[anim.element] || "#fff3cc";
      for (let i = 0; i < 5; i += 1) {
        fill(x - i * 4, y + Math.sin(t * 9 + i) * 5, 5, 5, color);
      }
      if (anim.element === "Electric") {
        strokeLightning(x - 12, y - 10, x + 12, y + 10, "#fff27a");
      }
      if (anim.element === "Shadow") {
        ellipse(x, y, 18 + t * 10, 10 + t * 6, "rgba(55, 36, 82, 0.55)");
      }
      return;
    }

    if (anim.kind === "capsule") {
      const x = lerp(78, 235, easeOut(Math.min(1, t * 1.4)));
      const y = lerp(158, 92, easeOut(Math.min(1, t * 1.4))) + Math.sin(t * 30) * 3;
      drawCapsule(x, y, 2);
      ellipse(235, 111, 22 + Math.sin(t * 20) * 4, 8, "rgba(240, 201, 90, 0.35)");
      if (anim.success && t > 0.7) {
        ellipse(235, 95, 44 * (t - 0.65), 28 * (t - 0.65), "rgba(255, 243, 204, 0.35)");
      }
    }
  }

  function drawCapsule(x, y, scale) {
    const s = scale;
    fill(x - 5 * s, y - 4 * s, 10 * s, 4 * s, "#e45757");
    fill(x - 5 * s, y, 10 * s, 4 * s, "#fff3cc");
    fill(x - 6 * s, y - 1 * s, 12 * s, 2 * s, "#2d4152");
    fill(x - 2 * s, y - 2 * s, 4 * s, 4 * s, "#f0c95a");
    fill(x - 1 * s, y - 1 * s, 2 * s, 2 * s, "#fff3cc");
  }

  function drawHpBar(x, y, w, h, hp, maxHp) {
    const ratio = clamp(hp / maxHp, 0, 1);
    fill(x, y, w, h, "#7b3e43");
    const color = ratio > 0.5 ? "#55bd69" : ratio > 0.22 ? "#f0c95a" : "#e45757";
    fill(x + 1, y + 1, Math.max(0, Math.round((w - 2) * ratio)), h - 2, color);
    fill(x, y, w, 1, "#26384a");
    fill(x, y + h - 1, w, 1, "#26384a");
  }

  function drawCreature(speciesId, x, y, scale, opts = {}) {
    const s = scale;
    const px = (cx, cy, cw, ch, color) => {
      const rx = opts.flip ? x + (16 - cx - cw) * s : x + cx * s;
      fill(rx, y + cy * s, cw * s, ch * s, color);
    };
    const faintOffset = opts.faint ? 5 * s : 0;
    y += faintOffset;

    if (opts.faint) ctx.globalAlpha = 0.55;
    if (speciesId === "flameling") {
      px(3, 7, 8, 5, "#f26a3d");
      px(6, 4, 6, 5, "#ff8d4a");
      px(5, 2, 2, 4, "#f26a3d");
      px(10, 2, 2, 4, "#f26a3d");
      px(6, 5, 4, 3, "#ffd28a");
      px(11, 8, 4, 3, "#d94d35");
      px(13, 6, 2, 3, "#ffd84f");
      px(4, 12, 2, 2, "#743a2a");
      px(9, 12, 2, 2, "#743a2a");
      px(7, 6, 1, 1, "#2d4152");
      px(10, 6, 1, 1, "#2d4152");
      px(8, 8, 2, 1, "#743a2a");
    } else if (speciesId === "aquabbit") {
      px(4, 7, 8, 5, "#4ca6e8");
      px(6, 4, 6, 5, "#68c4f4");
      px(6, 1, 2, 5, "#4ca6e8");
      px(10, 1, 2, 5, "#4ca6e8");
      px(7, 7, 4, 4, "#d9f5ff");
      px(3, 9, 2, 3, "#347fc5");
      px(11, 12, 2, 2, "#2f6aa5");
      px(5, 12, 2, 2, "#2f6aa5");
      px(7, 6, 1, 1, "#1c3651");
      px(10, 6, 1, 1, "#1c3651");
      px(8, 8, 2, 1, "#1c3651");
    } else if (speciesId === "leafawn") {
      px(3, 8, 9, 4, "#64bb64");
      px(7, 5, 6, 5, "#77cf70");
      px(5, 4, 2, 2, "#8b5b3d");
      px(11, 3, 2, 3, "#8b5b3d");
      px(4, 2, 2, 2, "#58a85c");
      px(12, 1, 2, 2, "#58a85c");
      px(8, 7, 4, 3, "#e6c68b");
      px(4, 12, 2, 3, "#4d8f50");
      px(10, 12, 2, 3, "#4d8f50");
      px(9, 7, 1, 1, "#26384a");
      px(12, 7, 1, 1, "#26384a");
    } else if (speciesId === "sparkit") {
      px(4, 7, 8, 5, "#ffd84f");
      px(6, 4, 6, 5, "#ffe46f");
      px(5, 2, 2, 3, "#ffd84f");
      px(11, 2, 2, 3, "#ffd84f");
      px(12, 8, 2, 2, "#ffd84f");
      px(14, 6, 1, 3, "#fff27a");
      px(2, 9, 2, 2, "#ffb23c");
      px(5, 12, 2, 2, "#b57a2a");
      px(10, 12, 2, 2, "#b57a2a");
      px(7, 6, 1, 1, "#26384a");
      px(10, 6, 1, 1, "#26384a");
      px(7, 8, 1, 1, "#67d7ff");
      px(11, 8, 1, 1, "#67d7ff");
    } else if (speciesId === "rockub") {
      px(3, 7, 10, 6, "#8d8a82");
      px(5, 4, 7, 5, "#aaa493");
      px(4, 3, 2, 3, "#6f6f72");
      px(11, 3, 2, 3, "#6f6f72");
      px(7, 7, 3, 3, "#e6dec2");
      px(2, 9, 3, 3, "#6f6f72");
      px(11, 11, 3, 2, "#5d5e62");
      px(5, 13, 3, 2, "#55585f");
      px(10, 13, 3, 2, "#55585f");
      px(7, 6, 1, 1, "#26384a");
      px(10, 6, 1, 1, "#26384a");
      px(8, 8, 2, 1, "#55585f");
    } else if (speciesId === "shadewisp") {
      const bob = Math.round(Math.sin(titlePulse * 5) * s);
      y += bob;
      px(4, 5, 8, 7, "#6a4aa0");
      px(5, 3, 6, 4, "#8061bf");
      px(3, 8, 3, 4, "#4a3475");
      px(10, 8, 3, 4, "#4a3475");
      px(4, 12, 2, 3, "#4a3475");
      px(7, 12, 2, 3, "#8061bf");
      px(10, 12, 2, 3, "#4a3475");
      px(6, 6, 2, 2, "#9ff4ff");
      px(10, 6, 2, 2, "#9ff4ff");
      px(7, 9, 4, 1, "#2b223f");
    }
    if (opts.flash) {
      ctx.globalAlpha = 0.42;
      fill(x, y, 16 * s, 16 * s, "#fff8e6");
      ctx.globalAlpha = opts.faint ? 0.55 : 1;
    }
    ctx.globalAlpha = 1;
  }

  function panel(x, y, w, h, fillColor = "#fff3cc", borderColor = "#2d4152") {
    fill(x, y, w, h, borderColor);
    fill(x + 2, y + 2, w - 4, h - 4, "#f4d889");
    fill(x + 4, y + 4, w - 8, h - 8, fillColor);
    fill(x + 4, y + 4, w - 8, 2, "rgba(255,255,255,0.28)");
  }

  function dim() {
    fill(0, 0, W, H, "rgba(20, 30, 38, 0.32)");
  }

  function text(value, x, y, color = "#26384a", size = 8, align = "left", weight = "normal") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Courier New", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillText(value, Math.round(x), Math.round(y));
    ctx.restore();
  }

  function wrappedText(value, x, y, maxWidth, color, size, lineHeight) {
    const lines = wrapLines(value, maxWidth, size);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], x, y + i * lineHeight, color, size);
    }
  }

  function wrapLines(value, maxWidth, size) {
    ctx.save();
    ctx.font = `${size}px "Courier New", monospace`;
    const words = value.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  function fill(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function ellipse(x, y, rx, ry, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function strokeLightning(x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo((x1 + x2) / 2 - 5, (y1 + y2) / 2);
    ctx.lineTo((x1 + x2) / 2 + 4, (y1 + y2) / 2 - 2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function wrap(value, length) {
    if (length <= 0) return 0;
    return ((value % length) + length) % length;
  }

  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  }

  function isConfirm(code) {
    return code === "KeyZ" || code === "Enter" || code === "Space";
  }

  function isCancel(code) {
    return code === "KeyX" || code === "Escape" || code === "Backspace";
  }

  function normalizeKey(event) {
    const code = event.code;
    if (code === "KeyW") return "ArrowUp";
    if (code === "KeyA") return "ArrowLeft";
    if (code === "KeyS") return "ArrowDown";
    if (code === "KeyD") return "ArrowRight";
    return code;
  }

  function handlePress(code) {
    if (game.mode === "title") {
      const options = hasSave() ? 2 : 1;
      if (code === "ArrowUp" || code === "ArrowDown") game.titleIndex = wrap(game.titleIndex + 1, options);
      if (isConfirm(code)) {
        if (hasSave() && game.titleIndex === 1) {
          const ok = loadGame();
          if (!ok) newGame();
        } else {
          newGame();
        }
      }
      return;
    }

    if (game.mode === "dialog") {
      handleDialogKey(code);
      return;
    }

    if (game.mode === "menu") {
      handleMenuKey(code);
      return;
    }

    if (game.mode === "battle") {
      handleBattleKey(code);
      return;
    }

    if (game.mode === "overworld") {
      if (isConfirm(code)) interact();
      if (isCancel(code) || code === "Enter") openMenu();
    }
  }

  window.addEventListener("keydown", (event) => {
    const code = normalizeKey(event);
    const controlled =
      code.startsWith("Arrow") ||
      ["KeyZ", "KeyX", "Enter", "Space", "Escape", "Backspace"].includes(code);
    if (!controlled) return;
    event.preventDefault();
    if (!keys.has(code)) handlePress(code);
    keys.add(code);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(normalizeKey(event));
  });

  document.querySelectorAll("[data-key]").forEach((button) => {
    const code = button.getAttribute("data-key");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touchHolds.set(event.pointerId, code);
      if (!keys.has(code)) handlePress(code);
      keys.add(code);
    });
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      keys.delete(touchHolds.get(event.pointerId));
      touchHolds.delete(event.pointerId);
    });
    button.addEventListener("pointercancel", (event) => {
      keys.delete(touchHolds.get(event.pointerId));
      touchHolds.delete(event.pointerId);
    });
  });

  function loop(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
