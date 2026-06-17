import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdminStatus(currentUser).then(() => {
        setLoading(false);
      });
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await checkAdminStatus(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }

    if (currentUser.email === 'cuongnt.aclw@gmail.com') {
      setIsAdmin(true);
      return;
    }

    try {
      let userIsAdmin = false;
      
      // Check roles table by email
      if (currentUser.email) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('is_admin')
          .eq('email', currentUser.email.toLowerCase().trim())
          .maybeSingle();
          
        if (!roleError && roleData?.is_admin) {
          userIsAdmin = true;
        }
      }

      // Check profiles table by id if not found in roles
      if (!userIsAdmin) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!profileError && profileData?.is_admin) {
          userIsAdmin = true;
        }
      }

      setIsAdmin(userIsAdmin);
    } catch (e) {
      console.error('Error fetching user privileges from Supabase:', e);
      setIsAdmin(false);
    }
  };

  return <AuthContext.Provider value={{ user, isAdmin, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
