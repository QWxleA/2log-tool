#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

const JOURNAL_DIR = '/Users/qwxlea/Documents/ThirdTime/Journal';

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
  return `# ${getTodayFilename().replace('.md', '')}

## Today

`;
}

/**
 * Finds the position after the "## Today" header where we should insert the new entry
 */
function findTodayInsertPosition(content: string): number {
  const lines = content.split('\n');
  let todayHeaderIndex = -1;
  
  // Find the "## Today" header
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '## Today') {
      todayHeaderIndex = i;
      break;
    }
  }
  
  if (todayHeaderIndex === -1) {
    throw new Error('Could not find "## Today" header in the daily note');
  }
  
  // Find the next header (##) or end of file to determine where to insert
  let insertIndex = lines.length;
  for (let i = todayHeaderIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      insertIndex = i;
      break;
    }
  }
  
  // Find the last non-empty line under "## Today" section
  let lastContentIndex = todayHeaderIndex;
  for (let i = todayHeaderIndex + 1; i < insertIndex; i++) {
    if (lines[i].trim() !== '') {
      lastContentIndex = i;
    }
  }
  
  return lastContentIndex + 1;
}

/**
 * Adds a log entry to the daily note
 */
function addLogEntry(logMessage: string): void {
  try {
    const filename = getTodayFilename();
    const filepath = path.join(JOURNAL_DIR, filename);
    const timestamp = getCurrentTime();
    const logEntry = `- ${timestamp} ${logMessage}`;
    
    // Check if journal directory exists
    if (!fs.existsSync(JOURNAL_DIR)) {
      console.error(`Journal directory does not exist: ${JOURNAL_DIR}`);
      console.error('Please create the directory or update the JOURNAL_DIR path in the script.');
      process.exit(1);
    }
    
    let content: string;
    
    // Read existing file or create new one
    if (fs.existsSync(filepath)) {
      content = fs.readFileSync(filepath, 'utf-8');
    } else {
      content = createDailyNoteTemplate();
      console.log(`Created new daily note: ${filename}`);
    }
    
    // Find where to insert the log entry
    const lines = content.split('\n');
    const insertPosition = findTodayInsertPosition(content);
    
    // Insert the log entry
    lines.splice(insertPosition, 0, logEntry);
    
    // Write back to file
    const updatedContent = lines.join('\n');
    fs.writeFileSync(filepath, updatedContent, 'utf-8');
    
    console.log(`✅ Added log entry to ${filename}: ${logEntry}`);
    
  } catch (error) {
    console.error('❌ Error writing log entry:', error.message);
    process.exit(1);
  }
}

/**
 * Main function that processes command line arguments
 */
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: 2log <message>');
    console.error('Example: 2log "Had a great meeting with the team"');
    process.exit(1);
  }
  
  const logMessage = args.join(' ');
  addLogEntry(logMessage);
}

// Run the script
main();