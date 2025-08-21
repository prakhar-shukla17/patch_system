'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon
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

export default function PatchesPage() {
  const [patches, setPatches] = useState<PatchWithAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchPatches()
  }, [])

  const fetchPatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patches')
      if (response.ok) {
        const data = await response.json()
        setPatches(data)
      } else {
        console.error('Failed to fetch patches')
      }
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

  const filteredPatches = patches.filter(patch => {
    if (filter === 'all') return true
    if (filter === 'critical') return patch.severity === 'CRITICAL'
    if (filter === 'updates-available') return patch.updateAvailable
    if (filter === 'pending') return patch.status === 'PENDING'
    return true
  })

  const stats = {
    total: patches.length,
    critical: patches.filter(p => p.severity === 'CRITICAL' && p.updateAvailable).length,
    updatesAvailable: patches.filter(p => p.updateAvailable).length,
    pending: patches.filter(p => p.status === 'PENDING').length
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
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
          </div>

          {/* Patches table */}
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
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
                {filteredPatches
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
                  <tr key={patch._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{patch.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/dashboard/assets/${patch.asset._id}`}
                        className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                      >
                        <ServerIcon className="h-4 w-4 mr-1" />
                        {patch.asset.name}
                      </Link>
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
        </div>
      </div>
    </Layout>
  )
}
