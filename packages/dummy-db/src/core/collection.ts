import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Database } from './database'
import { Reference } from './reference'

export class CollectionReference extends Reference {
  private _db: Database

  constructor(db: Database, id: string) {
    super(id)

    this._db = db

    if (!existsSync(this.path)) {
      console.log(`Creating collection "${this.id}"`)
      mkdirSync(this.path, { recursive: true })
    }

    const docPath = join(this.path, 'documents')
    if (!existsSync(docPath)) {
      mkdirSync(docPath, { recursive: true })
    }

    const indexPath = join(this.path, 'indexes')
    if (!existsSync(indexPath)) {
      mkdirSync(indexPath, { recursive: true })
    }
  }

  override get path(): string {
    return join(this._db.path, 'collections', this.id)
  }
}
