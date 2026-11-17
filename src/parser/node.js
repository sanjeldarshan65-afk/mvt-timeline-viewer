import { parseMvtFiles } from './mvt.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

/**
 * Asynchronous parser that reads files from a directory using node:fs/promises
 * 
 * @param {string} dir - Directory containing MVT result files
 * @returns {Promise<object>} Result from parseMvtFiles
 */
export async function parseMvtFolder(dir) {
  // Read all files in the directory
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  const fileContents = {};
  
  for (const file of files) {
    if (file.isFile()) {
      const filePath = join(dir, file.name);
      const textContent = await fs.readFile(filePath, 'utf8');
      fileContents[filePath] = textContent;
    }
  }
  
  // Pass the file contents to the pure parser
  // The parser expects {path: textContent} where path is the full file path
  return parseMvtFiles(fileContents);
}
