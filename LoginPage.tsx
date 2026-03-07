import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMouseTracker } from '../components/MouseTracker';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { GlassCard } from '../components/GlassCard';

export function LoginPage() {
    const navigate = useNavigate();
    const { getBehavioralData, resetTracker, isInactive } = useMouseTracker();
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username_or_email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [mfaCode, setMfaCode] = useState('');

    useEffect(() => {
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
        if (mfaRequired && focusedField === 'mfaCode') {
            setMfaCode(prev => prev + key);
        } else {
            setFormData(prev => ({
                ...prev,
                [focusedField]: prev[focusedField as keyof typeof prev] + key
            }));
        }
    };

    const handleBackspace = () => {
        if (!focusedField) return;
        if (mfaRequired && focusedField === 'mfaCode') {
            setMfaCode(prev => prev.slice(0, -1));
        } else {
            setFormData(prev => ({
                ...prev,
                [focusedField]: prev[focusedField as keyof typeof prev].slice(0, -1)
            }));
        }
    };

    const handleClear = () => {
        if (!focusedField) return;
        if (mfaRequired && focusedField === 'mfaCode') {
            setMfaCode('');
        } else {
            setFormData(prev => ({
                ...prev,
                [focusedField]: ''
            }));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isInactive(60000)) {
            setError('No sufficient mouse activity was detected. Please retry and interact naturally using the mouse.');
            resetTracker();
            return;
        }

        setIsLoading(true);
        const behavioralData = getBehavioralData();

        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username_or_email: formData.username_or_email,
                    password: formData.password,
                    behavioral_data: behavioralData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || 'Login failed');
                resetTracker();
                return;
            }

            setScore(data.score);

            if (data.status === 'MFA_REQUIRED') {
                setMfaRequired(true);
                setFocusedField('mfaCode');
            } else if (data.status === 'SUCCESS') {
                localStorage.setItem('token', data.token);
                setTimeout(() => navigate('/'), 1500);
            }
        } catch (err) {
            setError('Server connection error. Ensure the backend is running on port 8000.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/verify-mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username_or_email,
                    code: mfaCode,
                    score: score
                })
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.detail || 'MFA failed');
                return;
            }
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
                    title="Secure Login"
                    description="Evaluating mouse dynamics against your biometric baseline."
                />

                <GlassCard className="p-6">
                    {score !== null && (
                        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-sm text-gray-400 mb-2">Biometric Score Match</div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${score > 80 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(score, 100)}%` }}
                                    />
                                </div>
                                <div className="font-bold text-lg">{score.toFixed(1)}%</div>
                            </div>
                            <div className="mt-2 text-xs font-medium uppercase tracking-wider">
                                {score > 80 ? (
                                    <span className="text-green-400">Trusted Behavior</span>
                                ) : score > 50 ? (
                                    <span className="text-yellow-400">Verification Required</span>
                                ) : (
                                    <span className="text-red-400">Suspicious Behavior</span>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 flex flex-col gap-1 text-red-200 text-sm">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <AlertTriangle className="w-4 h-4" /> Security Alert
                            </div>
                            {error}
                        </div>
                    )}

                    {!mfaRequired ? (
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400">Username or Email</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={formData.username_or_email}
                                    onClick={() => setFocusedField('username_or_email')}
                                    className={`px-4 py-2 rounded-lg bg-white/5 border outline-none cursor-pointer transition-colors ${focusedField === 'username_or_email' ? 'border-blue-500 bg-white/10 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                                    placeholder="Click here to use on-screen keyboard..."
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400">Password</label>
                                <input
                                    type="password"
                                    readOnly
                                    value={formData.password}
                                    onClick={() => setFocusedField('password')}
                                    className={`px-4 py-2 rounded-lg bg-white/5 border outline-none cursor-pointer transition-colors ${focusedField === 'password' ? 'border-blue-500 bg-white/10 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                                    placeholder="Click here to use on-screen keyboard..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full py-3 rounded-lg bg-blue-600/80 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Analyzing Behavior...' : 'Login Securely'}
                            </button>
                            <div className="text-center mt-2">
                                <span onClick={() => navigate('/register')} className="text-sm cursor-pointer hover:underline hover:text-blue-400 text-gray-400 transition-colors">Register a new profile</span>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleMfaVerify} className="flex flex-col gap-4">
                            <div className="text-sm text-yellow-200 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                                Medium trust score detected. Please enter the MFA code "123456" to proceed.
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400">6-digit MFA Code</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={mfaCode}
                                    onClick={() => setFocusedField('mfaCode')}
                                    className={`px-4 py-2 rounded-lg bg-white/5 border outline-none cursor-pointer text-center tracking-[0.5em] text-xl transition-colors ${focusedField === 'mfaCode' ? 'border-blue-500 bg-white/10 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                                    placeholder="······"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || mfaCode.length !== 6}
                                className="mt-4 w-full py-3 rounded-lg bg-green-600/80 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Verifying...' : 'Submit Mfa Code'}
                            </button>
                        </form>
                    )}
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
