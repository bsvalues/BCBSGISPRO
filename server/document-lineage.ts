import { MemDocumentLineageStorage, IDocumentLineageStorage } from "./document-lineage-storage";

// Create an instance of document lineage storage
export const documentLineageStorage: IDocumentLineageStorage = new MemDocumentLineageStorage();

// Export default for convenience
export default documentLineageStorage;