import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) onClose();
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Removed document.body.style.overflow manipulation — on Android, changing
  // body overflow during a React render triggers a synchronous layout pass
  // that can move DOM nodes, causing "insertBefore: node not a child" errors.

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  // Portal: render into document.body to avoid inline reconciliation conflicts.
  // Without a portal, multiple Modal siblings inside the same parent (e.g.
  // PlayersPanel has 5 modals) could confuse React's fiber reconciler on mobile
  // when states change rapidly — only one modal is ever open at a time but all
  // share the same parent DOM node as their sibling rendered elements.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={onClose}
    >
      <div
        className={`${sizeClass} w-full card-dark rounded-xl animate-fadeIn max-h-[85vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-red-900/30">
          <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
