'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface PatchWithAsset {
  _id: string
  name: string
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'APPROVED' | 'INSTALLED' | 'FAILED' | 'IGNORED'
  lastChecked: string
  asset: {
    _id: string
    name: string
  }
}

interface AssetGroup {
  assetId: string
  assetName: string
  patches: PatchWithAsset[]
  criticalCount: number
  updatesAvailableCount: number
  pendingCount: number
}

export default function PatchesPage() {
  const [patches, setPatches] = useState<PatchWithAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPatches()
  }, [])

  const fetchPatches = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPatches()
      const data = response.data || []
      setPatches(data)
      // Expand all assets by default
      const assetIds = [...new Set(data.map((patch: PatchWithAsset) => patch.asset._id))]
      setExpandedAssets(new Set(assetIds))
    } catch (error) {
      console.error('Error fetching patches:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
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

  const toggleAssetExpansion = (assetId: string) => {
    const newExpanded = new Set(expandedAssets)
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId)
    } else {
      newExpanded.add(assetId)
    }
    setExpandedAssets(newExpanded)
  }

  const toggleAllAssets = () => {
    if (expandedAssets.size === groupedPatches.length) {
      setExpandedAssets(new Set())
    } else {
      const allAssetIds = groupedPatches.map(group => group.assetId)
      setExpandedAssets(new Set(allAssetIds))
    }
  }

  // Group patches by asset
  const groupedPatches: AssetGroup[] = patches.reduce((groups: AssetGroup[], patch) => {
    const existingGroup = groups.find(group => group.assetId === patch.asset._id)
    
    if (existingGroup) {
      existingGroup.patches.push(patch)
      if (patch.severity === 'CRITICAL' && patch.updateAvailable) existingGroup.criticalCount++
      if (patch.updateAvailable) existingGroup.updatesAvailableCount++
      if (patch.status === 'PENDING') existingGroup.pendingCount++
    } else {
      groups.push({
        assetId: patch.asset._id,
        assetName: patch.asset.name,
        patches: [patch],
        criticalCount: patch.severity === 'CRITICAL' && patch.updateAvailable ? 1 : 0,
        updatesAvailableCount: patch.updateAvailable ? 1 : 0,
        pendingCount: patch.status === 'PENDING' ? 1 : 0
      })
    }
    
    return groups
  }, [])

  // Filter grouped patches
  const filteredGroupedPatches = groupedPatches.map(group => ({
    ...group,
    patches: group.patches.filter(patch => {
      if (filter === 'all') return true
      if (filter === 'critical') return patch.severity === 'CRITICAL'
      if (filter === 'updates-available') return patch.updateAvailable
      if (filter === 'pending') return patch.status === 'PENDING'
      return true
    })
  })).filter(group => group.patches.length > 0)

  const stats = {
    total: patches.length,
    critical: patches.filter(p => p.severity === 'CRITICAL' && p.updateAvailable).length,
    updatesAvailable: patches.filter(p => p.updateAvailable).length,
    pending: patches.filter(p => p.status === 'PENDING').length,
    assets: groupedPatches.length
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Patches Overview</h1>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Assets</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.assets}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Patches</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.critical}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Updates Available</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.updatesAvailable}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'all' 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'critical' 
                      ? 'bg-red-100 text-red-800' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Critical ({stats.critical})
                </button>
                <button
                  onClick={() => setFilter('updates-available')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'updates-available' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Updates Available ({stats.updatesAvailable})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pending ({stats.pending})
                </button>
              </div>
              <button
                onClick={toggleAllAssets}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandedAssets.size === groupedPatches.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>

          {/* Asset Groups */}
          <div className="divide-y divide-gray-200">
            {filteredGroupedPatches
              .sort((a, b) => {
                // Sort by critical count first, then by total patches
                if (a.criticalCount !== b.criticalCount) return b.criticalCount - a.criticalCount
                return b.patches.length - a.patches.length
              })
              .map((group) => (
                <div key={group.assetId} className="bg-white">
                  {/* Asset Header */}
                  <div 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleAssetExpansion(group.assetId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {expandedAssets.has(group.assetId) ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <ServerIcon className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{group.assetName}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {group.patches.length} patches
                            </span>
                            {group.criticalCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {group.criticalCount} critical
                              </span>
                            )}
                            {group.updatesAvailableCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {group.updatesAvailableCount} updates
                              </span>
                            )}
                            {group.pendingCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {group.pendingCount} pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link 
                        href={`/dashboard/assets/${group.assetId}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Asset
                      </Link>
                    </div>
                  </div>

                  {/* Patches Table */}
                  {expandedAssets.has(group.assetId) && (
                    <div className="border-t border-gray-200">
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
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.patches
                            .sort((a, b) => {
                              // Sort by severity: CRITICAL first, then by update availability
                              const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 }
                              const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
                              if (severityDiff !== 0) return severityDiff
                              
                              // Then by update availability
                              if (a.updateAvailable && !b.updateAvailable) return -1
                              if (!a.updateAvailable && b.updateAvailable) return 1
                              
                              return 0
                            })
                            .map((patch) => (
                            <tr key={patch._id} className="hover:bg-gray-50">
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
                                  {patch.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getStatusIcon(patch.status)}
                                  <span className="ml-2 text-sm text-gray-900">{patch.status}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
