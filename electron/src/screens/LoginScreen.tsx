import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '../App';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const electronAPI = (window as any)?.electronAPI;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors
    
    try {
      console.log('Electron login attempt:', { email: data.email });
      const xmlFileExists = electronAPI?.checkXMLFileExists
        ? await electronAPI.checkXMLFileExists()
        : { exists: false };
      console.log('XML file exists:', xmlFileExists);
      
      if (xmlFileExists.exists) {
        console.log('XML file found at:', xmlFileExists.path);
        
        // Validate credentials against XML file
        console.log('Validating against XML file...');
        console.log('Attempting login with:', { email: data.email, password: '***' });
        
        if (!electronAPI?.validateLoginXML) {
          console.warn('validateLoginXML unavailable - skipping offline login path');
        } else {
          const xmlValidation = await electronAPI.validateLoginXML({
            email: data.email,
            password: data.password
          });
          console.log('XML validation result:', xmlValidation);
          
          if (xmlValidation.isValid) {
            console.log('XML validation successful - allowing login');
            
            // Create user object for successful login
            const user: User = {
              email: data.email,
              role: "OPERATOR",
              locationId: xmlValidation.credentials.locationId || "2010"
            };
            
            onLogin(user);
            return;
          } else {
            console.log('XML validation failed:', xmlValidation.error);
            console.log('Blocking login due to invalid credentials');
            setErrorMessage(`Authentication failed: ${xmlValidation.error}`);
            return;
          }
        }
      }

      console.log('No usable XML file found - attempting online login');
      
      try {
        // Attempt online login
        const response = await fetch('http://localhost:3836/v1/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Online login successful:', result);
          
          const locationId = result.user?.locationId || "2010";
          
          // Save credentials to XML for future offline access
          if (electronAPI?.saveLoginXML) {
            console.log('Saving credentials to XML...');
            const saveResult = await electronAPI.saveLoginXML({
              email: data.email,
              password: data.password,
              locationId: locationId
            });
            
            if (saveResult.success) {
              console.log('Credentials saved successfully to:', saveResult.path);
            } else {
              console.warn('Failed to save credentials:', saveResult.error);
            }
          } else {
            console.log('Electron API unavailable - skipping credential persistence');
          }
          
          // Create user object
          const user: User = {
            email: data.email,
            role: result.user?.role || "OPERATOR",
            locationId: locationId
          };
          
          onLogin(user);
        } else {
          console.log('Online login failed:', response.status);
          setErrorMessage("Online login failed. Please check your credentials.");
        }
      } catch (apiError) {
        console.error('API login error:', apiError);
        setErrorMessage("Login failed. No local credentials found and online login failed.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center backgroundColor p-4 ">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
        <div className="space-y-1 pb-4 flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold text-center">
            Emergency Travel Document
          </h1>
          <p className="text-center text-gray-600">
            Sign in to your account to continue in
          </p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register("email")}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  form.formState.errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1 pb-8">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register("password")}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  form.formState.errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-3xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
