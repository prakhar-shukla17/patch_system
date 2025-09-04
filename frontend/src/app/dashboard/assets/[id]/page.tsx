'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { 
  ServerIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'

interface Asset {
  _id: string
  name: string
  description?: string
  ipAddress?: string
  osType?: string
  createdAt: string
  updatedAt: string
}

interface Patch {
  _id: string
  name: string
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'APPROVED' | 'INSTALLED' | 'FAILED' | 'IGNORED'
  lastChecked: string
  createdAt: string
  updatedAt: string
}

export default function AssetDetailPage() {
  const params = useParams()
  const assetId = params.id as string
  
  const [asset, setAsset] = useState<Asset | null>(null)
  const [patches, setPatches] = useState<Patch[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showOnlyCritical, setShowOnlyCritical] = useState(true)

  useEffect(() => {
    if (assetId) {
      fetchAssetDetails()
      fetchPatches()
    }
  }, [assetId])

  const fetchAssetDetails = async () => {
    try {
      const response = await apiClient.getAsset(assetId)
      if (response.success) {
        setAsset(response.data)
      } else {
        toast.error('Failed to fetch asset details')
      }
    } catch (error) {
      console.error('Error fetching asset details:', error)
      toast.error('Error fetching asset details')
    }
  }

  const fetchPatches = async () => {
    try {
      const response = await apiClient.getPatchesForAsset(assetId)
      if (response.success) {
        setPatches(response.data)
      } else {
        toast.error('Failed to fetch patches')
      }
    } catch (error) {
      console.error('Error fetching patches:', error)
      toast.error('Error fetching patches')
    } finally {
      setLoading(false)
    }
  }

  const scanForPatches = async () => {
    setScanning(true)
    try {
      const response = await apiClient.scanForPatches(assetId)
      
      if (response.success) {
        setPatches(response.data)
        toast.success(`Found ${response.data.length} patches`)
      } else {
        toast.error(response.error || 'Failed to scan for patches')
      }
    } catch (error) {
      console.error('Error scanning for patches:', error)
      toast.error('Error scanning for patches')
    } finally {
      setScanning(false)
    }
  }

  const updatePatchStatus = async (patchId: string, status: string) => {
    try {
      const response = await apiClient.updatePatchStatus(patchId, status)

      if (response.success) {
        const updatedPatch = response.data
        setPatches(patches.map(p => p._id === patchId ? updatedPatch : p))
        toast.success('Patch status updated')
      } else {
        toast.error('Failed to update patch status')
      }
    } catch (error) {
      console.error('Error updating patch status:', error)
      toast.error('Error updating patch status')
    }
  }



  const getDownloadUrl = async (patchId: string) => {
    try {
      const response = await apiClient.getDownloadUrl(patchId)
      if (response.success && response.data.downloadUrl) {
        // Open the download URL in a new tab
        window.open(response.data.downloadUrl, '_blank')
        toast.success('Opening download page...')
      } else {
        toast.error('No download URL available for this application')
      }
    } catch (error) {
      console.error('Error getting download URL:', error)
      toast.error('Error getting download URL')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'NONE': return 'bg-gray-100 text-gray-500'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'APPROVED': return <CheckCircleIcon className="h-4 w-4 text-blue-500" />
      case 'INSTALLED': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'FAILED': return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'IGNORED': return <XCircleIcon className="h-4 w-4 text-gray-500" />
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!asset) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Asset not found</h3>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Asset Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <ServerIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{asset.name}</h1>
                {asset.description && (
                  <p className="text-gray-600 mt-1 text-lg">{asset.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={scanForPatches}
              disabled={scanning}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            >
              <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan for Updates'}
            </button>
          </div>
          
          {/* Asset Details */}
          <div className="mt-6 flex items-center space-x-6 text-sm text-gray-600">
            {asset.ipAddress && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>IP: {asset.ipAddress}</span>
              </div>
            )}
            {asset.osType && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{asset.osType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Patches Section */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h2 className="text-2xl font-semibold text-gray-900">Available Updates</h2>
              <div className="flex items-center">
                <input
                  id="show-critical-only"
                  type="checkbox"
                  checked={showOnlyCritical}
                  onChange={(e) => setShowOnlyCritical(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-critical-only" className="ml-2 text-sm text-gray-700">
                  Critical updates only
                </label>
              </div>
            </div>
            
            {/* Stats */}
            {patches.length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{patches.length} total updates</span>
                {patches.filter(p => p.severity === 'CRITICAL').length > 0 && (
                  <span className="text-red-600 font-medium">
                    {patches.filter(p => p.severity === 'CRITICAL').length} critical
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Critical Alert */}
          {patches.filter(p => p.severity === 'CRITICAL').length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-900">
                    Critical Security Updates
                  </h3>
                  <p className="mt-1 text-red-700">
                    {patches.filter(p => p.severity === 'CRITICAL').length} applications require immediate attention to address security vulnerabilities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Patches List */}
          {patches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No updates found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Click "Scan for Updates" to check for available software updates on this device.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {patches
                .filter(patch => showOnlyCritical ? patch.severity === 'CRITICAL' : true)
                .sort((a, b) => {
                  const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'NONE': 4 }
                  return severityOrder[a.severity] - severityOrder[b.severity]
                })
                .map((patch) => (
                  <div key={patch._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{patch.name}</h3>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(patch.severity)}`}>
                            {patch.severity === 'NONE' ? 'No Severity' : patch.severity}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Current:</span>
                            <span className="font-mono">{patch.currentVersion}</span>
                          </div>
                          {patch.updateAvailable && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Latest:</span>
                              <span className="font-mono text-blue-600">{patch.latestVersion}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(patch.status)}
                            <span className="capitalize">{patch.status.toLowerCase()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-3 ml-6">
                        {patch.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updatePatchStatus(patch._id, 'APPROVED')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updatePatchStatus(patch._id, 'IGNORED')}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                              Ignore
                            </button>
                          </>
                        )}
                        {patch.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => getDownloadUrl(patch._id)}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                            >
                              Download
                            </button>
                          </>
                        )}
                        {patch.updateAvailable && patch.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => getDownloadUrl(patch._id)}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                            >
                              Download
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
