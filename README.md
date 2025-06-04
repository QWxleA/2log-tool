# 2log - Daily Note Logger for Obsidian

A TypeScript command-line tool that appends timestamped log entries to your daily Obsidian notes. Perfect for quick journaling and maintaining a continuous log of your daily activities.

## Features

- **Quick logging**: Simple command to add timestamped entries
- **Obsidian integration**: Works seamlessly with markdown daily notes
- **Auto-creation**: Creates daily notes if they don't exist
- **Smart positioning**: Always adds entries under the `## Today` header
- **TypeScript safety**: Type-safe code for reliable operation and easy extension
- **Error handling**: Comprehensive error messages and validation

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Setup

1. **Clone or create the project directory:**
   ```bash
   mkdir 2log-tool
   cd 2log-tool
   ```

2. **Initialize npm project:**
   ```bash
   npm init -y
   ```

3. **Install dependencies:**
   ```bash
   npm install --save-dev typescript @types/node
   ```

4. **Create configuration files:**
   
   Save the `package.json` and `tsconfig.json` from the setup artifacts, then save the main script as `2log.ts`.

5. **Build the project:**
   ```bash
   npm run build
   ```

6. **Make executable:**
   ```bash
   chmod +x 2log.js
   ```

7. **Optional - Create global command:**
   ```bash
   sudo ln -s $(pwd)/2log.js /usr/local/bin/2log
   ```

## Usage

### Basic Usage

```bash
# Add a simple log entry with current timestamp
2log "Had a productive morning call"

# List today's entries (default when no arguments)
2log
2log -l
2log --list

# Add entry with custom timestamp (entries auto-sorted chronologically)
2log -t 09:30 "Morning standup meeting"
2log --time 14:15 "Meeting with Sarah - discussed project timeline"

# Remove the last entry (undo)
2log -u
2log --undo

# Get help
2log -h
2log --help
```

### Command Line Options

- **`-t, --time HH:mm`**: Override the timestamp (format: HH:mm, e.g., 09:30, 14:15)
- **`-l, --list`**: List all log entries for today
- **`-u, --undo`**: Remove the last log entry (chronologically last)
- **`-h, --help`**: Display help information

### Default Behavior

- **No arguments**: Lists today's log entries
- **Message only**: Adds entry with current timestamp
- **Custom time**: Entries are automatically sorted chronologically

### Output Format

Entries are added in the format:
```markdown
- HH:mm Your message here
```

For example:
```markdown
## Today

- 09:30 Morning standup meeting
- 11:45 Had a productive morning call
- 14:15 Meeting with Sarah - discussed project timeline
- 16:45 Finished reading chapter 3
```

### Chronological Sorting

All entries are automatically sorted by time when added, regardless of when you add them:

```bash
# Add entries out of order
2log -t 14:00 "Afternoon meeting"
2log -t 09:00 "Morning coffee"
2log -t 11:30 "Mid-morning call"

# Result is automatically sorted:
# - 09:00 Morning coffee
# - 11:30 Mid-morning call
# - 14:00 Afternoon meeting
```

### Daily Note Structure

The tool expects and creates daily notes with this structure:

```markdown
# YYYY-MM-DD

## Today

(your log entries appear here)
```

## Configuration

### Default Settings

- **Journal Directory**: `$HOME/Documents/ThirdTime/Journal`
- **Daily Note Format**: `YYYY-MM-DD.md`
- **Entry Format**: `- HH:mm <message>`
- **Target Header**: `## Today`

### Customizing the Journal Directory

To change the default directory, edit the `DEFAULT_CONFIG` in `2log.ts`:

```typescript
const DEFAULT_CONFIG: LoggerConfig = {
  journalDir: process.env.HOME + '/your/custom/path',
  // ... other settings
};
```

## Development

### npm Scripts

```bash
# Build the TypeScript
npm run build

# Watch mode for development
npm run dev

# Build and make executable
npm run build-and-link

# Test the built script
npm start "Test message"
```

