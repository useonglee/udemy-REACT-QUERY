import { AxiosResponse } from 'axios';
import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from '../../../user-storage';

async function getUser(
  user: User | null,
  signal: AbortSignal,
): Promise<User | null> {
  if (!user) return null;
  const { data }: AxiosResponse<{ user: User }> = await axiosInstance.get(
    `/user/${user.id}`,
    {
      headers: getJWTHeader(user),
      signal,
    },
  );
  return data.user;
}

interface UseUser {
  user: User | null;
  updateUser: (user: User) => void;
  clearUser: () => void;
}

export function useUser(): UseUser {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(getStoredUser());

  useQuery(queryKeys.user, ({ signal }) => getUser(user, signal), {
    enabled: !!user,
    onSuccess: (data) => setUser(data),
  });

  // meant to be called from useAuth
  function updateUser(newUser: User): void {
    setUser(newUser);
    setStoredUser(newUser);
    queryClient.setQueryData(queryKeys.user, newUser);
  }

  // meant to be called from useAuth
  function clearUser() {
    setUser(null);
    clearStoredUser();

    queryClient.setQueryData(queryKeys.user, user);
    queryClient.removeQueries([[queryKeys.appointments, queryKeys.user]]);
  }

  return { user, updateUser, clearUser };
}
