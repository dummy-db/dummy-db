import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Config } from './config'

type LogEntry = {
  level: 'debug' | 'error' | 'info' | 'warn'
  message: string
  timestamp: Date
}

export class Database {
  private _logs: LogEntry[] = []

  constructor(readonly config: Config) {
    if (!existsSync(this.path)) {
      this._log('info', `Database not found at ${this.path}, generating...`)
      this._generateDbStructure()
      this._log('info', `Database successfully created at ${this.path}`)
    } else {
      // Ensure collections directory exists
      const collectionsPath = join(this.path, 'collections')
      if (!existsSync(collectionsPath)) {
        this._log(
          'warn',
          `Collections directory not found at ${collectionsPath}, creating...`,
        )
        mkdirSync(collectionsPath, { recursive: true })
        this._log('info', `Collections directory created at ${collectionsPath}`)
      }
    }
  }

  /**
   * Returns the absolute path to the database directory.
   */
  get path(): string {
    return join(this.config.rootPath, this.config.name)
  }

  private _generateDbStructure(): void {
    mkdirSync(this.path, { recursive: true })
    const collectionsPath = join(this.path, 'collections')
    mkdirSync(collectionsPath, { recursive: true })
  }

  private _log(level: LogEntry['level'], message: string): void {
    this._logs.push({
      level,
      message,
      timestamp: new Date(),
    })
  }
}