### Project Structure

```
2log-tool/
├── 2log.ts          # Main TypeScript source
├── 2log.js          # Compiled JavaScript (generated)
├── package.json     # Project configuration
├── tsconfig.json    # TypeScript configuration
└── README.md        # This file
```

## Enhanced Features

### New Command Line Features
- **Custom Timestamps**: Use `-t` or `--time` to add entries with specific times
- **Chronological Sorting**: All entries are automatically sorted by time, regardless of input order
- **List Functionality**: View all today's entries with `-l` or `--list` (default when no arguments)
- **Undo Support**: Remove the last entry with `-u` or `--undo`
- **Smart Default**: Running `2log` without arguments shows today's entries

### Type Safety Features
- **Enhanced Interfaces**: `LoggerConfig`, `CommandArgs`, and `LogEntry` for better type safety
- **Custom Error Types**: `Logger2Error` with specific error categories including time format validation
- **Proper typing**: All functions have explicit return types for better IDE support

### Better Error Handling
- **Time Format Validation**: Ensures custom timestamps are in valid HH:mm format
- **Specific error types**: Directory not found, header not found, file write errors, invalid time format
- **Helpful error messages**: More descriptive feedback with suggestions
- **Validation**: Checks directory exists and is writable before attempting operations

### Advanced Functionality
- **Log Entry Parsing**: Intelligent parsing of existing entries for sorting and manipulation
- **Section Management**: Robust handling of the "## Today" section boundaries
- **Entry Management**: Add, list, and remove entries with full chronological awareness
- **Time Comparison**: Sophisticated time sorting that handles 24-hour format correctly

## Error Messages

The tool provides helpful error messages for common issues:

- **Directory not found**: Suggests creating the journal directory
- **Header not found**: Reminds you to add the `## Today` header to existing notes
- **Permission issues**: Indicates when the directory isn't writable
- **Invalid arguments**: Helps with correct usage syntax
- **Invalid time format**: Validates timestamp format and suggests correct HH:mm format
- **No entries to undo**: Informs when there are no entries to remove
- **Missing time value**: Ensures `-t` flag has a corresponding time argument

### Common Error Examples

```bash
# Invalid time format
2log -t 25:30 "Invalid hour"
# ❌ Invalid time format: "25:30". Please use HH:mm format (e.g., 14:30)

# Time flag without value
2log -t "Missing time value"
# ❌ Option -t/--time requires a time value (e.g., -t 14:30)

# Undo with no entries
2log -u
# ❌ No log entries found in today's note. Nothing to undo.

# Unknown option
2log --invalid "Some message"
# ❌ Unknown option: --invalid
# 💡 Use '2log --help' to see usage instructions.
```

## Integration with Self Anthropology

This tool is designed to work perfectly with self-anthropology practices as described in your documentation. You can use it to:

- **Track daily routines**: Quick logs of habits and activities
- **Record emotional responses**: Note feelings and triggers throughout the day
- **Document social interactions**: Log conversations and their outcomes
- **Monitor goal progress**: Track daily progress on objectives
- **Capture reflections**: Store insights and realizations as they occur

### Example Self-Anthropology Usage

```bash
# Morning routine tracking
2log "Started day with 10min meditation - felt centered"

# Emotional tracking
2log "Felt anxious before presentation, but deep breathing helped"

# Social interaction logging
2log "Good conversation with Alex - I listened more than usual"

# Goal progress
2log "Completed 30min coding practice - building consistency"

# Reflection capture
2log "Realized I'm more productive in morning hours"
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'fs'"**
   - Ensure you've installed `@types/node`: `npm install --save-dev @types/node`

2. **"Property 'padStart' does not exist"**
   - Update your `tsconfig.json` target to `ES2020` or higher

3. **"Journal directory does not exist"**
   - Create the directory: `mkdir -p $HOME/Documents/ThirdTime/Journal`
   - Or update the path in the configuration

4. **"Could not find '## Today' header"**
   - Add the header to your existing daily note manually
   - Or let the tool create a new note with the proper structure

5. **"Invalid time format" errors**
   - Use 24-hour format: `09:30`, `14:15`, `23:45`
   - Ensure minutes are between 00-59: `14:30` ✅, `14:60` ❌
   - Single digits are supported: `9:30` works, but `09:30` is preferred

6. **Entries not sorting correctly**
   - The tool automatically sorts all entries chronologically
   - If entries appear out of order, check for formatting issues in existing entries
   - Manual entries should follow the format: `- HH:mm message`

### Advanced Troubleshooting

**Debugging entry parsing:**
```bash
# List entries to see current state
2log -l

