  import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
  } from "react";
  import { authService } from "../services/authService";

  export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
  }

  interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (name: string, email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let active = true;

      async function restoreSession() {
        const token = authService.getToken();

        if (!token) {
          if (active) setIsLoading(false);
          return;
        }

        try {
          const currentUser = await authService.getMe();

          if (active) {
            setUser(currentUser);
          }
        } catch {
          authService.clearToken();

          if (active) {
            setUser(null);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      void restoreSession();

      return () => {
        active = false;
      };
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
      const response = await authService.login({ email, password });

      authService.saveToken(response.access_token);
      setUser(response.user);

      return response.user;
    };

    const register = async (
      name: string,
      email: string,
      password: string
    ): Promise<User> => {
      const response = await authService.register({
        name,
        email,
        password,
      });

      authService.saveToken(response.access_token);
      setUser(response.user);

      return response.user;
    };

    const logout = async (): Promise<void> => {
      try {
        await authService.logout();
      } finally {
        setUser(null);
      }
    };

    return (
      <AuthContext.Provider
        value={{
          user,
          isLoading,
          isAuthenticated: Boolean(user && authService.getToken()),
          login,
          register,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
      throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
  }
