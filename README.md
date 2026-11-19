# Vice Platinum

An offline companion for hunting the **Grand Theft Auto VI** platinum on PlayStation 5. Vice Platinum pairs a complete trophy guide with a progress tracker, ships as a folder of plain static files, and asks for nothing in return: no sign-up, no connection, no advertising. Once you have the files, you can cut the network entirely and lose nothing.

![The checklist view](screenshots/1-checklist.jpg)

## The trophy list

The guide covers the full official set of **55 trophies**: a single platinum, 2 golds, 6 silvers and 46 bronzes. PlayStation hides 28 of them until they pop, and each entry here carries the name, wording and grade exactly as published.

Twenty trophies are not simple one-and-done unlocks — PlayStation tracks them against a running total (250 stunts, gold in 42 shooting-range challenges, $250,000 of cash laundered, and so on). Those entries get a stepper counter in the app, so the number on screen can stay matched to the number in game.

## Tracking your run

- Tick a trophy the moment it pops. Your state persists in the browser's localStorage, and the header always shows how many you hold and what share of the list that is.
- Back the save up or carry it to another machine with the JSON export; the matching import restores it.
- Narrow the list with a text search, or filter by grade, by category — Story, Side Missions, Activities, World & Collectibles, Crime & Combat, Money & Property, Moments, Completion — or by whether a trophy is still outstanding.
- Attach a private note to any trophy. Notes never leave the browser either.

## Spoilers stay hidden

Because 28 trophies are secret on PSN, the app ships with a spoiler guard switched on: an unearned hidden trophy appears only as "Hidden trophy", with its name and description withheld. Earning it lifts the mask, and so does deliberately revealing it from its own guide page — the choice is yours, trophy by trophy, or all at once in the settings.

## The guide itself

Every trophy has a dedicated page explaining, in original prose written for this project, what the unlock asks of you and the point in the game where it matters. Each page credits the material it rests on. Where launch-week information could not pin a trigger down, the page admits the gap openly rather than dressing a guess up as fact.

Three further views build on the list:

- **Roadmap** — the road to platinum broken into eight stages, sequenced from the official descriptions and updated live from your ticks.
- **Missables** — the straight answer is that no trophy is confirmed missable. The page names the single trophy community guides have flagged as a maybe, and describes the save routine that removes the worry.
- **Next Up** — a shortlist drawn from your own save: the counters nearest completion, the next story beats, and the one-off moments still waiting.

## Running it locally

There is nothing to compile. The whole application lives under `app/`:

```sh
node serve.ts
```

That serves the folder at http://localhost:8080. Prefer a different static server? Point any of them at `app/` and you will get the same result.

## Where the information comes from

- Names, descriptions and grades reproduce the official PlayStation 5 trophy list for Grand Theft Auto VI as captured on 2026-11-18, taken from [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/).
- Progress totals and which trophies are hidden come from [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi), checked against community lists published during launch week.
- The advice is this project's own work. `gen-trophies.mjs` holds the guide text and generates `app/data/trophies.json` from it; no wording is lifted from any existing guide.

## About this entry

Vice Platinum was created for **gta6-trophy-guide-01** ("Build the best GTA 6 trophy guide") on make.fun. Readers arriving from there can use the referral link https://make.fun/r/1c94brae.

`main.ts` exists for that competition: it assembles the submission by copying `app/` and `screenshots/` into an output directory and emitting the dossier file the judges review, relying on the vendored helper under `vendor/`, which ships exactly as provided and is not modified here. To produce the same output yourself:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Legal

Released under the MIT license. Vice Platinum is an unofficial fan project: it has no connection to Rockstar Games or Take-Two Interactive, and the app contains none of their artwork or logos.