# If entries aren't parsing correctly, check the format:
# ✅ Correct: - 14:30 Meeting notes
# ❌ Wrong:   -14:30 Meeting notes (missing space)
# ❌ Wrong:   - 2:30 Meeting notes (should be 02:30)
```

**Manual file inspection:**
```bash
# View the raw markdown file
cat $HOME/Documents/ThirdTime/Journal/$(date +%Y-%m-%d).md

# Check for invisible characters or formatting issues
hexdump -C $HOME/Documents/ThirdTime/Journal/$(date +%Y-%m-%d).md | head
```

### Development Tips

- Use `npm run dev` for watch mode during development
- The tool exports functions (`addLogEntry`, `listTodayEntries`, `undoLastEntry`) for use in other TypeScript projects
- Error types are defined for easy extension of error handling
- Configuration is centralized in the `DEFAULT_CONFIG` object
- All log entry operations maintain chronological order automatically
- The `LogEntry` interface provides type safety for entry manipulation

### Testing New Features

```bash
# Test custom timestamps
2log -t 08:00 "Test early morning entry"
2log -t 23:59 "Test late evening entry"
2log -t 12:00 "Test noon entry"
2log -l  # Should show entries in chronological order

# Test undo functionality
2log "Test entry to remove"
2log -u  # Should remove the test entry
2log -l  # Verify removal

# Test edge cases
2log -t 00:00 "Midnight entry"
2log -t 23:59 "Almost midnight"
2log -t 12:00 "Noon exactly"
```

## Contributing

This tool is designed to be easily extensible. Some ideas for future enhancements:

### Planned Features
- **Multiple header support**: Target different sections (e.g., `## Work`, `## Personal`)
- **Template customization**: Custom daily note templates
- **Bulk operations**: Import/export entries, merge days
- **Rich formatting**: Support for markdown formatting in entries
- **Tag system**: Categorize entries with hashtags
- **Search functionality**: Find entries across multiple days
- **Statistics**: Daily/weekly/monthly entry counts and patterns

### Advanced Ideas
- **Mood tracking**: Emoji or numeric mood indicators
- **Time tracking**: Duration-based entries for activities
- **Goal integration**: Link entries to specific goals or projects
- **Habit tracking**: Mark recurring activities and track streaks
- **Integration APIs**: Connect with other productivity tools
- **Export formats**: Generate reports in various formats (PDF, CSV, etc.)
- **Calendar integration**: Sync with calendar events
- **Natural language processing**: Smart categorization and insights

### Code Architecture for Extensions

The codebase is structured to support easy extensions:

```typescript
// Easy to add new command line options
interface CommandArgs {
  message?: string;
  time?: string;
  list?: boolean;
  undo?: boolean;
  help?: boolean;
  // Add new options here
}

// Configuration can be extended
interface LoggerConfig {
  journalDir: string;
  dateFormat?: string;
  timeFormat?: string;
  todayHeader?: string;
  // Add new config options here
}

// Error types can be expanded
type LoggerError = 
  | 'DIRECTORY_NOT_FOUND'
  | 'HEADER_NOT_FOUND'
  // Add new error types here
```

## License

MIT License - feel free to modify and distribute as needed.