
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
    const [showAuthForm, setShowAuthForm] = useState(false);

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

    if (showAuthForm) {
        return (
            <div className="w-full h-screen bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center p-4">
                <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{App_Name}</h1>
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
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
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        )}
                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold text-lg hover:bg-teal-700 transition-all shadow-md disabled:bg-gray-400">
                            {isLoading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Register')}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-6">
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={toggleMode} className="font-semibold text-teal-600 hover:underline ml-1">
                            {mode === 'login' ? 'Register here' : 'Log in here'}
                        </button>
                    </p>
                    <button 
                        onClick={() => setShowAuthForm(false)} 
                        className="text-center text-sm text-gray-500 mt-4 hover:text-teal-600"
                    >
                        ← Back to landing page
                    </button>
                    <p className="text-xs text-gray-400 mt-8 text-center">
                        Note: For demonstration purposes, user data is stored locally in your browser and is not secured. Do not use real passwords.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400 relative overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-700 rounded-full opacity-20 -translate-y-48 translate-x-48"></div>
            
            {/* Navigation */}
            <nav className="absolute top-8 right-8 flex space-x-8 text-teal-900 font-medium">
                <a href="#" className="hover:text-white transition-colors">ABOUT US</a>
                <a href="#" className="hover:text-white transition-colors">LIVE PROJECTS</a>
                <a href="#" className="hover:text-white transition-colors">TEAMS</a>
                <a href="#" className="hover:text-white transition-colors">JOBS</a>
                <a href="#" className="hover:text-white transition-colors">CONTACT</a>
            </nav>

            <div className="flex h-full">
                {/* Left side - Rocket and clouds */}
                <div className="flex-1 flex items-end justify-center relative">
                    {/* Clouds */}
                    <div className="absolute bottom-0 left-0 w-full h-48">
                        <div className="absolute bottom-0 left-8 w-32 h-24 bg-white rounded-full opacity-80"></div>
                        <div className="absolute bottom-4 left-16 w-24 h-16 bg-white rounded-full opacity-60"></div>
                        <div className="absolute bottom-8 left-4 w-20 h-12 bg-white rounded-full opacity-70"></div>
                        <div className="absolute bottom-2 left-32 w-28 h-20 bg-white rounded-full opacity-50"></div>
                        <div className="absolute bottom-6 left-48 w-20 h-14 bg-white rounded-full opacity-80"></div>
                    </div>
                    
                    {/* Rocket */}
                    <div className="relative z-10 mb-16 transform -rotate-12">
                        {/* Rocket body */}
                        <div className="w-16 h-32 bg-white rounded-t-full relative">
                            {/* Nose cone */}
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-teal-900"></div>
                            
                            {/* Windows */}
                            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-teal-200 rounded-full border-2 border-teal-900"></div>
                            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-teal-200 rounded-full border border-teal-900"></div>
                            
                            {/* Red band */}
                            <div className="absolute top-24 left-0 w-full h-2 bg-red-500"></div>
                            
                            {/* Front fin */}
                            <div className="absolute top-28 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-teal-200"></div>
                            
                            {/* Side fins */}
                            <div className="absolute top-20 -left-2 w-0 h-0 border-t-8 border-r-8 border-b-8 border-transparent border-r-teal-900"></div>
                            <div className="absolute top-20 -right-2 w-0 h-0 border-t-8 border-l-8 border-b-8 border-transparent border-l-teal-900"></div>
                        </div>
                        
                        {/* Exhaust plume */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-12 border-r-12 border-t-16 border-transparent border-t-white opacity-60"></div>
                    </div>
                </div>

                {/* Right side - Content */}
                <div className="flex-1 flex flex-col justify-center px-16">
                    <h1 className="text-5xl font-bold text-teal-900 mb-6 leading-tight">
                        BOOST YOUR<br />BUSINESS
                    </h1>
                    
                    <p className="text-lg text-teal-800 mb-8 leading-relaxed max-w-md">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    
                    <button 
                        onClick={() => setShowAuthForm(true)}
                        className="bg-teal-900 text-teal-100 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-teal-800 transition-all shadow-lg w-fit"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};
