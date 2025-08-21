import { NextRequest, NextResponse } from 'next/server'
import { PatchService } from '@/services/patchService'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Python script execution...')
    
    const patchService = new PatchService()
    const patches = await patchService.getInstalledApps()
    
    return NextResponse.json({
      success: true,
      message: `Successfully found ${patches.length} applications`,
      patches: patches
    })
  } catch (error: any) {
    console.error('Python test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Check the server console for more details'
    }, { status: 500 })
  }
}


