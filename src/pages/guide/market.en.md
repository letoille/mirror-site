---
title: Using Mirror Market — Path of Exile 2 Trade Search, Character Try-On, Live Search
description: A guide to Mirror Market (trade.kalandraeye.com): how the modifier pool narrows to the item class you picked, switching between the Global, China and Taiwan realms, why changing the sort re-runs the search, turning on live search, contacting sellers and hideout links, and why market search needs the Mirror client running.
keywords: mirror market,poe2 trade search,path of exile 2 trade site,search by modifier,item class projection,live search,character try-on,path of building,contact seller,hideout,global realm,taiwan realm,how to use trade search
---

# Using Mirror Market

The difficulty with the official trade site is not a lack of features but an excess of entries: a single dropdown holds thousands of modifiers, the vast majority of which cannot roll on the item class in question.

Mirror Market does one thing: **the form narrows with the item**. Select a bow and the modifier pool reduces to the 55 a bow can roll, the filters to 32. The question of which dropdown holds the entry you need no longer arises.

Open it at [trade.kalandraeye.com](https://trade.kalandraeye.com/en).

## Prerequisite: the client must be running

Market search and character try-on **require the Mirror client to be running**. The [loot filters](/en/guide/loot-filter.html) and the regex generator on the same site do not; those work from the browser alone.

The reasons for that dependency:

- **Searches use your own official trade session.** Every search, page turn and seller contact is issued by the client on your machine, under your account and your IP. Our servers issue **no requests at all** to the official trade API; this is a compliance requirement.
- **Character try-on runs Path of Building itself**, rather than our own implementation of its damage formulas. That engine resides in the client process and cannot be hosted in a browser.

The page connects to your local client automatically on first load. If the connection fails, a “connect client” button appears; pressing it brings the client to the foreground, starting it if it is not already running.

## Searching for something

1. Pick an **item class** at the top (bow, wand, ring…)
2. The modifier pool and filters narrow to that class
3. Add conditions: required modifiers, minimum values, a price ceiling, sockets, level and so on
4. Search

Name search accepts all three languages: an item name entered in English, Simplified or Traditional Chinese will match. The same item often carries substantially different names across realms (“Headhunter” versus <span lang="zh-Hant">獵首</span>), so no prior translation is needed.

## Switching realms

One dropdown at the top: Global, China, Taiwan. When you switch:

- The league list refetches for that realm (each has its own leagues)
- Base names are rewritten into that realm's language

⚠️ Traditional and Simplified Chinese are **not a script conversion of each other** here. Waystone is <span lang="zh-Hans">引路石</span> in one and <span lang="zh-Hant">換界石</span> in the other; Precursor Tablet is <span lang="zh-Hans">石板</span> vs <span lang="zh-Hant">碑牌</span>; Trial Coin is <span lang="zh-Hans">巨灵币</span> vs <span lang="zh-Hant">巨靈之幣</span>. Switching realm isn't flipping a toggle — it swaps the whole name catalogue.

## Sorting: two groups, and they aren't the same thing

There are two sets of sorting controls, and they do genuinely different jobs:

**GGG's sort** (price, DPS, level and so on) determines **which hundred of the three thousand are returned**. Changing it re-runs the search, because the top 100 depends on the sort key. Reaching results beyond number 100 requires changing the sort key and searching again; there is no other route.

**Local sort** (ΔDPS, ΔEHP, value-per-currency) only re-orders **the ten already fetched**. These are computed against your character and can therefore only operate on data already retrieved.

⚠️ The two groups are deliberately **not rendered as one row of identical buttons**, to avoid “best value” being read as a conclusion about the whole market when it applies only to the ten retrieved.

## Character try-on

Once a character is loaded, every listing reports the resulting change in DPS and effective health.

⚠️ One point must be understood: **Path of Building applies no penalty for unmet attribute requirements.** A weapon you lack the Strength to equip will still report +40% DPS. The page therefore flags “cannot equip” separately — that is not a footnote, it is the conclusion.

⚠️ Note also: the passive tree on the character page is clickable, but changes **exist only within the page** and are not reflected in the DPS figure. The tree is currently an interactive viewer. To carry it into the game, use “sync to game”: it writes a `.build` file, and pressing <kbd>P</kbd> in game draws the route.

## Live search

After a search you may subscribe to it: new listings matching the query are delivered automatically, without manual refreshing.

The subscription is held by the client (the handshake requires your session), so **closing the page ends it**. At league start, or when pursuing a scarce item, this is considerably more effective than repeated manual searching.

## Contacting sellers and hideout links

Result rows carry both buttons.

⚠️ **Buttons for offline sellers are not disabled**, deliberately. In practice nearly every hideout token belongs to an offline seller, so disabling them would render the feature permanently unusable.

The technical reason: GGG issues these tokens with a 300-second lifetime, while a listing typically remains on screen for hours. The page therefore never stores the value; it is fetched and posted at the moment of the click.

## Saving and sharing

Searches can be saved into folders and published as a shared snapshot. **Share pages require no login and no client** — the recipient simply opens the link. Being able to view is not the same as being able to search.

---

**Next**: [What is this item worth](/en/guide/price-check.html) · [Installing a loot filter](/en/guide/loot-filter.html)
