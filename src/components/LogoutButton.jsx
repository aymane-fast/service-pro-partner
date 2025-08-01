'use client';

import { authService } from '../api/auth';

export default function LogoutButton({ className = '' }) {
    const handleLogout = () => {
        authService.logout();
    };

    return (
        <button
            onClick={handleLogout}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${className}`}
        >
            Logout
        </button>
    );
}
