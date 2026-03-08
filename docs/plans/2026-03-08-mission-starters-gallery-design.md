# Mission Starters Gallery Design

## Problem

A kid opens Elisa for the first time and sees a blank Blockly canvas. They don't know what's possible, what blocks to use, or where to start. A parent/teacher is with them but neither has context on how the app works. The first session needs to feel magical and successful.

## Solution

A "New Project" modal showing ~8 curated starter missions as visual cards. Picking one pre-loads the Blockly canvas with blocks the kid can customize before hitting GO.

## Gallery Modal

- Triggered by a "New Project" button (prominent, in the top bar or canvas area)
- Grid of cards, scrollable if needed
- Each card shows:
  - Fun title ("Joke Machine!")
  - Short tagline ("Build a website that tells random jokes")
  - Small preview screenshot of the finished result
  - Difficulty indicator (1-3 stars)
  - Category label (e.g. "Game", "Creative", "Utility")
- Selecting a card loads the pre-built Blockly workspace and closes the modal
- "Blank project" option at the bottom for advanced users

## Starter Missions (web-only)

| # | Title | Tagline | Difficulty | Key blocks |
|---|-------|---------|------------|------------|
| 1 | Hello World | "Your first website — say hi to the internet!" | ★ | goal, 1 requirement |
| 2 | Joke Machine | "A website that tells random jokes" | ★ | goal, 2 requirements |
| 3 | About Me | "A personal page all about you" | ★ | goal, style, 2 requirements |
| 4 | Pet Name Picker | "Generate the perfect name for your pet" | ★★ | goal, 3 requirements |
| 5 | Quiz Game | "Test your friends with a trivia quiz" | ★★ | goal, style, 3-4 requirements |
| 6 | Story Maker | "Create a choose-your-own-adventure story" | ★★ | goal, style, 4 requirements |
| 7 | Countdown Timer | "Count down to your birthday or any event" | ★★★ | goal, style, 4-5 requirements |
| 8 | Mini Dashboard | "A weather + clock + greeting dashboard" | ★★★ | goal, style, 5+ requirements |

## How Pre-loading Works

- Each mission is stored as a serialized Blockly workspace (same format the app uses for save/load)
- Blocks have placeholder values the kid customizes (e.g. "your name here", "pick a color")
- Customizable fields are visually highlighted or have helper tooltips
- The workspace loads normally — the kid can add, remove, or change any block before hitting GO

## Preview Images

- Static screenshots generated once from completed builds of each mission
- Stored as assets in the frontend bundle
- Fallback: a simple colored icon if no screenshot exists yet

## User Flow

```
App opens → kid sees canvas (or returning workspace)
         → clicks "New Project"
         → modal opens with mission grid
         → picks "Joke Machine"
         → modal closes, canvas fills with blocks
         → kid changes joke topic, hits GO
         → agents build it, kid watches
         → deploy preview opens in browser
```

## Scope

- Web-only missions (no ESP32/hardware)
- No backend changes needed — workspace loading already exists
- Frontend: new modal component, mission data, preview assets, "New Project" button
- Mission workspaces authored once and stored as static JSON/XML in the frontend
