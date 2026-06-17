import os

file_path = r"c:\Cuong\Codex\sachnhaminh-main\src\Admin.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for mobileMenuOpen
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'gallery' | 'events' | 'books' | 'roles' | 'slides' | 'contacts' | 'categories' | 'articleCategories' | 'checkin' | 'crm'>('dashboard');",
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'gallery' | 'events' | 'books' | 'roles' | 'slides' | 'contacts' | 'categories' | 'articleCategories' | 'checkin' | 'crm'>('dashboard');\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"
)

# 2. Update Sidebar Layout
old_sidebar = """  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">"""

new_sidebar = """  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button 
          onClick={() => setMobileMenuOpen(false)} 
          className="md:hidden absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          <X className="w-4 h-4 text-gray-600"/>
        </button>"""

content = content.replace(old_sidebar, new_sidebar)

# 3. Add Mobile Header to Main Content
old_main = """      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shrink-0">"""

new_main = """      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* Mobile Header Toolbar */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="font-bold text-gray-900 capitalize tracking-tight">{activeTab}</h2>
          </div>
          <button onClick={() => setAdminLang(adminLang === 'vi' ? 'en' : 'vi')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">
            {adminLang === 'vi' ? 'VI' : 'EN'}
          </button>
        </div>

        {/* Header Desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center px-8 justify-between shrink-0">"""

content = content.replace(old_main, new_main)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fix_admin_mobile")
