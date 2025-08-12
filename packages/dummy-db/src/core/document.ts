import { join } from 'node:path'
import { CollectionReference } from './collection'
import { Reference } from './reference'

export class DocumentReference extends Reference {
  private _collection: CollectionReference

  constructor(collection: CollectionReference, id: string) {
    super(id)

    this._collection = collection
  }

  override get path(): string {
    return join(this._collection.path, 'documents', `${this.id}.json`)
  }
}
