import type { DocumentData, WhereClause } from '@dummy-db/types'
import { CollectionReference } from './collection'

export class Query<DbModelType extends DocumentData> {
  constructor(
    public collection: CollectionReference,
    public filters: WhereClause<DbModelType>[] = [],
  ) {}
}
