import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMouseTracker } from '../components/MouseTracker';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { GlassCard } from '../components/GlassCard';

export function RegistrationPage() {
    const navigate = useNavigate();
    const { getBehavioralData, resetTracker, isInactive } = useMouseTracker();
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Prevent physical keyboard entirely
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setError('Physical keyboard is disabled for security reasons. Please use the on-screen keyboard.');
            setTimeout(() => setError(''), 3000);
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    const handleKeyboardPress = (key: string) => {
        if (!focusedField) return;
        setFormData(prev => ({
            ...prev,
            [focusedField]: prev[focusedField as keyof typeof prev] + key
        }));
    };

    const handleBackspace = () => {
        if (!focusedField) return;
        setFormData(prev => ({
            ...prev,
            [focusedField]: prev[focusedField as keyof typeof prev].slice(0, -1)
        }));
    };

    const handleClear = () => {
        if (!focusedField) return;
        setFormData(prev => ({
            ...prev,
            [focusedField]: ''
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isInactive(60000)) {
            setError('No sufficient mouse activity was detected. Please retry and interact naturally using the mouse.');
            resetTracker();
            return;
        }

        if (formData.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/.test(formData.password)) {
            setError('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        const behavioralData = getBehavioralData();

        try {
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                    behavioral_data: behavioralData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || 'Registration failed');
                resetTracker();
                return;
            }

            // Success
            localStorage.setItem('token', data.token);
            navigate('/');
        } catch (err) {
            setError('Server connection error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex w-full pr-[500px]">
            <div className="container mx-auto px-4 py-8 max-w-lg w-full">
                <PageHeader
                    title="Secure Registration"
                    description="Your mouse behavior is recorded to establish a baseline biometric profile."
                />

                <GlassCard className="p-6">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 flex flex-col gap-1 text-red-200 text-sm">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <AlertTriangle className="w-4 h-4" /> Security Alert
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="flex flex-col gap-4">
                        {Object.entries({
                            name: 'Full Name',
                            email: 'Email',
                            username: 'Username',
                            password: 'Password',
                            confirmPassword: 'Confirm Password'
                        }).map(([field, label]) => (
                            <div key={field} className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400 capitalize">{label}</label>
                                <input
                                    type={field.includes('assword') ? 'password' : 'text'}
                                    readOnly
                                    value={formData[field as keyof typeof formData]}
                                    onClick={() => setFocusedField(field)}
                                    className={`px-4 py-2 rounded-lg bg-white/5 border outline-none cursor-pointer transition-colors ${focusedField === field ? 'border-blue-500 bg-white/10 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                                    placeholder={`Click here to use on-screen keyboard...`}
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? 'Processing Registration...' : 'Complete Secure Registration'}
                        </button>
                        <div className="text-center mt-2">
                            <span onClick={() => navigate('/login')} className="text-sm cursor-pointer hover:underline hover:text-blue-400 text-gray-400 transition-colors">Already have an account? Login</span>
                        </div>
                    </form>
                </GlassCard>
            </div>
            <VirtualKeyboard
                onKeyPress={handleKeyboardPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
            />
        </div>
    );
}
