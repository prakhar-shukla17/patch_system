'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';

interface Agent {
  id: string;
  system: string;
  capabilities: string[];
  status: string;
  lastSeen: string;
  lastMessage: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingAgent, setStartingAgent] = useState(false);
  const [stoppingAgent, setStoppingAgent] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('test-agent-001');
  const [apiKey, setApiKey] = useState('mysecretkey123');
  const [availablePatches, setAvailablePatches] = useState<any[]>([]);
  const [loadingPatches, setLoadingPatches] = useState(false);

  const fetchAgents = async () => {
    try {
      const response = await apiClient.getAvailableAgents();
      if (response.success) {
        setAgents(response.data);
      } else {
        toast.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Error fetching agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePatches = async () => {
    setLoadingPatches(true);
    try {
      // Get all assets first
      const assetsResponse = await apiClient.getAssets();
      if (assetsResponse.success && assetsResponse.data.length > 0) {
        const allPatches: any[] = [];
        
        // For each asset, get its patches
        for (const asset of assetsResponse.data) {
          try {
            const patchesResponse = await apiClient.getPatchesForAsset(asset._id);
            if (patchesResponse.success) {
              // Filter patches that have updates available (CRITICAL severity)
              const criticalPatches = patchesResponse.data.filter((patch: any) => 
                patch.severity === 'CRITICAL' && patch.updateAvailable
              );
              allPatches.push(...criticalPatches);
            }
          } catch (error) {
            console.error(`Error fetching patches for asset ${asset._id}:`, error);
          }
        }
        
        setAvailablePatches(allPatches);
      } else {
        // If no assets, try to scan for patches on a default asset
        await scanForPatches();
      }
    } catch (error) {
      console.error('Error fetching available patches:', error);
      toast.error('Error fetching available patches');
    } finally {
      setLoadingPatches(false);
    }
  };

  const scanForPatches = async () => {
    try {
      // Create a default asset if none exists
      const assetsResponse = await apiClient.getAssets();
      let assetId = '';
      
      if (assetsResponse.success && assetsResponse.data.length > 0) {
        assetId = assetsResponse.data[0]._id;
      } else {
        // Create a default asset
        const createResponse = await apiClient.createAsset({
          name: 'Local System',
          description: 'Default system for patch scanning',
          osType: 'WINDOWS'
        });
        if (createResponse.success) {
          assetId = createResponse.data._id;
        }
      }
      
      if (assetId) {
        const scanResponse = await apiClient.scanForPatches(assetId);
        if (scanResponse.success) {
          // Filter for critical patches
          const criticalPatches = scanResponse.data.filter((patch: any) => 
            patch.severity === 'CRITICAL' && patch.updateAvailable
          );
          setAvailablePatches(criticalPatches);
        }
      }
    } catch (error) {
      console.error('Error scanning for patches:', error);
      toast.error('Error scanning for patches');
    }
  };

  const startAgent = async () => {
    setStartingAgent(true);
    try {
      const response = await apiClient.startAgent(agentId, apiKey);
      if (response.success) {
        toast.success('Agent started successfully!');
        fetchAgents(); // Refresh the list
      } else {
        toast.error(response.error || 'Failed to start agent');
      }
    } catch (error) {
      console.error('Error starting agent:', error);
      toast.error('Error starting agent');
    } finally {
      setStartingAgent(false);
    }
  };

  const stopAgent = async () => {
    setStoppingAgent(true);
    try {
      const response = await apiClient.stopAgent(agentId);
      if (response.success) {
        toast.success('Agent stopped successfully!');
        fetchAgents(); // Refresh the list
      } else {
        toast.error(response.error || 'Failed to stop agent');
      }
    } catch (error) {
      console.error('Error stopping agent:', error);
      toast.error('Error stopping agent');
    } finally {
      setStoppingAgent(false);
    }
  };

  const installViaAgent = async (appName: string, appId?: string) => {
    if (!isAgentRunning()) {
      toast.error('Agent is not running. Please start the agent first.');
      return;
    }

    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      toast.error('Agent not found. Please start an agent first.');
      return;
    }

    setInstalling(appName);
    
    try {
      const response = await apiClient.installViaAgent(agent.id, appName, appId);
      if (response.success) {
        toast.success(`Installation request sent for ${appName}!`);
      } else {
        toast.error(response.error || 'Failed to send installation request');
      }
    } catch (error) {
      console.error('Error installing via agent:', error);
      toast.error('Error sending installation request');
    } finally {
      setInstalling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-600';
      case 'OFFLINE':
        return 'text-red-600';
      case 'INSTALLING':
        return 'text-blue-600';
      case 'SUCCESS':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isAgentRunning = () => {
    return agents.some(agent => agent.id === agentId && agent.status === 'ONLINE');
  };

  const getAgentStatus = () => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.status : 'OFFLINE';
  };

  useEffect(() => {
    fetchAgents();
    fetchAvailablePatches();
    // Poll for agent updates every 5 seconds
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Management</h1>
        <p className="text-gray-600">Manage remote installation agents and install applications automatically</p>
      </div>

        {/* Agent Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent ID
              </label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="test-agent-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="mysecretkey123"
              />
            </div>
            <div className="flex items-end">
              {isAgentRunning() ? (
                <button
                  onClick={stopAgent}
                  disabled={stoppingAgent}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stoppingAgent ? 'Stopping...' : 'Stop Agent'}
                </button>
              ) : (
                <button
                  onClick={startAgent}
                  disabled={startingAgent}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startingAgent ? 'Starting...' : 'Start Agent'}
                </button>
              )}
            </div>
          </div>
          
          {/* Agent Status Indicator */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                 <div className={`w-3 h-3 rounded-full ${
                   getAgentStatus() === 'ONLINE' ? 'bg-green-500' : 
                   getAgentStatus() === 'OFFLINE' ? 'bg-gray-400' :
                   getAgentStatus() === 'INSTALLING' ? 'bg-blue-500' :
                   getAgentStatus() === 'SUCCESS' ? 'bg-green-500' :
                   getAgentStatus() === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'
                 }`}></div>
                 <span className="text-sm font-medium text-gray-700">
                   Agent Status: {getAgentStatus()}
                 </span>
               </div>
              <div className="text-sm text-gray-500">
                ID: {agentId}
              </div>
            </div>
            {isAgentRunning() && (
              <div className="mt-2 text-sm text-green-600">
                ✓ Agent is online and ready to receive installation commands
              </div>
            )}
          </div>
        </div>

        {/* Quick Install Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Available Updates</h2>
              <p className="text-gray-600">Install applications with available updates</p>
            </div>
            <button
              onClick={fetchAvailablePatches}
              disabled={loadingPatches}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPatches ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
                     {loadingPatches ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
               <p className="text-gray-500 mt-2">Scanning for available updates...</p>
             </div>
           ) : !isAgentRunning() ? (
             <div className="text-center py-8">
               <div className="text-gray-500 mb-4">Agent is not running</div>
               <p className="text-sm text-gray-400 mb-6">Start the agent above to install updates</p>
               <div className="flex justify-center space-x-4">
                 <button
                   onClick={scanForPatches}
                   className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                 >
                   Scan for Updates
                 </button>
                 <button
                   onClick={() => setAvailablePatches([
                     { _id: 'docker', name: 'Docker Desktop', wingetAppId: 'Docker.DockerDesktop', currentVersion: 'Not installed', latestVersion: 'Latest' },
                     { _id: 'vscode', name: 'Visual Studio Code', wingetAppId: 'Microsoft.VisualStudioCode', currentVersion: 'Not installed', latestVersion: 'Latest' },
                     { _id: 'chrome', name: 'Google Chrome', wingetAppId: 'Google.Chrome', currentVersion: 'Not installed', latestVersion: 'Latest' },
                     { _id: 'notepad', name: 'Notepad++', wingetAppId: 'Notepad++.Notepad++', currentVersion: 'Not installed', latestVersion: 'Latest' },
                     { _id: '7zip', name: '7-Zip', wingetAppId: '7zip.7zip', currentVersion: 'Not installed', latestVersion: 'Latest' },
                     { _id: 'vlc', name: 'VLC Media Player', wingetAppId: 'VideoLAN.VLC', currentVersion: 'Not installed', latestVersion: 'Latest' }
                   ])}
                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                 >
                   Show Common Apps
                 </button>
               </div>
             </div>
           ) : availablePatches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No updates available</div>
              <p className="text-sm text-gray-400 mb-6">All applications are up to date</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={scanForPatches}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Scan for Updates
                </button>
                <button
                  onClick={() => setAvailablePatches([
                    { _id: 'docker', name: 'Docker Desktop', wingetAppId: 'Docker.DockerDesktop', currentVersion: 'Not installed', latestVersion: 'Latest' },
                    { _id: 'vscode', name: 'Visual Studio Code', wingetAppId: 'Microsoft.VisualStudioCode', currentVersion: 'Not installed', latestVersion: 'Latest' },
                    { _id: 'chrome', name: 'Google Chrome', wingetAppId: 'Google.Chrome', currentVersion: 'Not installed', latestVersion: 'Latest' },
                    { _id: 'notepad', name: 'Notepad++', wingetAppId: 'Notepad++.Notepad++', currentVersion: 'Not installed', latestVersion: 'Latest' },
                    { _id: '7zip', name: '7-Zip', wingetAppId: '7zip.7zip', currentVersion: 'Not installed', latestVersion: 'Latest' },
                    { _id: 'vlc', name: 'VLC Media Player', wingetAppId: 'VideoLAN.VLC', currentVersion: 'Not installed', latestVersion: 'Latest' }
                  ])}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Show Common Apps
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePatches.map((patch) => (
                                 <button
                   key={patch._id}
                   onClick={() => installViaAgent(patch.name, patch.wingetAppId)}
                   disabled={!isAgentRunning() || installing === patch.name}
                   className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                 >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{patch.name}</div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      CRITICAL
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {patch.currentVersion && patch.latestVersion ? (
                      <>Current: {patch.currentVersion} → Latest: {patch.latestVersion}</>
                    ) : (
                      <>Update available</>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {patch.wingetAppId}
                  </div>
                  {installing === patch.name && (
                    <div className="text-blue-600 text-sm mt-2">Installing...</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Agents List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Agents</h2>
          
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No agents running</div>
              <p className="text-sm text-gray-400">Start an agent above to begin automated installations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{agent.id}</h3>
                        <span className={`text-sm font-medium ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        System: {agent.system} | Capabilities: {agent.capabilities.join(', ')}
                      </div>
                      {agent.lastMessage && (
                        <div className="text-sm text-gray-600 mt-1">
                          Last message: {agent.lastMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Last seen: {new Date(agent.lastSeen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
}
