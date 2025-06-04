#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

// Configuration interface for future extensibility
interface LoggerConfig {
  journalDir: string;
  dateFormat?: string;
  timeFormat?: string;
  todayHeader?: string;
}

// Command line arguments interface
interface CommandArgs {
  message?: string;
  time?: string;
  list?: boolean;
  undo?: boolean;
  help?: boolean;
}

// Log entry interface for better type safety
interface LogEntry {
  time: string;
  message: string;
  raw: string; // The full "- HH:mm message" line
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  journalDir: process.env.HOME + '/Documents/ThirdTime/Journal',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  todayHeader: '## Today'
};

// Types for better error handling
type LoggerError = 
  | 'DIRECTORY_NOT_FOUND'
  | 'HEADER_NOT_FOUND'
  | 'FILE_WRITE_ERROR'
  | 'INVALID_ARGUMENTS'
  | 'INVALID_TIME_FORMAT'
  | 'NO_ENTRIES_TO_UNDO';

class Logger2Error extends Error {
  constructor(
    public type: LoggerError,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'Logger2Error';
  }
}

/**
 * Pads a number with leading zeros (alternative to padStart for older TS versions)
 */
function padZero(num: number, length: number = 2): string {
  return String(num).length >= length ? String(num) : ('0'.repeat(length - String(num).length) + num);
}

/**
 * Gets the current date in YYYY-MM-DD format for the daily note filename
 */
function getTodayFilename(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = padZero(today.getMonth() + 1);
  const day = padZero(today.getDate());
  return `${year}-${month}-${day}.md`;
}

/**
 * Gets the current time in HH:mm format
 */
function getCurrentTime(): string {
  const now = new Date();
  const hours = padZero(now.getHours());
  const minutes = padZero(now.getMinutes());
  return `${hours}:${minutes}`;
}

/**
 * Validates time format HH:mm
 */
function validateTimeFormat(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Formats time to HH:mm ensuring proper padding
 */
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  return `${padZero(parseInt(hours))}:${padZero(parseInt(minutes))}`;
}

/**
 * Parses a log entry line to extract time and message
 */
function parseLogEntry(line: string): LogEntry | null {
  const logEntryRegex = /^-\s+(\d{1,2}:\d{2})\s+(.+)$/;
  const match = line.match(logEntryRegex);
  
  if (match) {
    return {
      time: match[1],
      message: match[2],
      raw: line
    };
  }
  
  return null;
}

/**
 * Compares two time strings for sorting (HH:mm format)
 */
function compareTimeStrings(timeA: string, timeB: string): number {
  const [hoursA, minutesA] = timeA.split(':').map(Number);
  const [hoursB, minutesB] = timeB.split(':').map(Number);
  
  const totalMinutesA = hoursA * 60 + minutesA;
  const totalMinutesB = hoursB * 60 + minutesB;
  
  return totalMinutesA - totalMinutesB;
}

/**
 * Creates a basic daily note template if the file doesn't exist
 */
function createDailyNoteTemplate(): string {
  const dateString = getTodayFilename().replace('.md', '');
  return `# ${dateString}

## Today

`;
}

/**
 * Finds the content within the "## Today" section
 */
function findTodaySection(content: string, headerText: string = DEFAULT_CONFIG.todayHeader!): { startIndex: number; endIndex: number; lines: string[] } {
  const lines = content.split('\n');
  let todayHeaderIndex = -1;
  
  // Find the specified header
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === headerText) {
      todayHeaderIndex = i;
      break;
    }
  }
  
  if (todayHeaderIndex === -1) {
    throw new Logger2Error(
      'HEADER_NOT_FOUND',
      `Could not find "${headerText}" header in the daily note. Make sure the header exists or create it manually.`
    );
  }
  
  // Find the next header (##) or end of file to determine section boundaries
  let endIndex = lines.length;
  for (let i = todayHeaderIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      endIndex = i;
      break;
    }
  }
  
  return {
    startIndex: todayHeaderIndex,
    endIndex: endIndex,
    lines: lines
  };
}

/**
 * Gets all log entries from the Today section, sorted chronologically
 */
function getTodayLogEntries(content: string, headerText: string = DEFAULT_CONFIG.todayHeader!): LogEntry[] {
  const section = findTodaySection(content, headerText);
  const entries: LogEntry[] = [];
  
  // Extract log entries from the Today section
  for (let i = section.startIndex + 1; i < section.endIndex; i++) {
    const line = section.lines[i];
    const entry = parseLogEntry(line);
    if (entry) {
      entries.push(entry);
    }
  }
  
  // Sort entries chronologically
  entries.sort((a, b) => compareTimeStrings(a.time, b.time));
  
  return entries;
}

/**
 * Validates that the journal directory exists and is accessible
 */
