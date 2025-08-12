export type DocumentData = { [field: string]: any }

export type DocumentMeta = {
  createdAt: string
  updatedAt: string
}

export type Record<ModelType extends DocumentData> = {
  data: ModelType
  id: string
  meta: DocumentMeta
}

export type WhereClause<ModelType extends DocumentData> = {
  field: keyof ModelType
  op: WhereFilterOp
  value: any
}

export type WhereFilterOp = '==' | '!=' | '<' | '<=' | '>' | '>='
