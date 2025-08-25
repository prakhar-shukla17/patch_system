import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing MAC address detection...')
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization header required'
      }, { status: 401 })
    }
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/system-info/test-mac`, {
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
        error: errorData.error || 'Failed to test MAC address detection'
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Failed to test MAC address detection:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to test MAC address detection'
    }, { status: 500 })
  }
}
