import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useAuth() {
  const qc = useQueryClient();
  const me = useQuery<{ id: string; username: string }>({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiClient.get('/api/auth/me'),
    retry: false,
  });

  const login = useMutation({
    mutationFn: (payload: { username: string; password: string }) => apiClient.post('/api/auth/login', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/auth/me'] }),
  });

  const register = useMutation({
    mutationFn: (payload: { username: string; password: string; email?: string }) => apiClient.post('/api/auth/register', payload),
  });

  const logout = useMutation({
    mutationFn: () => apiClient.post('/api/auth/logout'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/auth/me'] }),
  });

  return { me, login, register, logout };
}

