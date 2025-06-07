

interface ImportResult {
  imported: number;
  total: number;
  errors?: Array<{ row: number; message: string }>;
  parcels?: Array<{
    id: string;
    parcelNumber: string;
    address: string;
    ownerName: string;
  }>;
}

interface ImportHistory {
  id: string;
  fileName: string;
  timestamp: string;
  status: 'success' | 'failed' | 'partial';
  imported: number;
  total: number;
  userId: string;
}

const DataImport: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedCounty, setSelectedCounty] = useState('');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async ({ file, countyId }: { file: File; countyId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('countyId', countyId);

      const response = await fetch('/api/parcels/bulk-import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/parcels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counties'] });
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile && selectedCounty) {
      importMutation.mutate({ file: selectedFile, countyId: selectedCounty });
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'parcelNumber,legalDescription,address,ownerName,assessedValue,acreage',
      '123-456-789,"Lot 1 Block 1 Smith Addition","123 Main St","John Doe",150000,0.25',
      '123-456-790,"Lot 2 Block 1 Smith Addition","125 Main St","Jane Smith",175000,0.30'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parcel_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
          <p className="text-gray-600">Import parcel data and GIS layers</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Import Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Parcel Data</h3>
          
          {/* County Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select County
            </label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a county...</option>
              <option value="benton-wa">Benton County, WA</option>
              <option value="franklin-wa">Franklin County, WA</option>
              <option value="yakima-wa">Yakima County, WA</option>
            </select>
          </div>

          {/* File Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            {selectedFile ? (
              <div>
                <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!selectedFile || !selectedCounty || importMutation.isPending}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Importing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Import Data
              </>
            )}
          </button>
        </div>

        {/* Import Guidelines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Guidelines</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">File Format</h4>
                <p className="text-sm text-gray-600">
                  CSV files with headers. Maximum file size: 10MB
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Required Columns</h4>
                <p className="text-sm text-gray-600">
                  parcelNumber, legalDescription, countyId
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Optional Columns</h4>
                <p className="text-sm text-gray-600">
                  address, ownerName, assessedValue, acreage, zoning
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Validation</h4>
                <p className="text-sm text-gray-600">
                  Duplicate parcel numbers will be skipped
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Sample Data Format:</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`parcelNumber,legalDescription,address
123-456-789,"Lot 1 Block 1","123 Main St"
123-456-790,"Lot 2 Block 1","125 Main St"`}
            </pre>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Imported</p>
                  <p className="text-2xl font-bold text-green-900">{importResult.imported}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Total Records</p>
                  <p className="text-2xl font-bold text-blue-900">{importResult.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((importResult.imported / importResult.total) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Import Errors:</h4>
              <div className="space-y-1">
                {importResult.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">
                    Row {error.row}: {error.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {importResult.parcels && importResult.parcels.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Sample Imported Parcels:</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Parcel Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Owner
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importResult.parcels.slice(0, 5).map((parcel) => (
                      <tr key={parcel.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parcel.parcelNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parcel.address || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parcel.ownerName || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importResult.parcels.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  and {importResult.parcels.length - 5} more parcels...
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataImport;