import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export interface PatchInfo {
  name: string
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
}

export class PatchService {
  private pythonScriptPath: string

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'scripts', 'latest_version.py')
  }

  private async findPythonExecutable(): Promise<string> {
    const pythonCommands = ['python', 'python3', 'py']
    
    for (const cmd of pythonCommands) {
      try {
        await new Promise((resolve, reject) => {
          const testProcess = spawn(cmd, ['--version'])
          testProcess.on('close', (code) => {
            if (code === 0) {
              resolve(cmd)
            } else {
              reject()
            }
          })
          testProcess.on('error', () => reject())
        })
        return cmd
      } catch {
        continue
      }
    }
    throw new Error('Python executable not found. Please install Python and ensure it\'s in your PATH.')
  }

  async getInstalledApps(): Promise<PatchInfo[]> {
    // Check if Python script exists
    if (!fs.existsSync(this.pythonScriptPath)) {
      throw new Error(`Python script not found at: ${this.pythonScriptPath}`)
    }

    const pythonCmd = await this.findPythonExecutable()
    
    return new Promise((resolve, reject) => {
      console.log(`Executing: ${pythonCmd} ${this.pythonScriptPath}`)
      
      const pythonProcess = spawn(pythonCmd, [this.pythonScriptPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          PYTHONLEGACYWINDOWSSTDIO: '1'
        }
      })
      
      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
        console.log('Python stdout:', data.toString())
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        console.log('Python stderr:', data.toString())
      })

      pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code: ${code}`)
        console.log('Full stdout:', stdout)
        console.log('Full stderr:', stderr)

        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}. Error: ${stderr}`))
          return
        }

        try {
          // Look for JSON in the output more flexibly
          const jsonRegex = /\[[\s\S]*?\]/g
          const jsonMatches = stdout.match(jsonRegex)
          
          if (!jsonMatches || jsonMatches.length === 0) {
            console.log('No JSON found in Python script output')
            reject(new Error('No JSON data found in Python script output. Please ensure the script runs correctly and outputs valid JSON.'))
            return
          }

          // Try to parse the largest JSON array found
          let appsData = []
          for (const jsonMatch of jsonMatches) {
            try {
              const parsed = JSON.parse(jsonMatch)
              if (Array.isArray(parsed) && parsed.length > appsData.length) {
                appsData = parsed
              }
            } catch (e) {
              console.log('Failed to parse JSON match:', jsonMatch.substring(0, 100))
            }
          }

          if (appsData.length === 0) {
            throw new Error('No valid JSON data found in Python script output')
          }
          
          const patchInfo: PatchInfo[] = appsData.map((app: any) => {
            const updateAvailable = app.update_available === true
            const currentVersion = app.current_version || '0.0.0'
            const latestVersion = app.latest_version || currentVersion
            

            
            return {
              name: app.name || 'Unknown',
              currentVersion: currentVersion,
              latestVersion: latestVersion,
              updateAvailable: updateAvailable
            }
          })

          console.log(`Successfully parsed ${patchInfo.length} applications`)
          resolve(patchInfo)
        } catch (error) {
          console.error('Error parsing Python output:', error)
          reject(new Error(`Failed to parse Python script output: ${error}`))
        }
      })

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error)
        reject(new Error(`Failed to start Python script: ${error.message}`))
      })

      // Set a timeout for the process
      setTimeout(() => {
        pythonProcess.kill()
        reject(new Error('Python script execution timed out after 30 seconds'))
      }, 30000)
    })
  }

  async getUpdatableApps(): Promise<PatchInfo[]> {
    const allApps = await this.getInstalledApps()
    return allApps.filter(app => app.updateAvailable)
  }

  determineSeverity(appName: string, currentVersion: string, latestVersion: string, updateAvailable: boolean): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // Only mark as CRITICAL if there's actually an update available AND versions are different
    if (updateAvailable && currentVersion !== latestVersion && latestVersion !== currentVersion) {
      return 'CRITICAL'
    }
    
    // For apps that are up to date, use lower severity levels
    return 'LOW'
  }

  determineStatus(updateAvailable: boolean): 'PENDING' | 'APPROVED' | 'INSTALLED' | 'FAILED' | 'IGNORED' {
    // If no update is available, the app is already up-to-date/installed
    if (!updateAvailable) {
      return 'INSTALLED'
    }
    
    // If update is available, it's pending action
    return 'PENDING'
  }
}
