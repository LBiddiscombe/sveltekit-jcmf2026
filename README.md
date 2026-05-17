# JCMF Remake

## Background

Jack Charltons Match Fishing, published by Alligata Software Ltd created by Elliot Gay & F. David Thorpe (graphics), was a game on 8-bit computers back in the 1980s, I remember playing this for hours with my brother, sat hovering over the ZX Spectrum keyboard waiting for our peg to flash and fighting to get to our number key!

This JCMF Remake is an ode to those times.

## Description

A simple, but authentic match fishing experience combining patience, skill and joy of landing a fish. It can be played alone, or as multiplayer.

This is an outline of the game screens

- Splash screen
- Main menu
  - Go Fishing (single player)
  - Host match (multiplayer, for future)
  - Join match (multiplayer, for future)
  - Fishing Journal (sessions, matches, fish PBs)
  - Settings
- For solo play
  - Pick a venue
  - Pick a lake
  - Pick a peg
  - Set rules (set a time, or unlimited, optionally add bots)
  - Go fishing (see below)
  - See results, leave
- Go fishing
  - Choose tackle & bait
  - Enter the main fishing loop
    - Cast
    - Wait for a bite
    - Strike to hook
    - Reel
    - Net fish
    - Optionally change tackle
  - See results
  - Leave lake
- Bots
  - Have a skill level
  - Skill determines things like tackle choice, change tackle time, strike/reel/land success
  - First names only, male and female, based on known anglers Jack (Charlton), John (Wilson), Matt (Hayes), Mick (Brown), Paul (Whitehouse), Bob (Mortimer), Ashley (Rae), Emma (Pickering), Becky (Keogh), Sarah (Taylor)

Suggested language for context.md? file so dev and ai share a common vocabulary.

Venue: A location with fishing lakes. A venue has a logo, unique name and description. Initially only 1 venue, JCs with only 1 lake, but expect 10s not 100s of venues eventually, each with 1 to 10ish lakes.

Lake: A body of water in a venue. A lake has a unique name within the venue. Each lake has multiple pegs, typically around 10.

Peg: A fishing location around a lake which accommodates 0 or 1 angers. Each peg of a lake is a sequential number. A peg has 9, 3x3, zones.

Zone: an area of a peg with water characteristics. Characteristics will determine species of fish that would habit.

Characteristic: A feature of the water environment such as flow, clarity, vegetation etc.

Species: A type of fish such as a carp, roach or tench. Each species has multiple classes small, average, specimen, monster etc. A species has a name, description, record size, preferred water characteristics etc.

SpeciesClass: a species class has a size range (percentage) of the species record, preferred baits.

Fish: A single fish instance, will be of a species and class, and have a weight. We may spawn these up front or generate on a bite.

Bait: A substance (typically food, could be a lure) used on a hook to catch a fish.

Tackle: the equipment the angler uses to fish. Rod, reel, line, hook.

Angler: the person fishing and playing the game.

AnglerBot: NPC anglers that we can fish against if we wish. They have a skill level, skill determines things like tackle choices, change tackle time, strike/reel/land speed and/or success. They are based on known anglers Jack (Charlton), John (Wilson), Matt (Hayes), Mick (Brown), Paul (Whitehouse), Bob (Mortimer), Ashley (Rae), Emma (Pickering), Becky (Keogh), Sarah (Taylor)

Angler States: These apply to human angler and anglerbots.

- Casting/Cast: the action of presenting the line to the water leading to the wait for a bite. A gameplay mechanic yet to be determined.
- Waiting: the period of time after casting before a bite occurs, the time watching the bite indicator (float or leger bobbin)
- Bite: the signal that a fish takes the bait and is ready to be hooked.
- Strike: the action of hooking a biting fish. If successful the fish is hooked ready to be reeled in, otherwise the fish gets away. A gameplay mechanic yet to be determined.
- Reeling: the action of pulling the fish in. It’s possible the angler identifies the fish species and class during this process. a gameplay mechanic yet to be determined.
- Netting. The action of netting a fish to complete a catch. The angler is certain of the fish species and class by this point. A gameplay mechanic yet to be determined. Could be automatic if fish is under a certain weight.
- Catch: The result of a successful landing. At this point the angler knows the actual weight of the fish.
- Finished: after the fishing session viewing the results.
