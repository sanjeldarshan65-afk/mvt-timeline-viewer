import { parseMvtFiles } from './mvt.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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
      const filePath = path.join(dir, file.name);
      try {
        const textContent = await fs.readFile(filePath, 'utf8');
        fileContents[file.name] = textContent;
      } catch (e) {
        // Skip files that can't be read
        console.warn(`Could not read ${file.name}: ${e.message}`);
      }
    }
  }
  
  // Pass the file contents to the pure parser
  return parseMvtFiles(fileContents);
}
