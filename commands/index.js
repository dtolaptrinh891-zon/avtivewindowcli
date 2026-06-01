/**
 * Command registry for onodecli.
 * Each entry defines the metadata for a registered command.
 * To add a new command: append one entry here + create commands/<key>.js
 * DO NOT remove or edit existing entries.
 *
 * @type {Array<{key: string, emoji: string, label: string, description: string, module: string}>}
 */
export const COMMANDS = [
  {
    key: 'activewin',
    emoji: '🪟',
    label: 'Active Window Inspector',
    description: 'Show info about the currently focused window (title, process, PID)',
    module: './activewin.js',
  },
  {
    key: 'app-quickaccesspopup',
    emoji: '⚡',
    label: 'Quick Access Popup',
    description: 'Launch or interact with QuickAccessPopup.exe or custom shortcut menus',
    module: './app-quickaccesspopup.js',
  },
  {
    key: 'app-browser',
    emoji: '🌐',
    label: 'Browser Controller',
    description: 'Open URLs, focus browser, select profile',
    module: './app-browser.js',
  },
  {
    key: 'spawncommand',
    emoji: '🚀',
    label: 'Spawn Command Router',
    description: 'Spawn and execute another CLI command interactively',
    module: './spawncommand.js',
  },
];

export default COMMANDS;
