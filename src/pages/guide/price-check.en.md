---
title: How to Tell What an Item Is Worth in Path of Exile 2 — Mirror Price-Check Guide
description: The complete method for pricing gear in Path of Exile 1 & 2: hover an item and press Ctrl+E, interpret each part of the overlay, why you should select modifiers yourself rather than all of them, how pseudo modifiers (total resistance / total life) work, and why unidentified uniques can only be searched by base type.
keywords: poe2 price check,how much is this item worth,item pricing,poe2 price checker,how to price items,trade search,pseudo mods,total resistance,unidentified unique,ctrl+e,mirror price check
---

# How to tell what an item is worth

Path of Exile has no official prices. An item's value depends on **how many comparable items are currently listed, and at what price**. Pricing is therefore a trade search: translate the item's attributes into search conditions, then observe the range the returned listings ask for.

Performing this manually requires copying the item in game, opening the trade site, locating the relevant entries among thousands of modifiers, selecting each one, entering minimum values and running the search. Roughly a minute per item; half an hour for a stash tab.

Mirror compresses that into a single hotkey.

## Procedure

1. Start the Mirror client and leave it running in the background (it does not take focus from the game)
2. **Hover** the target item in game
3. Press <kbd>Ctrl</kbd> + <kbd>E</kbd>

An overlay appears beside the item, listing every modifier it rolled together with a reference price.

> The hotkey can be changed on the client's **Shortcuts** page, or bound to a gamepad — every feature supports gamepad triggers.

## Reading the overlay

**Modifiers are colour-coded by type.** Fractured, crafted and corrupted each have their own colour, because their value differs substantially: a high-tier fractured modifier can be worth more than the rest of the item combined, whereas crafted modifiers can be added by the buyer and generally carry no premium.

**Each modifier has a checkbox.** Only a few are selected by default. This is deliberate; the reason follows below.

**Values accept a lower bound.** Selecting "maximum Life" proposes a floor based on what the item actually rolled. It can be lowered manually to widen the result set and increase the sample.

## Why not select everything

Selecting everything asks whether the market holds an item **identical** to this one. Usually it does not, and the search returns nothing — and an empty result does not indicate a high price, it indicates **no information at all**.

The more useful question is what **comparable** items sell for. Therefore:

- Select the entries **buyers pay for** — life, resistances, damage, skill levels
- Omit entries nobody searches for — most crafted modifiers, low-tier fillers
- Lower the minimums moderately, to obtain a sufficient sample

This is the only step in the process that calls for judgement, and the reason Mirror does not decide on your behalf: which modifiers carry value depends on the patch, the league, and which builds the market is currently assembling.

## Pseudo modifiers: searching "total resistance" in one step

When buying a ring, a player rarely thinks "fire resistance ≥ 30"; they consider whether the three resistances sum to enough. The trade site supports this natively — these are **pseudo modifiers**: total elemental resistance, total life, and so on.

The overlay lists them separately, and a click adds them to the search. They are more accurate than selecting resistances individually, because the market prices the total rather than the parts.

## Special cases

**Unidentified uniques.** These have no name, and the trade site does not index names for unidentified items, so the only available search is "base type + unidentified" — which is fundamentally **a speculative price**. Mirror derives every unique that base can produce and lists them; selecting one switches the whole query to that tier.

**Related items.** When pricing a fragment, ticket or unique, the overlay also lists items grouped with it in the upstream data, prices included. Note that this relationship means "related", not "this necessarily drops that".

**Thaumaturgic Dust** (Path of Exile 1). The amount of dust a unique disenchants into is computed directly on the overlay — in some cases disenchanting yields more than selling.

## After the search

Several exits are provided along the bottom of the overlay:

- **Search** — opens the official trade site with the current conditions, filters carried over intact
- **Two market entries** — one carries GGG's saved-search id (which consumes a search from your quota); the other carries **the query itself** into [Mirror Market](/en/guide/market.html), where it arrives as an editable copy you can continue to adjust

## Pricing a whole screen at once

Hovering items individually is slow. Pressing <kbd>Ctrl</kbd> + <kbd>D</kbd> captures one frame; Mirror recognises every item name on it **locally** and prices them in bulk, returning results in one to two seconds. The capture is not uploaded.

That path identifies items by name only, so it suits currency, uniques and divination cards — items whose name determines the price. Gear with random modifiers still requires an individual hover.

---

**Next**: [Using Mirror Market](/en/guide/market.html) · [Installing a loot filter](/en/guide/loot-filter.html)
