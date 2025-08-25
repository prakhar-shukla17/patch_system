'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import { apiClient } from '@/lib/api'
import { 
  ServerIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalAssets: number
  totalPatches: number
  criticalPatches: number
  upToDateAssets: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    totalPatches: 0,
    criticalPatches: 0,
    upToDateAssets: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch assets using API client (includes auth token)
      const assetsResponse = await apiClient.getAssets()
      const assetsData = assetsResponse.data || []
      
      // Fetch patches using API client (includes auth token)
      const patchesResponse = await apiClient.getPatches()
      const patchesData = patchesResponse.data || []

      // Calculate statistics
      const totalAssets = assetsData.length || 0
      const totalPatches = patchesData.length || 0
      const criticalPatches = patchesData.filter((patch: any) => 
        patch.severity === 'CRITICAL' && patch.updateAvailable
      ).length || 0
      
      // Calculate up-to-date assets (assets with no pending critical patches)
      const assetsWithCriticalPatches = new Set(
        patchesData
          .filter((patch: any) => patch.severity === 'CRITICAL' && patch.updateAvailable)
          .map((patch: any) => patch.asset._id)
      )
      const upToDateAssets = totalAssets - assetsWithCriticalPatches.size

      setStats({
        totalAssets,
        totalPatches,
        criticalPatches,
        upToDateAssets: Math.max(0, upToDateAssets) // Ensure non-negative
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard statistics')
      
      // Fallback to zero values on error
      setStats({
        totalAssets: 0,
        totalPatches: 0,
        criticalPatches: 0,
        upToDateAssets: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Assets',
      value: stats.totalAssets,
      icon: ServerIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Patches',
      value: stats.totalPatches,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Critical Patches',
      value: stats.criticalPatches,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Up to Date',
      value: stats.upToDateAssets,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome back, {user?.name}!
        </h1>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How to Scan for Patches
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>1. Add an asset using the "Add New Asset" button below</p>
                <p>2. Click "View & Scan" next to your asset</p>
                <p>3. Click "Scan for Patches" to run the patch detection</p>
                <p>4. Review and manage discovered patches</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/dashboard/assets"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Manage Assets
                </span>
              </a>
              <a
                href="/dashboard/patches"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  View Patches
                </span>
              </a>
              <a
                href="/dashboard/assets/new"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center text-2xl">
                  +
                </div>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Add New Asset
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
