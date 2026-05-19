import { useState, useCallback } from "react";
import onboardingService, { OnboardingProfileResponse, UpsertOnboardingProfileRequest } from "../../api/onboardingService";

export function useOnboardingProfile(workspaceId?: string) {
  const [profile, setProfile] = useState<OnboardingProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true); setError(null);
    try {
      const res = await onboardingService.fetchOnboardingProfile(workspaceId);
      if (res.code === 404 || res.data === null) {
        setProfile(null);
        return null;
      }
      setProfile(res.data);
      return res.data;
    } catch (err: any) {
      setError(err);
      setProfile(null);
      throw err;
    } finally { setLoading(false); }
  }, [workspaceId]);

  const upsert = useCallback(async (body: UpsertOnboardingProfileRequest) => {
    if (!workspaceId) throw new Error("workspaceId missing");
    setLoading(true); setError(null);
    try {
      const res = await onboardingService.upsertOnboardingProfile(workspaceId, body);
      setProfile(res.data);
      return res.data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally { setLoading(false); }
  }, [workspaceId]);

  return { profile, loading, error, fetchOnboardingProfile: fetch, upsertOnboardingProfile: upsert, setProfile };
}

export default useOnboardingProfile;
