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
  | 'INVALID_ARGUMENTS';

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
 * Creates a basic daily note template if the file doesn't exist
 */
function createDailyNoteTemplate(): string {
  const dateString = getTodayFilename().replace('.md', '');
  return `# ${dateString}

## Today

`;
}

/**
 * Finds the position after the "## Today" header where we should insert the new entry
 */
function findTodayInsertPosition(content: string, headerText: string = DEFAULT_CONFIG.todayHeader!): number {
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
  
  // Find the next header (##) or end of file to determine where to insert
  let insertIndex = lines.length;
  for (let i = todayHeaderIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      insertIndex = i;
      break;
    }
  }
  
  // Find the last non-empty line under the target section
  let lastContentIndex = todayHeaderIndex;
  for (let i = todayHeaderIndex + 1; i < insertIndex; i++) {
    if (lines[i].trim() !== '') {
      lastContentIndex = i;
    }
  }
  
  return lastContentIndex + 1;
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
 * Adds a log entry to the daily note
 */
function addLogEntry(logMessage: string, config: LoggerConfig = DEFAULT_CONFIG): void {
  try {
    validateJournalDirectory(config.journalDir);
    
    const filename = getTodayFilename();
    const filepath = path.join(config.journalDir, filename);
    const timestamp = getCurrentTime();
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
    
    // Find where to insert the log entry
    const lines = content.split('\n');
    const insertPosition = findTodayInsertPosition(content, config.todayHeader);
    
    // Insert the log entry
    lines.splice(insertPosition, 0, logEntry);
    
    // Write back to file
    const updatedContent = lines.join('\n');
    fs.writeFileSync(filepath, updatedContent, 'utf-8');
    
    // Success feedback
    if (isNewFile) {
      console.log(`📄 Created new daily note: ${filename}`);
    }
    console.log(`✅ Added log entry: ${logEntry}`);
    
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
 * Displays help information
 */
function displayHelp(): void {
  console.log(`
2log - Daily Note Logger for Obsidian

Usage:
  2log <message>          Add a timestamped entry to today's note
  2log --help, -h         Show this help message

Examples:
  2log "Had a productive morning call"
  2log "Meeting with Sarah - discussed project timeline"
  2log "Finished reading chapter 3"

Configuration:
  Journal directory: ${DEFAULT_CONFIG.journalDir}
  Daily note format: YYYY-MM-DD.md
  Entry format: - HH:mm <message>
  Target header: ${DEFAULT_CONFIG.todayHeader}

The tool will create a new daily note if one doesn't exist for today.
`);
}

/**
 * Main function that processes command line arguments
 */
function main(): void {
  const args = process.argv.slice(2);
  
  // Handle help flags
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }
  
  const logMessage = args.join(' ');
  
  // Basic validation
  if (logMessage.trim().length === 0) {
    throw new Logger2Error(
      'INVALID_ARGUMENTS',
      'Log message cannot be empty'
    );
  }
  
  addLogEntry(logMessage);
}

// Run the script
if (require.main === module) {
  main();
}

// Export for potential future use as a module
export { addLogEntry, Logger2Error, LoggerConfig };