'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'

export default function NewAssetPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ipAddress: '',
    osType: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiClient.createAsset(formData)

      if (response.success) {
        toast.success('Asset created successfully!')
        router.push('/dashboard/assets')
      } else {
        toast.error(response.error || 'Failed to create asset')
      }
    } catch (error) {
      console.error('Error creating asset:', error)
      toast.error('Error creating asset')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Asset</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new asset to monitor for patches and updates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Asset Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g., Web Server 01"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Brief description of the asset"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700">
                  IP Address
                </label>
                <input
                  type="text"
                  name="ipAddress"
                  id="ipAddress"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g., 192.168.1.100"
                  value={formData.ipAddress}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="osType" className="block text-sm font-medium text-gray-700">
                  Operating System
                </label>
                <select
                  name="osType"
                  id="osType"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.osType}
                  onChange={handleChange}
                >
                  <option value="">Select OS Type</option>
                  <option value="Windows">Windows</option>
                  <option value="Linux">Linux</option>
                  <option value="macOS">macOS</option>
                  <option value="Unix">Unix</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}


