import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../api/apiClient';

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

export type RoadmapResponse = {
  id: string;
  workspaceId: string;
  status: 'PENDING' | 'GENERATING' | 'DONE' | 'FAILED';
  steps: Array<{
    title: string;
    description: string;
    resources: Array<{
      title: string;
      url: string;
      type: string;
    }>;
  }>;
  resources: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export function useRoadmap(workspaceId: string) {
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };
      const response = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/roadmaps/current`, {
        method: 'GET',
        headers,
      });

      if (response.status === 404) {
        setRoadmapData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch roadmap: ${response.statusText}`);
      }

      const payload = await response.json();
      setRoadmapData(payload.data || payload);
    } catch (err: any) {
      console.error("Error fetching roadmap:", err);
      setError(err.message || "Failed to fetch roadmap.");
      setRoadmapData(null);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const generateRoadmap = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };
      const response = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/roadmaps/generate`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate roadmap: ${response.statusText}`);
      }

      // After successful generation, refetch the roadmap to display it
      await fetchRoadmap();
    } catch (err: any) {
      console.error("Error generating roadmap:", err);
      setError(err.message || "Failed to generate roadmap.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, fetchRoadmap]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  return { roadmapData, isLoading, error, fetchRoadmap, generateRoadmap };
}