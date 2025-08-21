'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { PlusIcon, ServerIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await apiClient.getAssets()
      if (response.success) {
        setAssets(response.data)
      } else {
        toast.error('Failed to fetch assets')
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast.error('Error fetching assets')
    } finally {
      setLoading(false)
    }
  }

  const deleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return
    }

    try {
      const response = await apiClient.deleteAsset(id)

      if (response.success) {
        toast.success('Asset deleted successfully')
        setAssets(assets.filter(asset => asset._id !== id))
      } else {
        toast.error('Failed to delete asset')
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('Error deleting asset')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center py-4 border-b border-gray-200 last:border-b-0">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <Link
            href="/dashboard/assets/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Asset
          </Link>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-12">
            <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assets</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first asset.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/assets/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Asset
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <li key={asset._id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ServerIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {asset.name}
                          </p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            {asset.description && (
                              <p className="mr-6">{asset.description}</p>
                            )}
                            {asset.ipAddress && (
                              <p className="mr-6">IP: {asset.ipAddress}</p>
                            )}
                            {asset.osType && (
                              <p>OS: {asset.osType}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/assets/${asset._id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                        title="View Asset & Scan Patches"
                      >
                        View & Scan
                      </Link>
                      <Link
                        href={`/dashboard/assets/${asset._id}/edit`}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit Asset"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => deleteAsset(asset._id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete Asset"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  )
}
