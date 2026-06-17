import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isStaff: boolean;
  roleLevel: 'admin' | 'editor' | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, isStaff: false, roleLevel: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [roleLevel, setRoleLevel] = useState<'admin' | 'editor' | null>(null);
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
      setIsStaff(false);
      setRoleLevel(null);
      return;
    }

    if (currentUser.email === 'cuongnt.aclw@gmail.com') {
      setIsAdmin(true);
      setIsStaff(true);
      setRoleLevel('admin');
      return;
    }

    try {
      let userIsAdmin = false;
      let userIsStaff = false;
      let level: 'admin' | 'editor' | null = null;
      
      // Check roles table by email
      if (currentUser.email) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('is_admin')
          .eq('email', currentUser.email.toLowerCase().trim())
          .maybeSingle();
          
        if (!roleError && roleData) {
          userIsStaff = true;
          userIsAdmin = !!roleData.is_admin;
          level = roleData.is_admin ? 'admin' : 'editor';
        }
      }

      // Check profiles table by id if not found in roles
      if (!userIsStaff) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!profileError && profileData?.is_admin) {
          userIsStaff = true;
          userIsAdmin = true;
          level = 'admin';
        }
      }

      setIsStaff(userIsStaff);
      setIsAdmin(userIsAdmin);
      setRoleLevel(level);
    } catch (e) {
      console.error('Error fetching user privileges from Supabase:', e);
      setIsStaff(false);
      setIsAdmin(false);
      setRoleLevel(null);
    }
  };

  return <AuthContext.Provider value={{ user, isAdmin, isStaff, roleLevel, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
