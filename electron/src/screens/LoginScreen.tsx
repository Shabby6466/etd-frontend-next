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
      
      // Check if XML file exists
      const xmlFileExists = await (window as any).electronAPI.checkXMLFileExists();
      console.log('XML file exists:', xmlFileExists);
      
      if (!xmlFileExists.exists) {
        console.log('No XML file found - blocking login');
        setErrorMessage("No authentication file found. Please contact administrator to set up your credentials.");
        return;
      }
      
      console.log('XML file found at:', xmlFileExists.path);
      
      // Validate credentials against XML file
      console.log('Validating against XML file...');
      console.log('Attempting login with:', { email: data.email, password: '***' });
      
      const xmlValidation = await (window as any).electronAPI.validateLoginXML({
        email: data.email,
        password: data.password
      });
      console.log('XML validation result:', xmlValidation);
      
      if (xmlValidation.isValid) {
        console.log('XML validation successful - allowing login');
        
        // Create user object for successful login
        const user: User = {
          email: data.email,
          role: "OPERATOR"
        };
        
        onLogin(user);
      } else {
        console.log('XML validation failed:', xmlValidation.error);
        console.log('Blocking login due to invalid credentials');
        setErrorMessage(`Authentication failed: ${xmlValidation.error}`);
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
