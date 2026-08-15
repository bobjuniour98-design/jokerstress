// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  user_id: string;
  username: string;
  rank: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

let cachedUser: User | null = null;
let cachedLoading: boolean = true;

export default function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(cachedLoading);
  const router = useRouter();

  useEffect(() => {
    if (cachedUser === null && cachedLoading) {
      const fetchUser = async () => {
        try {
          const res = await fetch('/api/auth', {
            method: 'GET',
            credentials: 'include',
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            cachedUser = data.user;
          } else {
            setUser(null);
            cachedUser = null;
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          setUser(null);
          cachedUser = null;
        } finally {
          setLoading(false);
          cachedLoading = false;
        }
      };

      fetchUser();
    }
  }, []);

  const signOut = async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
  
      if (res.ok) {
        setUser(null);
        cachedUser = null;
        router.push('/signin');
      } else {
        const data = await res.json();
        console.error('Failed to sign out:', data.error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, loading, signOut };
}
