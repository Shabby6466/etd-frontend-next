import React from 'react';
import { User } from '../App';

interface HomeScreenProps {
  user: User | null;
  onLogout: () => void;
  onNavigateToDataInput: () => void;
  onNavigateToUpload: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onLogout,
  onNavigateToDataInput,
  onNavigateToUpload,
}) => {
  return (
    <div className="min-h-screen dashboardBackgroundColor flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 space-y-8">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Welcome back</p>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Travel Document</h1>
          <p className="text-gray-600">
            {user ? `Signed in as ${user.email}` : 'Signed in'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="p-6 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-colors text-left"
            onClick={onNavigateToDataInput}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Application</h2>
            <p className="text-gray-600 text-sm">
              Gather citizen data, capture biometrics, and save a new offline application.
            </p>
          </button>

          <button
            className="p-6 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-colors text-left"
            onClick={onNavigateToUpload}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Pending</h2>
            <p className="text-gray-600 text-sm">
              Review locally saved applications and sync them to the central server.
            </p>
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onLogout}
            className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

