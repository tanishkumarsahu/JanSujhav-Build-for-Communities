import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CitizenSubmissionForm from './components/CitizenSubmissionForm.jsx';
import WhatsAppSimulation from './components/WhatsAppSimulation.jsx';
import MPDashboard from './components/MPDashboard.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import ProposalRanking from './components/ProposalRanking.jsx';
import useLocation from './hooks/useLocation.js';
import { put, setToken, clearToken, getToken } from './utils/api.js';
import LandingPage from './components/LandingPage.jsx';
import AuthForm from './components/AuthForm.jsx';
import SettingsPage from './components/SettingsPage.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─── Proposal Ranking Page ────────────────────────────────────────────────────
function ProposalRankingPage({ constituency }) {
    return (
        <div className="max-w-7xl mx-auto px-5 py-6">
            <ProposalRanking constituency={constituency} />
        </div>
    );
}

// ─── App (root) ───────────────────────────────────────────────────────────────
function AppContent() {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('pp_user');
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            if (parsed && parsed.success && parsed.data?.user) {
                return parsed.data.user;
            }
            return parsed;
        } catch {
            return null;
        }
    });
    const [token] = useState(() => getToken());

    const navigate = useNavigate();
    const location = useRouteLocation();
    const { constituency, setConstituency } = useLocation();

    // Self-healing migration for old localStorage wrappers
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('pp_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed.success && parsed.data?.user) {
                    localStorage.setItem('pp_user', JSON.stringify(parsed.data.user));
                    setUser(parsed.data.user);
                    if (parsed.data.token) {
                        setToken(parsed.data.token);
                    }
                }
            }
        } catch (e) {
            console.error('[Auth] Storage self-healing failed:', e.message);
        }
    }, []);

    // If user profile has a saved constituency, sync it globally on mount/login
    useEffect(() => {
        if (user?.constituency && user.constituency !== constituency) {
            setConstituency(user.constituency);
        }
    }, [user, constituency, setConstituency]);

    const handleAuthSuccess = useCallback((userData, authToken) => {
        setUser(userData);
        localStorage.setItem('pp_user', JSON.stringify(userData));
        if (authToken) setToken(authToken);
        if (userData?.constituency) {
            setConstituency(userData.constituency);
        }
        const nextPath = userData?.role === 'mp' ? '/mp-dashboard' : '/citizen';
        navigate(nextPath);
    }, [navigate, setConstituency]);

    const handleLogout = useCallback(() => {
        setUser(null);
        clearToken();
        localStorage.removeItem('pp_user');
        navigate('/');
    }, [navigate]);

    const handleNavigate = useCallback((targetView) => {
        const viewToRoute = {
            'landing': '/',
            'login': '/login',
            'register': '/register',
            'citizen': '/citizen',
            'whatsapp': '/whatsapp',
            'mp-dashboard': '/mp-dashboard',
            'news': '/news',
            'proposals': '/proposals',
            'settings': '/settings'
        };
        navigate(viewToRoute[targetView] || '/');
    }, [navigate]);

    const handleConstituencyChange = useCallback(async (newVal) => {
        if (!newVal) return;
        setConstituency(newVal);

        if (user) {
            try {
                await put('/api/auth/me/constituency', { constituency: newVal });
                const updatedUser = { ...user, constituency: newVal };
                setUser(updatedUser);
                localStorage.setItem('pp_user', JSON.stringify(updatedUser));
            } catch (err) {
                console.error('Failed to sync constituency override to user profile:', err.message);
            }
        }
    }, [user, setConstituency]);

    const getActiveView = () => {
        const path = location.pathname;
        if (path === '/') return 'landing';
        if (path === '/login') return 'login';
        if (path === '/register') return 'register';
        if (path === '/citizen') return 'citizen';
        if (path === '/whatsapp') return 'whatsapp';
        if (path === '/mp-dashboard') return 'mp-dashboard';
        if (path === '/news') return 'news';
        if (path === '/proposals') return 'proposals';
        if (path === '/settings') return 'settings';
        return 'landing';
    };
    const currentView = getActiveView();

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                currentView={currentView}
            />
            <main>
                <Routes>
                    <Route path="/" element={<LandingPage onNavigate={handleNavigate} constituency={constituency} />} />
                    <Route path="/login" element={<AuthForm mode="login" onSuccess={handleAuthSuccess} onSwitch={() => navigate('/register')} />} />
                    <Route path="/register" element={<AuthForm mode="register" onSuccess={handleAuthSuccess} onSwitch={() => navigate('/login')} />} />
                    <Route path="/citizen" element={<CitizenSubmissionForm constituency={constituency} setConstituency={handleConstituencyChange} />} />
                    <Route path="/whatsapp" element={<WhatsAppSimulation constituency={constituency} />} />
                    <Route path="/proposals" element={<ProposalRankingPage constituency={constituency} />} />
                    <Route path="/mp-dashboard" element={
                        user && user.role === 'mp' ? (
                            <MPDashboard constituency={constituency} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } />
                    <Route path="/news" element={<NewsFeed constituency={constituency} setConstituency={handleConstituencyChange} />} />
                    <Route path="/settings" element={
                        user ? (
                            <SettingsPage
                                user={user}
                                onLogout={handleLogout}
                                onUpdateUser={(updated) => {
                                    setUser(updated);
                                    localStorage.setItem('pp_user', JSON.stringify(updated));
                                }}
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    // Load Google Identity Services script
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;
        if (document.querySelector('script[src*="accounts.google.com"]')) return;
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, []);

    return (
        <Router>
            <AppContent />
        </Router>
    );
}
