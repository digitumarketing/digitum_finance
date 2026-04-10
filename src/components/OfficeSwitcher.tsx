import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Plus, Settings2, Check } from 'lucide-react';
import { useOfficeContext } from '../contexts/OfficeContext';

interface OfficeSwitcherProps {
  onManageOffices: () => void;
}

export const OfficeSwitcher: React.FC<OfficeSwitcherProps> = ({ onManageOffices }) => {
  const { offices, selectedOffice, switchOffice } = useOfficeContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (officeId: string) => {
    switchOffice(officeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group max-w-52"
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedOffice?.color || '#10b981' }}
        />
        <span className="text-sm font-semibold text-gray-800 truncate flex-1 text-left">
          {selectedOffice?.name || 'Select Office'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Office</p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {offices.map(office => (
              <button
                key={office.id}
                onClick={() => handleSwitch(office.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${selectedOffice?.id === office.id ? 'bg-gray-50' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${office.color}20` }}
                >
                  <Building2 className="w-4 h-4" style={{ color: office.color }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{office.name}</p>
                  {office.description && (
                    <p className="text-xs text-gray-400 truncate">{office.description}</p>
                  )}
                </div>
                {selectedOffice?.id === office.id && (
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { setIsOpen(false); onManageOffices(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-gray-400" />
              Manage Offices
            </button>
            <button
              onClick={() => { setIsOpen(false); onManageOffices(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-green-600 hover:bg-green-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Office
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
