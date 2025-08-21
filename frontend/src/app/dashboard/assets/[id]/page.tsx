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

  const installPatch = async (patchId: string) => {
    try {
      const response = await apiClient.installPatch(patchId)

      if (response.success) {
        const updatedPatch = response.data.patch
        setPatches(patches.map(p => p._id === patchId ? updatedPatch : p))
        toast.success('Update installed successfully!')
      } else {
        toast.error('Failed to install update')
      }
    } catch (error) {
      console.error('Error installing patch:', error)
      toast.error('Error installing update')
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
      <div>
        {/* Asset Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <ServerIcon className="h-12 w-12 text-gray-400 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                {asset.description && (
                  <p className="text-gray-600 mt-1">{asset.description}</p>
                )}
                <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                  {asset.ipAddress && <span>IP: {asset.ipAddress}</span>}
                  {asset.osType && <span>OS: {asset.osType}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patches Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium text-gray-900">Patches</h2>
                <div className="flex items-center">
                  <input
                    id="show-critical-only"
                    type="checkbox"
                    checked={showOnlyCritical}
                    onChange={(e) => setShowOnlyCritical(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-critical-only" className="ml-2 text-sm text-gray-700">
                    Show only critical updates
                  </label>
                </div>
              </div>
              <button
                onClick={scanForPatches}
                disabled={scanning}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Scan for Patches'}
              </button>
            </div>

            {patches.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click "Scan for Patches" to check for available updates.
                </p>
              </div>
            ) : (
              <>
                {/* Critical Patches Summary */}
                {patches.filter(p => p.severity === 'CRITICAL').length > 0 && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Critical Updates Available
                        </h3>
                        <p className="mt-2 text-sm text-red-700">
                          {patches.filter(p => p.severity === 'CRITICAL').length} applications have updates available and require immediate attention.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {patches.length > 0 && (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patches
                      .filter(patch => showOnlyCritical ? patch.severity === 'CRITICAL' : true)
                      .sort((a, b) => {
                        // Sort by severity: CRITICAL first, then others, NONE last
                        const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'NONE': 4 }
                        return severityOrder[a.severity] - severityOrder[b.severity]
                      })
                      .map((patch) => (
                        <tr key={patch._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{patch.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patch.currentVersion}
                            {patch.updateAvailable && (
                              <span className="text-primary-600"> → {patch.latestVersion}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(patch.severity)}`}>
                            {patch.severity === 'NONE' ? 'No Severity' : patch.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(patch.status)}
                            <span className="ml-2 text-sm text-gray-900">{patch.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {patch.status === 'PENDING' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updatePatchStatus(patch._id, 'APPROVED')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updatePatchStatus(patch._id, 'IGNORED')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Ignore
                              </button>
                            </div>
                          )}
                          {patch.status === 'APPROVED' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => installPatch(patch._id)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Install Update
                              </button>
                              <button
                                onClick={() => getDownloadUrl(patch._id)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => updatePatchStatus(patch._id, 'INSTALLED')}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Mark Installed
                              </button>
                            </div>
                          )}
                          {patch.updateAvailable && patch.status === 'PENDING' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => installPatch(patch._id)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Install Update
                              </button>
                              <button
                                onClick={() => getDownloadUrl(patch._id)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Download
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
