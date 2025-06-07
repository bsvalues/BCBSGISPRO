

interface Parcel {
  id: string
  parcelNumber: string
  legalDescription: string
  address?: string
  ownerName?: string
  assessedValue?: string
  acreage?: string
  lastModified: string
}

export default function TerraFusionDashboard() {
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: parcels = [], isLoading } = useQuery({
    queryKey: ['/api/parcels'],
    enabled: true
  })

  const { data: recentDocuments = [] } = useQuery({
    queryKey: ['/api/documents', { limit: 10 }],
    enabled: true
  })

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: true
  })

  const searchParcels = useQuery({
    queryKey: ['/api/parcels', { search: searchQuery }],
    enabled: searchQuery.length > 2
  })

  const displayedParcels = searchQuery.length > 2 
    ? searchParcels.data || [] 
    : parcels.slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TerraFusion</h1>
            <p className="text-gray-600">Civil Infrastructure Intelligence Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search parcels, addresses, owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button>
              <Plus size={16} className="mr-2" />
              New Parcel
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database size={16} />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Parcels</span>
                  <Badge variant="secondary">{parcels.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <Badge variant="secondary">{recentDocuments.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <Badge variant="secondary">{users.length}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin size={16} />
                  Recent Parcels
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {displayedParcels.map((parcel: Parcel) => (
                      <div
                        key={parcel.id}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          selectedParcel?.id === parcel.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedParcel(parcel)}
                      >
                        <div className="font-medium text-sm">{parcel.parcelNumber}</div>
                        {parcel.address && (
                          <div className="text-xs text-gray-600">{parcel.address}</div>
                        )}
                        {parcel.ownerName && (
                          <div className="text-xs text-gray-500">{parcel.ownerName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  Recent Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentDocuments.map((doc: any) => (
                    <div key={doc.id} className="p-2 border rounded text-xs">
                      <div className="font-medium">{doc.fileName}</div>
                      <div className="text-gray-600">{doc.documentType}</div>
                    </div>
                  ))}
                  {recentDocuments.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No documents available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main className="flex-1 relative">
          <TerraFusionMap 
            selectedParcelId={selectedParcel?.id}
            onParcelSelect={(parcelData) => {
              const parcel = parcels.find((p: Parcel) => p.parcelNumber === parcelData.parcelNumber)
              if (parcel) setSelectedParcel(parcel)
            }}
          />
          
          {selectedParcel && (
            <Card className="absolute bottom-4 left-4 w-80 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Parcel Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-600">Parcel Number</label>
                  <div className="text-sm">{selectedParcel.parcelNumber}</div>
                </div>
                {selectedParcel.address && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Address</label>
                    <div className="text-sm">{selectedParcel.address}</div>
                  </div>
                )}
                {selectedParcel.ownerName && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Owner</label>
                    <div className="text-sm">{selectedParcel.ownerName}</div>
                  </div>
                )}
                {selectedParcel.assessedValue && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Assessed Value</label>
                    <div className="text-sm">${selectedParcel.assessedValue}</div>
                  </div>
                )}
                <div className="pt-2">
                  <Button size="sm" className="w-full">
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}