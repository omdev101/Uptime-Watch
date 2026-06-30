import { useState, useEffect, useRef } from 'react'

interface PingResult {
  id: number
  status_code: number
  response_time_ms: number
  created_at: string
  response_body?: string
  response_headers?: any
}

interface Endpoint {
  id: number
  name: string
  url: string
  http_method: string
  expected_status: number
  environment: string
  custom_headers: any
  ping_results: PingResult[]
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

function Sparkline({ data, isUp }: { data: number[], isUp: boolean }) {
  if (data.length < 2) return (
    <div className="h-20 w-full flex items-center justify-center text-[11px] uppercase tracking-widest text-zinc-500/50 font-medium border-t border-zinc-100 dark:border-zinc-800/50 mt-4">
      Awaiting telemetry...
    </div>
  );
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 1000;
  const height = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');
  const polygonPoints = `0,${height} ${polylinePoints} ${width},${height}`;
  
  const colorCode = isUp ? "#10b981" : "#ef4444";
  
  return (
    <div className="w-full h-20 mt-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-2 relative group">
      <div className="absolute top-2 left-0 text-[10px] font-mono text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity">{max}ms</div>
      <div className="absolute bottom-0 left-0 text-[10px] font-mono text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity">{min}ms</div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`gradient-${isUp}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colorCode} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colorCode} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={polygonPoints} fill={`url(#gradient-${isUp})`} />
        <polyline points={polylinePoints} fill="none" stroke={colorCode} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100 transition-opacity" />
      </svg>
    </div>
  );
}

function JsonViewer({ jsonString }: { jsonString: string }) {
  try {
    const parsed = JSON.parse(jsonString);
    const formatted = JSON.stringify(parsed, null, 2);
    
    // Simple regex-based syntax highlighting for JSON
    const highlighted = formatted.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let color = 'text-blue-500 dark:text-blue-400'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            color = 'text-pink-500 dark:text-pink-400 font-semibold'; // key
          } else {
            color = 'text-green-600 dark:text-green-400'; // string
          }
        } else if (/true|false/.test(match)) {
          color = 'text-amber-500 dark:text-amber-400'; // boolean
        } else if (/null/.test(match)) {
          color = 'text-zinc-500 dark:text-zinc-500'; // null
        }
        return `<span class="${color}">${match}</span>`;
      }
    );

    return <pre className="text-[11px] font-mono whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: highlighted }} />;
  } catch (e) {
    return <pre className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-words">{jsonString}</pre>;
  }
}