function validateJournalDirectory(journalDir: string): void {
  if (!fs.existsSync(journalDir)) {
    throw new Logger2Error(
      'DIRECTORY_NOT_FOUND',
      `Journal directory does not exist: ${journalDir}\nPlease create the directory or update the JOURNAL_DIR path in the script.`
    );
  }
  
  // Check if directory is writable
  try {
    fs.accessSync(journalDir, fs.constants.W_OK);
  } catch (error) {
    throw new Logger2Error(
      'DIRECTORY_NOT_FOUND',
      `Journal directory is not writable: ${journalDir}`,
      error as Error
    );
  }
}

/**
 * Lists today's log entries
 */
function listTodayEntries(config: LoggerConfig = DEFAULT_CONFIG): void {
  try {
    validateJournalDirectory(config.journalDir);
    
    const filename = getTodayFilename();
    const filepath = path.join(config.journalDir, filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`📄 No daily note found for today (${filename})`);
      console.log(`💡 Create one by adding your first log entry!`);
      return;
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    const entries = getTodayLogEntries(content, config.todayHeader);
    
    if (entries.length === 0) {
      console.log(`📋 No log entries found for today in ${filename}`);
      console.log(`💡 Add your first entry with: 2log "Your message here"`);
      return;
    }
    
    console.log(`📋 Today's log entries (${filename}):`);
    console.log('');
    entries.forEach(entry => {
      console.log(`  ${entry.raw}`);
    });
    console.log('');
    console.log(`📊 Total entries: ${entries.length}`);
    
  } catch (error) {
    if (error instanceof Logger2Error) {
      console.error(`❌ ${error.message}`);
    } else {
      console.error('❌ Unexpected error:', (error as Error).message);
    }
    process.exit(1);
  }
}

/**
 * Removes the last log entry (undo)
 */
function undoLastEntry(config: LoggerConfig = DEFAULT_CONFIG): void {
  try {
    validateJournalDirectory(config.journalDir);
    
    const filename = getTodayFilename();
    const filepath = path.join(config.journalDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Logger2Error(
        'NO_ENTRIES_TO_UNDO',
        `No daily note found for today (${filename}). Nothing to undo.`
      );
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    const section = findTodaySection(content, config.todayHeader);
    const entries = getTodayLogEntries(content, config.todayHeader);
    
    if (entries.length === 0) {
      throw new Logger2Error(
        'NO_ENTRIES_TO_UNDO',
        `No log entries found in today's note. Nothing to undo.`
      );
    }
    
    // Find and remove the last entry (chronologically last, not necessarily last in file)
    const lastEntry = entries[entries.length - 1];
    const lines = section.lines;
    
    // Find the line with the last entry and remove it
    for (let i = section.startIndex + 1; i < section.endIndex; i++) {
      if (lines[i] === lastEntry.raw) {
        lines.splice(i, 1);
        break;
      }
    }
    
    // Write back to file
    const updatedContent = lines.join('\n');
    fs.writeFileSync(filepath, updatedContent, 'utf-8');
    
    console.log(`🗑️  Removed last entry: ${lastEntry.raw}`);
    console.log(`📊 Remaining entries: ${entries.length - 1}`);
    
  } catch (error) {
    if (error instanceof Logger2Error) {
      console.error(`❌ ${error.message}`);
    } else {
      console.error('❌ Unexpected error:', (error as Error).message);
    }
    process.exit(1);
  }
}

/**
 * Adds a log entry to the daily note with optional custom timestamp
 */
function addLogEntry(logMessage: string, customTime?: string, config: LoggerConfig = DEFAULT_CONFIG): void {
  try {
    validateJournalDirectory(config.journalDir);
    
    const filename = getTodayFilename();
    const filepath = path.join(config.journalDir, filename);
    
    // Validate custom time if provided
    let timestamp: string;
    if (customTime) {
      if (!validateTimeFormat(customTime)) {
        throw new Logger2Error(
          'INVALID_TIME_FORMAT',
          `Invalid time format: "${customTime}". Please use HH:mm format (e.g., 14:30)`
        );
      }
      timestamp = formatTime(customTime);
    } else {
      timestamp = getCurrentTime();
    }
    
    const logEntry = `- ${timestamp} ${logMessage}`;
    
    let content: string;
    let isNewFile = false;
    
    // Read existing file or create new one
    if (fs.existsSync(filepath)) {
      content = fs.readFileSync(filepath, 'utf-8');
    } else {
      content = createDailyNoteTemplate();
      isNewFile = true;
    }
    
    // Get current entries and add new one
    const section = findTodaySection(content, config.todayHeader);
    const existingEntries = getTodayLogEntries(content, config.todayHeader);
    
    // Create new entry object
    const newEntry: LogEntry = {
      time: timestamp,
      message: logMessage,
      raw: logEntry
    };
    
    // Add new entry and sort all entries
    const allEntries = [...existingEntries, newEntry];
    allEntries.sort((a, b) => compareTimeStrings(a.time, b.time));
    
    // Rebuild the Today section with sorted entries
    const lines = section.lines;
    
    // Remove existing log entries from the Today section
    for (let i = section.endIndex - 1; i > section.startIndex; i--) {
      const entry = parseLogEntry(lines[i]);
      if (entry) {
        lines.splice(i, 1);
      }
    }
    
    // Add all entries back in sorted order
    const insertPosition = section.startIndex + 1;
    allEntries.forEach((entry, index) => {
      lines.splice(insertPosition + index, 0, entry.raw);
    });
    
    // Write back to file
    const updatedContent = lines.join('\n');
    fs.writeFileSync(filepath, updatedContent, 'utf-8');
    
    // Success feedback
    if (isNewFile) {
      console.log(`📄 Created new daily note: ${filename}`);
    }
    console.log(`✅ Added log entry: ${logEntry}`);
    
    if (customTime) {
      console.log(`🕐 Used custom timestamp: ${timestamp}`);
    }
    
    console.log(`📊 Total entries: ${allEntries.length}`);
    
  } catch (error) {
    if (error instanceof Logger2Error) {
      console.error(`❌ ${error.message}`);
      if (error.type === 'HEADER_NOT_FOUND') {
        console.error(`💡 Tip: Make sure your daily note contains a "${config.todayHeader}" header.`);
      }
    } else {
      console.error('❌ Unexpected error:', (error as Error).message);
    }
    process.exit(1);
  }
}

/**
 * Parses command line arguments
 */
function parseArguments(args: string[]): CommandArgs {
  const result: CommandArgs = {};
  const messageArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-h':
      case '--help':
        result.help = true;
        break;
        
      case '-l':
      case '--list':
        result.list = true;
        break;
        
      case '-u':
      case '--undo':
        result.undo = true;
        break;
        
      case '-t':
      case '--time':
        if (i + 1 < args.length) {
          result.time = args[i + 1];
          i++; // Skip next argument as it's the time value
        } else {
          throw new Logger2Error(
            'INVALID_ARGUMENTS',
            'Option -t/--time requires a time value (e.g., -t 14:30)'
          );
        }
        break;
        
      default:
        // If it starts with a dash but isn't recognized, it's an error
        if (arg.startsWith('-')) {
          throw new Logger2Error(
            'INVALID_ARGUMENTS',
            `Unknown option: ${arg}`
          );
        }
        // Otherwise, it's part of the message
        messageArgs.push(arg);
        break;
    }
  }
  
  if (messageArgs.length > 0) {
    result.message = messageArgs.join(' ');
  }
  
  return result;
}

