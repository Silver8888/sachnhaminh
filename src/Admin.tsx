import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { FileText, Image as ImageIcon, LogOut, Edit3, Trash2, Plus, Calendar, Type, Users, BookOpen, Clock, MapPin, Star, UserPlus, Globe, LayoutDashboard, X, Bell, Mail, Phone, Check, Tag, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendRegistrationEmail } from './utils/emailService';
import * as XLSX from 'xlsx';
import ReactQuill from 'react-quill-new';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import 'react-quill-new/dist/quill.snow.css';
import { CheckinScanner } from './components/CheckinScanner';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const quillModulesSimple = {
  toolbar: [
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ],
};

export const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [adminEventSearch, setAdminEventSearch] = useState('');
  const [adminEventDate, setAdminEventDate] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [articleCategories, setArticleCategories] = useState<any[]>([]);
  
  const [adminLang, setAdminLang] = useState<'vi' | 'en'>('vi');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'gallery' | 'events' | 'books' | 'roles' | 'slides' | 'contacts' | 'categories' | 'articleCategories' | 'checkin' | 'crm'>('dashboard');

  const [crmSearch, setCrmSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [checkinEventId, setCheckinEventId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerInput, setScannerInput] = useState('');
  const [checkinEventSearch, setCheckinEventSearch] = useState('');
  const [checkinEventDate, setCheckinEventDate] = useState('');
  const [checkinCustomerSearch, setCheckinCustomerSearch] = useState('');
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [articleFormLang, setArticleFormLang] = useState<'vi' | 'en'>('vi');
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);
  const [editingArticleCategory, setEditingArticleCategory] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<any>(null);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [newRegistrationCount, setNewRegistrationCount] = useState(0);
  const [newEventRegistrations, setNewEventRegistrations] = useState<{ [eventId: string]: number }>({});
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<any>(null);


  const t = {
    vi: {
      portal: 'Quản trị hệ thống',
      dashboard: 'Tổng quan',
      slides: 'Slideshow',
      articles: 'Bài viết',
      gallery: 'Thư viện',
      events: 'Sự kiện',
      checkin: 'Check-in Sự kiện',
      crm: 'CRM Khách hàng',
      books: 'Điểm sách',
      roles: 'Tài khoản',
      contacts: 'Liên hệ',
      categories: 'Danh mục sự kiện',
      articleCategories: 'Danh mục bài viết',
      emailTemplates: 'Mẫu Email',
      addArticleCategory: 'Thêm Danh Mục BV',
      signOut: 'Đăng xuất',
      management: 'Quản lý',
      addArticle: 'Thêm Bài Viết',
      addMedia: 'Thêm Media',
      addEvent: 'Thêm Sự Kiện',
      addBook: 'Thêm Sách',
      addUser: 'Thêm Tài Khoản',
      addSlide: 'Thêm Slide',
      addCategory: 'Thêm Danh Mục',
      noArticles: 'Chưa có bài viết. Hãy tạo bản ghi đầu tiên.',
      noGallery: 'Thư viện trống. Hãy tải lên ảnh/video.',
      noSlides: 'Chưa có slide nào.',
    },
    en: {
      portal: 'Admin Portal',
      dashboard: 'Dashboard',
      slides: 'Slideshow',
      articles: 'Articles',
      gallery: 'Gallery',
      events: 'Events',
      checkin: 'Event Check-in',
      crm: 'CRM Customers',
      books: 'Book Reviews',
      roles: 'Users / Roles',
      contacts: 'Contacts',
      categories: 'Event Categories',
      articleCategories: 'Article Categories',
      emailTemplates: 'Email Templates',
      addArticleCategory: 'Add Article Category',
      signOut: 'Sign Out',
      management: 'Management',
      addArticle: 'Add Article',
      addMedia: 'Add Media',
      addEvent: 'Add Event',
      addBook: 'Add Book Review',
      addUser: 'Add User Role',
      addSlide: 'Add Slide',
      addCategory: 'Add Category',
      noArticles: 'No articles found. Create your first article.',
      noGallery: 'No gallery items found. Upload some media.',
      noSlides: 'No slides yet.',
    }
  }[adminLang];

  const handleCheckin = async (registrationId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('registrations').update({
        checked_in: true,
        checked_in_at: now
      }).eq('id', registrationId);
      
      if (error) throw error;
      
      setAllRegistrations(prev => prev.map(r => r.id === registrationId ? { ...r, checked_in: true, checked_in_at: now } : r));
      alert('Check-in thành công!');
    } catch (e: any) {
      alert('Lỗi check-in: ' + e.message);
    }
  };

  const handleScan = (decodedText: string) => {
    // Expected format: SNM-XXXXX
    const ticketPrefix = decodedText.split('-')[1];
    if (!ticketPrefix) {
       alert('Mã vé không hợp lệ!');
       return;
    }
    
    const registration = allRegistrations.find(r => 
       (r.eventId === checkinEventId || r.event_id === checkinEventId) && 
       String(r.id).split('-')[0].toUpperCase() === ticketPrefix.toUpperCase()
    );
    
    if (registration) {
      if (registration.checked_in) {
        alert('Khách này đã được check-in trước đó lúc ' + new Date(registration.checked_in_at).toLocaleString('vi-VN'));
      } else {
        handleCheckin(registration.id);
      }
    } else {
      alert('Mã vé không thuộc về sự kiện này hoặc không tồn tại!');
    }
    setShowScanner(false);
  };

  const fetchArticles = async () => {
    const { data, error } = await supabase.from('articles').select('*');
    if (!error && data) setArticles(data);
  };

  
    const fetchArticleCategories = async () => {
      const { data, error } = await supabase.from('article_categories').select('*').order('name_vi');
      if (!error && data) setArticleCategories(data);
    };

    const fetchEmailTemplates = async () => {
      const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false });
      if (!error && data) setEmailTemplates(data);
    };

    const fetchSubCategories = async () => {
    const { data, error } = await supabase.from('sub_categories').select('*');
    if (!error && data) setSubCategories(data);
  };

  const seedDefaultCategories = async () => {
    const DEFAULT_SUBCATEGORIES = [
      { name_vi: 'Văn Hóa', name_en: 'Culture' },
      { name_vi: 'Nghệ Thuật', name_en: 'Art' },
      { name_vi: 'Thể Thao', name_en: 'Sport' },
      { name_vi: 'Thẩm Mỹ', name_en: 'Aesthetics' },
    ];
    try {
      const { error } = await supabase.from('sub_categories').insert(DEFAULT_SUBCATEGORIES);
      if (error) throw error;
      alert('Đã khởi tạo các danh mục mặc định thành công!');
      fetchSubCategories();
      fetchArticleCategories();
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi khởi tạo danh mục: ' + e.message);
    }
  };

  const fetchSlides = async () => {
    const { data, error } = await supabase.from('slides').select('*').order('order', { ascending: true });
    if (!error && data) setSlides(data);
  };

  const fetchGallery = async () => {
    const { data, error } = await supabase.from('gallery').select('*');
    if (!error && data) setGallery(data);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*');
    if (!error && data) setEvents(data);
  };

  const fetchRegistrations = async (eventId: string) => {
    const { data, error } = await supabase.from('registrations').select('*').eq('event_id', eventId);
    if (!error && data) setEventRegistrations(data);
  };

  const isInitialLoad = useRef(true);

  const showNotification = (message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const fetchAllRegistrations = () => {
    const loadAllRegs = async () => {
      const { data, error } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setAllRegistrations(data.map((reg: any) => ({
          ...reg,
          eventId: reg.event_id,
          participantsInfo: reg.participants_info,
          ticketSent: reg.ticket_sent,
          createdAt: { toMillis: () => new Date(reg.created_at).getTime() }
        })));
      }
    };

    loadAllRegs();

    const channel = supabase.channel('realtime-registrations-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations' }, (payload) => {
        const newReg = payload.new;
        setNewRegistrationCount(prev => prev + 1);
        setNewEventRegistrations(prev => {
          const updated = { ...prev };
          const eventId = newReg.event_id;
          if (!updated[eventId]) updated[eventId] = 0;
          updated[eventId]++;
          return updated;
        });
        showNotification(`Khách hàng ${newReg.name} vừa đăng ký sự kiện!`);
        loadAllRegs();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'registrations' }, () => {
        loadAllRegs();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'registrations' }, () => {
        loadAllRegs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchBooks = async () => {
    const { data, error } = await supabase.from('books').select('*');
    if (!error && data) {
      setBooks(data.map((b: any) => ({
        ...b,
        coverUrl: b.cover_url,
        tikiUrl: b.tiki_url,
        isHotMonth: b.is_hot_month,
        isTypical10: b.is_typical_10,
        isMustRead100: b.is_must_read_100,
        createdAt: b.created_at ? { toMillis: () => new Date(b.created_at).getTime() } : null
      })));
    }
  };

  const downloadBookTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        title_vi: 'Tên sách (Tiếng Việt)',
        title_en: 'Book title (English)',
        author: 'Tên tác giả',
        category: 'Thể loại (VD: VN Classic, Classic, Science...)',
        price_vi: 'Giá (VD: 100.000 VNĐ)',
        price_en: 'Price (VD: 100,000 VND)',
        coverUrl: 'URL Ảnh bìa (Không bắt buộc)',
        description_vi: 'Mô tả tóm tắt (Tiếng Việt)',
        description_en: 'Short description (English)',
        content_vi: 'Nội dung chi tiết (Tiếng Việt)',
        content_en: 'Detailed content (English)',
        rating: 5,
        isTypical10: false,
        isMustRead100: false
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Books_Template.xlsx');
  };

  const handleImportBooks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        for (const row of data as any[]) {
          if (row.title_vi === 'Tên sách (Tiếng Việt)') continue;
          
          const payload = {
            title_vi: row.title_vi?.toString() || '',
            title_en: row.title_en?.toString() || row.title_vi?.toString() || '',
            author: row.author?.toString() || '',
            category: row.category?.toString() || 'General',
            price_vi: row.price_vi?.toString() || '',
            price_en: row.price_en?.toString() || '',
            cover_url: row.coverUrl?.toString() || '',
            summary_vi: row.description_vi?.toString() || '',
            summary_en: row.description_en?.toString() || '',
            review_vi: row.content_vi?.toString() || '',
            review_en: row.content_en?.toString() || '',
            rating: typeof row.rating === 'number' ? row.rating : (parseFloat(row.rating) || 5),
            is_typical_10: row.isTypical10 === true || row.isTypical10 === 'true' || row.isTypical10 === 'TRUE' || row.isTypical10 === 1,
            is_must_read_100: row.isMustRead100 === true || row.isMustRead100 === 'true' || row.isMustRead100 === 'TRUE' || row.isMustRead100 === 1,
            is_hot_month: false
          };
          
          await supabase.from('books').insert(payload);
        }
        
        alert('Nhập dữ liệu thành công!');
        fetchBooks();
      } catch (error) {
        console.error('Error importing books:', error);
        alert('Có lỗi xảy ra khi nhập file!');
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };


  const fetchRoles = async () => {
    const { data, error } = await supabase.from('roles').select('*');
    if (!error && data) setRoles(data);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setContacts(data.map((c: any) => ({
        ...c,
        createdAt: c.created_at ? { toMillis: () => new Date(c.created_at).getTime() } : null
      })));
    }
  };

  useEffect(() => {
    let unsubscribeRegistrations: (() => void) | undefined;
    if (isAdmin) {
      fetchArticles();
      fetchSlides();
      fetchGallery();
      fetchEvents();
      unsubscribeRegistrations = fetchAllRegistrations();
      fetchBooks();
      fetchRoles();
      fetchContacts();
      fetchSubCategories();
      fetchArticleCategories();
      fetchEmailTemplates();
    }
    return () => {
      if (unsubscribeRegistrations) unsubscribeRegistrations();
    };
  }, [isAdmin]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
    } catch (e: any) {
      console.error(e);
      setLoginError(e.message || 'Sai tài khoản hoặc mật khẩu');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const crmData = React.useMemo(() => {
    const customers = new Map();
    allRegistrations.forEach(r => {
       const email = (r.email || '').toLowerCase().trim();
       if (!email) return;
       
       if (!customers.has(email)) {
         customers.set(email, {
            email: email,
            name: r.name || '',
            phone: r.phone || '',
            history: [],
            totalRegistered: 0,
            totalAttended: 0
         });
       }
       
       const c = customers.get(email);
       if (r.name) c.name = r.name;
       if (r.phone) c.phone = r.phone;
       
       const evId = r.event_id || r.eventId;
       const event = events.find(ev => ev.id === evId);
       
       c.history.push({
          eventId: evId,
          eventTitleVi: event?.title_vi || 'Sự kiện đã xóa',
          eventTitleEn: event?.title_en || 'Deleted Event',
          status: r.status,
          checkedIn: r.checked_in,
          checkedInAt: r.checked_in_at,
          createdAt: r.created_at,
          participants: Number(r.participants) || 1,
          ticketCode: `SNM-${String(r.id).split('-')[0].toUpperCase()}`
       });
       
       c.totalRegistered += 1;
       if (r.checked_in) {
          c.totalAttended += 1;
       }
    });
    
    customers.forEach(c => {
       c.history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    return Array.from(customers.values()).sort((a, b) => b.totalAttended - a.totalAttended);
  }, [allRegistrations, events]);

  const handleExportCRM = () => {
    const exportData = crmData.map((c: any) => ({
      'Tên khách hàng': c.name,
      'Email': c.email,
      'Số điện thoại': c.phone,
      'Số sự kiện đã đăng ký': c.totalRegistered,
      'Số lần tham gia (Check-in)': c.totalAttended,
      'Tỷ lệ tham gia': c.totalRegistered > 0 ? `${Math.round((c.totalAttended / c.totalRegistered) * 100)}%` : '0%',
      'Sự kiện tham gia gần nhất': c.history.length > 0 ? c.history[0].eventTitleVi : '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM_KhachHang");
    XLSX.writeFile(wb, `SNM_CRM_KhachHang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const saveSlide = async (e: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingSlide) return;
    const payload = {
      image_url: editingSlide.imageUrl || '',
      heading_vi: editingSlide.heading_vi || '',
      heading_en: editingSlide.heading_en || editingSlide.heading_vi || '',
      description_vi: editingSlide.description_vi || '',
      description_en: editingSlide.description_en || editingSlide.description_vi || '',
      content_vi: editingSlide.content_vi || '',
      content_en: editingSlide.content_en || editingSlide.content_vi || '',
      effect: editingSlide.effect || 'fade',
      order: parseInt(editingSlide.order) || 0,
    };
    if (editingSlide.id === 'NEW') {
      try {
        const { error } = await supabase.from('slides').insert(payload);
        if (error) throw error;
      } catch (err: any) {
        console.error("Error adding slide:", err);
        alert("Lỗi khi thêm slide: " + err.message);
      }
    } else {
      try {
        const { error } = await supabase.from('slides').update(payload).eq('id', editingSlide.id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Error updating slide:", err);
        alert("Lỗi khi cập nhật slide: " + err.message);
      }
    }
    setEditingSlide(null);
    fetchSlides();
  };

  const deleteSlide = async (id: string) => {
    if (window.confirm('Delete this slide?')) {
      await supabase.from('slides').delete().eq('id', id);
      fetchSlides();
    }
  };

  const saveEmailTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmailTemplate) return;
    setIsSaving(true);
    const payload = {
      event_id: editingEmailTemplate.event_id || null,
      subject: editingEmailTemplate.subject,
      body_html: editingEmailTemplate.body_html
    };
    try {
      if (editingEmailTemplate.id === 'NEW') {
        const { error } = await supabase.from('email_templates').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('email_templates').update(payload).eq('id', editingEmailTemplate.id);
        if (error) throw error;
      }
      setEditingEmailTemplate(null);
      fetchEmailTemplates();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi lưu mẫu email: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title_vi: editingArticle.title_vi,
      title_en: editingArticle.title_en || editingArticle.title_vi,
      summary_vi: editingArticle.summary_vi || '',
      summary_en: editingArticle.summary_en || '',
      content_vi: editingArticle.content_vi || '',
      content_en: editingArticle.content_en || '',
      date: editingArticle.date || '',
      image: editingArticle.image || '',
      category: editingArticle.category || 'school',
      event_id: editingArticle.event_id || null
    };
    if (editingArticle.id === 'NEW') {
      await supabase.from('articles').insert(payload);
    } else {
      await supabase.from('articles').update(payload).eq('id', editingArticle.id);
    }
    setEditingArticle(null);
    fetchArticles();
  };

  const saveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: editingGallery.type,
      category: editingGallery.category,
      url: editingGallery.url || '',
      thumbnail: editingGallery.thumbnail || '',
      title: editingGallery.title || '',
      event_id: editingGallery.eventId ? editingGallery.eventId.toString() : null,
      video_url: editingGallery.videoUrl || ''
    };
    if (editingGallery.id === 'NEW') {
      await supabase.from('gallery').insert(payload);
    } else {
      await supabase.from('gallery').update(payload).eq('id', editingGallery.id);
    }
    setEditingGallery(null);
    fetchGallery();
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let formattedDate = editingEvent.date || '';
    let day = editingEvent.day || 0;
    
    if (editingEvent.time) {
      const dateObj = new Date(editingEvent.time);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
        day = dateObj.getDate();
      }
    }

    const payload: any = {
      title_vi: editingEvent.title_vi,
      title_en: editingEvent.title_en || '',
      date: formattedDate,
      time: editingEvent.time || '',
      end_time: editingEvent.endTime !== undefined ? editingEvent.endTime : (editingEvent.end_time || ''),
      day: day,
      code: editingEvent.code || '',
      location: editingEvent.location || '',
      description_vi: editingEvent.description_vi || '',
      description_en: editingEvent.description_en || '',
      content_vi: editingEvent.content_vi || '',
      content_en: editingEvent.content_en || '',
      image: editingEvent.image || '',
      category: editingEvent.category || 'sachnhaminh',
      sub_category_id: editingEvent.subCategory !== undefined ? editingEvent.subCategory : (editingEvent.sub_category_id || null),
      max_attendees: Number(editingEvent.maxAttendees !== undefined ? editingEvent.maxAttendees : editingEvent.max_attendees) || 0,
      approved_count: Number(editingEvent.approvedCount !== undefined ? editingEvent.approvedCount : editingEvent.approved_count) || 0,
    };
    try {
      if (editingEvent.id === 'NEW') {
        const generatedCode = 'EVT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const insertPayload = {
          ...payload,
          code: payload.code || generatedCode,
          created_by: user?.email || 'Unknown'
        };
        const { error } = await supabase.from('events').insert(insertPayload);
        if (error) throw error;
        alert('Tạo sự kiện thành công!');
      } else {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id);
        if (error) throw error;
        alert('Cập nhật sự kiện thành công!');
      }
      setEditingEvent(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Lỗi khi lưu sự kiện:', error);
      alert('Lỗi lưu sự kiện: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleSelectReg = (id: string) => {
    setSelectedRegIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllRegs = () => {
    if (selectedRegIds.length === eventRegistrations.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(eventRegistrations.map(reg => reg.id));
    }
  };

  const sendTicketsToSelected = async () => {
    if (selectedRegIds.length === 0) return;
    try {
      await Promise.all(selectedRegIds.map(id => 
        supabase.from('registrations').update({
          ticket_sent: true,
          updated_at: new Date().toISOString()
        }).eq('id', id)
      ));
      setSelectedRegIds([]);
      if (selectedEventForRegistrations) {
         fetchRegistrations(selectedEventForRegistrations.id);
      }
      alert('Đã gửi vé thành công cho các khách được chọn!');
    } catch (error) {
      console.error("Error sending tickets: ", error);
      alert('Lỗi khi gửi vé. Vui lòng thử lại.');
    }
  };

  const updateRegistrationStatus = async (registration: any, status: 'approved' | 'rejected') => {
    await supabase.from('registrations').update({
      status
    }).eq('id', registration.id);

    // If approved, update event approvedCount
    const participantsCount = registration.participants ? Number(registration.participants) : 1;
    const targetEventId = registration.eventId || registration.event_id;
    
    if (status === 'approved' && registration.status !== 'approved') {
       const ev = events.find(e => String(e.id) === String(targetEventId));
       if (ev) {
          await supabase.from('events').update({
             approved_count: (ev.approved_count || 0) + participantsCount
          }).eq('id', ev.id);
          fetchEvents();
       }
    } else if (status !== 'approved' && registration.status === 'approved') {
       const ev = events.find(e => String(e.id) === String(targetEventId));
       if (ev) {
          await supabase.from('events').update({
             approved_count: Math.max(0, (ev.approved_count || 0) - participantsCount)
          }).eq('id', ev.id);
          fetchEvents();
       }
    }
    
    // Send Email if Approved
    if (status === 'approved' && registration.status !== 'approved') {
      try {
        const targetEventId = registration.eventId || registration.event_id;
        const ev = events.find(e => String(e.id) === String(targetEventId));
        
        // Find template: specific first, then general
        let template = emailTemplates.find(t => String(t.event_id) === String(targetEventId));
        if (!template) {
          template = emailTemplates.find(t => !t.event_id);
        }

        if (template && ev && registration.email) {
          const ticketCode = `SNM-${String(registration.id).split('-')[0].toUpperCase()}`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketCode}`;
          const qrCodeHtml = `<img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px;" />`;
          const startDateStr = ev.date || '';
          let timeStr = '';
          if (ev.time) {
             const d = new Date(ev.time);
             if (!isNaN(d.getTime())) timeStr += d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          }
          const et = ev.end_time || ev.endTime;
          if (et) {
             const d2 = new Date(et);
             if (!isNaN(d2.getTime())) {
                if (timeStr) timeStr += ' - ';
                timeStr += d2.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
             }
          }
          const eventTime = timeStr ? `${startDateStr} (${timeStr})` : startDateStr;

          const replacements = {
            Ten_Khach_Hang: registration.name || '',
            Ten_Su_Kien: ev.title_vi || '',
            Ma_Ve: ticketCode,
            QR_Code: qrCodeHtml,
            Thoi_Gian: eventTime,
            Dia_Diem: ev.location || '',
            So_Nguoi: registration.participants ? String(registration.participants) : '1',
          };

          const sent = await sendRegistrationEmail(registration.email, template.subject, template.body_html, replacements);
          if (sent) {
            await supabase.from('registrations').update({ ticket_sent: true, updated_at: new Date().toISOString() }).eq('id', registration.id);
            showNotification(`Đã gửi email xác nhận cho ${registration.name}`);
          } else {
            showNotification(`Không thể gửi email cho ${registration.name}. Hãy kiểm tra cấu hình.`);
          }
        } else if (!template) {
           console.warn("Không tìm thấy mẫu email nào để gửi.");
        }
      } catch (err) {
        console.error("Lỗi gửi email:", err);
      }
    }
    
    fetchRegistrations(registration.eventId || registration.event_id);
    fetchAllRegistrations();
  };

  const saveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title_vi: editingBook.title_vi,
      title_en: editingBook.title_en || '',
      author: editingBook.author || '',
      cover_url: editingBook.coverUrl || '',
      review_vi: editingBook.review_vi || '',
      review_en: editingBook.review_en || '',
      summary_vi: editingBook.summary_vi || '',
      summary_en: editingBook.summary_en || '',
      rating: editingBook.rating ? Number(editingBook.rating) : 5,
      is_hot_month: editingBook.isHotMonth === true,
      is_typical_10: editingBook.isTypical10 === true,
      is_must_read_100: editingBook.isMustRead100 === true,
      publisher: editingBook.publisher || '',
      year: editingBook.year || '',
      translator: editingBook.translator || '',
      isbn: editingBook.isbn || '',
      age: editingBook.age || '',
      category: editingBook.category || 'General',
      price_vi: editingBook.price_vi || '',
      price_en: editingBook.price_en || '',
      tiki_url: editingBook.tikiUrl || '',
    };
    if (editingBook.id === 'NEW') {
      await supabase.from('books').insert(payload);
    } else {
      await supabase.from('books').update(payload).eq('id', editingBook.id);
    }
    setEditingBook(null);
    fetchBooks();
  };

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const emailKey = editingRole.email.toLowerCase().trim();
    if (!emailKey.includes('@')) {
      setIsSaving(false);
      return alert('Email không hợp lệ');
    }

    const payload = {
      email: emailKey,
      is_admin: editingRole.isAdmin === true,
    };

    try {
      if (editingRole.id === 'NEW') {
        const password = editingRole.password;
        if (!password || password.length < 6) {
          setIsSaving(false);
          return alert('Mật khẩu bắt buộc và phải có tối thiểu 6 ký tự');
        }

        // 1. Ghi phân quyền vào public.roles trước (để trigger database nhận diện khi auth.users được tạo)
        const { error: rolesError } = await supabase.from('roles').insert(payload);
        if (rolesError) throw rolesError;

        // 2. Tạo tài khoản trong Supabase Auth bằng client phụ không lưu session
        const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL || '',
          import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          }
        );

        const { error: authError } = await tempSupabase.auth.signUp({
          email: emailKey,
          password: password,
        });

        if (authError) {
          // Rollback nếu tạo tài khoản auth thất bại
          await supabase.from('roles').delete().eq('email', emailKey);
          throw authError;
        }

        alert('Đã tạo tài khoản và phân quyền thành công!');
      } else {
        // Cập nhật phân quyền trong public.roles
        const { error: rolesError } = await supabase.from('roles').update(payload).eq('email', emailKey);
        if (rolesError) throw rolesError;

        // Cập nhật cả trong public.profiles nếu tài khoản đã tồn tại
        await supabase.from('profiles').update({ is_admin: payload.is_admin }).eq('email', emailKey);
        
        alert('Đã cập nhật phân quyền thành công!');
      }
      setEditingRole(null);
      fetchRoles();
    } catch (error: any) {
      console.error(error);
      alert('Lỗi lưu tài khoản/phân quyền: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  
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

  const saveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory) return;
    const payload = {
      name_vi: editingSubCategory.name_vi || '',
      name_en: editingSubCategory.name_en || ''
    };
    try {
      if (editingSubCategory.id === 'NEW') {
        const { error } = await supabase.from('sub_categories').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sub_categories').update(payload).eq('id', editingSubCategory.id);
        if (error) throw error;
      }
      setEditingSubCategory(null);
      fetchSubCategories();
      fetchArticleCategories();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi lưu danh mục: ' + err.message);
    }
  };

  const deleteSubCategory = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Các sự kiện thuộc danh mục này sẽ không bị xóa nhưng có thể hiển thị không đúng danh mục.')) {
      try {
        const { error } = await supabase.from('sub_categories').delete().eq('id', id);
        if (error) throw error;
        fetchSubCategories();
      fetchArticleCategories();
      } catch (err: any) {
        console.error(err);
        alert('Lỗi khi xóa danh mục: ' + err.message);
      }
    }
  };

  const deleteArticle = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      await supabase.from('articles').delete().eq('id', id);
      fetchArticles();
    }
  };

  const deleteGallery = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa media này?')) {
      await supabase.from('gallery').delete().eq('id', id);
      fetchGallery();
    }
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchEvents();
    }
  };

  const deleteBook = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sách này?')) {
      await supabase.from('books').delete().eq('id', id);
      fetchBooks();
    }
  };

  const deleteRole = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản/quyền này?')) {
      // Find role email by id
      const r = roles.find(role => role.id === id || role.email === id);
      if (r) {
        // 1. Xóa khỏi bảng public.roles
        await supabase.from('roles').delete().eq('email', r.email);

        // 2. Cập nhật is_admin = false trong public.profiles
        await supabase.from('profiles').update({ is_admin: false }).eq('email', r.email);

        fetchRoles();
      }
    }
  };

  const markContactAsRead = async (id: string) => {
    await supabase.from('contacts').update({ status: 'read' }).eq('id', id);
    fetchContacts();
  };

  const deleteContact = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) {
      await supabase.from('contacts').delete().eq('id', id);
      fetchContacts();
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">Admin Login</h1>
          <p className="text-gray-500 text-center mb-8 text-sm">Please sign in to access the dashboard</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email / Tài khoản</label>
              <input 
                type="email" 
                required 
                placeholder="admin@sachnhaminh.com"
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <button type="submit" className="w-full bg-black hover:bg-gray-850 transition-colors text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 mt-6">
              Đăng nhập
            </button>
          </form>
          {loginError && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {loginError}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
         <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-500 mb-6 text-sm">You don't have administrator privileges.</p>
            <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors">Sign out</button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{t.portal}</h1>
          <button onClick={() => setAdminLang(adminLang === 'vi' ? 'en' : 'vi')} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">
             {adminLang === 'vi' ? 'VI' : 'EN'}
          </button>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {(t as any).dashboard}
          </button>
          <button 
            onClick={() => setActiveTab('slides')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'slides' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ImageIcon className="w-5 h-5" />
            {t.slides}
          </button>
          <button 
            onClick={() => setActiveTab('articles')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'articles' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" />
            {t.articles}
          </button>
          <button 
            onClick={() => setActiveTab('gallery')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'gallery' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ImageIcon className="w-5 h-5" />
            {t.gallery}
          </button>
          <button 
            onClick={() => setActiveTab('events')} 
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'events' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              {t.events}
            </div>
            {allRegistrations.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {allRegistrations.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('checkin')} 
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'checkin' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5" />
              {t.checkin}
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('crm')} 
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'crm' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              {t.crm}
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('books')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'books' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BookOpen className="w-5 h-5" />
            {t.books}
          </button>
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Tag className="w-5 h-5" />
            {t.categories}
          </button>
          
          <button 
            onClick={() => setActiveTab('articleCategories')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'articleCategories' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Tag className="w-5 h-5" />
            {(t as any).articleCategories}
          </button>
          
          <button 
            onClick={() => setActiveTab('emailTemplates')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'emailTemplates' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Mail className="w-5 h-5" />
            {(t as any).emailTemplates}
          </button>

          <div className="pt-4 mt-2 border-t border-gray-100">
             <button 
               onClick={() => setActiveTab('contacts')} 
               className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <div className="flex items-center gap-3">
                 <Mail className="w-5 h-5" />
                 {(t as any).contacts}
               </div>
               {contacts.filter(c => c.status === 'new').length > 0 && (
                 <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                   {contacts.filter(c => c.status === 'new').length}
                 </span>
               )}
             </button>
             <button 
               onClick={() => setActiveTab('roles')} 
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'roles' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <Users className="w-5 h-5" />
               {t.roles}
             </button>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
             <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full" />
             <div className="text-xs truncate text-gray-500 font-medium">{user.email}</div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            {t.signOut}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">{t[activeTab as keyof typeof t]} {t.management}</h2>
          <div className="flex items-center gap-3">
             {activeTab === 'slides' && (
                <button onClick={() => setEditingSlide({ id: 'NEW', title_vi: '', content_vi: '', order: slides.length + 1 })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {t.addSlide}
                </button>
             )}
             {activeTab === 'articles' && (
                <button onClick={() => setEditingArticle({ id: 'NEW', title_vi: '', content_vi: '', category: 'school' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {t.addArticle}
                </button>
             )}
             {activeTab === 'gallery' && (
                <button onClick={() => setEditingGallery({ id: 'NEW', type: 'image', category: 'school', title: '' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {t.addMedia}
                </button>
             )}
             
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

          {activeTab === 'events' && (
                <button onClick={() => setEditingEvent({ id: 'NEW', title_vi: '', category: 'sachnhaminh' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {t.addEvent}
                </button>
             )}
             {activeTab === 'categories' && (
                <button onClick={() => setEditingSubCategory({ id: 'NEW', name_vi: '', name_en: '' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {t.addCategory}
                </button>
             )}
             
             {activeTab === 'articleCategories' && (
                <button onClick={() => setEditingArticleCategory({ id: 'NEW', name_vi: '', name_en: '' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {(t as any).addArticleCategory}
                </button>
             )}

             {activeTab === 'books' && (
                <div className="flex items-center gap-2">
                  <button onClick={downloadBookTemplate} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                    Tải file mẫu
                  </button>
                  <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
                    Nhập Excel
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportBooks} />
                  </label>
                  <button onClick={() => setEditingBook({ id: 'NEW', title_vi: '', author: '', rating: 5 })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> {t.addBook}
                  </button>
                </div>
             )}
             {activeTab === 'roles' && (
                <button onClick={() => setEditingRole({ id: 'NEW', email: '', isAdmin: false })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <UserPlus className="w-4 h-4" /> {t.addUser}
                </button>
             )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-gray-50">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500 font-medium">Sự kiện</p>
                        <h4 className="text-3xl font-bold text-gray-900 mt-1">{events.length}</h4>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Calendar className="w-6 h-6" />
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500 font-medium">Người ĐK T.Gia</p>
                        <h4 className="text-3xl font-bold text-gray-900 mt-1">{allRegistrations.length}</h4>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Users className="w-6 h-6" />
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500 font-medium">Sách (Đánh giá)</p>
                        <h4 className="text-3xl font-bold text-gray-900 mt-1">{books.length}</h4>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <BookOpen className="w-6 h-6" />
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500 font-medium">Bài viết</p>
                        <h4 className="text-3xl font-bold text-gray-900 mt-1">{articles.length}</h4>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                        <FileText className="w-6 h-6" />
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-sm text-gray-500 font-medium">Thư viện (Ảnh/Vdeo)</p>
                        <h4 className="text-3xl font-bold text-gray-900 mt-1">{gallery.length}</h4>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <ImageIcon className="w-6 h-6" />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Category Distribution - Articles */}
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <h3 className="text-base font-semibold text-gray-800 mb-4">Phân bổ Bài viết</h3>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    ...articleCategories.map(cat => ({
                                       name: cat.name_vi,
                                       value: articles.filter(a => a.category === cat.id || a.category === cat.name_vi || a.category === cat.name_en?.toLowerCase() || (a.category === 'school' && cat.name_vi === 'Góc nhà mình') || (a.category === 'skills' && cat.name_vi === 'Kỹ năng cha mẹ')).length
                                    })),
                                    { name: 'Khác', value: articles.filter(a => {
                                       return !articleCategories.some(cat => a.category === cat.id || a.category === cat.name_vi || a.category === cat.name_en?.toLowerCase() || (a.category === 'school' && cat.name_vi === 'Góc nhà mình') || (a.category === 'skills' && cat.name_vi === 'Kỹ năng cha mẹ'));
                                    }).length }
                                 ].filter(d => d.value > 0)}
                                 cx="50%"
                                 cy="50%"
                                 labelLine={false}
                                 outerRadius={80}
                                 fill="#8884d8"
                                 dataKey="value"
                                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                 <Cell fill="#0088FE" />
                                 <Cell fill="#00C49F" />
                                 <Cell fill="#FFBB28" />
                              </Pie>
                              <Tooltip />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Media Distribution */}
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <h3 className="text-base font-semibold text-gray-800 mb-4">Phân bổ Thư viện (Ảnh vs Video)</h3>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Hình ảnh', value: gallery.filter(g => g.type === 'image').length },
                                    { name: 'Video', value: gallery.filter(g => g.type === 'video').length },
                                 ].filter(d => d.value > 0)}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={50}
                                 outerRadius={80}
                                 fill="#8884d8"
                                 dataKey="value"
                                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                 <Cell fill="#8b5cf6" />
                                 <Cell fill="#ec4899" />
                              </Pie>
                              <Tooltip />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Top Events by Registrations */}
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <h3 className="text-base font-semibold text-gray-800 mb-4">Sự kiện thu hút nhất</h3>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart
                              data={events.map(ev => ({
                                 name: ev.title_vi ? ev.title_vi.substring(0, 10) + '...' : 'Event',
                                 registrations: allRegistrations.filter(r => r.eventId === ev.id).length
                              })).sort((a,b) => b.registrations - a.registrations).slice(0, 5)}
                              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                           >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" fontSize={11} tickMargin={10} />
                              <YAxis allowDecimals={false} fontSize={11} />
                              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                              <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Lượt ĐK">
                                 {
                                    [...Array(5)].map((_, index) => (
                                       <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                                    ))
                                 }
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'slides' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">Vị trí</div>
                  <div className="col-span-6">Hình ảnh & Tựa đề</div>
                  <div className="col-span-3">Hiệu ứng</div>
                  <div className="col-span-2 text-right">Actions</div>
               </div>
               <div className="divide-y divide-gray-100">
                  {slides.map((slide, index) => (
                    <div key={slide.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-1 flex items-center gap-2">
                        <span className="font-bold text-gray-500">{slide.order}</span>
                      </div>
                      <div className="col-span-6 flex items-center gap-4">
                        {slide.imageUrl ? (
                           <img src={slide.imageUrl} alt="" className="w-20 h-12 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                           <div className="w-20 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                           </div>
                        )}
                        <div className="truncate">
                           <div className="font-bold text-gray-900 truncate prose-p:m-0 prose-headings:m-0" dangerouslySetInnerHTML={{__html: slide.heading_vi || 'No title'}} />
                           <p className="text-xs text-gray-500 truncate">{slide.description_vi}</p>
                        </div>
                      </div>
                      <div className="col-span-3 text-sm text-gray-600 capitalize">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                           {slide.effect || 'fade'}
                         </span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button onClick={() => setEditingSlide(slide)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteSlide(slide.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {slides.length === 0 && (
                     <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <ImageIcon className="w-12 h-12 text-gray-200 mb-3" />
                        <p>{t.noSlides}</p>
                     </div>
                  )}
               </div>
            </div>
          )}
          {activeTab === 'articles' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">Title</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2 text-right">Actions</div>
               </div>
               <div className="divide-y divide-gray-100">
                  {articles.map(article => (
                    <div key={article.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-6 flex items-center gap-4">
                        {article.image ? (
                           <img src={article.image} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                           <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-gray-400" />
                           </div>
                        )}
                        <span className="font-medium text-gray-900 truncate">{article.title_vi}</span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600 capitalize">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                           {article.category}
                         </span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-500 flex items-center gap-1.5">
                         <Calendar className="w-3.5 h-3.5" />
                         {article.date || 'No date'}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button onClick={() => setEditingArticle(article)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteArticle(article.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {articles.length === 0 && (
                     <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-200 mb-3" />
                        <p>{t.noArticles}</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {gallery.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group shadow-sm flex flex-col">
                  <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                    {(item.url || item.thumbnail) ? (
                      <img src={item.url || item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                    {item.type === 'video' && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center">
                             <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-blue-600 ml-1"></div>
                          </div>
                       </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => setEditingGallery({ ...item, eventId: item.event_id })} className="p-2 bg-white text-gray-800 rounded-full hover:bg-blue-50 transition-colors shadow-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteGallery(item.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-gray-900 truncate mb-1" title={item.title}>{item.title || 'Untitled'}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                       <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{item.category}</span>
                       <span className="uppercase text-[10px] font-bold tracking-wider">{item.type}</span>
                    </div>
                  </div>
                </div>
              ))}
              {gallery.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-500 flex flex-col items-center bg-white border border-gray-200 rounded-xl">
                  <ImageIcon className="w-12 h-12 text-gray-200 mb-3" />
                  <p>{t.noGallery}</p>
                </div>
              )}
            </div>
          )}
          
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

          {activeTab === 'events' && (
            selectedEventForRegistrations ? (
               <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                  <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                       <button onClick={() => setSelectedEventForRegistrations(null)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                          Quay lại
                       </button>
                       <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          Danh sách đăng ký: <span className="text-blue-600">{selectedEventForRegistrations.title_vi}</span>
                       </h2>
                    </div>
                    {selectedRegIds.length > 0 && (
                      <button onClick={sendTicketsToSelected} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Gửi vé ({selectedRegIds.length})
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-x-auto bg-white">
                     {eventRegistrations.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                           <Users className="w-12 h-12 text-gray-300 mb-3" />
                           <p>Chưa có người đăng ký nào.</p>
                        </div>
                     ) : (
                        <table className="w-full text-sm text-left text-gray-500">
                           <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                              <tr>
                                 <th scope="col" className="p-4 w-10">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                      onChange={handleSelectAllRegs}
                                      checked={selectedRegIds.length === eventRegistrations.length && eventRegistrations.length > 0}
                                    />
                                 </th>
                                 <th scope="col" className="px-6 py-3 whitespace-nowrap">STT</th>
                                 <th scope="col" className="px-6 py-3 min-w-[200px]">Người Đăng Ký</th>
                                 <th scope="col" className="px-6 py-3">Liên Hệ</th>
                                 <th scope="col" className="px-6 py-3 text-center whitespace-nowrap">Mã Vé & QR</th>
                                 <th scope="col" className="px-6 py-3 whitespace-nowrap">Thời Gian Đk</th>
                                 <th scope="col" className="px-6 py-3 text-center whitespace-nowrap">Trạng Thái</th>
                                 <th scope="col" className="px-6 py-3 text-center whitespace-nowrap">Trạng Thái Vé</th>
                                 <th scope="col" className="px-6 py-3 text-right">Hành Động</th>
                              </tr>
                           </thead>
                           <tbody>
                              {eventRegistrations.map((reg, idx) => (
                                 <tr key={reg.id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 w-10">
                                       <input 
                                         type="checkbox" 
                                         className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                         checked={selectedRegIds.includes(reg.id)}
                                         onChange={() => handleSelectReg(reg.id)}
                                       />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                       <div className="font-bold text-gray-900 flex items-center gap-2">
                                          {reg.name}
                                          {reg.participants && parseInt(reg.participants) > 1 && (
                                             <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                                +{parseInt(reg.participants) - 1} người đi cùng
                                             </span>
                                          )}
                                       </div>
                                       {reg.participantsInfo && Array.isArray(reg.participantsInfo) && reg.participantsInfo.length > 0 && (
                                          <div className="mt-2 text-xs flex flex-col gap-1">
                                             {reg.participantsInfo.map((pInfo: any, i: number) => (
                                                <div key={i} className="text-gray-500">
                                                   - {pInfo.name || `Khách ${i+1}`} {pInfo.info && `(${pInfo.info})`}
                                                </div>
                                             ))}
                                          </div>
                                       )}
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1 text-xs">
                                          <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400 shrink-0" /> <span className="truncate max-w-[150px]" title={reg.email}>{reg.email}</span></span>
                                          {reg.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400 shrink-0" /> {reg.phone}</span>}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                       <div className="flex flex-col items-center gap-1.5">
                                          <div className="bg-white p-1 border border-gray-200 rounded shadow-sm hover:scale-[2] transition-transform origin-top z-10">
                                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SNM-${String(reg.id).split('-')[0].toUpperCase()}`} alt="QR Code" className="w-10 h-10 object-contain" />
                                          </div>
                                          <span className="font-mono text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded tracking-widest border border-gray-200">SNM-{String(reg.id).split('-')[0].toUpperCase()}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                       {reg.created_at ? new Date(reg.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                       {reg.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Pending</span>}
                                       {reg.status === 'approved' && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex justify-center items-center gap-1"><Check className="w-3 h-3" /> Approved</span>}
                                       {reg.status === 'rejected' && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Rejected</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {reg.ticket_sent ? (
                                           <div className="flex flex-col items-center gap-1">
                                             <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded flex border border-green-200 justify-center items-center gap-1"><Check className="w-3 h-3" /> Đã gửi vé</span>
                                             {reg.updated_at && <span className="text-[10px] text-gray-500 font-medium">{new Date(reg.updated_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                                           </div>
                                        ) : <span className="text-orange-500 text-xs bg-orange-50 px-2 py-1 rounded border border-orange-200">Chưa gửi</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex justify-end gap-1.5 flex-wrap">
                                          {reg.status !== 'approved' && (
                                             <button onClick={() => updateRegistrationStatus(reg, 'approved')} className="text-xs px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded shadow-sm transition-colors flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Duyệt
                                             </button>
                                          )}
                                          {reg.status !== 'rejected' && (
                                             <button onClick={() => updateRegistrationStatus(reg, 'rejected')} className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 font-medium rounded shadow-sm transition-colors flex items-center gap-1">
                                                <X className="w-3 h-3" /> Từ chối
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     )}
                  </div>
               </div>
            ) : (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white">
                 <input
                   type="text"
                   placeholder="Lọc sự kiện (mã, tên)..."
                   value={adminEventSearch}
                   onChange={(e) => setAdminEventSearch(e.target.value)}
                   className="border border-gray-300 rounded-lg px-4 py-2 text-sm max-w-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                 />
                 <input
                   type="date"
                   value={adminEventDate}
                   onChange={(e) => setAdminEventDate(e.target.value)}
                   className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-gray-600"
                 />
                 {(adminEventSearch || adminEventDate) && (
                   <button onClick={() => { setAdminEventSearch(''); setAdminEventDate(''); }} className="text-sm text-gray-500 hover:text-blue-600">Xóa lọc</button>
                 )}
               </div>
               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">STT</div>
                  <div className="col-span-1">Mã SK</div>
                  <div className="col-span-3">Event Title</div>
                  <div className="col-span-2">Creator / At</div>
                  <div className="col-span-2">Date/Time</div>
                  <div className="col-span-2">Location/Attendees</div>
                  <div className="col-span-1 text-right">Actions</div>
               </div>
               <div className="divide-y divide-gray-100">
                  {events
                    .filter(e => {
                      let match = true;
                      if (adminEventSearch) {
                        const q = adminEventSearch.toLowerCase();
                        match = match && (e.code?.toLowerCase().includes(q) || e.title_vi?.toLowerCase().includes(q) || e.title_en?.toLowerCase().includes(q));
                      }
                      if (adminEventDate && e.time) {
                         const filterDate = new Date(adminEventDate).toLocaleDateString('en-GB'); // dd/mm/yyyy roughly if e.date is formatted that way or we can check e.time
                         const eventDate = new Date(e.time);
                         if (!isNaN(eventDate.getTime())) {
                            const eDateStr = eventDate.toISOString().split('T')[0]; // "yyyy-mm-dd" which matches <input type="date">
                            match = match && (eDateStr === adminEventDate);
                         } else {
                            match = false; // invalid date can't match a specific date filter
                         }
                      }
                      return match;
                    })
                    .sort((a, b) => {
                      const timeA = a.createdAt?.seconds || 0;
                      const timeB = b.createdAt?.seconds || 0;
                      return timeB - timeA;
                    })
                    .map((event, index) => {
                      const pendingCount = allRegistrations.filter(r => String(r.eventId || r.event_id) === String(event.id) && r.status === 'pending').length;
                      const actualApprovedCount = allRegistrations.filter(r => String(r.eventId || r.event_id) === String(event.id) && r.status === 'approved').reduce((sum, r) => sum + (Number(r.participants) || 1), 0);
                      return (
                      <div key={event.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
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
                      <div className="col-span-1 flex justify-end gap-2">
                        <button onClick={() => {
                           setSelectedEventForRegistrations(event);
                           fetchRegistrations(event.id);
                           if (newEventRegistrations[event.id]) {
                             setNewRegistrationCount(prev => Math.max(0, prev - newEventRegistrations[event.id]));
                             setNewEventRegistrations(prev => {
                               const up = {...prev};
                               delete up[event.id];
                               return up;
                             });
                           }
                        }} className="relative p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Manage Registrations">
                          <Users className="w-4 h-4" />
                          {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                               {pendingCount}
                            </span>
                          )}
                        </button>
                        <button onClick={() => setEditingEvent(event)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteEvent(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
               </div>
            </div>
            )
          )}

          {activeTab === 'checkin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6 p-6">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-800">Check-in Sự kiện</h2>
                 <button onClick={() => setShowScanner(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                   Quét mã QR
                 </button>
              </div>
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="Tìm tên sự kiện..." 
                      value={checkinEventSearch}
                      onChange={(e) => setCheckinEventSearch(e.target.value)}
                      className="flex-grow border border-gray-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input 
                      type="date" 
                      value={checkinEventDate}
                      onChange={(e) => setCheckinEventDate(e.target.value)}
                      className="w-40 border border-gray-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select 
                    value={checkinEventId} 
                    onChange={(e) => setCheckinEventId(e.target.value)}
                    size={checkinEventSearch || checkinEventDate ? 5 : 1}
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn sự kiện để check-in --</option>
                    {events.filter(ev => {
                      const matchSearch = (ev.title_vi || '').toLowerCase().includes(checkinEventSearch.toLowerCase()) || 
                                          (ev.title_en || '').toLowerCase().includes(checkinEventSearch.toLowerCase());
                      
                      let matchDate = true;
                      if (checkinEventDate && ev.time) {
                         const eventDate = new Date(ev.time);
                         if (!isNaN(eventDate.getTime())) {
                            matchDate = eventDate.toISOString().split('T')[0] === checkinEventDate;
                         } else {
                            matchDate = false;
                         }
                      }
                      return matchSearch && matchDate;
                    }).map(ev => (
                      <option key={ev.id} value={ev.id}>{adminLang === 'vi' ? ev.title_vi : ev.title_en}</option>
                    ))}
                  </select>
                </div>
                {checkinEventId && (
                  <div className="md:w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dùng máy quét QR vật lý</label>
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Quét mã QR vào đây..."
                      value={scannerInput}
                      onChange={(e) => setScannerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (scannerInput.trim()) {
                             handleScan(scannerInput.trim());
                             setScannerInput('');
                          }
                        }
                      }}
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {checkinEventId && (() => {
                const eventRegs = allRegistrations.filter(r => (r.event_id === checkinEventId || r.eventId === checkinEventId) && r.status === 'approved');
                const totalParticipants = eventRegs.reduce((sum, r) => sum + (Number(r.participants) || 1), 0);
                const checkedInParticipants = eventRegs.filter(r => r.checked_in).reduce((sum, r) => sum + (Number(r.participants) || 1), 0);
                
                return (
                <div className="overflow-hidden">
                  <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <input 
                      type="text" 
                      placeholder="Tìm khách hàng theo tên, sđt, email, mã vé..." 
                      value={checkinCustomerSearch}
                      onChange={(e) => setCheckinCustomerSearch(e.target.value)}
                      className="w-full md:w-1/2 border border-gray-300 px-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg font-semibold border border-emerald-100 shadow-sm flex items-center gap-2 whitespace-nowrap">
                       <Check className="w-5 h-5 text-emerald-600" />
                       <span>Đã check-in: <span className="text-xl">{checkedInParticipants}</span> / {totalParticipants}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th scope="col" className="px-6 py-3">Khách hàng</th>
                          <th scope="col" className="px-6 py-3 text-center">Trạng thái Check-in</th>
                          <th scope="col" className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allRegistrations.filter(r => {
                           if (!((r.event_id === checkinEventId || r.eventId === checkinEventId) && r.status === 'approved')) return false;
                           if (!checkinCustomerSearch) return true;
                           
                           const q = checkinCustomerSearch.toLowerCase();
                           const ticketCode = `SNM-${String(r.id).split('-')[0].toUpperCase()}`;
                           
                           return (r.name || '').toLowerCase().includes(q) || 
                                  (r.phone || '').toLowerCase().includes(q) || 
                                  (r.email || '').toLowerCase().includes(q) || 
                                  ticketCode.toLowerCase().includes(q);
                        }).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Không có khách nào được duyệt cho sự kiện này.</td>
                        </tr>
                      ) : (
                          allRegistrations.filter(r => {
                             if (!((r.event_id === checkinEventId || r.eventId === checkinEventId) && r.status === 'approved')) return false;
                             if (!checkinCustomerSearch) return true;
                             
                             const q = checkinCustomerSearch.toLowerCase();
                             const ticketCode = `SNM-${String(r.id).split('-')[0].toUpperCase()}`;
                             
                             return (r.name || '').toLowerCase().includes(q) || 
                                    (r.phone || '').toLowerCase().includes(q) || 
                                    (r.email || '').toLowerCase().includes(q) || 
                                    ticketCode.toLowerCase().includes(q);
                          }).map(reg => (
                            <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{reg.name}</div>
                              <div className="text-xs text-gray-500">{reg.email} • {reg.phone}</div>
                              <div className="text-xs text-indigo-600 font-mono mt-1 font-bold">Mã vé: SNM-{String(reg.id).split('-')[0].toUpperCase()}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {reg.checked_in ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    <Check className="w-3 h-3" /> Đã Check-in
                                  </span>
                                  <div className="text-[10px] text-gray-400 mt-1">
                                     {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('vi-VN') : ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Chưa Check-in
                               </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {!reg.checked_in && (
                                <button 
                                  onClick={() => handleCheckin(reg.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                                >
                                  Check-in Thủ Công
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );})()}
            </div>
          )}

          {showScanner && (
             <CheckinScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
          )}

          {activeTab === 'crm' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6 p-6">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Users className="w-6 h-6 text-indigo-600" />
                     Danh sách Khách hàng ({crmData.length})
                  </h2>
                  <button onClick={handleExportCRM} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                     <Download className="w-4 h-4" /> Xuất Excel
                  </button>
               </div>
               
               <div className="mb-6 flex items-center">
                  <input 
                     type="text" 
                     placeholder="Tìm khách hàng theo tên, sđt, email..." 
                     value={crmSearch}
                     onChange={(e) => setCrmSearch(e.target.value)}
                     className="w-full md:w-1/2 border border-gray-300 px-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                           <th scope="col" className="px-6 py-3">Khách hàng</th>
                           <th scope="col" className="px-6 py-3 text-center">Đã Đăng ký</th>
                           <th scope="col" className="px-6 py-3 text-center">Tham gia (Check-in)</th>
                           <th scope="col" className="px-6 py-3 text-center">Tỷ lệ</th>
                           <th scope="col" className="px-6 py-3 text-right">Chi tiết</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {crmData.filter((c: any) => {
                           if (!crmSearch) return true;
                           const q = crmSearch.toLowerCase();
                           return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
                        }).map((c: any) => (
                           <tr key={c.email} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="font-semibold text-gray-900">{c.name}</div>
                                 <div className="text-xs text-gray-500">{c.email} {c.phone ? `• ${c.phone}` : ''}</div>
                              </td>
                              <td className="px-6 py-4 text-center font-medium text-gray-900">{c.totalRegistered}</td>
                              <td className="px-6 py-4 text-center font-medium text-emerald-600">{c.totalAttended}</td>
                              <td className="px-6 py-4 text-center">
                                 {c.totalRegistered > 0 ? (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.totalAttended / c.totalRegistered >= 0.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                       {Math.round((c.totalAttended / c.totalRegistered) * 100)}%
                                    </span>
                                 ) : '-'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button onClick={() => setSelectedCustomer(c)} className="text-indigo-600 hover:text-indigo-900 text-xs font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                    Hồ sơ
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          
             {activeTab === 'articleCategories' && (
                <button onClick={() => setEditingArticleCategory({ id: 'NEW', name_vi: '', name_en: '' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> {(t as any).addArticleCategory}
                </button>
             )}

             {activeTab === 'books' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Book</div>
                  <div className="col-span-3">Author</div>
                  <div className="col-span-2 text-center">Rating</div>
                  <div className="col-span-2 text-right">Actions</div>
               </div>
               <div className="divide-y divide-gray-100">
                  {books.map(book => (
                    <div key={book.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-5 flex items-center gap-3">
                         {book.coverUrl ? (
                            <img src={book.coverUrl} className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200" />
                         ) : (
                            <div className="w-10 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                               <BookOpen className="w-4 h-4 text-gray-400" />
                            </div>
                         )}
                         <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900 line-clamp-2">{book.title_vi}</span>
                            <div className="flex flex-wrap gap-1">
                               {book.isHotMonth && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Hot in Month</span>}
                               {book.isTypical10 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">Top 10</span>}
                               {book.isMustRead100 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">100 Must Read</span>}
                            </div>
                         </div>
                      </div>
                      <div className="col-span-3 text-sm text-gray-500">{book.author}</div>
                      <div className="col-span-2 text-center text-sm font-medium text-yellow-600 flex items-center justify-center gap-1">
                         <Star className="w-4 h-4 fill-current" /> {book.rating}/5
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button onClick={() => setEditingBook(book)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteBook(book.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'emailTemplates' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-5xl mx-auto">
               <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Quản lý Mẫu Email</h3>
                  <p className="text-xs text-gray-500">Mẫu Email chung và riêng cho từng sự kiện</p>
               </div>
               <div className="p-4">
                  <div className="mb-4 flex gap-2">
                    <button onClick={() => setEditingEmailTemplate({ id: 'NEW', event_id: null, subject: '', body_html: '' })} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Thêm Mẫu Mới
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {emailTemplates.map(tpl => {
                        const eventObj = events.find(e => String(e.id) === String(tpl.event_id));
                        const eventName = eventObj ? eventObj.title_vi : 'Sự kiện không tồn tại';
                        return (
                           <div key={tpl.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 relative hover:shadow-md transition-all">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tpl.event_id ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                       {tpl.event_id ? 'Mẫu Sự Kiện' : 'Mẫu Chung'}
                                    </span>
                                 </div>
                                 <div className="flex gap-1">
                                    <button onClick={() => setEditingEmailTemplate(tpl)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={async () => {
                                       if(window.confirm('Xóa mẫu email này?')) {
                                          await supabase.from('email_templates').delete().eq('id', tpl.id);
                                          fetchEmailTemplates();
                                       }
                                    }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </div>
                              {tpl.event_id && <div className="text-xs font-semibold text-gray-600 line-clamp-1">Sự kiện: {eventName}</div>}
                              <div className="font-semibold text-gray-900 mt-1 line-clamp-2">{tpl.subject}</div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-4xl mx-auto">
               <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Tài khoản & Phân quyền</h3>
                  <p className="text-xs text-gray-500">Chỉ những email được thêm tại đây mới có quyền đăng nhập trang quản trị.</p>
               </div>
               <div className="divide-y divide-gray-100">
                  {roles.map(role => (
                    <div key={role.id || role.email} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {role.email.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <div className="font-medium text-gray-900">{role.email}</div>
                            <div className="text-xs text-gray-500">{role.is_admin ? 'Quản trị viên (Admin)' : 'Biên tập viên (Editor)'}</div>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingRole({ ...role, isAdmin: role.is_admin })} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteRole(role.id || role.email)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
          {activeTab === 'contacts' && (
            <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-6xl mx-auto">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800">{(t as any).contacts}</h3>
               </div>
               {contacts.length === 0 ? (
                 <div className="p-12 text-center text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{(t as any).noContacts || 'No contacts yet.'}</p>
                 </div>
               ) : (
                 <div className="divide-y divide-gray-100 text-sm">
                    {contacts.map(contact => (
                      <div key={contact.id} className={`p-4 hover:bg-gray-50 transition-colors flex justify-between items-start ${contact.status === 'new' ? 'bg-blue-50/30' : ''}`}>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <div className="font-bold text-gray-900">{contact.name}</div>
                               <div className="text-gray-500 border-l border-gray-300 pl-2 ml-1">{contact.phone}</div>
                               <div className="text-gray-500 border-l border-gray-300 pl-2 ml-1">{contact.email}</div>
                               {contact.status === 'new' && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">New</span>}
                            </div>
                            <div className="text-gray-700 whitespace-pre-wrap">{contact.message}</div>
                            <div className="text-[10px] text-gray-400 font-medium">
                               {contact.createdAt?.toDate ? new Date(contact.createdAt.toDate()).toLocaleString() : ''}
                            </div>
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                           {contact.status === 'new' && (
                             <button onClick={() => markContactAsRead(contact.id)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mark as Read">
                               <Check className="w-4 h-4" />
                             </button>
                           )}
                           <button onClick={() => deleteContact(contact.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6 text-left max-w-4xl mx-auto">
              {subCategories.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Tag className="w-8 h-8 text-blue-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Danh mục đang trống</h4>
                      <p className="text-xs text-blue-700 mt-0.5">Khởi tạo nhanh các danh mục mặc định để bắt đầu phân loại.</p>
                    </div>
                  </div>
                  <button onClick={seedDefaultCategories} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs shadow transition-colors shrink-0">
                    Khởi tạo danh mục mặc định
                  </button>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm">Danh sách danh mục sự kiện</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Các danh mục con dùng chung cho toàn bộ sự kiện</p>
                </div>
                <div className="divide-y divide-gray-100 flex-1 min-h-[300px]">
                  {subCategories.map((cat, idx) => (
                    <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{cat.name_vi}</div>
                          <div className="text-xs text-gray-500">{cat.name_en}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingSubCategory(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteSubCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {subCategories.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-xs">Không có danh mục nào. Hãy khởi tạo danh mục hoặc thêm danh mục mới.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide Modal */}
      <AnimatePresence>
         {editingSlide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingSlide(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <ImageIcon className="w-5 h-5 text-blue-600" />
                     {editingSlide.id === 'NEW' ? 'Thêm Slide' : 'Sửa Slide'}
                  </h2>
                  <button onClick={() => setEditingSlide(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div id="slide-form" className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Thứ tự hiển thị</label>
                           <input type="number" value={editingSlide.order || 0} onChange={e => setEditingSlide({...editingSlide, order: e.target.value})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Hiệu ứng chuyển cảnh</label>
                           <select value={editingSlide.effect || 'fade'} onChange={e => setEditingSlide({...editingSlide, effect: e.target.value})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="fade">Mờ dần (Fade)</option>
                              <option value="slide">Trượt (Slide)</option>
                              <option value="zoom">Phóng to (Zoom)</option>
                              <option value="scale">Thu nhỏ (Scale)</option>
                           </select>
                        </div>
                     </div>
                     
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">URL hình ảnh nền</label>
                        <input type="text" value={editingSlide.imageUrl || ''} onChange={e => setEditingSlide({...editingSlide, imageUrl: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                        {editingSlide.imageUrl && (
                           <div className="mt-2 relative aspect-video w-48 rounded bg-gray-100 overflow-hidden border border-gray-200">
                              <img src={editingSlide.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                           </div>
                        )}
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Tiêu đề lớn (Heading) - Tiếng Việt</label>
                           <ReactQuill theme="snow" modules={quillModulesSimple} value={editingSlide.heading_vi || ''} onChange={content => setEditingSlide({...editingSlide, heading_vi: content})} className="bg-white rounded-lg" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Tiêu đề lớn (Heading) - Tiếng Anh</label>
                           <ReactQuill theme="snow" modules={quillModulesSimple} value={editingSlide.heading_en || ''} onChange={content => setEditingSlide({...editingSlide, heading_en: content})} className="bg-white rounded-lg" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Mô tả nhỏ (Description) - Tiếng Việt</label>
                           <textarea value={editingSlide.description_vi || ''} onChange={e => setEditingSlide({...editingSlide, description_vi: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Mô tả nhỏ (Description) - Tiếng Anh</label>
                           <textarea value={editingSlide.description_en || ''} onChange={e => setEditingSlide({...editingSlide, description_en: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                           <button type="button" onClick={() => setArticleFormLang('vi')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${articleFormLang === 'vi' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Tiếng Việt</button>
                           <button type="button" onClick={() => setArticleFormLang('en')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${articleFormLang === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>English</button>
                        </div>
                        
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Nội dung bài viết đính kèm slide ({articleFormLang === 'vi' ? 'VI' : 'EN'})</label>
                           <p className="text-xs text-gray-400 mb-2">Bài viết hiển thị khi khách nhấn vào slide</p>
                           <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                             <ReactQuill 
                               theme="snow" 
                               value={articleFormLang === 'vi' ? (editingSlide.content_vi || '') : (editingSlide.content_en || '')} 
                               onChange={(content) => {
                                 if (articleFormLang === 'vi') setEditingSlide({ ...editingSlide, content_vi: content });
                                 else setEditingSlide({ ...editingSlide, content_en: content });
                               }}
                               className="h-[300px]"
                             />
                           </div>
                           <div className="h-10"></div>
                        </div>
                     </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
                    <button type="button" onClick={() => setEditingSlide(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                    <button type="button" onClick={saveSlide} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Lưu Slide</button>
                  </div>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Article Modal */}
      <AnimatePresence>
         {editingArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingArticle(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <FileText className="w-5 h-5 text-blue-600" />
                     {editingArticle.id === 'NEW' ? 'Create Article' : 'Edit Article'}
                  </h2>
                  <button onClick={() => setEditingArticle(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <form id="article-form" onSubmit={saveArticle} className="space-y-8">
                     
                     {/* Basic Settings */}
                     <div>
                        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Basic Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500">Category</label>
                              <select required value={editingArticle.category || ''} onChange={e => setEditingArticle({...editingArticle, category: e.target.value})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                 <option value="">-- Chọn danh mục --</option>
                                 {articleCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_vi}</option>
                                 ))}
                                 {editingArticle.category && !articleCategories.some(c => c.id === editingArticle.category) && (
                                    <option value={editingArticle.category}>{articleCategories.find(c => c.name_vi === editingArticle.category || c.name_en === editingArticle.category)?.name_vi || editingArticle.category}</option>
                                 )}
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500">Date (Display)</label>
                              <div className="relative">
                                 <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                 <input placeholder="e.g. 15/05/2026" value={editingArticle.date || ''} onChange={e => setEditingArticle({...editingArticle, date: e.target.value})} className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500">Liên kết sự kiện (Tùy chọn)</label>
                              <select value={editingArticle.event_id || ''} onChange={e => setEditingArticle({...editingArticle, event_id: e.target.value || null})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                 <option value="">-- Không liên kết --</option>
                                 {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>
                                       {adminLang === 'vi' ? ev.title_vi : ev.title_en || ev.title_vi}
                                    </option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </div>

                     {/* Media Settings */}
                     <div>
                        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Cover Image</h3>
                        <div className="flex gap-4">
                           {editingArticle.image && (
                              <img src={editingArticle.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                           )}
                           <div className="flex-1 space-y-1">
                              <label className="text-xs font-medium text-gray-500">Image URL</label>
                              <div className="relative">
                                 <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                 <input placeholder="https://..." value={editingArticle.image || ''} onChange={e => setEditingArticle({...editingArticle, image: e.target.value})} className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Content Translation Tabs */}
                     <div>
                        <div className="flex items-center justify-between border-b border-gray-200 mb-4">
                           <h3 className="text-sm font-semibold text-gray-900">Content</h3>
                           <div className="flex bg-gray-100 p-1 rounded-lg">
                              <button type="button" onClick={() => setArticleFormLang('vi')} className={`px-4 py-1 text-xs font-medium rounded-md transition-colors ${articleFormLang === 'vi' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Vietnamese (Primary)</button>
                              <button type="button" onClick={() => setArticleFormLang('en')} className={`px-4 py-1 text-xs font-medium rounded-md transition-colors ${articleFormLang === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>English</button>
                           </div>
                        </div>

                        {articleFormLang === 'vi' && (
                           <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                              <div className="space-y-1">
                                 <label className="text-xs font-medium text-gray-500">Title (VI) <span className="text-red-500">*</span></label>
                                 <div className="relative">
                                    <Type className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                    <input required placeholder="Tiêu đề bài viết..." value={editingArticle.title_vi || ''} onChange={e => setEditingArticle({...editingArticle, title_vi: e.target.value})} className="w-full border border-gray-300 font-medium pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-xs font-medium text-gray-500">Summary (VI)</label>
                                 <textarea placeholder="Tóm tắt ngắn gọn..." value={editingArticle.summary_vi || ''} onChange={e => setEditingArticle({...editingArticle, summary_vi: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-xs font-medium text-gray-500">Full Content (VI) <span className="text-red-500">*</span></label>
                                 <div className="bg-white">
                                    <ReactQuill theme="snow" value={editingArticle.content_vi || ''} onChange={value => setEditingArticle({...editingArticle, content_vi: value})} className="h-64 mb-12" />
                                 </div>
                              </div>
                           </div>
                        )}

                        {articleFormLang === 'en' && (
                           <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
                              <div className="space-y-1">
                                 <label className="text-xs font-medium text-gray-500">Title (EN)</label>
                                 <div className="relative">
                                    <Type className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                    <input placeholder="Article title..." value={editingArticle.title_en || ''} onChange={e => setEditingArticle({...editingArticle, title_en: e.target.value})} className="w-full border border-gray-300 font-medium pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-xs font-medium text-gray-500">Summary (EN)</label>
                                 <textarea placeholder="Brief summary..." value={editingArticle.summary_en || ''} onChange={e => setEditingArticle({...editingArticle, summary_en: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-xs font-medium text-gray-500">Full Content (EN)</label>
                                 <div className="bg-white">
                                    <ReactQuill theme="snow" value={editingArticle.content_en || ''} onChange={value => setEditingArticle({...editingArticle, content_en: value})} className="h-64 mb-12" />
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingArticle(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" form="article-form" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Save Article</button>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Gallery Modal */}
      <AnimatePresence>
         {editingGallery && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingGallery(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <ImageIcon className="w-5 h-5 text-blue-600" />
                     {editingGallery.id === 'NEW' ? 'Add Media' : 'Edit Media'}
                  </h2>
                  <button onClick={() => setEditingGallery(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <form id="gallery-form" onSubmit={saveGallery} className="space-y-5">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Media Type</label>
                           <select value={editingGallery.type} onChange={e => setEditingGallery({...editingGallery, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                             <option value="image">Image</option>
                             <option value="video">Video</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Category</label>
                           <select required value={editingGallery.category || 'school'} onChange={e => setEditingGallery({...editingGallery, category: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                             <option value="school">School</option>
                             <option value="culture">Culture</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Title / Caption</label>
                        <input placeholder="Brief description..." value={editingGallery.title || ''} onChange={e => setEditingGallery({...editingGallery, title: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>

                     {editingGallery.type === 'image' && (
                        <div className="space-y-3">
                           <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500">Image URL <span className="text-red-500">*</span></label>
                              <div className="relative">
                                 <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                 <input required placeholder="https://..." value={editingGallery.url || ''} onChange={e => setEditingGallery({...editingGallery, url: e.target.value})} className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                           </div>
                           {editingGallery.url && (
                             <div className="mt-2 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img src={editingGallery.url} alt="Preview" className="w-full h-full object-contain" />
                             </div>
                           )}
                        </div>
                     )}

                     {editingGallery.type === 'video' && (
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500">Video Embed URL <span className="text-red-500">*</span></label>
                              <input required placeholder="e.g. YouTube embed link" value={editingGallery.videoUrl || ''} onChange={e => setEditingGallery({...editingGallery, videoUrl: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              <p className="text-[10px] text-gray-400">Please use embed links format, not watch links.</p>
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500">Thumbnail URL</label>
                              <input placeholder="https://..." value={editingGallery.thumbnail || ''} onChange={e => setEditingGallery({...editingGallery, thumbnail: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                           </div>
                           {editingGallery.thumbnail && (
                             <div className="mt-2 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img src={editingGallery.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                             </div>
                           )}
                        </div>
                     )}
                     
                     <div className="space-y-1 border-t border-gray-100 pt-4">
                        <label className="text-xs font-medium text-gray-500">Liên kết sự kiện (Tùy chọn)</label>
                        <select value={editingGallery.eventId || ''} onChange={e => setEditingGallery({...editingGallery, eventId: e.target.value || null})} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">-- Không liên kết --</option>
                            {events.map(ev => (
                               <option key={ev.id} value={ev.id}>
                                  {adminLang === 'vi' ? ev.title_vi : ev.title_en || ev.title_vi}
                               </option>
                            ))}
                         </select>
                     </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingGallery(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" form="gallery-form" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Save Media</button>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
         {editingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingEvent(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-blue-600" />
                     {editingEvent.id === 'NEW' ? 'Create Event' : 'Edit Event'}
                  </h2>
                  <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <form id="event-form" onSubmit={saveEvent} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Event Title (VI) <span className="text-red-500">*</span></label>
                           <input required value={editingEvent.title_vi || ''} onChange={e => setEditingEvent({...editingEvent, title_vi: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Event Title (EN)</label>
                           <input value={editingEvent.title_en || ''} onChange={e => setEditingEvent({...editingEvent, title_en: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Event Start Time <span className="text-red-500">*</span></label>
                           <input required type="datetime-local" value={(() => {
                             if (!editingEvent.time) return '';
                             const d = new Date(editingEvent.time);
                             if (isNaN(d.getTime())) return '';
                             return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                           })()} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Event End Time</label>
                           <input type="datetime-local" value={(() => {
                             if (!editingEvent.endTime) return '';
                             const d = new Date(editingEvent.endTime);
                             if (isNaN(d.getTime())) return '';
                             return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                           })()} onChange={e => setEditingEvent({...editingEvent, endTime: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Loại sự kiện chính</label>
                           <select value={editingEvent.category || 'sachnhaminh'} onChange={e => setEditingEvent({...editingEvent, category: e.target.value, subCategory: ''})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                             <option value="sachnhaminh">Sách Nhà Mình</option>
                             <option value="external">Sự kiện bên ngoài</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Danh mục con</label>
                           <select value={editingEvent.subCategory !== undefined ? editingEvent.subCategory : (editingEvent.sub_category_id || '')} onChange={e => setEditingEvent({...editingEvent, subCategory: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                             <option value="">Chọn danh mục...</option>
                             {subCategories.map(cat => (
                               <option key={cat.id} value={cat.id}>{cat.name_vi} / {cat.name_en}</option>
                             ))}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Max Attendees (0 for ∞)</label>
                           <input type="number" min="0" value={editingEvent.maxAttendees !== undefined ? editingEvent.maxAttendees : (editingEvent.max_attendees || 0)} onChange={e => setEditingEvent({...editingEvent, maxAttendees: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Event Code (Optional)</label>
                        <input placeholder="e.g. EVT-001" value={editingEvent.code || ''} onChange={e => setEditingEvent({...editingEvent, code: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Location</label>
                        <input placeholder="e.g. Main Hall" value={editingEvent.location || ''} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Cover Image URL</label>
                        <input placeholder="https://..." value={editingEvent.image || ''} onChange={e => setEditingEvent({...editingEvent, image: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Description (VI)</label>
                        <textarea value={editingEvent.description_vi || ''} onChange={e => setEditingEvent({...editingEvent, description_vi: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Description (EN)</label>
                        <textarea value={editingEvent.description_en || ''} onChange={e => setEditingEvent({...editingEvent, description_en: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Detailed Content (VI)</label>
                        <ReactQuill theme="snow" value={editingEvent.content_vi || ''} onChange={content => setEditingEvent({...editingEvent, content_vi: content})} className="bg-white rounded-lg" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Detailed Content (EN)</label>
                        <ReactQuill theme="snow" value={editingEvent.content_en || ''} onChange={content => setEditingEvent({...editingEvent, content_en: content})} className="bg-white rounded-lg" />
                     </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingEvent(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" form="event-form" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Save Event</button>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Book Modal */}
      <AnimatePresence>
         {editingBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingBook(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <BookOpen className="w-5 h-5 text-blue-600" />
                     {editingBook.id === 'NEW' ? 'Create Book Review' : 'Edit Book Review'}
                  </h2>
                  <button onClick={() => setEditingBook(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <form id="book-form" onSubmit={saveBook} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Book Title (VI) <span className="text-red-500">*</span></label>
                           <input required value={editingBook.title_vi || ''} onChange={e => setEditingBook({...editingBook, title_vi: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Book Title (EN)</label>
                           <input value={editingBook.title_en || ''} onChange={e => setEditingBook({...editingBook, title_en: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Author <span className="text-red-500">*</span></label>
                           <input required value={editingBook.author || ''} onChange={e => setEditingBook({...editingBook, author: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1 flex items-center gap-4">
                           <div className="flex-1 space-y-1">
                              <label className="text-xs font-medium text-gray-500">Rating (1-5)</label>
                              <input type="number" min="1" max="5" required value={editingBook.rating || 5} onChange={e => setEditingBook({...editingBook, rating: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                           </div>
                           <div className="flex-1 space-y-1">
                              <label className="text-xs font-medium text-gray-500">Cover URL</label>
                              <input value={editingBook.coverUrl || ''} onChange={e => setEditingBook({...editingBook, coverUrl: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                           </div>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Nhà xuất bản</label>
                           <input value={editingBook.publisher || ''} onChange={e => setEditingBook({...editingBook, publisher: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Năm xuất bản</label>
                           <input value={editingBook.year || ''} onChange={e => setEditingBook({...editingBook, year: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Dịch giả</label>
                           <input value={editingBook.translator || ''} onChange={e => setEditingBook({...editingBook, translator: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">ISBN</label>
                           <input value={editingBook.isbn || ''} onChange={e => setEditingBook({...editingBook, isbn: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Lứa tuổi phù hợp</label>
                           <input value={editingBook.age || ''} onChange={e => setEditingBook({...editingBook, age: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                           <input type="checkbox" checked={editingBook.isHotMonth} onChange={e => setEditingBook({...editingBook, isHotMonth: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                           <span className="text-sm font-medium text-gray-700">Sách hot trong tháng</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                           <input type="checkbox" checked={editingBook.isTypical10} onChange={e => setEditingBook({...editingBook, isTypical10: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                           <span className="text-sm font-medium text-gray-700">10 cuốn sách tiêu biểu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                           <input type="checkbox" checked={editingBook.isMustRead100} onChange={e => setEditingBook({...editingBook, isMustRead100: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                           <span className="text-sm font-medium text-gray-700">100 cuốn sách must read</span>
                        </label>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Brief Summary (VI)</label>
                           <textarea value={editingBook.summary_vi || ''} onChange={e => setEditingBook({...editingBook, summary_vi: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Brief Summary (EN)</label>
                           <textarea value={editingBook.summary_en || ''} onChange={e => setEditingBook({...editingBook, summary_en: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Full Review (VI)</label>
                           <textarea value={editingBook.review_vi || ''} onChange={e => setEditingBook({...editingBook, review_vi: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] leading-relaxed" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Full Review (EN)</label>
                           <textarea value={editingBook.review_en || ''} onChange={e => setEditingBook({...editingBook, review_en: e.target.value})} className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] leading-relaxed" />
                        </div>
                     </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingBook(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" form="book-form" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Save Book</button>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Role Modal */}
      <AnimatePresence>
         {editingRole && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingRole(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     <UserPlus className="w-5 h-5 text-blue-600" />
                     {editingRole.id === 'NEW' ? 'Tạo tài khoản & Phân quyền' : 'Chỉnh sửa phân quyền'}
                  </h2>
                  <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-6 text-left">
                  <form id="role-form" onSubmit={saveRole} className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Địa chỉ Email <span className="text-red-500">*</span></label>
                        <input required type="email" placeholder="user@gmail.com" value={editingRole.email || ''} onChange={e => setEditingRole({...editingRole, email: e.target.value})} disabled={editingRole.id !== 'NEW'} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500" />
                     </div>
                     {editingRole.id === 'NEW' && (
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-500">Mật khẩu đăng nhập <span className="text-red-500">*</span></label>
                           <input required type="password" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" minLength={6} value={editingRole.password || ''} onChange={e => setEditingRole({...editingRole, password: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     )}
                     <div className="flex items-center gap-3 mt-4">
                        <input type="checkbox" id="isAdminCheckbox" checked={editingRole.isAdmin} onChange={e => setEditingRole({...editingRole, isAdmin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="isAdminCheckbox" className="text-sm font-medium text-gray-700">Quyền Quản trị viên (Admin)</label>
                     </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingRole(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                  <button type="submit" form="role-form" disabled={isSaving} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      
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

      {/* SubCategory Modal */}
      <AnimatePresence>
         {editingSubCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingSubCategory(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-left">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     <Tag className="w-5 h-5 text-blue-600" />
                     {editingSubCategory.id === 'NEW' ? 'Thêm Danh Mục' : 'Sửa Danh Mục'}
                  </h2>
                  <button onClick={() => setEditingSubCategory(null)} className="text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-6">
                  <form id="subcategory-form" onSubmit={saveSubCategory} className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Tên danh mục (Tiếng Việt) <span className="text-red-500">*</span></label>
                        <input required type="text" placeholder="Ví dụ: Nghệ Thuật" value={editingSubCategory.name_vi || ''} onChange={e => setEditingSubCategory({...editingSubCategory, name_vi: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Tên danh mục (Tiếng Anh) <span className="text-red-500">*</span></label>
                        <input required type="text" placeholder="Ví dụ: Art" value={editingSubCategory.name_en || ''} onChange={e => setEditingSubCategory({...editingSubCategory, name_en: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingSubCategory(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                  <button type="submit" form="subcategory-form" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Lưu danh mục</button>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
         <AnimatePresence>
            {editingEmailTemplate && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingEmailTemplate(null)} />
                 <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                   <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                     <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        {editingEmailTemplate.id === 'NEW' ? 'Thêm Mẫu Email Mới' : 'Chỉnh sửa Mẫu Email'}
                     </h2>
                     <button onClick={() => setEditingEmailTemplate(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                   </div>
                   <form onSubmit={saveEmailTemplate} id="email-template-form">
                     <div className="p-6 space-y-4 text-left">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
                           <p className="font-semibold mb-1">Các biến hỗ trợ:</p>
                           <p className="opacity-80">Sử dụng các biến sau để chèn thông tin động: {'{{Ten_Khach_Hang}}, {{Ten_Su_Kien}}, {{Ma_Ve}}, {{QR_Code}}, {{Thoi_Gian}}, {{Dia_Diem}}, {{So_Nguoi}}'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Loại Mẫu</label>
                              <select 
                                 value={editingEmailTemplate.event_id || ''} 
                                 onChange={e => setEditingEmailTemplate({...editingEmailTemplate, event_id: e.target.value || null})}
                                 className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                              >
                                 <option value="">Mẫu Chung (Cho tất cả sự kiện không có mẫu riêng)</option>
                                 {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title_vi}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề Email (Subject)</label>
                              <input 
                                 required 
                                 value={editingEmailTemplate.subject} 
                                 onChange={e => setEditingEmailTemplate({...editingEmailTemplate, subject: e.target.value})} 
                                 className="w-full border border-gray-300 px-3 py-2 rounded-lg" 
                                 placeholder="VD: Xác nhận tham gia sự kiện {{Ten_Su_Kien}}"
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung HTML</label>
                           <ReactQuill 
                              theme="snow" 
                              value={editingEmailTemplate.body_html || ''} 
                              onChange={val => setEditingEmailTemplate({...editingEmailTemplate, body_html: val})}
                              className="bg-white rounded-lg"
                              style={{ height: '300px', marginBottom: '50px' }}
                           />
                        </div>
                     </div>
                   </form>
                   <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-4">
                     <button type="button" onClick={() => setEditingEmailTemplate(null)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                     <button type="submit" form="email-template-form" disabled={isSaving} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                       {isSaving ? 'Đang lưu...' : 'Lưu'}
                     </button>
                   </div>
                 </motion.div>
               </div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {notifications.map(notif => (
               <motion.div
                 key={notif.id}
                 initial={{ opacity: 0, y: 50, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                 className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 flex items-center gap-4 min-w-[300px]"
               >
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                    <Bell className="w-5 h-5" />
                 </div>
                 <p className="text-sm font-medium text-gray-800 flex-1">{notif.message}</p>
                 <button 
                   onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                   className="text-gray-400 hover:text-gray-600 shrink-0"
                 >
                    <X className="w-4 h-4" />
                 </button>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>

      <AnimatePresence>
         {selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Users className="w-5 h-5 text-indigo-600" />
                     Hồ sơ Khách hàng
                  </h2>
                  <button onClick={() => setSelectedCustomer(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                   <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 mb-6 flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                         <div className="text-2xl font-bold text-gray-900 mb-1">{selectedCustomer.name}</div>
                         <div className="text-gray-600 flex gap-4 text-sm">
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {selectedCustomer.email}</span>
                            {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedCustomer.phone}</span>}
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="bg-white px-4 py-3 rounded-lg border border-indigo-100 shadow-sm text-center">
                            <div className="text-sm text-gray-500 mb-1">Đã đăng ký</div>
                            <div className="text-xl font-bold text-gray-900">{selectedCustomer.totalRegistered}</div>
                         </div>
                         <div className="bg-white px-4 py-3 rounded-lg border border-emerald-100 shadow-sm text-center">
                            <div className="text-sm text-gray-500 mb-1">Đã Check-in</div>
                            <div className="text-xl font-bold text-emerald-600">{selectedCustomer.totalAttended}</div>
                         </div>
                      </div>
                   </div>
                   
                   <h3 className="font-semibold text-gray-900 mb-4 text-lg">Lịch sử Tham gia Sự kiện</h3>
                   <div className="overflow-hidden border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-sm text-gray-600">
                         <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                               <th scope="col" className="px-4 py-3">Sự kiện</th>
                               <th scope="col" className="px-4 py-3 text-center">Mã vé</th>
                               <th scope="col" className="px-4 py-3 text-center">Tham gia cùng</th>
                               <th scope="col" className="px-4 py-3 text-center">Ngày đăng ký</th>
                               <th scope="col" className="px-4 py-3 text-center">Trạng thái Check-in</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                            {selectedCustomer.history.map((h: any, i: number) => (
                               <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-gray-900">{h.eventTitleVi}</td>
                                  <td className="px-4 py-3 text-center font-mono text-xs">{h.ticketCode}</td>
                                  <td className="px-4 py-3 text-center">{h.participants} người</td>
                                  <td className="px-4 py-3 text-center text-gray-500">
                                     {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                     {h.checkedIn ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                           <Check className="w-3 h-3" /> Check-in
                                        </span>
                                     ) : h.status === 'approved' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                           Đã duyệt
                                        </span>
                                     ) : h.status === 'pending' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                           Chờ duyệt
                                        </span>
                                     ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                           Từ chối
                                        </span>
                                     )}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

    </div>
  );
};
