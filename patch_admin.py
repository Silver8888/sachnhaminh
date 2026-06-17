import sys
import re

filepath = r'c:\Cuong\Codex\sachnhaminh-main\src\Admin.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
content = content.replace(
    "const [subCategories, setSubCategories] = useState<any[]>([]);",
    "const [subCategories, setSubCategories] = useState<any[]>([]);\n  const [articleCategories, setArticleCategories] = useState<any[]>([]);"
)

# 2. activeTab type
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'gallery' | 'events' | 'books' | 'roles' | 'slides' | 'contacts' | 'categories'>('dashboard');",
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'gallery' | 'events' | 'books' | 'roles' | 'slides' | 'contacts' | 'categories' | 'articleCategories'>('dashboard');"
)

# 3. editingArticleCategory
content = content.replace(
    "const [editingSubCategory, setEditingSubCategory] = useState<any>(null);",
    "const [editingSubCategory, setEditingSubCategory] = useState<any>(null);\n  const [editingArticleCategory, setEditingArticleCategory] = useState<any>(null);"
)

# 4. Translations
content = content.replace(
    "categories: 'Quản lý danh mục',",
    "categories: 'Danh mục sự kiện',\n      articleCategories: 'Danh mục bài viết',\n      addArticleCategory: 'Thêm Danh Mục BV',"
)
content = content.replace(
    "categories: 'Categories',",
    "categories: 'Event Categories',\n      articleCategories: 'Article Categories',\n      addArticleCategory: 'Add Article Category',"
)

# 5. Fetch
fetch_code = """
    const fetchArticleCategories = async () => {
      const { data, error } = await supabase.from('article_categories').select('*').order('name_vi');
      if (!error && data) setArticleCategories(data);
    };
"""
content = content.replace(
    "const fetchSubCategories = async () => {",
    fetch_code + "\n    const fetchSubCategories = async () => {"
)
content = content.replace(
    "fetchSubCategories();",
    "fetchSubCategories();\n      fetchArticleCategories();"
)

# 6. Save / Delete
save_del_code = """
  const saveArticleCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name_vi: editingArticleCategory.name_vi,
        name_en: editingArticleCategory.name_en,
      };
      if (editingArticleCategory.id === 'NEW') {
        const { error } = await supabase.from('article_categories').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('article_categories').update(payload).eq('id', editingArticleCategory.id);
        if (error) throw error;
      }
      setEditingArticleCategory(null);
      fetchArticleCategories();
      alert('Đã lưu danh mục bài viết!');
    } catch (err: any) {
      alert('Lỗi khi lưu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteArticleCategory = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục bài viết này?')) {
      const { error } = await supabase.from('article_categories').delete().eq('id', id);
      if (error) alert('Lỗi: ' + error.message);
      else fetchArticleCategories();
    }
  };
"""
content = content.replace(
    "const saveSubCategory = async (e: React.FormEvent) => {",
    save_del_code + "\n  const saveSubCategory = async (e: React.FormEvent) => {"
)

# 7. Sidebar
sidebar_btn = """
          <button 
            onClick={() => setActiveTab('articleCategories')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'articleCategories' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Tag className="w-5 h-5" />
            {(t as any).articleCategories}
          </button>
"""
content = content.replace(
    "<div className=\"pt-4 mt-2 border-t border-gray-100\">",
    sidebar_btn + "\n          <div className=\"pt-4 mt-2 border-t border-gray-100\">"
)

# 8. Topbar add button
topbar_btn = """
             {activeTab === 'articleCategories' && (
                <button onClick={() => setEditingArticleCategory({ id: 'NEW', name_vi: '', name_en: '' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {(t as any).addArticleCategory}
                </button>
             )}
"""
content = content.replace(
    "{activeTab === 'books' && (",
    topbar_btn + "\n             {activeTab === 'books' && ("
)