/**
 * Displays help information
 */
function displayHelp(): void {
  console.log(`
2log - Daily Note Logger for Obsidian

Usage:
  2log [OPTIONS] <message>    Add a timestamped entry to today's note
  2log [OPTIONS]              List today's entries (default when no message)

Options:
  -t, --time HH:mm           Override timestamp (entries sorted chronologically)
  -l, --list                 List today's log entries
  -u, --undo                 Remove the last log entry
  -h, --help                 Show this help message

Examples:
  2log "Had a productive morning call"
  2log -t 09:30 "Retrospective meeting notes"
  2log --time 14:15 "Met with Sarah about project timeline"
  2log -l                    # List today's entries
  2log --list                # List today's entries  
  2log -u                    # Undo last entry
  2log --undo                # Undo last entry

Configuration:
  Journal directory: ${DEFAULT_CONFIG.journalDir}
  Daily note format: YYYY-MM-DD.md
  Entry format: - HH:mm <message>
  Target header: ${DEFAULT_CONFIG.todayHeader}

Features:
  • Automatic chronological sorting of entries
  • Smart daily note creation
  • Undo functionality for recent entries
  • Custom timestamp support
  • Integration with Obsidian markdown format

The tool will create a new daily note if one doesn't exist for today.
`);
}

/**
 * Main function that processes command line arguments
 */
function main(): void {
  try {
    const args = process.argv.slice(2);
    
    // If no arguments, default to list
    if (args.length === 0) {
      listTodayEntries();
      return;
    }
    
    const parsed = parseArguments(args);
    
    // Handle help
    if (parsed.help) {
      displayHelp();
      return;
    }
    
    // Handle list
    if (parsed.list) {
      listTodayEntries();
      return;
    }
    
    // Handle undo
    if (parsed.undo) {
      undoLastEntry();
      return;
    }
    
    // Handle adding entry
    if (parsed.message) {
      addLogEntry(parsed.message, parsed.time);
    } else if (parsed.time) {
      // If time is specified but no message, that's an error
      throw new Logger2Error(
        'INVALID_ARGUMENTS',
        'When using -t/--time, you must also provide a message'
      );
    } else {
      // No message and no other action specified, default to list
      listTodayEntries();
    }
    
  } catch (error) {
    if (error instanceof Logger2Error) {
      console.error(`❌ ${error.message}`);
      if (error.type === 'INVALID_ARGUMENTS') {
        console.error(`💡 Use '2log --help' to see usage instructions.`);
      }
    } else {
      console.error('❌ Unexpected error:', (error as Error).message);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

// Export for potential future use as a module
export { addLogEntry, listTodayEntries, undoLastEntry, Logger2Error, LoggerConfig, LogEntry };