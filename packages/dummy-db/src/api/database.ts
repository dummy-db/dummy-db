import { Config } from '../core/config'
import { Database } from '../core/database'

export function initializeDb(config: Config): Database {
  return new Database(config)
}
