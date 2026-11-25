# Project Beast Mode 2.0

A mobile-first Progressive Web App for PET preparation, daily habits, Life Cells and performance records.

## Deploy to GitHub Pages

1. Export a JSON backup from the currently deployed app before replacing files.
2. Download and extract this ZIP.
3. Open your existing GitHub repository and locate the folder currently published by GitHub Pages.
4. Upload/replace the extracted app files (`index.html`, `app.js`, `styles.css`, `sw.js`, manifest and icons) in that same published folder. Do not create an extra nested folder.
5. Commit the changes and wait for the GitHub Pages deployment to complete.
6. Open the deployed app in your browser. The new service worker uses network-first loading for the app shell and removes the previous Beast Mode cache.
7. Confirm the app version loads, then test habit editing, reward reversal, reports and backup/import.

## Existing data compatibility

This version intentionally keeps the existing localStorage key `beastModeDataV1` and retains the existing workout group IDs, event IDs, daily reflections and performance record structure. New habit history, Life Cells balance, reward claims and reward ledger are added to the same stored object.

Before replacing files, export a JSON backup from the currently deployed app. After deployment, open the app on the same device/browser profile. Do not clear browser storage or uninstall the existing PWA during the upgrade.

Importing a JSON backup replaces the current local data after confirmation. Export a fresh backup before importing.

## Life Cells rules

- +10 LC per completed active habit, once per date.
- +50 LC when all active habits are completed for a date.
- +150 LC after all seven daily completion bonuses are earned in a configured calendar week.
- Habit and daily/weekly completion rewards are reversible: unchecking a habit or lowering a numeric value below its target removes the associated reward; completing it again restores the reward.
- Archiving a habit hides it from future tracking while retaining its historical day data.

## Offline behavior

The service worker uses the versioned cache (`beast-mode-v4`) and network-first loading for the app shell so updated files are fetched after deployment. It is configured for a project subpath such as GitHub Pages `/Projects/`. Offline behavior still needs to be verified on the actual deployed URL and target Android browser.

## Notes

- Data is stored locally in the browser; it is not cloud-synced.
- Water, reading and study targets can be adjusted in Settings. Habits can be renamed, given a new description/icon, archived or added from the Habits screen. Custom habits can also be permanently removed from the active definition list; their old day records remain stored. Custom minute-based habits support a daily target.
- Life Cells are motivational points, not money or a medical measure.
- The app does not claim guaranteed health benefits from habit streaks.


## Recovery Mission & Aura Evolution

The Recovery tab adds a configurable personal challenge, daily reflection and urge-management log, a 10-minute Urge Emergency reset, weekly programme, persistent aura XP, milestone unlocks, and a comeback/restart history. Recovery data is stored in the existing `beastModeDataV1` local-storage record under `recovery`, so existing user data is migrated without replacing their existing habits, PET records or Life Cells.

Aura XP and unlocked milestones are cumulative and are not reset when the current challenge streak is restarted. Challenge boundaries are user-configurable. The tracker is a self-management and gamification tool, not a medical measure or a promise of specific health outcomes. Normal sexual thoughts, involuntary erections and nocturnal emissions are not treated as failures.

Export a JSON backup before clearing browser data or changing devices. All app data remains local to the browser unless the user exports it.