# 9. Tab View
tab_view = """
          {activeTab === 'articleCategories' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Tên (Tiếng Việt)</div>
                  <div className="col-span-5">Name (English)</div>
                  <div className="col-span-2 text-right">Actions</div>
               </div>
               <div className="divide-y divide-gray-100">
                  {articleCategories.map(cat => (
                    <div key={cat.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-5 font-medium text-gray-900">{cat.name_vi}</div>
                      <div className="col-span-5 text-gray-500">{cat.name_en}</div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button onClick={() => setEditingArticleCategory(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteArticleCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
"""
content = content.replace(
    "{activeTab === 'events' && (",
    tab_view + "\n          {activeTab === 'events' && ("
)

# 10. Article Categories Modal
modal_view = """
      <AnimatePresence>
         {editingArticleCategory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingArticleCategory(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     <Tag className="w-5 h-5 text-blue-600" />
                     {editingArticleCategory.id === 'NEW' ? 'Thêm danh mục bài viết' : 'Sửa danh mục bài viết'}
                  </h2>
                  <button onClick={() => setEditingArticleCategory(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={saveArticleCategory}>
                  <div className="p-6 space-y-4 text-left">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục (Tiếng Việt)</label>
                        <input required type="text" value={editingArticleCategory.name_vi} onChange={e => setEditingArticleCategory({...editingArticleCategory, name_vi: e.target.value})} className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                        <input required type="text" value={editingArticleCategory.name_en} onChange={e => setEditingArticleCategory({...editingArticleCategory, name_en: e.target.value})} className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                     <button type="button" onClick={() => setEditingArticleCategory(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                     <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                     </button>
                  </div>
                </form>
              </motion.div>
            </div>
         )}
      </AnimatePresence>
"""
content = content.replace(
    "{/* SubCategory Modal */}",
    modal_view + "\n      {/* SubCategory Modal */}"
)

# 11. Dropdown update
old_dropdown = """<select required value={editingArticle.category || 'school'} onChange={e => setEditingArticle({...editingArticle, category: e.target.value})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                 <option value="school">School</option>
                                 <option value="culture">Culture</option>
                              </select>"""
new_dropdown = """<select required value={editingArticle.category || ''} onChange={e => setEditingArticle({...editingArticle, category: e.target.value})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                 <option value="">-- Chọn danh mục --</option>
                                 {articleCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_vi}</option>
                                 ))}
                                 {editingArticle.category && !articleCategories.some(c => c.id === editingArticle.category) && (
                                    <option value={editingArticle.category}>{articleCategories.find(c => c.name_vi === editingArticle.category || c.name_en === editingArticle.category)?.name_vi || editingArticle.category}</option>
                                 )}
                              </select>"""
content = content.replace(old_dropdown, new_dropdown)

# 12. Pie chart update
old_pie = """<Pie
                                 data={[
                                    { name: 'Góc nhà mình', value: articles.filter(a => a.category === 'school').length },
                                    { name: 'Kỹ năng cha mẹ', value: articles.filter(a => a.category === 'skills').length },
                                    { name: 'Khác', value: articles.filter(a => a.category !== 'school' && a.category !== 'skills').length }
                                 ].filter(d => d.value > 0)}"""
new_pie = """<Pie
                                 data={[
                                    ...articleCategories.map(cat => ({
                                       name: cat.name_vi,
                                       value: articles.filter(a => a.category === cat.id || a.category === cat.name_vi || a.category === cat.name_en?.toLowerCase() || (a.category === 'school' && cat.name_vi === 'Góc nhà mình') || (a.category === 'skills' && cat.name_vi === 'Kỹ năng cha mẹ')).length
                                    })),
                                    { name: 'Khác', value: articles.filter(a => {
                                       return !articleCategories.some(cat => a.category === cat.id || a.category === cat.name_vi || a.category === cat.name_en?.toLowerCase() || (a.category === 'school' && cat.name_vi === 'Góc nhà mình') || (a.category === 'skills' && cat.name_vi === 'Kỹ năng cha mẹ'));
                                    }).length }
                                 ].filter(d => d.value > 0)}"""
content = content.replace(old_pie, new_pie)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully!')
