import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching assets from backend...')
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization header required'
      }, { status: 401 })
    }
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/assets`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.error || 'Failed to fetch assets'
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data.data || [])
    
  } catch (error: any) {
    console.error('Failed to fetch assets:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to fetch assets from backend'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating new asset in backend:', body)
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization header required'
      }, { status: 401 })
    }
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/assets`, {
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
        error: errorData.error || 'Failed to create asset'
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data.data, { status: 201 })
    
  } catch (error: any) {
    console.error('Failed to create asset:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to create asset in backend'
    }, { status: 500 })
  }
}
