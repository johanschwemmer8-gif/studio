
/**
 * @fileoverview Initializes the Firebase Admin SDK for server-side operations.
 */
import admin from 'firebase-admin';

// In a real Firebase environment (like Cloud Functions or Cloud Run),
// the Admin SDK is initialized without arguments.
// if (!admin.apps.length) {
//   admin.initializeApp();
// }

// In a local/dev environment, you might need to provide a service account.
// To avoid exposing credentials, we will use a mock DB for local dev.

const createMockDb = () => {
  const data: { [key: string]: any[] } = {};
  
  // This is a simplified in-memory mock of Firestore.
  // It is not a complete implementation.

  const getCollection = (path: string) => {
    return data[path] || [];
  };

  const setCollection = (path: string, collection: any[]) => {
    data[path] = collection;
  };
  
  return {
    collection: (name: string) => ({
      doc: (id?: string) => {
        const docId = id || `mock-${Math.random().toString(36).substring(2, 10)}`;
        return {
          id: docId,
          collection: (subName: string) => createMockDb().collection(`${name}/${docId}/${subName}`),
        }
      },
    }),
    batch: () => {
        const operations: {type: 'set', ref: any, data: any}[] = [];
        return {
            set: (ref: any, data: any) => {
                operations.push({type: 'set', ref, data});
            },
            commit: async () => {
                // In a real mock, you would process these operations.
                // For now, we'll just log and simulate success.
                console.log(`Mock batch commit with ${operations.length} operations.`);
                const requestId = operations[0]?.ref.id;
                
                // Simulate saving to localStorage for persistence in dev
                 try {
                    if (typeof localStorage !== 'undefined') {
                        const requestData = operations.find(op => op.ref._path.segments.length === 2)?.data;
                        const items = operations.filter(op => op.ref._path.segments.length === 4).map(op => op.data);
                        if(requestId && requestData) {
                            const mockRequest = { ...requestData, id: requestId, items };
                            const existingRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                            localStorage.setItem('mockBulkQrRequests', JSON.stringify([...existingRequests, mockRequest]));
                        }
                    }
                } catch(e) {
                    // localStorage not available
                }
            }
        }
    }
  };
};


// Use the mock DB in a non-production environment.
// In production (e.g., on Firebase App Hosting), it would use the real Admin SDK.
const db = process.env.NODE_ENV === 'production' ? admin.firestore() : createMockDb();

export { admin, db };


