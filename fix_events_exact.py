import os

file_path = r"c:\Cuong\Codex\sachnhaminh-main\src\Admin.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Events Grid Headers with Table Headers
headers_old = """               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">STT</div>
                  <div className="col-span-1">Mã SK</div>
                  <div className="col-span-3">Event Title</div>
                  <div className="col-span-2">Creator / At</div>
                  <div className="col-span-2">Date/Time</div>
                  <div className="col-span-2">Location/Attendees</div>
                  <div className="col-span-1 text-right">Actions</div>
               </div>
               <div className="divide-y divide-gray-100">"""

headers_new = """               <div className="overflow-x-auto">
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
content = content.replace(headers_old, headers_new)

# Replace the inner map return logic
row_old = """                      <div key={event.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 text-sm font-medium text-gray-500 flex flex-col items-start gap-1">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{index + 1}</span>
                      </div>
                      <div className="col-span-1 flex flex-col items-start gap-1">
                        {event.code ? <div className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{event.code}</div> : <span className="text-gray-300 text-xs">-</span>}
                      </div>
                      <div className="col-span-3 font-medium text-gray-900 truncate">
                        <div className="flex flex-col gap-1">
                           <span className="truncate font-bold" title={event.title_vi}>{event.title_vi}</span>
                           <div className="text-[10px] text-gray-500 flex items-center gap-1">
                             <span className="capitalize font-semibold">{event.category === 'sachnhaminh' ? 'Sách Nhà Mình' : event.category === 'external' ? 'Sự kiện ngoài' : (event.category === 'school' ? 'Sách Nhà Mình' : event.category === 'culture' ? 'Sách Nhà Mình' : event.category || 'Mặc định')}</span>
                             <span>&gt;</span>
                             <span className="text-blue-600 font-semibold">
                               {subCategories.find(c => c.id === event.subCategory)?.name_vi || 'Mặc định'}
                             </span>
                           </div>
                           {/* Badge moved to manage button */}
                        </div>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 flex flex-col gap-0.5 truncate">
                         <span className="text-gray-700 truncate" title={event.createdBy || 'Unknown'}>{event.createdBy || 'Unknown'}</span>
                         <span className="text-[10px] opacity-70">
                           {event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                         </span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-500 flex flex-col gap-0.5">
                         <span className="text-gray-800">{event.date}</span>
                         <span className="text-xs">
                           {event.time ? new Date(event.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                           {event.endTime ? ` - ${new Date(event.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                         </span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-500 flex flex-col gap-1 truncate text-left">
                         <span className="truncate text-xs" title={event.location}>{event.location || '-'}</span>
                         <span className={`text-[10px] font-bold w-fit px-2 py-0.5 rounded-full uppercase tracking-widest ${actualApprovedCount >= event.max_attendees && event.max_attendees > 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                            {actualApprovedCount} ĐÃ DUYỆT / {event.max_attendees || '∞'} TỔNG CHỖ
                         </span>
                      </div>
                      <div className="col-span-1 flex justify-end gap-2">"""

row_new = """                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-gray-500">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{index + 1}</span>
                        </td>
                        <td className="px-4 py-4">
                          {event.code ? <div className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 inline-block rounded">{event.code}</div> : <span className="text-gray-300 text-xs">-</span>}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900 truncate">
                          <div className="flex flex-col gap-1">
                             <span className="truncate font-bold" title={event.title_vi}>{event.title_vi}</span>
                             <div className="text-[10px] text-gray-500 flex items-center gap-1">
                               <span className="capitalize font-semibold">{event.category === 'sachnhaminh' ? 'Sách Nhà Mình' : event.category === 'external' ? 'Sự kiện ngoài' : (event.category === 'school' ? 'Sách Nhà Mình' : event.category === 'culture' ? 'Sách Nhà Mình' : event.category || 'Mặc định')}</span>
                               <span>&gt;</span>
                               <span className="text-blue-600 font-semibold">
                                 {subCategories.find(c => c.id === event.subCategory)?.name_vi || 'Mặc định'}
                               </span>
                             </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">
                          <div className="flex flex-col gap-0.5">
                             <span className="text-gray-700 truncate" title={event.createdBy || 'Unknown'}>{event.createdBy || 'Unknown'}</span>
                             <span className="text-[10px] opacity-70">
                               {event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                             </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          <div className="flex flex-col gap-0.5">
                             <span className="text-gray-800">{event.date}</span>
                             <span className="text-xs">
                               {event.time ? new Date(event.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                               {event.endTime ? ` - ${new Date(event.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                             </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1 text-left text-sm text-gray-500">
                             <span className="truncate text-xs" title={event.location}>{event.location || '-'}</span>
                             <span className={`text-[10px] font-bold w-fit px-2 py-0.5 rounded-full uppercase tracking-widest ${actualApprovedCount >= event.max_attendees && event.max_attendees > 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                {actualApprovedCount} ĐÃ DUYỆT / {event.max_attendees || '∞'} TỔNG CHỖ
                             </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">"""
content = content.replace(row_old, row_new)

# Map close
map_close_old = """                        <button onClick={() => deleteEvent(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
               </div>
            </div>"""
map_close_new = """                        <button onClick={() => deleteEvent(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                   </tbody>
                 </table>
               </div>
            </div>"""
content = content.replace(map_close_old, map_close_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done events")