function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  // Form State
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [httpMethod, setHttpMethod] = useState('GET')
  const [expectedStatus, setExpectedStatus] = useState('200')
  const [environment, setEnvironment] = useState('Production')
  const [customHeaders, setCustomHeaders] = useState('{\n  \n}')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // UI State
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'system' | 'light' | 'dark') || 'system'
  })
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // Filter State
  const [filterEnv, setFilterEnv] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  
  // Command Palette
  const [cmdKOpen, setCmdKOpen] = useState(false)
  const [cmdSearch, setCmdSearch] = useState('')
  const cmdInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdKOpen(prev => !prev)
      }
      if (e.key === 'Escape' && cmdKOpen) {
        setCmdKOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cmdKOpen])

  useEffect(() => {
    if (cmdKOpen && cmdInputRef.current) {
      cmdInputRef.current.focus()
    } else {
      setCmdSearch('')
    }
  }, [cmdKOpen])

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const fetchEndpoints = async () => {
    try {
      const res = await fetch(`${API_URL}/endpoints`)
      const data = await res.json()
      setEndpoints(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchEndpoints()
    const interval = setInterval(fetchEndpoints, 5000)
    return () => clearInterval(interval)
  }, [])

  const addEndpoint = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let parsedHeaders = {}
    if (customHeaders.trim() !== '' && customHeaders.trim() !== '{\n  \n}') {
      try {
        parsedHeaders = JSON.parse(customHeaders)
      } catch(err) {
        addToast("Invalid JSON in Custom Headers field", "error")
        return
      }
    }

    try {
      await fetch(`${API_URL}/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          endpoint: { 
            name, 
            url, 
            http_method: httpMethod,
            expected_status: parseInt(expectedStatus, 10),
            environment,
            custom_headers: parsedHeaders
          } 
        })
      })
      
      addToast(`Added target: ${name}`, "success")
      setName('')
      setUrl('')
      setHttpMethod('GET')
      setExpectedStatus('200')
      setEnvironment('Production')
      setCustomHeaders('{\n  \n}')
      setShowAdvanced(false)
      setCmdKOpen(false)
      fetchEndpoints()
    } catch (err) {
      addToast("Failed to add target", "error")
    }
  }

  const deleteEndpoint = async (id: number, endpointName: string) => {
    try {
      await fetch(`${API_URL}/endpoints/${id}`, { method: 'DELETE' })
      addToast(`Deleted target: ${endpointName}`, "info")
      fetchEndpoints()
    } catch (err) {
      addToast("Failed to delete target", "error")
    }
  }

  const totalEndpoints = endpoints.length;
  let totalPings = 0;
  let totalUp = 0;
  let totalLatency = 0;

  endpoints.forEach(ep => {
    ep.ping_results.forEach(ping => {
      totalPings++;
      const isPingUp = ping.status_code === (ep.expected_status || 200)
      if (isPingUp) totalUp++;
      totalLatency += ping.response_time_ms;
    });
  });

  const globalUptime = totalPings > 0 ? ((totalUp / totalPings) * 100).toFixed(2) : '100.00';
  const avgLatency = totalPings > 0 ? Math.round(totalLatency / totalPings) : 0;

  const methodColors: Record<string, string> = {
    GET: 'text-blue-500',
    POST: 'text-emerald-500',
    PUT: 'text-amber-500',
    DELETE: 'text-red-500',
  }

  const envColors: Record<string, string> = {
    Production: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:bg-fuchsia-500/20 dark:text-fuchsia-400',
    Staging: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400',
    Development: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400',
  }

  // Filter Logic
  const filteredEndpoints = endpoints.filter(ep => {
    const latestPing = ep.ping_results[ep.ping_results.length - 1]
    const expected = ep.expected_status || 200
    const isUp = latestPing ? latestPing.status_code === expected : false

    if (filterEnv !== 'All' && ep.environment !== filterEnv) return false;
    
    if (filterStatus === 'Outage') {
      // If it doesn't have a ping yet, it's not an outage. If it is UP, it's not an outage.
      if (!latestPing || isUp) return false;
    }
    if (filterStatus === 'Operational') {
      // If it doesn't have a ping yet, or it is DOWN, it's not operational.
      if (!latestPing || !isUp) return false;
    }
    
    if (cmdSearch.trim() !== '') {
      const s = cmdSearch.toLowerCase();
      if (!ep.name.toLowerCase().includes(s) && !ep.url.toLowerCase().includes(s)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-zinc-900 dark:text-[#ededed] p-4 sm:p-8 font-sans selection:bg-blue-500/30">
      
      {/* Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className="animate-in slide-in-from-right-8 fade-in duration-300 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg p-4 flex items-center gap-3 min-w-[300px]">
            {toast.type === 'success' && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
            {toast.type === 'error' && <div className="h-2 w-2 rounded-full bg-red-500" />}
            {toast.type === 'info' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Command Palette Overlay */}
      {cmdKOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm px-4" onClick={() => setCmdKOpen(false)}>
          <div className="bg-white dark:bg-[#111] w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input 
                ref={cmdInputRef}
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                placeholder="Search endpoints by name or url..."
                className="w-full bg-transparent border-none outline-none px-3 py-1 text-sm font-medium placeholder-zinc-400"
              />
              <div className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">ESC</div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredEndpoints.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Results</div>
                  {filteredEndpoints.map(ep => (
                    <button key={ep.id} onClick={() => { setCmdKOpen(false); setExpandedEndpoint(ep.id) }} className="w-full flex items-center justify-between p-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left group">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase ${methodColors[ep.http_method || 'GET']}`}>{ep.http_method || 'GET'}</span>
                        <span className="text-sm font-medium group-hover:text-blue-500 transition-colors">{ep.name}</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">{ep.url}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-sm">No endpoints found matching "{cmdSearch}"</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-12 min-h-[calc(100vh-4rem)] flex flex-col">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900 dark:text-white"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h1 className="text-xl font-semibold tracking-tight">Uptime Watch</h1>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-6 text-zinc-500 dark:text-zinc-400">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Uptime</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{globalUptime}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Latency</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{avgLatency}ms</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Targets</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{totalEndpoints}</span>
              </div>
            </div>

            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800/60 hidden sm:block"></div>
            
            <div className="flex gap-2">
              <button onClick={() => setCmdKOpen(true)} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Search
                <span className="font-mono text-[9px] bg-white dark:bg-black px-1 rounded border border-zinc-200 dark:border-zinc-700 ml-1">⌘K</span>
              </button>

              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md border border-zinc-200 dark:border-zinc-800 hidden sm:flex">
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded transition-all ${theme === 'light' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </button>
                <button onClick={() => setTheme('system')} className={`p-1.5 rounded transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                </button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded transition-all ${theme === 'dark' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Configuration Form */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] shadow-sm transition-shadow">
          <form onSubmit={addEndpoint} className="flex flex-col md:flex-row gap-0 focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600 rounded-lg overflow-hidden relative z-10">
            <select 
              value={httpMethod} 
              onChange={e => setHttpMethod(e.target.value)} 
              className="bg-transparent border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 outline-none w-full md:w-28 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 appearance-none"
            >
              <option value="GET" className="bg-white dark:bg-[#111] text-zinc-900 dark:text-zinc-100">GET</option>
              <option value="POST" className="bg-white dark:bg-[#111] text-zinc-900 dark:text-zinc-100">POST</option>
              <option value="PUT" className="bg-white dark:bg-[#111] text-zinc-900 dark:text-zinc-100">PUT</option>
              <option value="DELETE" className="bg-white dark:bg-[#111] text-zinc-900 dark:text-zinc-100">DELETE</option>
            </select>
            <input 
              required
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-transparent border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm outline-none w-full md:w-1/3 placeholder-zinc-400 dark:placeholder-zinc-600"
              placeholder="Target Name"
            />
            <input 
              required
              type="url" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              className="bg-transparent border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm font-mono outline-none w-full placeholder-zinc-400 dark:placeholder-zinc-600"
              placeholder="https://api.example.com"
            />
            
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
              Options
            </button>
            <button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap">
              Add Target
            </button>
          </form>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0a0a0a] p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-b-lg">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Expected HTTP Status</label>
                  <p className="text-[11px] text-zinc-400 mb-1">Target is marked OUTAGE if response differs from this code.</p>
                  <input 
                    type="number" 
                    value={expectedStatus} 
                    onChange={e => setExpectedStatus(e.target.value)} 
                    className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    placeholder="200"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Environment</label>
                  <p className="text-[11px] text-zinc-400 mb-1">Tag for organizing your dashboard targets.</p>
                  <select 
                    value={environment} 
                    onChange={e => setEnvironment(e.target.value)} 
                    className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Custom Request Headers (JSON)</label>
                <p className="text-[11px] text-zinc-400 mb-1">Inject authorization tokens or custom metadata.</p>
                <textarea 
                  value={customHeaders} 
                  onChange={e => setCustomHeaders(e.target.value)} 
                  className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 h-32 resize-none custom-scrollbar"
                  spellCheck="false"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center justify-between !mt-8">
          <div className="flex gap-2">
            {['All', 'Production', 'Staging', 'Development'].map(env => (
              <button 
                key={env} 
                onClick={() => setFilterEnv(env)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterEnv === env ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white shadow-sm' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              >
                {env}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['All', 'Operational', 'Outage'].map(stat => (
              <button 
                key={stat} 
                onClick={() => setFilterStatus(stat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterStatus === stat ? (stat === 'Outage' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white shadow-sm') : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <div className="space-y-4 pb-12 !mt-6">
          {isInitialLoading ? (
            // Skeleton Loaders
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#111] rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-2.5">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-900 rounded" />
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="space-y-2">
                    <div className="h-2 w-12 bg-zinc-100 dark:bg-zinc-900 rounded" />
                    <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-12 bg-zinc-100 dark:bg-zinc-900 rounded" />
                    <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredEndpoints.length === 0 ? (
            <div className="text-center text-zinc-500 py-20 border border-zinc-200 dark:border-zinc-800/60 rounded-lg border-dashed">
              <span className="text-sm">No targets match your filters.</span>
            </div>
          ) : filteredEndpoints.map(endpoint => {
            const latestPing = endpoint.ping_results[endpoint.ping_results.length - 1]
            const expected = endpoint.expected_status || 200
            const isUp = latestPing ? latestPing.status_code === expected : false
            const isExpanded = expandedEndpoint === endpoint.id
            const methodClass = methodColors[endpoint.http_method || 'GET'] || methodColors['GET']
            const envClass = envColors[endpoint.environment || 'Production'] || envColors['Production']
            const latencyHistory = endpoint.ping_results.map(p => p.response_time_ms)
            
            // Analytics
            const endpointPings = endpoint.ping_results.length;
            const endpointUpCount = endpoint.ping_results.filter(p => p.status_code === expected).length;
            const endpointUptime = endpointPings > 0 ? ((endpointUpCount / endpointPings) * 100).toFixed(2) : '100.00';
            const maxLat = latencyHistory.length > 0 ? Math.max(...latencyHistory) : 0;
            const avgLat = latencyHistory.length > 0 ? Math.round(latencyHistory.reduce((a,b)=>a+b,0) / latencyHistory.length) : 0;
            
            return (
              <div key={endpoint.id} className="bg-white dark:bg-[#111] rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all relative group/card">
                
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                  <div className="flex items-center gap-4">
                    {/* Status Dot */}
                    <div className="relative flex h-2 w-2 shrink-0" title={isUp ? 'Operational' : 'Outage Detected'}>
                      {isUp && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${methodClass}`}>
                          {endpoint.http_method || 'GET'}
                        </span>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{endpoint.name}</h2>
                        
                        <span className={`ml-2 px-1.5 py-[2px] rounded text-[9px] uppercase tracking-widest font-bold border ${envClass}`}>
                          {endpoint.environment || 'PROD'}
                        </span>
                      </div>
                      <a href={endpoint.url} target="_blank" className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-mono truncate max-w-[200px] sm:max-w-md">
                        {endpoint.url}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8">
                    {latestPing ? (
                      <div className="flex gap-6 text-right">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Latency</span>
                          <span className="font-mono text-sm">{latestPing.response_time_ms}ms</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5" title={`Expected: ${expected}`}>Status</span>
                          <span className={`font-mono text-sm ${isUp ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-500 font-bold'}`}>
                            {latestPing.status_code}
                            {!isUp && <span className="text-[10px] ml-1 text-red-500/70 block sm:inline">(Exp: {expected})</span>}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Pending...</span>
                    )}

                    <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-4 sm:pl-6 opacity-50 group-hover/card:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setExpandedEndpoint(isExpanded ? null : endpoint.id)} 
                        className={`text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-2 rounded transition-colors ${isExpanded ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      <button 
                        onClick={() => deleteEndpoint(endpoint.id, endpoint.name)} 
                        className="text-zinc-400 hover:text-red-500 p-2 rounded transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Delete Target"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full-width Sparkline */}
                <div className="px-4 sm:px-5 pb-4">
                  <Sparkline data={latencyHistory} isUp={isUp || false} />
                </div>

                {/* Expanded Payload Section */}
                {isExpanded && latestPing && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0a0a0a] p-4 sm:p-5">
                    
                    {/* Endpoint Analytics Banner */}
                    <div className="mb-6 grid grid-cols-4 gap-4 bg-white dark:bg-[#111] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <div className="flex flex-col border-r border-zinc-100 dark:border-zinc-800">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Health</span>
                        <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">{endpointUptime}%</span>
                      </div>
                      <div className="flex flex-col border-r border-zinc-100 dark:border-zinc-800">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Avg Latency</span>
                        <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">{avgLat}ms</span>
                      </div>
                      <div className="flex flex-col border-r border-zinc-100 dark:border-zinc-800">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Max Latency</span>
                        <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">{maxLat}ms</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Total Pings</span>
                        <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">{endpointPings}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Response Headers</h3>
                        {latestPing.response_headers ? (
                          <div className="bg-white dark:bg-[#111] rounded border border-zinc-200 dark:border-zinc-800/80 p-3 h-[250px] overflow-y-auto font-mono text-[11px] custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                              <tbody>
                                {Object.entries(latestPing.response_headers).map(([key, value]) => (
                                  <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                    <td className="py-2 pr-4 font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{key}</td>
                                    <td className="py-2 text-zinc-500 break-all">
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-[#111] rounded border border-zinc-200 dark:border-zinc-800/80 p-3 h-[250px] flex items-center justify-center">
                            <p className="text-[11px] text-zinc-500 italic">No headers present.</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Response Body</h3>
                        <div className="bg-white dark:bg-[#111] rounded border border-zinc-200 dark:border-zinc-800/80 p-3 h-[250px] overflow-y-auto custom-scrollbar">
                          {latestPing.response_body ? (
                            <JsonViewer jsonString={latestPing.response_body} />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <span className="text-[11px] text-zinc-500 italic">Empty body.</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                )}
                
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="mt-auto py-6 border-t border-zinc-200 dark:border-zinc-800/60 text-center text-xs text-zinc-500 font-medium">
          Developed by Om
        </footer>
      </div>
    </div>
  )
}

export default App
