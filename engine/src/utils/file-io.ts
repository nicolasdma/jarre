import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * File I/O utilities for the storage engine.
 * All operations use explicit error handling — no silent failures.
 */

/** Ensure a directory exists, creating it recursively if needed */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/** Append raw bytes to a file. Creates the file if it doesn't exist. */
export function appendToFile(filePath: string, data: Buffer): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, data);
}

/** Read the entire file as a Buffer. Returns null if file doesn't exist. */
export function readFileBuffer(filePath: string): Buffer | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

/** Get the size of a file in bytes. Returns 0 if file doesn't exist. */
export function fileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size;
}

/** Delete a file if it exists */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
