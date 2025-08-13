import type { DocumentData, Record } from '@dummy-db/types'
import { randomUUID } from 'node:crypto'
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CollectionReference } from '../core/collection'
import { DocumentReference } from '../core/document'
import { Query } from '../core/query'
import { DocumentSnapshot } from '../core/snapshot'

/**
 * Adds a new document to the specified collection with a generated ID.
 *
 * The document is created with the provided data and a unique ID.
 *
 * If you want to set the document ID manually, use `setDoc` instead.
 *
 * @param reference - The collection reference where the document will be added.
 * @param data - The data to be stored in the new document.
 * @returns A promise that resolves to the DocumentReference of the newly created document.
 */
export async function addDoc<ModelType extends DocumentData>(
  reference: CollectionReference,
  data: ModelType,
): Promise<DocumentReference> {
  const id = randomUUID()
  const docRef = doc(reference, id)
  await setDoc(docRef, data)
  return docRef
}

/**
 * Deletes a document from the database.
 *
 * If the codument does not exist, it will log a warning and resolve without error.
 *
 * This transaction is permanent, but a future implementation may support soft deletes.
 *
 * @param docRef - The DocumentReference of the document to be deleted.
 * @returns A promise that resolves when the document is successfully deleted.
 * @throws An error if there is an issue during deletion.
 */
export async function deleteDoc(docRef: DocumentReference): Promise<void> {
  try {
    await unlink(docRef.path)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Document ${docRef.id} does not exist, nothing to delete.`)
      return
    }
    throw new Error(`Failed to delete document ${docRef.id}: ${error.message}`)
  }
}

/**
 * Creates a new DocumentReference for the specified collection and document ID.
 *
 * This function is used to create a reference to a document within a collection.
 * It does not create the document itself; it simply provides a reference that can
 * be used to read or write data.
 *
 * @param collection - The CollectionReference where the document will reside.
 * @param id - The unique identifier for the document.
 * @returns A DocumentReference for the specified document in the collection.
 */
export function doc(
  collection: CollectionReference,
  id: string,
): DocumentReference {
  return new DocumentReference(collection, id)
}

/**
 * Retrieves a document snapshot from the database.
 *
 * If the document does not exist, it returns a DocumentSnapshot with undefined data.
 *
 * @param docRef - The DocumentReference of the document to retrieve.
 * @returns A promise that resolves to a DocumentSnapshot containing the document data.
 * @throws An error if there is an issue reading the document file.
 */
export async function getDoc<ModelType extends DocumentData>(
  docRef: DocumentReference,
): Promise<DocumentSnapshot<ModelType>> {
  try {
    const rawData = await readFile(docRef.path, 'utf-8')
    return new DocumentSnapshot<ModelType>(docRef, rawData)
  } catch (error: any) {
    if (error.code === 'ENOENT')
      return new DocumentSnapshot<ModelType>(docRef, undefined)
    console.error(`Error getting document ${docRef.id}:`, error)
    return new DocumentSnapshot<ModelType>(docRef, undefined)
  }
}

/**
 * Retrieves all documents from a collection or query.
 *
 * If the source is a Query, it applies the filters defined in the query.
 * If no documents match the filters, it returns an empty array.
 *
 * @param source - The CollectionReference or Query from which to retrieve documents.
 * @returns A promise that resolves to an array of DocumentSnapshot objects.
 */
export async function getDocs<ModelType extends DocumentData>(
  source: CollectionReference | Query<ModelType>,
): Promise<DocumentSnapshot<ModelType>[]> {
  const collection: CollectionReference =
    source instanceof Query ? source.collection : source
  const docs = await _getDocsFromCollection<ModelType>(collection)
  const filters = source instanceof Query ? source.filters : []

  if (filters.length === 0) return docs

  return docs.filter((doc) => {
    const data = doc.data()
    if (!data) return false

    return filters.every(({ field, op, value }) => {
      const fieldValue = (data as any)[field]
      switch (op) {
        case '==':
          return fieldValue === value
        case '!=':
          return fieldValue !== value
        case '<':
          return fieldValue < value
        case '<=':
          return fieldValue <= value
        case '>':
          return fieldValue > value
        case '>=':
          return fieldValue >= value
        default:
          return false
      }
    })
  })
}

/**
 * Adds a new document using the provided DocumentReference and data.
 *
 * This function allows you to create a document with a specific ID.
 * If the document already exists, it will be overwritten.
 *
 * If you want to generate a random ID, use `addDoc` instead.
 *
 * @param docRef - The DocumentReference where the document will be created.
 * @param data - The data to be stored in the new document.
 * @returns A promise that resolves when the document is successfully created.
 * @throws An error if there is an issue writing the document file.
 */
export async function setDoc<ModelType extends DocumentData>(
  docRef: DocumentReference,
  data: ModelType,
): Promise<void> {
  const timestamp = new Date().toISOString()
  const record: Record<ModelType> = {
    data,
    id: docRef.id,
    meta: {
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }
  const json = JSON.stringify(record)
  await writeFile(docRef.path, json, 'utf-8')
}

async function _getDocsFromCollection<ModelType extends DocumentData>(
  collection: CollectionReference,
): Promise<DocumentSnapshot<ModelType>[]> {
  const maxDocs = 100 // Adjust as needed for performance
  const concurrency = 10 // Adjust as needed for performance
  const docsPath = join(collection.path, 'documents')

  try {
    const files = await readdir(docsPath, { withFileTypes: true })
    const docFiles = files
      .filter((file) => file.isFile() && file.name.endsWith('.json'))
      .sort((a, b) =>
        _sortById(a.name.replace('.json', ''), b.name.replace('.json', '')),
      )
      .slice(0, maxDocs)

    const tasks = docFiles.map((file) => {
      const docRef = doc(collection, file.name.replace('.json', ''))
      return async () => {
        try {
          const rawData = await readFile(docRef.path, 'utf-8')
          return new DocumentSnapshot<ModelType>(docRef, rawData)
        } catch (error) {
          console.error(`Error reading document ${docRef.id}:`, error)
          return new DocumentSnapshot<ModelType>(docRef, undefined)
        }
      }
    })

    return await _runWithConcurrency(tasks, concurrency)
  } catch (error) {
    console.error(
      `Error getting documents from collection ${collection.path}:`,
      error,
    )
    return []
  }
}

async function _runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = []
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const i = index++

      if (tasks[i]) results[i] = await tasks[i]()
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  )

  return results
}

function _sortById(a: string, b: string): number {
  const isNumA = /^\d+$/.test(a)
  const isNumB = /^\d+$/.test(b)
  if (isNumA && isNumB) return parseInt(a, 10) - parseInt(b, 10)
  return a.localeCompare(b)
}
