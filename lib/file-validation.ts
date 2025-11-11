/**
 * File Size Validation Utility
 * 
 * Provides utilities for validating file sizes in uploads and imports.
 * Prevents DoS attacks via large file uploads.
 * 
 * File Size Limits:
 * - Default: 10MB
 * - Import files (CSV, JSON, Excel): 10MB
 * - Backup restore files: 50MB (compressed)
 * - Image uploads: 5MB
 * - Document uploads: 20MB
 */

export interface FileSizeConfig {
    /** Default maximum file size in bytes */
    defaultMaxSize: number
    /** Import file maximum size in bytes */
    importMaxSize: number
    /** Backup restore file maximum size in bytes */
    backupMaxSize: number
    /** Image upload maximum size in bytes */
    imageMaxSize: number
    /** Document upload maximum size in bytes */
    documentMaxSize: number
}

/**
 * Default file size configuration
 * Can be overridden via environment variables
 */
export const DEFAULT_FILE_SIZE_CONFIG: FileSizeConfig = {
    defaultMaxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    importMaxSize: parseInt(process.env.MAX_IMPORT_FILE_SIZE || '10485760', 10), // 10MB
    backupMaxSize: parseInt(process.env.MAX_BACKUP_FILE_SIZE || '52428800', 10), // 50MB
    imageMaxSize: parseInt(process.env.MAX_IMAGE_FILE_SIZE || '5242880', 10), // 5MB
    documentMaxSize: parseInt(process.env.MAX_DOCUMENT_FILE_SIZE || '20971520', 10), // 20MB
}

/**
 * File size validation error
 */
export class FileSizeError extends Error {
    constructor(
        public readonly actualSize: number,
        public readonly maxSize: number,
        public readonly fileType: string
    ) {
        const actualMB = (actualSize / 1024 / 1024).toFixed(2)
        const maxMB = (maxSize / 1024 / 1024).toFixed(2)
        super(`File size (${actualMB}MB) exceeds maximum allowed size (${maxMB}MB) for ${fileType}`)
        this.name = 'FileSizeError'
    }
}

/**
 * Validate file size
 * 
 * @param size File size in bytes
 * @param maxSize Maximum allowed size in bytes
 * @param fileType Type of file (for error messages)
 * @throws FileSizeError if file exceeds maximum size
 */
export function validateFileSize(
    size: number,
    maxSize: number,
    fileType: string = 'file'
): void {
    if (size > maxSize) {
        throw new FileSizeError(size, maxSize, fileType)
    }
}

/**
 * Validate import file size
 * 
 * @param size File size in bytes
 * @param config File size configuration
 * @throws FileSizeError if file exceeds maximum size
 */
export function validateImportFileSize(
    size: number,
    config: FileSizeConfig = DEFAULT_FILE_SIZE_CONFIG
): void {
    validateFileSize(size, config.importMaxSize, 'import file')
}

/**
 * Validate backup restore file size
 * 
 * @param size File size in bytes
 * @param config File size configuration
 * @throws FileSizeError if file exceeds maximum size
 */
export function validateBackupFileSize(
    size: number,
    config: FileSizeConfig = DEFAULT_FILE_SIZE_CONFIG
): void {
    validateFileSize(size, config.backupMaxSize, 'backup file')
}

/**
 * Validate image file size
 * 
 * @param size File size in bytes
 * @param config File size configuration
 * @throws FileSizeError if file exceeds maximum size
 */
export function validateImageFileSize(
    size: number,
    config: FileSizeConfig = DEFAULT_FILE_SIZE_CONFIG
): void {
    validateFileSize(size, config.imageMaxSize, 'image file')
}

/**
 * Validate document file size
 * 
 * @param size File size in bytes
 * @param config File size configuration
 * @throws FileSizeError if file exceeds maximum size
 */
export function validateDocumentFileSize(
    size: number,
    config: FileSizeConfig = DEFAULT_FILE_SIZE_CONFIG
): void {
    validateFileSize(size, config.documentMaxSize, 'document file')
}

/**
 * Get human-readable file size
 * 
 * @param bytes File size in bytes
 * @returns Human-readable size string (e.g., "10.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Parse file size string to bytes
 * 
 * @param sizeString Size string (e.g., "10MB", "5.5GB")
 * @returns Size in bytes
 */
export function parseFileSize(sizeString: string): number {
    const units: Record<string, number> = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
    }

    const match = sizeString.match(/^([\d.]+)\s*([KMGT]?B)$/i)
    if (!match) {
        throw new Error(`Invalid file size format: ${sizeString}`)
    }

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    return value * (units[unit] || 1)
}

