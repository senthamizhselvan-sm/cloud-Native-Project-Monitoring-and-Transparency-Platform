import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, feedbackApi } from '../../services/api';

interface SearchItem {
  id: string;
  type: 'project' | 'complaint' | 'action' | 'district';
  title: string;
  subtitle: string;
  route: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [filtered, setFiltered] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Predefined actions
  const actionItems: SearchItem[] = [
    { id: 'act-state', type: 'action', title: 'Open Executive State Overview', subtitle: 'View statewide infrastructure indicators and statistics', route: '/' },
    { id: 'act-dist', type: 'action', title: 'Open District Intelligence', subtitle: 'Detailed geographic telemetry, graphs, and performance metrics', route: '/dashboard/district-intelligence' },
    { id: 'act-proj', type: 'action', title: 'View All Projects Directory', subtitle: 'Search and inspect all ongoing and planned public works', route: '/projects' },
    { id: 'act-anal', type: 'action', title: 'Open Budget Analytics Console', subtitle: 'Interactive charts, spending curves, and allocations maps', route: '/analytics' },
    { id: 'act-ai', type: 'action', title: 'Go to AI Operations Center', subtitle: 'Predictive risk rankings, delay durations, and summaries', route: '/dashboard/ai-center' },
    { id: 'act-oper', type: 'action', title: 'View Operations Control Center', subtitle: 'Real-time alert queues, logs, and live notification hubs', route: '/dashboard/operations' },
    { id: 'act-feed', type: 'action', title: 'Manage Citizen Grievances', subtitle: 'Review and assign inspectors to reported safety/quality defects', route: '/feedback/manage' },
  ];

  // Disticts quick navigation
  const districtItems: SearchItem[] = [
    { id: 'dist-salem', type: 'district', title: 'Salem District Intelligence', subtitle: 'View active projects and spending graphs in Salem', route: '/dashboard/district-intelligence?district=Salem' },
    { id: 'dist-chennai', type: 'district', title: 'Chennai District Intelligence', subtitle: 'View active projects and spending graphs in Chennai', route: '/dashboard/district-intelligence?district=Chennai' },
    { id: 'dist-trichy', type: 'district', title: 'Trichy District Intelligence', subtitle: 'View active projects and spending graphs in Trichy', route: '/dashboard/district-intelligence?district=Trichy' },
    { id: 'dist-madurai', type: 'district', title: 'Madurai District Intelligence', subtitle: 'View active projects and spending graphs in Madurai', route: '/dashboard/district-intelligence?district=Madurai' },
  ];

  // Fetch indexable projects/complaints when logged in and palette is opened
  async function loadIndexData() {
    if (!localStorage.getItem('access_token')) return;
    try {
      setLoading(true);
      const [projRes, feedRes] = await Promise.all([
        projectApi.get('/projects').catch(() => ({ data: [] })),
        feedbackApi.get('/feedback').catch(() => ({ data: [] }))
      ]);

      const projects: SearchItem[] = projRes.data.map((p: any) => ({
        id: `proj-${p.id}`,
        type: 'project',
        title: p.name,
        subtitle: `${p.department} • ${p.location} District • Progress: ${p.completion}%`,
        route: `/projects/${p.id}`
      }));

      const complaints: SearchItem[] = feedRes.data.map((f: any) => ({
        id: `feed-${f.id}`,
        type: 'complaint',
        title: `Grievance: ${f.issue_type}`,
        subtitle: `Reported by ${f.citizen_name} • Severity: ${f.severity || 'Low'} • Status: ${f.status}`,
        route: `/projects/${f.project_id || ''}`
      }));

      setItems([...actionItems, ...districtItems, ...projects, ...complaints]);
    } catch (err) {
      console.warn("Failed to load search indexes in command palette", err);
      setItems([...actionItems, ...districtItems]);
    } finally {
      setLoading(false);
    }
  }

  // Bind keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch items when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      loadIndexData();
      // Auto focus search field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Dynamic filtering
  useEffect(() => {
    if (!search) {
      // Show actions and districts by default
      setFiltered([...actionItems, ...districtItems]);
      return;
    }
    const query = search.toLowerCase();
    const matches = items.filter(
      (it) =>
        it.title.toLowerCase().includes(query) ||
        it.subtitle.toLowerCase().includes(query)
    );
    setFiltered(matches);
    setSelectedIndex(0);
  }, [search, items]);

  // Handle key select options
  const handleItemSelect = (item: SearchItem) => {
    setIsOpen(false);
    navigate(item.route);
    // Trigger location reload if navigating to same path with diff query
    if (item.route.includes('?')) {
      window.location.href = item.route;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleItemSelect(filtered[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 font-sans animate-fade-in">
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[480px] transform scale-100 transition-all duration-200"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100 py-3 bg-slate-50/50">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, complaints, districts, or actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-slate-800 text-sm placeholder-slate-400"
          />
          <kbd className="text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono text-slate-400 select-none">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="flex-grow overflow-y-auto p-2 divide-y divide-slate-50">
          {loading && filtered.length === 0 ? (
            <div className="flex justify-center items-center py-12 gap-2 text-xs text-slate-450 font-bold">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Scanning index registry...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 font-semibold">
              No matching workspace actions or items found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className={`p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-blue-50 text-blue-900 border border-blue-100' : 'bg-transparent text-slate-700 hover:bg-slate-50/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Item icon based on type */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'project' ? 'bg-blue-100/50 text-blue-600' :
                      item.type === 'complaint' ? 'bg-amber-100/50 text-amber-600' :
                      item.type === 'district' ? 'bg-indigo-100/50 text-indigo-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.type === 'project' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3m0 18a9.005 9.005 0 0 0 8.716-11.253" />
                        </svg>
                      )}
                      {item.type === 'complaint' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                      )}
                      {item.type === 'district' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      )}
                      {item.type === 'action' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                        </svg>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{item.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Navigate
                      <kbd className="font-mono text-[8px] bg-white border border-slate-200 px-1 rounded">↵</kbd>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex justify-between items-center text-[9px] text-slate-400 font-mono font-semibold select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigation</span>
            <span>↵ Select</span>
          </div>
          <span>Gov Monitor Keyboard Search System</span>
        </div>
      </div>
    </div>
  );
}
