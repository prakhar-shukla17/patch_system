import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching patches from backend...')
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization header required'
      }, { status: 401 })
    }
    
    // First, get all assets for the user
    const assetsResponse = await fetch(`${BACKEND_URL}/api/assets`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })
    
    if (!assetsResponse.ok) {
      const errorData = await assetsResponse.json()
      return NextResponse.json({
        success: false,
        error: errorData.error || 'Failed to fetch assets'
      }, { status: assetsResponse.status })
    }
    
    const assetsData = await assetsResponse.json()
    const assets = assetsData.data || []
    
    // Then, get all patches for each asset
    const allPatches = []
    
    for (const asset of assets) {
      const patchesResponse = await fetch(`${BACKEND_URL}/api/patches/asset/${asset._id}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      })
      
      if (patchesResponse.ok) {
        const patchesData = await patchesResponse.json()
        const patches = patchesData.data || []
        
        // Add asset information to each patch
        const patchesWithAsset = patches.map((patch: any) => ({
          ...patch,
          asset: {
            _id: asset._id,
            name: asset.name
          }
        }))
        
        allPatches.push(...patchesWithAsset)
      }
    }
    
    return NextResponse.json(allPatches)
    
  } catch (error: any) {
    console.error('Failed to fetch patches:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to fetch patches from backend'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating new patch in backend:', body)
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization header required'
      }, { status: 401 })
    }
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/patches`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.error || 'Failed to create patch'
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data.data, { status: 201 })
    
  } catch (error: any) {
    console.error('Failed to create patch:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to create patch in backend'
    }, { status: 500 })
  }
}
