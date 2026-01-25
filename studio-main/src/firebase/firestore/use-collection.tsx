'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  getFirestore,
  collection as createCollection,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 *
 * IMPORTANT! Memoize the `targetRefOrQuery` for performance.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | string | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query, or a string path. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | string | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading immediately
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Reset state for new query
    setIsLoading(true);
    setError(null);

    const getQuery = () => {
        if (typeof targetRefOrQuery === 'string') {
            // If it's a string, create a collection reference.
            // This requires access to the firestore instance.
            return createCollection(getFirestore(), targetRefOrQuery);
        }
        // Otherwise, it's already a Query or CollectionReference
        return targetRefOrQuery;
    }

    const query = getQuery();

    const unsubscribe = onSnapshot(
      query as Query, // Cast to Query
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        let path: string;
        if (typeof query === 'string') {
          path = query;
        } else if ('path' in query) {
            path = (query as CollectionReference).path;
        } else {
          // This is a workaround as the direct path isn't exposed on the public Query type
          path = (query as any)._query?.path.segments.join('/') || 'unknown_path';
        }
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery]); // Re-run if the target query/reference changes.

  return { data, isLoading, error };
}
