import os

file_path = r"c:\Cuong\Codex\sachnhaminh-main\src\Admin.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Registrations table
t1_old = '<table className="w-full text-sm text-left text-gray-500">'
t1_new = '<div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500 whitespace-nowrap min-w-[800px]">'
content = content.replace(t1_old, t1_new)

t1_close_old = """                        </table>
                     )}"""
t1_close_new = """                        </table></div>
                     )}"""
content = content.replace(t1_close_old, t1_close_new)

# Fix 2: The rest
lines = content.splitlines()
for i, line in enumerate(lines):
    if '<table className="w-full text-left text-sm text-gray-600">' in line:
        if 'overflow-x-auto' not in lines[i-1]:
            lines[i] = line.replace('<table className="w-full text-left text-sm text-gray-600">', '<div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-600 whitespace-nowrap min-w-[800px]">')
            for j in range(i+1, len(lines)):
                if '</table>' in lines[j]:
                    lines[j] = lines[j].replace('</table>', '</table></div>')
                    break
        else:
            lines[i] = line.replace('<table className="w-full text-left text-sm text-gray-600">', '<table className="w-full text-left text-sm text-gray-600 whitespace-nowrap min-w-[800px]">')

content = '\n'.join(lines) + '\n'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
