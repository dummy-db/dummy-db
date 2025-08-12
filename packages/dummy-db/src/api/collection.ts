import { CollectionReference } from '../core/collection'
import { Database } from '../core/database'

/**
 * Creates a reference to a collection in the database.
 *
 * @param db - The database instance.
 * @param name - The name of the collection.
 */
export function collection(db: Database, name: string): CollectionReference {
  return new CollectionReference(db, name)
}
