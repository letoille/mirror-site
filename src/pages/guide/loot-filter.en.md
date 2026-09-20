---
title: How to Install a Path of Exile 2 Loot Filter — Mirror / NeverSink Custom Build
description: How to install a Path of Exile 2 loot filter: which of the three to pick, what the sound versions do, and one-click install vs copying it in.
keywords: poe2 loot filter,path of exile 2 item filter,how to install loot filter,neversink,filter download,filter sounds,poe2 filter install,loot filter guide,pushing filter,farming filter,speed filter
---

# How to install a loot filter

Most of what drops in a Path of Exile 2 map is not worth picking up. A loot filter determines **what appears on the ground and what is never drawn at all**, and can attach an alert sound and a beam to items that matter.

It is the highest-return configuration in the game: set up once, and every subsequent map is quieter.

## What we publish

We do not write filter rules. We redistribute **[NeverSink's](https://github.com/NeverSinkDev)** — the version this community settled on, under the MIT licence. What we do is tune it to current economy data and divide it three ways:

| Which one | When it fits |
|---|---|
| **Pushing** | From act one through to T15 maps. Shows more, to avoid missing anything |
| **Farming** | The T15 stage: upgrades, currency, and the pieces a build still lacks |
| **Speed** | Once the build is complete. Only genuinely valuable items remain; the floor is markedly cleaner |

Each also comes in a **version with alert sounds**, announcing high-value drops.

⚠️ Sound versions are Path of Exile 2 only. POE1 has no custom alert sounds, so those entries simply don't appear.

**All three can be installed at once** and switched in game at any time, so no decision is required up front: use Pushing while levelling, then move to Farming once maps are running.

## Method one: one-click install from the client (recommended)

Open the Mirror client → **Filters** → pick one → install.

The client performs two operations: writing it into the game folder, and pushing it to your GGG account so that it is available when you log in from another machine. The in-game name takes the form `Mirror - Pushing`, with the sound version named `Mirror - Pushing Sounds`.

The client then tracks the version: on an upstream update, an interface-language change or a sound-pack swap, it will prompt a reinstall.

> Checking whether a new version exists requires no account. **Installing** requires you to be signed in with a membership. The two are handled separately: the filter files themselves are free, as described below.

## Method two: place the file manually

If you would rather not sign in, or simply wish to try one, download the file directly:

**[trade.kalandraeye.com/en/filters](https://trade.kalandraeye.com/en/filters)**

All three, together with their sound versions, are freely available. Place the file in:

```
Documents/My Games/Path of Exile 2/
```

⚠️ If OneDrive backup is enabled, `Documents` may have been redirected elsewhere. Rely on what the game recognises rather than a manually constructed path.

The sound pack's mp3 files go in that same folder.

## Switching in game

<kbd>Esc</kbd> → **Options** → **UI** → pick it from the dropdown.

Each installed filter appears as an option. Switching takes effect immediately; no restart is required.

## When to change

- **Too much on the floor to read** → move toward Speed
- **You feel like you're missing things** → move toward Pushing
- **League start** → Pushing, then Farming once T15 is steady
- **Upstream updated** → the client will say so; if you installed by hand, check the download page now and then

## Common problems

**Installed, but nothing changed.** Confirm the game has it selected (the three steps above). A filter never activates on its own; it must be chosen in Options.

**No alert sounds.** The mp3 files must reside in the same folder as the filter. We also layer an *optional* alert sound, so a missing file never silences an entire rule; the rule in question may simply not have triggered.

**Is there a ban risk?** Loot filters are **an officially supported feature**; the dropdown in the Esc menu is provided by the game itself. A filter is a text file and does not touch the game process.

---

**Next**: [What is this item worth](/en/guide/price-check.html) · [Using Mirror Market](/en/guide/market.html)
