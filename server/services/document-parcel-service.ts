import { storage } from '../storage';

/**
 * Service for managing the associations between documents and parcels
 */
class DocumentParcelService {
  /**
   * Associates a document with one or more parcels
   * @param documentId The document ID
   * @param parcelIds Array of parcel IDs to associate with the document
   * @returns Array of created document-parcel links
   */
  async associateDocumentWithParcels(documentId: number, parcelIds: number[]) {
    // Ensure the document exists
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Create links for each parcel
    const links = [];
    for (const parcelId of parcelIds) {
      // Ensure the parcel exists
      const parcel = await storage.getParcelById(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Check if the link already exists
      const existingLink = await storage.getDocumentParcelLink(documentId, parcelId);
      if (existingLink) {
        links.push(existingLink);
        continue;
      }
      
      // Create a new link
      const link = await storage.createDocumentParcelLink({
        documentId,
        parcelId
      });
      
      links.push(link);
    }
    
    return links;
  }
  
  /**
   * Removes associations between a document and parcels
   * @param documentId The document ID
   * @param parcelIds Optional array of specific parcel IDs to disassociate (if not provided, all links are removed)
   * @returns Number of links removed
   */
  async disassociateDocumentFromParcels(documentId: number, parcelIds?: number[]) {
    return await storage.removeDocumentParcelLinks(documentId, parcelIds);
  }
  
  /**
   * Gets all parcels associated with a document
   * @param documentId The document ID
   * @returns Array of parcels
   */
  async getParcelsForDocument(documentId: number) {
    return await storage.getParcelsForDocument(documentId);
  }
  
  /**
   * Gets all documents associated with a parcel
   * @param parcelId The parcel ID
   * @returns Array of documents
   */
  async getDocumentsForParcel(parcelId: number) {
    return await storage.getDocumentsForParcel(parcelId);
  }
  
  /**
   * Searches for documents associated with a parcel matching a parcel number
   * @param parcelNumber The parcel number to search for
   * @returns Array of documents
   */
  async getDocumentsForParcelNumber(parcelNumber: string) {
    const parcels = await storage.searchParcelsByNumber(parcelNumber);
    if (parcels.length === 0) {
      return [];
    }
    
    const documents = [];
    for (const parcel of parcels) {
      const docs = await this.getDocumentsForParcel(parcel.id);
      documents.push(...docs);
    }
    
    // Remove duplicates
    return [...new Map(documents.map(doc => [doc.id, doc])).values()];
  }
}

// Export a singleton instance
export const documentParcelService = new DocumentParcelService();