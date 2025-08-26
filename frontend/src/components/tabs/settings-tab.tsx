'use client';

import { useState } from 'react';
import { 
  User, 
  Camera, 
  Bell, 
  Database,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

interface SettingsTabProps {
  onLogout?: () => void;
}

export function SettingsTab({ onLogout }: SettingsTabProps) {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'data' | 'notifications'>('profile');

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-secondary">Not authenticated</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header with Logout Button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center overflow-hidden">
            <Logo size="sm" variant="black" />
          </div>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
        </div>
        <Button
          onClick={handleLogout}
          className="bg-accent hover:bg-accent/90 text-black font-medium px-4 py-2"
        >
          Logout
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border bg-black">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'profile'
              ? "text-white border-accent"
              : "text-secondary border-transparent hover:text-white"
          )}
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={cn(
            "flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'data'
              ? "text-white border-accent"
              : "text-secondary border-transparent hover:text-white"
          )}
        >
          <Database className="w-4 h-4 mr-2" />
          Data
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={cn(
            "flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'notifications'
              ? "text-white border-accent"
              : "text-secondary border-transparent hover:text-white"
          )}
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'profile' && <ProfileTab user={user} />}
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || 'Tafar',
    bio: user.bio || 'A.k.a the app Owner',
    status: user.status || 'away',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = () => {
    // TODO: Implement profile update
    console.log('Updating profile:', formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Edit Profile Card */}
      <div className="bg-secondary/10 border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-6">Edit Profile</h2>
        
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden border-4 border-accent">
              {/* Placeholder anime-style avatar */}
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                  <Logo size="lg" variant="default" />
                </div>
              </div>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors shadow-lg">
              <Camera className="w-4 h-4 text-black" />
            </button>
          </div>
          <p className="text-accent text-sm mt-3 font-medium">Click to upload profile picture</p>
          <p className="text-secondary text-xs mt-1">Max 5MB • JPG, PNG, GIF, WebP</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-accent text-sm font-medium mb-2">
              Display Name
            </label>
            <Input
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="bg-secondary/20 border-secondary/30 text-white"
              placeholder="Enter your display name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-accent text-sm font-medium mb-2">
              Bio ({formData.bio.length}/150)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              maxLength={150}
              rows={3}
              className="w-full p-3 bg-secondary/20 border border-secondary/30 rounded-lg text-white placeholder-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Tell people about yourself..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-accent text-sm font-medium mb-2">
              Status
            </label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-3 bg-secondary/20 border border-secondary/30 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="online">🟢 Online</option>
                <option value="away">🟡 Away</option>
                <option value="busy">🔴 Busy</option>
                <option value="invisible">⚫ Invisible</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-accent text-sm font-medium mb-2">
              Email
            </label>
            <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
              <p className="text-secondary">{user.email || 'greetmessap@gmail.com'}</p>
              <p className="text-xs text-secondary mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Update Button */}
          <Button
            onClick={handleUpdateProfile}
            className="w-full bg-accent hover:bg-accent/90 text-black font-medium py-3 mt-6"
          >
            Update Profile
          </Button>
        </div>
      </div>

      {/* Profile Preview Card */}
      <div className="bg-secondary/10 border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Profile Preview</h2>
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                <Logo size="md" variant="default" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{formData.displayName}</h3>
            <p className="text-secondary">{formData.bio}</p>
            <div className="flex items-center mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                formData.status === 'online' ? 'bg-green-500' :
                formData.status === 'away' ? 'bg-accent' :
                formData.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
              )}></div>
              <span className="text-accent text-sm capitalize">{formData.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Data Tab Component
function DataTab() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-secondary/10 border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Data & Storage</h2>
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-secondary mx-auto mb-4" />
          <p className="text-secondary">Data settings coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Notifications Tab Component
function NotificationsTab() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-secondary/10 border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Notifications</h2>
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-secondary mx-auto mb-4" />
          <p className="text-secondary">Notification settings coming soon</p>
        </div>
      </div>
    </div>
  );
}
