
import React, { useState } from 'react';
import { authService } from '../services/authService';
import {App_Name, App_Tag_Line} from "@/constants.ts";

interface AuthScreenProps {
    onLoginSuccess: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                setIsLoading(false);
                return;
            }
            const res = await authService.register(email, password);
            if (res.success) {
                setMessage(res.message);
                setMode('login');
            } else {
                setError(res.message);
            }
        } else {
            const res = await authService.login(email, password);
            if (res.success) {
                onLoginSuccess(email);
            } else {
                setError(res.message);
            }
        }
        setIsLoading(false);
    };

    const toggleMode = () => {
        setMode(prev => (prev === 'login' ? 'register' : 'login'));
        setError('');
        setMessage('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleLaunch = () => {
        setShowAuthModal(true);
    };

    const handleCloseModal = () => {
        setShowAuthModal(false);
        setError('');
        setMessage('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="w-full h-screen relative overflow-hidden">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/assets/RocketBackground.jpeg')`
                }}
            />
            
            {/* Content Overlay */}
            <div className="relative z-10 w-full h-full flex items-center">
                {/* Left Side - App Name and Tagline */}
                <div className="w-1/2 pl-16 text-white">
                    <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">
                        {App_Name}
                    </h1>
                    <p className="text-2xl font-semibold drop-shadow-lg">
                        Ready for Takeoff Acceleration?
                    </p>
                </div>
                
                {/* Right Side - Launch Button */}
                <div className="w-1/2 flex justify-center">
                    <button 
                        onClick={handleLaunch}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/20"
                    >
                        🚀 LAUNCH
                    </button>
                </div>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-8 relative">
                        <button 
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                        
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">{App_Name}</h2>
                        <p className="text-lg text-center text-gray-500 mb-8">{App_Tag_Line}</p>

                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">{error}</p>}
                        {message && <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm text-center">{message}</p>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {mode === 'register' && (
                                 <div>
                                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-600 mb-2">Confirm Password</label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                            <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-400">
                                {isLoading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Register')}
                            </button>
                        </form>
                        <p className="text-center text-sm text-gray-500 mt-6">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                            <button onClick={toggleMode} className="font-semibold text-blue-600 hover:underline ml-1">
                                {mode === 'login' ? 'Register here' : 'Log in here'}
                            </button>
                        </p>
                        <p className="text-xs text-gray-400 mt-8 text-center">
                            Note: For demonstration purposes, user data is stored locally in your browser and is not secured. Do not use real passwords.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
