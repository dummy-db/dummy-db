import { Config } from '../core/config'

type Options = {
  /**
   * The name of the database.
   *
   * If not provided, it will default to 'default'.
   *
   * The name must adhere to the following rules:
   * - Must be a non-empty string
   * - Can only contain lowercase alphanumeric characters and underscores
   * - Must start with a letter
   * - Cannot end with an underscore
   * - Must be between 3 and 16 characters long
   */
  name?: string
  /**
   * The root directory where the database will be stored.
   *
   * If not provided, it will default to 'dummy-db'.
   *
   * The path can be absolute or relative. If relative, it will be resolved against the current working directory.
   *
   * @default 'dummy-db'
   * @example 'local-db'
   * @example '/Users/john/Documents/my-project/local-db'
   */
  rootDir?: string
}

const DB_NAME = 'default'
const DB_ROOT_DIR = 'dummy-db'

/**
 * Creates a new Config instance based on the provided options.
 *
 * @param options The options for the database configuration.
 * @returns A new Config instance.
 */
export function createConfig(options: Options): Config {
  const { name = DB_NAME, rootDir = DB_ROOT_DIR } = options

  return new Config(name, rootDir)
}
