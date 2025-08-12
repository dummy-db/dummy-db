import type { DocumentData, WhereFilterOp } from '@dummy-db/types'
import { CollectionReference } from '../core/collection'
import { Query } from '../core/query'

export function query<ModelType extends DocumentData>(
  collection: CollectionReference,
  ...constraints: ((q: Query<ModelType>) => Query<ModelType>)[]
): Query<ModelType> {
  let q = new Query<ModelType>(collection)
  for (const constraint of constraints) {
    q = constraint(q)
  }
  return q
}

export function where<T extends string>(
  field: T,
  op: WhereFilterOp,
  value: any,
): (query: Query<any>) => Query<any> {
  return (query: Query<any>) =>
    new Query(query.collection, [...query.filters, { field, op, value }])
}
