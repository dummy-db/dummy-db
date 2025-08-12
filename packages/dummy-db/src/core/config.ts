import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export class Config {
  private static _NAME_MAX_LENGTH = 16
  private static _NAME_MIN_LENGTH = 3

  /**
   * Validates the database name according to the following rules:
   * - Must be a non-empty string
   * - Can only contain lowercase alphanumeric characters, underscores, and hyphens
   * - Must start with a letter
   * - Cannot end with an underscore
   * - Must be between 3 and 16 characters long
   *
   * @param name The name of the database to validate
   * @throws {Error} If the name does not meet the validation criteria
   */
  private static _validateName(name: string): void {
    // Check if the name is a non-empty string
    if (!name || typeof name !== 'string') {
      throw new Error('Database name must be a non-empty string')
    }
    // Check if the name matches the required pattern
    if (!name.match(/^[a-z0-9_-]+$/)) {
      throw new Error(
        'Database name can only contain lowercase alphanumeric characters, underscores, and hyphens',
      )
    }
    // Check if the name starts with a letter
    if (!name.match(/^[a-z]/)) {
      throw new Error('Database name must start with a letter')
    }
    // Check if the name ends with an underscore
    if (name.endsWith('_')) {
      throw new Error('Database name cannot end with an underscore')
    }
    // Check the length of the name
    if (
      name.length < this._NAME_MIN_LENGTH ||
      name.length > this._NAME_MAX_LENGTH
    ) {
      throw new Error(
        `Database name must be between ${this._NAME_MIN_LENGTH} and ${this._NAME_MAX_LENGTH} characters long`,
      )
    }
  }

  private _name: string
  private _rootPath: string

  /**
   * Creates a new Config instance.
   *
   * @param name The name of the database.
   * @param rootPath The root path where the database files will be stored.
   *
   * @throws {Error} If the name does not meet the validation criteria or if the root path does not exist.
   */
  constructor(name: string, rootPath: string) {
    Config._validateName(name)
    this._name = name

    // Resolve the root path
    this._rootPath = resolve(process.cwd(), rootPath)
    if (!existsSync(this._rootPath)) {
      throw new Error(`Root directory not found at ${this._rootPath}`)
    }
  }

  /**
   * The name of the database.
   */
  get name(): string {
    return this._name
  }

  /**
   * The root path of the database.
   *
   * This is the absolute path where the database files are stored.
   *
   * @example '/Users/john/Documents/my-project/dummy-db'
   */
  get rootPath(): string {
    return this._rootPath
  }
}
