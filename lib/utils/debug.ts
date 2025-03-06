// Debug utility functions

export const logAuthDetails = async () => {
  try {
    // Check for local storage data
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('timesheet'))) {
        keys.push({
          key,
          value: localStorage.getItem(key)?.substring(0, 20) + '...',
        });
      }
    }

    console.group('Auth Debug Information');
    console.log('Available auth-related local storage keys:', keys);
    
    // Check for cookies
    console.log('Document cookie string:', document.cookie);
    console.groupEnd();
    
    return { success: true, data: { keys, cookies: document.cookie } };
  } catch (error) {
    console.error('Error logging auth details:', error);
    return { success: false, error };
  }
};

export const getStorageItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return null;
  }
};

export const clearAuthData = () => {
  try {
    // Clear potential auth data from localStorage
    const authKeys = [
      'supabase.auth.token',
      'timesheet-session',
      'supabase-auth-token',
      'sb-auth-token'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Failed to remove ${key}`, e);
      }
    });
    
    console.log('Auth data cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
}; 