import type { DocumentData, DocumentMeta, Record } from '@dummy-db/types'
import { DocumentReference } from './document'

export class DocumentSnapshot<DbModelType extends DocumentData> {
  private _hasParsed = false
  private _parsed: Record<DbModelType> | undefined
  private _readTime: Date

  constructor(
    private _ref: DocumentReference,
    private _raw: string | undefined,
  ) {
    this._readTime = new Date()
  }

  get id(): string {
    return this._ref.id
  }

  get readTime(): Date {
    return this._readTime
  }

  data(): DbModelType | undefined {
    this._parseRaw()
    return this._parsed?.data
  }

  exists(): this is QueryDocumentSnapshot<DbModelType> {
    this._parseRaw()
    return !!this._parsed
  }

  metadata(): DocumentMeta | undefined {
    this._parseRaw()
    return this._parsed?.meta
  }

  private _parseRaw(): void {
    if (this._hasParsed) return

    this._hasParsed = true

    if (!this._raw) return

    try {
      this._parsed = JSON.parse(this._raw) as Record<DbModelType>
    } catch {
      this._parsed = undefined
    }
  }
}

export class QueryDocumentSnapshot<
  DbModelType extends DocumentData,
> extends DocumentSnapshot<DbModelType> {
  override data(): DbModelType {
    return super.data() as DbModelType
  }

  override metadata(): DocumentMeta {
    return super.metadata() as DocumentMeta
  }
}
