import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export function NotificationBell() {
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Bem-vindo ao novo Dashboard!', time: 'Agora mesmo' },
        { id: 2, title: 'Novo versículo disponível', time: 'Há 2 horas' },
    ]);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5 text-text-secondary" />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 
            bg-red-500 text-white text-xs rounded-full 
            flex items-center justify-center">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white 
          rounded-xl shadow-lg border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-text-primary uppercase tracking-wider text-xs">Notificações</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif.id} className="p-4 hover:bg-gray-50 
                  border-b border-gray-100 last:border-0 transition-colors">
                                    <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                                    <p className="text-xs text-text-secondary mt-1">{notif.time}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-text-secondary text-sm">
                                Nenhuma notificação por enquanto.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
