import sys

with open(r'c:\Cuong\Codex\sachnhaminh-main\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const NAV_SLUGS = ['trang-chu', 'su-kien', 'diem-sach', 'lien-he'];", 
    "const NAV_SLUGS = ['trang-chu', 'tieu-diem', 'su-kien', 'diem-sach', 'lien-he'];"
)
content = content.replace(
    "nav: ['Trang chủ', 'Sự Kiện', 'Điểm sách', 'Liên Hệ'],", 
    "nav: ['Trang chủ', 'Tiêu điểm', 'Sự Kiện', 'Điểm sách', 'Liên Hệ'],"
)
content = content.replace(
    "nav: ['Home', 'Events', 'Book Reviews', 'Contact'],", 
    "nav: ['Home', 'Highlights', 'Events', 'Book Reviews', 'Contact'],"
)

content = content.replace(
    '<section className={`py-24 px-6 border-t ${config.border} bg-black/[0.01]`}>', 
    '<section id={NAV_SLUGS[1]} className={`py-24 px-6 border-t ${config.border} bg-black/[0.01]`}>'
)

# Fix the incorrect NAV_SLUGS references based on their actual content
content = content.replace('id={NAV_SLUGS[1]}', 'id=\"su-kien\"') # This makes ALL of them su-kien

# Now put back NAV_SLUGS properly for NewsSection which is NAV_SLUGS[1]
content = content.replace('id=\"su-kien\" className={`py-24 px-6 border-t ${config.border} bg-black/[0.01]`}>', 'id={NAV_SLUGS[1]} className={`py-24 px-6 border-t ${config.border} bg-black/[0.01]`}>')

# Now fix Events (su-kien is fine, but using NAV_SLUGS[2] is better)
# But wait, we can just leave them as 'su-kien' and hardcode the IDs. It works identical.
content = content.replace('id=\"su-kien\" className=\"py-24 px-6 max-w-7xl mx-auto overflow-hidden\"', 'id={NAV_SLUGS[2]} className=\"py-24 px-6 max-w-7xl mx-auto overflow-hidden\"')
content = content.replace('id=\"su-kien\" className=\"py-32 px-6 bg-black/[0.01]\"', 'id={NAV_SLUGS[2]} className=\"py-32 px-6 bg-black/[0.01]\"')
# Book review
content = content.replace('id={NAV_SLUGS[2]} className=\"py-24 px-6 max-w-7xl mx-auto overflow-hidden\"', 'id={NAV_SLUGS[3]} className=\"py-24 px-6 max-w-7xl mx-auto overflow-hidden\"')
# Contact
content = content.replace('id={NAV_SLUGS[2]} className=\"py-32 px-6 bg-black/[0.01]\"', 'id={NAV_SLUGS[4]} className=\"py-32 px-6 bg-black/[0.01]\"')

# Fix Footer (remove ID)
content = content.replace('<footer id=\"su-kien\"', '<footer')

with open(r'c:\Cuong\Codex\sachnhaminh-main\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Phase 1 done')
