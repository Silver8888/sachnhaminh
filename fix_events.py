import os

file_path = r"c:\Cuong\Codex\sachnhaminh-main\src\Admin.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Headers replacement
grid_headers = """               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">STT</div>
                  <div className="col-span-1">Mã SK</div>
                  <div className="col-span-3">Event Title</div>
                  <div className="col-span-2">Creator / At</div>
                  <div className="col-span-2">Date/Time</div>
                  <div className="col-span-2">Location/Attendees</div>
                  <div className="col-span-1 text-right">Actions</div>
               </div>"""

table_headers = """               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap min-w-[1000px]">
                   <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                     <tr>
                       <th className="px-4 py-3 w-16">STT</th>
                       <th className="px-4 py-3 w-24">Mã SK</th>
                       <th className="px-4 py-3 min-w-[200px]">Event Title</th>
                       <th className="px-4 py-3 w-32">Creator / At</th>
                       <th className="px-4 py-3 w-40">Date/Time</th>
                       <th className="px-4 py-3 w-48">Location/Attendees</th>
                       <th className="px-4 py-3 w-24 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">"""

content = content.replace(grid_headers, table_headers)

# Open div replacement
content = content.replace('<div className="divide-y divide-gray-100">', '')

# Row replacement
row_start_old = """                      <div key={event.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 text-sm font-medium text-gray-500 flex flex-col items-start gap-1">"""
row_start_new = """                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-gray-500">"""
content = content.replace(row_start_old, row_start_new)

content = content.replace(
    '                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{index + 1}</span>\n                      </div>\n                      <div className="col-span-1 flex flex-col items-start gap-1">',
    '                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{index + 1}</span>\n                        </td>\n                        <td className="px-4 py-4">'
)

content = content.replace(
    '                        {event.code ? <div className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{event.code}</div> : <span className="text-gray-300 text-xs">-</span>}\n                      </div>\n                      <div className="col-span-3 font-medium text-gray-900 truncate">',
    '                        {event.code ? <div className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 inline-block rounded">{event.code}</div> : <span className="text-gray-300 text-xs">-</span>}\n                        </td>\n                        <td className="px-4 py-4 font-medium text-gray-900 truncate">'
)

content = content.replace(
    '                           {/* Badge moved to manage button */}\n                        </div>\n                      </div>\n                      <div className="col-span-2 text-xs text-gray-500 flex flex-col gap-0.5 truncate">',
    '                           {/* Badge moved to manage button */}\n                        </div>\n                        </td>\n                        <td className="px-4 py-4 text-xs text-gray-500">'
)

content = content.replace(
    '                           {event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000).toLocaleString(\'vi-VN\', { dateStyle: \'short\', timeStyle: \'short\' }) : \'N/A\'}\n                         </span>\n                      </div>\n                      <div className="col-span-2 text-sm text-gray-500 flex flex-col gap-0.5">',
    '                           {event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000).toLocaleString(\'vi-VN\', { dateStyle: \'short\', timeStyle: \'short\' }) : \'N/A\'}\n                         </span>\n                        </td>\n                        <td className="px-4 py-4 text-sm text-gray-500">'
)

content = content.replace(
    '                           {event.endTime ? ` - ${new Date(event.endTime).toLocaleTimeString(\'vi-VN\', { hour: \'2-digit\', minute: \'2-digit\' })}` : \'\'}\n                         </span>\n                      </div>\n                      <div className="col-span-2 flex flex-col gap-1">',
    '                           {event.endTime ? ` - ${new Date(event.endTime).toLocaleTimeString(\'vi-VN\', { hour: \'2-digit\', minute: \'2-digit\' })}` : \'\'}\n                         </span>\n                        </td>\n                        <td className="px-4 py-4">'
)

content = content.replace(
    '                           <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><Users className="w-3 h-3"/> {actualApprovedCount}/{event.capacity || \'-\'} người</span>\n                         </div>\n                      </div>\n                      <div className="col-span-1 flex justify-end gap-2">',
    '                           <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><Users className="w-3 h-3"/> {actualApprovedCount}/{event.capacity || \'-\'} người</span>\n                         </div>\n                        </td>\n                        <td className="px-4 py-4 text-right">\n                          <div className="flex justify-end gap-2">'
)

content = content.replace(
    '                        <button onClick={() => deleteEvent(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">\n                          <Trash2 className="w-4 h-4" />\n                        </button>\n                      </div>\n                    </div>\n                    );',
    '                        <button onClick={() => deleteEvent(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">\n                          <Trash2 className="w-4 h-4" />\n                        </button>\n                          </div>\n                        </td>\n                      </tr>\n                    );'
)

# Replace the closing tags
content = content.replace(
    '                  })}\n               </div>\n            </div>',
    '                  })}\n                   </tbody>\n                 </table>\n               </div>\n            </div>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
