import re

with open(r'c:\Cuong\Codex\sachnhaminh-main\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. BookReview
content = re.sub(r'(const BookReview = \(\) => \{\s*.*?)(<section id=\{NAV_SLUGS\[\d\]\})', r'\g<1><section id={NAV_SLUGS[3]}', content, flags=re.DOTALL)

# 2. Events
content = re.sub(r'(const Events = \(\) => \{\s*.*?)(<section id=\{NAV_SLUGS\[\d\]\})', r'\g<1><section id={NAV_SLUGS[2]}', content, flags=re.DOTALL)

# 3. Contact (line 3314)
content = re.sub(r'<section id=\{NAV_SLUGS\[\d\]\} className=\"py-32 px-6 bg-black/\[0\.01\]\">\s*<div className=\"max-w-7xl mx-auto\">\s*<div className=\"grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start\">\s*<div className=\"lg:col-span-8\">\s*<div className=\"mb-12 flex flex-col gap-8\">\s*<span className=\{\`text-xs font-bold \$\{config\.accentText\} uppercase tracking-\[0\.2em\] block\`\}>\{t\.eventsSub\}', r'<section id={NAV_SLUGS[4]} className="py-32 px-6 bg-black/[0.01]">\n<div className="max-w-7xl mx-auto">\n<div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">\n<div className="lg:col-span-8">\n<div className="mb-12 flex flex-col gap-8">\n<span className={`text-xs font-bold ${config.accentText} uppercase tracking-[0.2em] block`}>{t.eventsSub}', content)

# 4. Services
content = re.sub(r'(const Services = \(\) => \{\s*.*?)(<section id=\{NAV_SLUGS\[\d\]\})', r'\g<1><section id={NAV_SLUGS[2]}', content, flags=re.DOTALL)

with open(r'c:\Cuong\Codex\sachnhaminh-main\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Regex replace done')
