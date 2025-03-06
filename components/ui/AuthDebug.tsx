'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { supabase } from '@/lib/supabase/client';
import { logAuthDetails, clearAuthData } from '@/lib/utils/debug';

export const AuthDebug = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cookies, setCookies] = useState('');
  const [storageKeys, setStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUserInfo({
          id: session.user.id,
          email: session.user.email,
          token: session.access_token.substring(0, 10) + '...',
          role: session.user.role,
          expires: new Date(session.expires_at! * 1000).toLocaleString(),
        });
      } else {
        setUserInfo(null);
      }

      // Get cookie information
      setCookies(document.cookie);

      // Get auth-related localStorage keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keys.push(key);
        }
      }
      setStorageKeys(keys);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const handleClearAuth = async () => {
    clearAuthData();
    await supabase.auth.signOut();
    await checkAuth();
    window.location.href = '/signin';
  };

  return (
    <Card className="w-full bg-red-50 border-red-200">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Auth Debug Info</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 text-xs"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <>
          <CardContent className="p-3 pt-0 text-xs">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">User Status:</h3>
                {userInfo ? (
                  <pre className="bg-white p-2 rounded overflow-auto max-h-28">
                    {JSON.stringify(userInfo, null, 2)}
                  </pre>
                ) : (
                  <div className="bg-red-100 p-2 rounded">Not authenticated</div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Cookies:</h3>
                <pre className="bg-white p-2 rounded overflow-auto max-h-28">{cookies || 'No cookies'}</pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Local Storage Auth Keys:</h3>
                <pre className="bg-white p-2 rounded overflow-auto max-h-28">
                  {storageKeys.length ? storageKeys.join('\n') : 'No auth keys found'}
                </pre>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="p-3 pt-0">
            <div className="flex gap-2">
              <Button size="sm" onClick={checkAuth}>Refresh</Button>
              <Button size="sm" variant="destructive" onClick={handleClearAuth}>Clear & Logout</Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

// Default export for dynamic import compatibility
export default AuthDebug; 