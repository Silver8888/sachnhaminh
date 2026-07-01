import { useState, createContext, useContext, useEffect, FormEvent, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

const Admin = lazy(() => import('./Admin').then(m => ({ default: m.Admin })));
import { isDriveFolderUrl, parseDriveUrl, getThumbnailForUrl } from './utils/driveHelpers';
import 'react-quill-new/dist/quill.snow.css';

// Import local images
import imagesBg from './assets/images/images.jpg';
import eventCoffeeImg from './assets/images/regenerated_image_1778148336367.png';
import schoolGalleryImg from './assets/images/regenerated_image_1778149467988.png';
import heroMainImg from './assets/images/regenerated_image_1778170677190.png';
import musicalActivityImg from './assets/images/regenerated_image_1778214630223.jpg';

import { 
  BookOpen, 
  Coffee, 
  Users, 
  MapPin, 
  Instagram, 
  Facebook, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Palette,
  Heart,
  Star,
  Quote,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Languages,
  Settings,
  Menu,
  X,
  Play,
  ArrowUp,
  MessageCircle,
  ShoppingCart,
  Ticket,
  Search,
  Calendar,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Link
} from 'lucide-react';

// --- Types & Context ---

type Theme = 'classic' | 'evergreen' | 'midnight' | 'pastelRed' | 'custom';
type Font = 'serif' | 'sans' | 'display' | 'clean' | 'custom';
type Language = 'vi' | 'en';

interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  accentText: string;
  card: string;
  border: string;
  overlay: string;
}

const fonts: Record<Font, string> = {
  serif: 'font-serif',
  sans: 'font-sans',
  display: 'font-display',
  clean: 'font-clean',
  custom: 'font-custom'
};

const themes: Record<Theme, ThemeConfig> = {
  classic: {
    bg: 'bg-[#FCFAF7]',
    text: 'text-[#000000]',
    accent: 'bg-[#9C826B]',
    accentText: 'text-[#8C725B]',
    card: 'bg-white',
    border: 'border-[#EEE7DE]',
    overlay: 'bg-[#FCFAF7]/40'
  },
  evergreen: {
    bg: 'bg-[#06140D]',
    text: 'text-[#FFFFFF]',
    accent: 'bg-[#C5A059]',
    accentText: 'text-[#D5B069]',
    card: 'bg-[#0C1F15]',
    border: 'border-[#1A2E24]',
    overlay: 'bg-[#06140D]/60'
  },
  midnight: {
    bg: 'bg-[#05070A]',
    text: 'text-[#FFFFFF]',
    accent: 'bg-[#7C8CF0]',
    accentText: 'text-[#9CAFF0]',
    card: 'bg-[#0D1117]',
    border: 'border-[#1C2128]',
    overlay: 'bg-[#05070A]/70'
  },
  pastelRed: {
    bg: 'bg-[#FFF9F9]',
    text: 'text-[#4A1D1D]',
    accent: 'bg-[#E57373]',
    accentText: 'text-[#C62828]',
    card: 'bg-white',
    border: 'border-[#FFEBEE]',
    overlay: 'bg-[#FFF9F9]/50'
  },
  custom: {
    bg: 'theme-custom-bg',
    text: 'theme-custom-text',
    accent: 'theme-custom-accent',
    accentText: 'theme-custom-accentText',
    card: 'theme-custom-card',
    border: 'theme-custom-border',
    overlay: 'theme-custom-overlay'
  }
};

const NAV_SLUGS = ['trang-chu', 'tieu-diem', 'su-kien', 'diem-sach', 'lien-he'];

export const getDirectDriveUrl = (url: string, type: 'image' | 'video' = 'image') => {
  if (!url) return '';
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1];
    if (type === 'video') {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
};

export 
const createSeoSlug = (title: string) => {
  if (!title) return 'item';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const getArticleSeoUrl = (art: any) => {
  const slug = createSeoSlug(art.title_vi || 'news');
  return '#/news/' + slug;
};

const getEventSeoUrl = (ev: any) => {
  const slug = createSeoSlug(ev.title_vi || 'event');
  return '#/event/' + slug;
};

const extractIdFromSeoSlug = (slug: string) => {
  if (!slug) return '';
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
  if (uuidMatch) return uuidMatch[1];
  
  const intMatch = slug.match(/-([0-9]+)$/);
  if (intMatch) return intMatch[1];

  const parts = slug.split('-');
  return parts[parts.length - 1] || slug;
};
const cleanHtmlContent = (html: string) => {
  if (!html) return '';
  return html.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
};

export const getApprovedCount = (event: any) => {
  if (!event) return 0;
  if (typeof event.approvedCount === 'number') return event.approvedCount;
  if (event.approvedCount !== undefined && event.approvedCount !== null) {
    const parsed = parseInt(String(event.approvedCount));
    if (!isNaN(parsed)) return parsed;
  }
  if (event.id) {
    const numericStr = String(event.id).replace(/[^0-9]/g, '');
    const num = parseInt(numericStr);
    if (!isNaN(num)) return (num % 40) + 12;
  }
  return 12;
};

const translations = {
  vi: {
    nav: ['Trang chủ', 'Tin Tức', 'Sự Kiện', 'Điểm sách', 'Liên Hệ'],
    heroSub: 'Chào mừng bạn đến với',
    heroTitle: 'Nơi Tâm Hồn\nTìm Thấy Nhà',
    heroDesc: 'Sách nhà Mình không chỉ là một tiệm sách, mà là không gian kết nối tri thức, nuôi dưỡng đam mê và sẻ chia những giá trị sống tốt đẹp.',
    heroCta1: 'Khám Phá Ngay',
    heroCta2: 'Đặt Chỗ',
    servicesTitle: 'Hoạt động sự kiện trường học',
    cultureTitle: 'Hoạt động sự kiện văn hóa',
    schoolTab: 'Trường học',
    cultureTab: 'Văn hóa',
    timelineTitle: 'Dòng Thời Gian',
    mediaTitle: 'Phòng Truyền Thống',
    videoLabel: 'Video liên quan',
    noMoreVideos: 'Không có thêm video',
    noPhotos: 'Chưa có ảnh cho sự kiện này',
    noMoreNews: 'Không có thêm tin bài',
    highlightsTitle: 'Tin Tức',
    moreNewsBtn: 'Xem thêm tin bài',
    s1Title: 'Trải Nghiệm Thực Tế',
    s1Desc: 'Các em học sinh tham gia trải nghiệm quy trình làm sách và bảo quản sách.',
    s2Title: 'Góc Sáng Tạo',
    s2Desc: 'Phát triển tư duy qua các hoạt động vẽ tranh, viết lách và làm thủ công.',
    s3Title: 'Thi Đọc Sách',
    s3Desc: 'Khuyến khích văn hóa đọc qua các cuộc thi đọc và tóm tắt sách thú vị.',
    eventsSub: 'Lịch trình văn hóa',
    moreEvents: 'Xem tất cả sự kiện',
    month: 'Tháng 5',
    days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    bookReviewSub: 'Điểm sách',
    bookReviewTitle: 'Khám phá thế giới qua từng trang giấy',
    notableBooksTitle: '10 Cuốn Sách Tiêu Biểu',
    hotBookTitle: 'Sách Hot Trong Tháng',
    mustReadTitle: '100 Cuốn Sách Must Read',
    expMore: 'Câu chuyện Sách nhà Mình',
    footerDesc: 'Cùng nhau xây dựng một cộng đồng yêu sách, nơi tri thức và tâm hồn được trân trọng.'
  },
  en: {
    nav: ['Home', 'News', 'Events', 'Book Reviews', 'Contact'],
    heroSub: 'Welcome to',
    heroTitle: 'Where Souls\nFind Their Home',
    heroDesc: 'Sach nha Minh is not just a bookstore, but a space for connecting knowledge, nurturing passion, and sharing life values.',
    heroCta1: 'Explore Now',
    heroCta2: 'Book a Spot',
    servicesTitle: 'School Event Activities',
    cultureTitle: 'Cultural Event Activities',
    schoolTab: 'Schools',
    cultureTab: 'Culture',
    timelineTitle: 'Event Timeline',
    mediaTitle: 'Media Center',
    videoLabel: 'Related videos',
    noMoreVideos: 'No more videos',
    noPhotos: 'No photos for this event',
    noMoreNews: 'No more news',
    highlightsTitle: 'News',
    moreNewsBtn: 'More News',
    s1Title: 'Hands-on Experience',
    s1Desc: 'Students participate in learning about bookmaking and preservation processes.',
    s2Title: 'Creative Corner',
    s2Desc: 'Developing thinking skills through drawing, writing, and crafting activities.',
    s3Title: 'Reading Contests',
    s3Desc: 'Encouraging reading culture through fun book reading and summary competitions.',
    eventsSub: 'Cultural Schedule',
    moreEvents: 'View All Events',
    month: 'May',
    days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    bookReviewSub: 'Book Reviews',
    bookReviewTitle: 'Explore the World Through Pages',
    notableBooksTitle: '10 Notable Books',
    hotBookTitle: 'Hot Book of the Month',
    mustReadTitle: '100 Must Read Books',
    expMore: 'The Story of Sach nha Minh',
    footerDesc: 'Building a community of book lovers together, where knowledge is cherished.'
  }
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  font: Font;
  setFont: (f: Font) => void;
  config: ThemeConfig;
  siteName?: string;
  siteLogo?: string;
  contactAddress?: string;
  contactPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  customColor?: string;
  customFont?: string;
  showSpotlight?: boolean;
  showBookReview?: boolean;
  showCulture?: boolean;
  partners_animation?: 'left' | 'right' | 'none';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'pastelRed',
  setTheme: () => {},
  font: 'serif',
  setFont: () => {},
  config: themes.pastelRed,
  siteName: 'Sách nhà Mình',
  siteLogo: '',
  contactAddress: '123 Văn Chương, Quận Tri Thức, TP. Hồ Chí Minh',
  contactPhone: '090 457 03 83',
  facebookUrl: 'https://www.facebook.com/sachnhaminh',
  instagramUrl: '',
  customColor: '#8B2B2B',
  customFont: 'Inter',
  showSpotlight: true,
  showBookReview: true,
  showCulture: true,
  partners_animation: 'left'
});

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.vi;
}>({
  lang: 'vi',
  setLang: () => {},
  t: translations.vi
});

interface DataContextType {
  events: any[];
  articles: any[];
  gallery: any[];
  books: any[];
  slides: any[];
  subCategories: any[];
  classifications?: any[];
  partners?: any[];
}

const DataContext = createContext<DataContextType>({ events: [], articles: [], gallery: [], books: [], slides: [], subCategories: [], classifications: [], partners: [] });

// --- Helper Functions ---
const getCityFromLocation = (location?: string, lang: string = 'vi') => {
  if (!location) return null;
  const loc = location.toLowerCase();
  if (loc.includes('hà nội') || loc.includes('ha noi') || loc.includes('hanoi')) return lang === 'vi' ? 'Hà Nội' : 'Hanoi';
  if (loc.includes('hồ chí minh') || loc.includes('ho chi minh') || loc.includes('hcm') || loc.includes('sài gòn') || loc.includes('sai gon')) return lang === 'vi' ? 'TP.HCM' : 'HCMC';
  if (loc.includes('đà nẵng') || loc.includes('da nang') || loc.includes('danang')) return lang === 'vi' ? 'Đà Nẵng' : 'Da Nang';
  if (loc.includes('hải phòng') || loc.includes('hai phong')) return lang === 'vi' ? 'Hải Phòng' : 'Hai Phong';
  if (loc.includes('cần thơ') || loc.includes('can tho')) return lang === 'vi' ? 'Cần Thơ' : 'Can Tho';
  return null;
};

const resolveEventCategory = (event: any, classificationsList: any[] = []) => {
  const cat = event?.category;
  if (!cat || cat === 'school' || cat === 'culture') {
    return 'sachnhaminh';
  }
  if (classificationsList && classificationsList.length > 0 && classificationsList.some(c => c.id === cat)) {
    return cat;
  }
  // Default fallback if not found in list (protecting default hardcoded classifications)
  if (cat === 'external') {
    return 'external';
  }
  return 'sachnhaminh';
};

const resolveEventSubCategory = (event: any, subCategories: any[]) => {
  const mainType = resolveEventCategory(event);
  
  const subId = event?.sub_category_id || event?.subCategory;
  if (event && subId) {
    const found = subCategories.find(s => s.id === subId);
    if (found) return found;
  }
  
  // Backward compatibility check
  const targetName = 'Văn Hóa'; // Default fallback name in VI
  const defaultSub = subCategories.find(s => s.name_vi === targetName) 
    || subCategories[0]
    || { id: 'fallback', name_vi: 'Văn Hóa', name_en: 'Culture', mainType };
    
  return defaultSub;
};

// --- Components ---


// --- Constants & Data ---

const SHARED_EVENTS: any[] = [];

const ACTIVITY_GALLERY = [
  { id: 322, type: 'image', category: 'school', url: musicalActivityImg, title: 'Biểu diễn nhạc cụ dân tộc', eventId: 1 },
  { id: 323, type: 'image', category: 'school', url: schoolGalleryImg, title: 'Giao lưu văn nghệ học đường', eventId: 1 },
  { id: 1, type: 'video', category: 'school', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200', title: 'Hoạt động ngoại khóa 2024', videoUrl: 'https://www.youtube.com/embed/H532mPkgd_A' },
  { id: 2, type: 'video', category: 'school', thumbnail: 'https://images.unsplash.com/photo-1510172951991-8561654261f9?auto=format&fit=crop&q=80&w=800', title: 'Lễ hội đọc sách', videoUrl: 'https://www.youtube.com/embed/pAZxuT_KJgg' },
  { id: 3, type: 'image', category: 'school', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800', title: 'Workshop vẽ tranh', eventId: 2 },
  { id: 4, type: 'image', category: 'school', url: 'https://images.unsplash.com/photo-1544411047-c4915842163b?auto=format&fit=crop&q=80&w=800', title: 'Thi kể chuyện', eventId: 3 },
  { id: 5, type: 'image', category: 'school', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800', title: 'Khám phá thế giới sách', eventId: 1 },
  { id: 6, type: 'image', category: 'school', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', title: 'Giờ kể chuyện', eventId: 3 },
  // Cultural Activities
  { id: 105, type: 'image', category: 'culture', url: 'https://images.unsplash.com/photo-1524311546418-52969a3a2414?auto=format&fit=crop&q=80&w=800', title: 'Góc đọc sách nhỏ', eventId: 4 },
  { id: 106, type: 'image', category: 'culture', url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', title: 'Không gian mở', eventId: 4 },
  { id: 107, type: 'image', category: 'culture', url: imagesBg, title: 'Thư viện Sách nhà Mình', eventId: 4 },
  { id: 101, type: 'video', category: 'culture', thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800', title: 'Đêm nhạc Trịnh', videoUrl: 'https://www.youtube.com/embed/pAZxuT_KJgg' },
  { id: 103, type: 'image', category: 'culture', url: 'https://images.unsplash.com/photo-1460518451285-97b6aa320961?auto=format&fit=crop&q=80&w=800', title: 'Triển lãm tranh', eventId: 1 },
  { id: 104, type: 'image', category: 'culture', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800', title: 'Hội thảo văn hóa', eventId: 3 },
];

const SCHOOL_NEWS = [
  { 
    id: 1, 
    category: 'school',
    date: '05/05/2026', 
    title_vi: 'Hợp tác với trường Tiểu học Alpha: Khai phá tiềm năng đọc', 
    title_en: 'Partnership with Alpha Primary: Unlocking Reading Potential',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    summary_vi: 'Dự án "Mỗi cuốn sách một ước mơ" đã chính thức khởi động tại cụm trường tiểu học khu vực phía Bắc.',
    summary_en: 'The "One Book, One Dream" project has officially launched at elementary school clusters.',
    content_vi: 'Dự án "Mỗi cuốn sách một ước mơ" đã chính thức khởi động tại cụm trường tiểu học khu vực phía Bắc, mở đầu là buổi ký kết tại trường Tiểu học Alpha. \n\nTại đây, Sách nhà Mình cam kết hỗ trợ hơn 2000 đầu sách đa dạng và tổ chức các buổi workshop định kỳ hàng tháng nhằm khơi gợi niềm yêu thích đọc sách cho các em nhỏ. Ông Nguyễn Văn A, đại diện Sách nhà Mình chia sẻ: "Chúng tôi tin rằng gieo mầm văn hóa đọc chính là gieo mầm tương lai."',
    content_en: 'The "One Book, One Dream" project officially launched at northern elementary school clusters, starting with a partnership at Alpha Primary. \n\nSach nha Minh commits to providing over 2000 diverse book titles and hosting monthly workshops to inspire reading passion in children. Mr. Nguyen Van A, representative of Sach nha Minh, shared: "We believe that planting the seeds of reading culture is planting the seeds for the future."'
  },
  { 
    id: 101, 
    category: 'culture',
    date: '07/05/2026', 
    title_vi: 'Đêm nhạc "Thu Quyến Rũ": Giai điệu vượt thời gian', 
    title_en: 'Musical Night "Charming Autumn": Timeless Melodies',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
    summary_vi: 'Đêm nhạc tri ân các nhạc sĩ tên tuổi Việt Nam đã diễn ra trong không gian ấm cúng tại Sách nhà Mình.',
    summary_en: 'A musical night honoring famous Vietnamese composers took place in the cozy space of Sach nha Minh.',
    content_vi: 'Đêm nhạc "Thu Quyến Rũ" không chỉ mang đến những ca khúc bất hủ mà còn là nơi giao lưu của những tâm hồn yêu nghệ thuật. Với sự tham gia của các nghệ sĩ trẻ triển vọng, buổi tối đã để lại nhiều dư vị khó quên cho khán giả.',
    content_en: 'The "Charming Autumn" musical night not only featured immortal songs but also served as a gathering place for art-loving souls. With the participation of promising young artists, the evening left many unforgettable memories for the audience.'
  },
  { 
    id: 103, 
    category: 'culture',
    date: '07/05/2026', 
    title_vi: 'Văn hóa đọc với giới trẻ ngày nay', 
    title_en: 'Reading Culture Among Today\'s Youth',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200',
    summary_vi: 'Trong thời đại số, việc duy trì thói quen đọc sách giấy mang lại những giá trị tinh thần vô giá cho thế hệ trẻ.',
    summary_en: 'In the digital age, maintaining the habit of reading physical books brings invaluable spiritual values to the younger generation.',
    content_vi: 'Văn hóa đọc không hề mất đi mà đang chuyển mình mạnh mẽ trong giới trẻ. Tại Sách nhà Mình, chúng tôi quan sát thấy ngày càng nhiều bạn trẻ tìm đến những không gian yên tĩnh để nghiền ngẫm những cuốn sách triết học, tâm lý hay văn học kinh điển. \n\nSách không chỉ cung cấp tri thức mà còn giúp rèn luyện khả năng tập trung và tư duy sâu sắc - những kỹ năng cực kỳ quan trọng trong thế giới đầy xao nhãng hiện nay. Hãy cùng chúng tôi lan tỏa tình yêu sách mỗi ngày.',
    content_en: 'Reading culture is not disappearing but is transforming strongly among youth. At Sach nha Minh, we observe more and more young people seeking quiet spaces to dive into philosophy, psychology, or classic literature. \n\nBooks not only provide knowledge but also help train concentration and deep thinking skills - extremely important skills in today\'s distracted world. Join us in spreading the love for books every day.'
  },
  { 
    id: 2, 
    category: 'school',
    date: '01/05/2026', 
    title_vi: 'Ra mắt góc đọc sách mới tại thư viện cộng đồng', 
    title_en: 'Launching new reading corner at community library',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400',
    content_vi: 'Một không gian đọc sách hoàn toàn mới vừa được khánh thành tại Thư viện cộng đồng Quận 1. Với thiết kế mở, nhiều cây xanh và ánh sáng tự nhiên, đây hứa hẹn là điểm đến lý tưởng cho những ai tìm kiếm sự yên bình giữa lòng thành phố.',
    content_en: 'A brand new reading space has been inaugurated at the District 1 Community Library. With an open design, plenty of greenery, and natural light, it promises to be an ideal destination for those seeking peace in the heart of the city.'
  },
  { 
    id: 102, 
    category: 'culture',
    date: '03/05/2026', 
    title_vi: 'Triển lãm "Nét Xưa": Gìn giữ di sản Việt', 
    title_en: '"Old Traits" Exhibition: Preserving Vietnamese Heritage',
    image: 'https://images.unsplash.com/photo-1544411047-c4915842163b?auto=format&fit=crop&q=80&w=400',
    content_vi: 'Trưng bày hơn 50 hiện vật văn hóa truyền thống, triển lãm thu hút đông đảo bạn trẻ đến tìm hiểu và trải nghiệm.',
    content_en: 'Displaying over 50 traditional cultural artifacts, the exhibition attracted many young people to learn and experience.'
  },
  { 
    id: 3, 
    category: 'school',
    date: '28/04/2026', 
    title_vi: 'Giải thưởng văn hóa đọc cấp quận cho các em nhỏ', 
    title_en: 'District reading award for children',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400',
    content_vi: 'Lễ trao giải "Gương mặt văn hóa đọc" cấp quận vừa diễn ra với nhiều bất ngờ. Đáng chú ý, hơn 60% các em đạt giải đều là thành viên tích cực của CLB Sách nhà Mình, minh chứng cho sức lan tỏa của dự án.',
    content_en: 'The District "Face of Reading Culture" awards took place with many surprises. Notably, over 60% of awardees are active members of Sach nha Minh Club, proving the project\'s widespread impact.'
  },
];

const NOTABLE_BOOKS = [
  { 
    id: 1, 
    title: 'Nhà Giả Kim', 
    author: 'Paulo Coelho', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    review: 'Một câu chuyện ngụ ngôn sâu sắc về việc theo đuổi ước mơ và lắng nghe tiếng gọi của trái tim. Cuốn sách đã truyền cảm hứng cho hàng triệu người trên thế giới tìm thấy "Vận mệnh cá nhân" của mình.',
    review_en: 'A profound fable about pursuing dreams and listening to the heart. The book has inspired millions worldwide to find their "Personal Legend".',
    tikiUrl: 'https://tiki.vn/search?q=nha+gia+kim'
  },
  { 
    id: 2, 
    title: 'Đắc Nhân Tâm', 
    author: 'Dale Carnegie', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400',
    review: 'Cuốn sách kinh điển về kỹ năng giao tiếp và ứng xử, giúp bạn xây dựng những mối quan hệ bền vững và thành công trong cuộc sống cũng như sự nghiệp.',
    review_en: 'A classic on communication and behavior skills, helping you build lasting relationships and succeed in life and career.',
    tikiUrl: 'https://tiki.vn/search?q=dac+nhan+tam'
  },
  { 
    id: 3, 
    title: 'Hoàng Tử Bé', 
    author: 'Antoine de Saint-Exupéry', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    review: 'Tác phẩm văn học cho mọi lứa tuổi, nhắc nhở chúng ta về những giá trị quan trọng của tình yêu, sự tử tế và cái nhìn trong trẻo của trẻ thơ.',
    review_en: 'A literary work for all ages, reminding us of the important values of love, kindness, and the pure vision of a child.',
    tikiUrl: 'https://tiki.vn/search?q=hoang+tu+be'
  },
  { 
    id: 4, 
    title: 'Trên Đường Băng', 
    author: 'Tony Buổi Sáng', 
    rating: 4, 
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    review: 'Những bài viết truyền cảm hứng mạnh mẽ cho giới trẻ về tư duy xê dịch, tinh thần học hỏi và khát vọng vươn ra biển lớn.',
    review_en: 'Inspiring articles for young people about a dynamic mindset, spirit of learning, and the desire to reach out to the world.',
    tikiUrl: 'https://tiki.vn/search?q=tren+duong+bang'
  },
  { 
    id: 5, 
    title: 'Cây Cam Ngọt Của Tôi', 
    author: 'José Mauro de Vasconcelos', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=400',
    review: 'Một câu chuyện cảm động về tình bạn giữa một cậu bé nghèo và một cây cam, lấy đi nước mắt của hàng triệu độc giả bởi sự chân thành và nỗi đau của sự trưởng thành.',
    review_en: 'A touching story of friendship between a poor boy and an orange tree, moving millions to tears with its sincerity and the pain of growing up.',
    tikiUrl: 'https://tiki.vn/search?q=cay+cam+ngot+cua+toi'
  },
  { 
    id: 6, 
    title: 'Chiến Binh Cầu Vồng', 
    author: 'Andrea Hirata', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1532012197367-142289f81da6?auto=format&fit=crop&q=80&w=400',
    review: 'Cuốn sách ngợi ca sức mạnh của giáo dục và tinh thần kiên cường của những đứa trẻ nghèo đi tìm con chữ trên hòn đảo Belitong.',
    review_en: 'The book celebrates the power of education and the resilience of poor children seeking knowledge on Belitong island.',
    tikiUrl: 'https://tiki.vn/search?q=chien+binh+cau+vong'
  },
  { 
    id: 7, 
    title: 'Lược Sử Loài Người', 
    author: 'Yuval Noah Harari', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400',
    review: 'Một cái nhìn tổng quát và đột phá về lịch sử nhân loại, từ thời kỳ đồ đá cho đến kỷ nguyên công nghệ hiện đại.',
    review_en: 'A general and breakthrough look at human history, from the Stone Age to the modern technological era.',
    tikiUrl: 'https://tiki.vn/search?q=luoc+su+loai+nguoi'
  },
  { 
    id: 8, 
    title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 
    author: 'Nguyễn Nhật Ánh', 
    rating: 4, 
    image: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&q=80&w=400',
    review: 'Những mẩu chuyện nhỏ về tuổi thơ nơi làng quê Việt Nam, trong veo, nhẹ nhàng và đầy ắp những kỉ niệm đáng nhớ.',
    review_en: 'Small stories about childhood in the Vietnamese countryside, pure, gentle, and filled with memorable memories.',
    tikiUrl: 'https://tiki.vn/search?q=toi+thay+hoa+vang+tren+co+xanh'
  },
  { 
    id: 9, 
    title: 'Dế Mèn Phiêu Lưu Ký', 
    author: 'Tô Hoài', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=400',
    review: 'Tác phẩm văn học thiếu nhi kinh điển của Việt Nam, kể về những cuộc phiêu lưu đầy thú vị và bài học làm người của chú Dế Mèn.',
    review_en: 'Classical Vietnamese children\'s literature, telling interesting adventures and life lessons of Cricket.',
    tikiUrl: 'https://tiki.vn/search?q=de+men+phieu+luu+ky'
  },
  { 
    id: 10, 
    title: 'Suối Nguồn', 
    author: 'Ayn Rand', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=400',
    review: 'Bản anh hùng ca về chủ nghĩa cá nhân, sự sáng tạo và lòng kiên định không bao giờ thỏa hiệp với những giá trị tầm thường.',
    review_en: 'An epic on individualism, creativity, and steadfast refusal to compromise with mediocre values.',
    tikiUrl: 'https://tiki.vn/search?q=suoi+nguon'
  },
];

const HOT_BOOK = {
  id: 1,
  title: 'Muôn Kiếp Nhân Sinh',
  author: 'Nguyên Phong',
  rating: 5,
  image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&q=80&w=1200',
  desc: 'Một cuốn sách thức tỉnh tâm linh mạnh mẽ, mở ra cái nhìn mới về nhân quả và luân hồi.',
  desc_en: 'A powerful spiritual awakening book, opening a new perspective on karma and reincarnation.'
};

const MUST_READ_REAL_TITLES = [
  { vi: "Đắc Nhân Tâm", en: "How to Win Friends and Influence People", author: "Dale Carnegie", cat: "Psychology" },
  { vi: "Nhà Giả Kim", en: "The Alchemist", author: "Paulo Coelho", cat: "Literature" },
  { vi: "Hoàng Tử Bé", en: "The Little Prince", author: "Antoine de Saint-Exupéry", cat: "Classic" },
  { vi: "1984", en: "1984", author: "George Orwell", cat: "Classic" },
  { vi: "Giết Con Chim Nhại", en: "To Kill a Mockingbird", author: "Harper Lee", cat: "Classic" },
  { vi: "Trăm Năm Cô Đơn", en: "One Hundred Years of Solitude", author: "Gabriel García Márquez", cat: "Literature" },
  { vi: "Suối Nguồn", en: "The Fountainhead", author: "Ayn Rand", cat: "Classic" },
  { vi: "Bắt Trẻ Đồng Xanh", en: "The Catcher in the Rye", author: "J.D. Salinger", cat: "Classic" },
  { vi: "Kiêu Hãnh và Định Kiến", en: "Pride and Prejudice", author: "Jane Austen", cat: "Classic" },
  { vi: "Chiến Tranh và Hòa Bình", en: "War and Peace", author: "Leo Tolstoy", cat: "Classic" },
  { vi: "Tội Ác và Hình Phạt", en: "Crime and Punishment", author: "Fyodor Dostoevsky", cat: "Classic" },
  { vi: "Những Người Khốn Khổ", en: "Les Misérables", author: "Victor Hugo", cat: "Classic" },
  { vi: "Anh Em Nhà Karamazov", en: "The Brothers Karamazov", author: "Fyodor Dostoevsky", cat: "Classic" },
  { vi: "Sapiens: Lược Sử Loài Người", en: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", cat: "History" },
  { vi: "Súng, Vi Trùng và Thép", en: "Guns, Germs, and Steel", author: "Jared Diamond", cat: "History" },
  { vi: "Thế Giới Phẳng", en: "The World Is Flat", author: "Thomas Friedman", cat: "Business" },
  { vi: "Tư Duy Nhanh và Chậm", en: "Thinking, Fast and Slow", author: "Daniel Kahneman", cat: "Psychology" },
  { vi: "Lược Sử Thời Gian", en: "A Brief History of Time", author: "Stephen Hawking", cat: "Science" },
  { vi: "Nguồn Gốc Các Loài", en: "On the Origin of Species", author: "Charles Darwin", cat: "Science" },
  { vi: "Cộng Hòa", en: "The Republic", author: "Plato", cat: "Philosophy" },
  { vi: "Đạo Đức Kinh", en: "Tao Te Ching", author: "Lao Tzu", cat: "Philosophy" },
  { vi: "Luận Ngữ", en: "The Analects", author: "Confucius", cat: "Philosophy" },
  { vi: "Siddhartha", en: "Siddhartha", author: "Hermann Hesse", cat: "Philosophy" },
  { vi: "Vũ Trụ", en: "Cosmos", author: "Carl Sagan", cat: "Science" },
  { vi: "Tâm Lý Học Đám Đông", en: "The Crowd: A Study of the Popular Mind", author: "Gustave Le Bon", cat: "Psychology" },
  { vi: "Bàn Về Tự Do", en: "On Liberty", author: "John Stuart Mill", cat: "Philosophy" },
  { vi: "Khế Ước Xã Hội", en: "The Social Contract", author: "Jean-Jacques Rousseau", cat: "Philosophy" },
  { vi: "Hoàng Đế", en: "The Prince", author: "Niccolò Machiavelli", cat: "Philosophy" },
  { vi: "Nghệ Thuật Yêu", en: "The Art of Loving", author: "Erich Fromm", cat: "Psychology" },
  { vi: "Sự Im Lặng Của Bầy Cừu", en: "The Silence of the Lambs", author: "Thomas Harris", cat: "Thriller" },
  { vi: "Bố Già", en: "The Godfather", author: "Mario Puzo", cat: "Literature" },
  { vi: "Sherlock Holmes", en: "Sherlock Holmes", author: "Arthur Conan Doyle", cat: "Mystery" },
  { vi: "Chúa Tể Những Chiếc Nhẫn", en: "The Lord of the Rings", author: "J.R.R. Tolkien", cat: "Fantasy" },
  { vi: "Harry Potter", en: "Harry Potter", author: "J.K. Rowling", cat: "Fantasy" },
  { vi: "Cuốn Theo Chiều Gió", en: "Gone with the Wind", author: "Margaret Mitchell", cat: "Classic" },
  { vi: "Đồi Gió Hú", en: "Wuthering Heights", author: "Emily Brontë", cat: "Classic" },
  { vi: "Gatsby Vĩ Đại", en: "The Great Gatsby", author: "F. Scott Fitzgerald", cat: "Classic" },
  { vi: "Phía Tây Không Có Gì Lạ", en: "All Quiet on the Western Front", author: "Erich Maria Remarque", cat: "Classic" },
  { vi: "Ông Già và Biển Cả", en: "The Old Man and the Sea", author: "Ernest Hemingway", cat: "Classic" },
  { vi: "Tiếng Chim Hót Trong Bụi Mận Gai", en: "The Thorn Birds", author: "Colleen McCullough", cat: "Literature" },
  { vi: "Huckleberry Finn", en: "The Adventures of Huckleberry Finn", author: "Mark Twain", cat: "Classic" },
  { vi: "Don Quixote", en: "Don Quixote", author: "Miguel de Cervantes", cat: "Classic" },
  { vi: "Ulysses", en: "Ulysses", author: "James Joyce", cat: "Classic" },
  { vi: "Lolita", en: "Lolita", author: "Vladimir Nabokov", cat: "Classic" },
  { vi: "Moby Dick", en: "Moby Dick", author: "Herman Melville", cat: "Classic" },
  { vi: "Đi Tìm Thời Gian Đã Mất", en: "In Search of Lost Time", author: "Marcel Proust", cat: "Classic" },
  { vi: "Tên Của Đóa Hồng", en: "The Name of the Rose", author: "Umberto Eco", cat: "Literature" },
  { vi: "Kafka Bên Bờ Biển", en: "Kafka on the Shore", author: "Haruki Murakami", cat: "Literature" },
  { vi: "Rừng Na Uy", en: "Norwegian Wood", author: "Haruki Murakami", cat: "Literature" },
  { vi: "Tắt Đèn", en: "Lights Out", author: "Ngo Tat To", cat: "VN Classic" },
  { vi: "Số Đỏ", en: "Dumb Luck", author: "Vu Trong Phung", cat: "VN Classic" },
  { vi: "Chí Phèo", en: "Chi Pheo", author: "Nam Cao", cat: "VN Classic" },
  { vi: "Vợ Nhặt", en: "The Found Wife", author: "Kim Lan", cat: "VN Classic" },
  { vi: "Dế Mèn Phiêu Lưu Ký", en: "Diary of a Cricket", author: "To Hoai", cat: "VN Classic" },
  { vi: "Đất Rừng Phương Nam", en: "Southern Land and Forests", author: "Doan Gioi", cat: "VN Classic" },
  { vi: "Tuổi Thơ Dữ Dội", en: "Fierce Childhood", author: "Phung Quan", cat: "VN Classic" },
  { vi: "Cho Tôi Xin Một Vé Đi Tuổi Thơ", en: "Ticket to Childhood", author: "Nguyen Nhat Anh", cat: "VN Literature" },
  { vi: "Mắt Biếc", en: "Blue Eyes", author: "Nguyen Nhat Anh", cat: "VN Literature" },
  { vi: "Nỗi Buồn Chiến Tranh", en: "The Sorrow of War", author: "Bao Ninh", cat: "VN Literature" },
  { vi: "Người Truyền Ký Ức", en: "The Giver", author: "Lois Lowry", cat: "Literature" },
  { vi: "Fahrenheit 451", en: "Fahrenheit 451", author: "Ray Bradbury", cat: "Classic" },
  { vi: "Luân Hồi", en: "Sum: Forty Tales from the Afterlives", author: "David Eagleman", cat: "Philosophy" },
  { vi: "Thế Giới Mới Tươi Đẹp", en: "Brave New World", author: "Aldous Huxley", cat: "Classic" },
  { vi: "Chuyện Người Tùy Nữ", en: "The Handmaid's Tale", author: "Margaret Atwood", cat: "Literature" },
  { vi: "Vùng Đất Dữ", en: "The Road", author: "Cormac McCarthy", cat: "Literature" },
  { vi: "Yêu Dấu", en: "Beloved", author: "Toni Morrison", cat: "Classic" },
  { vi: "Hoa Trên Mộ Algernon", en: "Flowers for Algernon", author: "Daniel Keyes", cat: "Literature" },
  { vi: "Đường Hầm", en: "The Tunnel", author: "Ernesto Sabato", cat: "Literature" },
  { vi: "Lâu Đài", en: "The Castle", author: "Franz Kafka", cat: "Classic" },
  { vi: "Vụ Án", en: "The Trial", author: "Franz Kafka", cat: "Classic" },
  { vi: "Biến Thái", en: "The Metamorphosis", author: "Franz Kafka", cat: "Classic" },
  { vi: "Faust", en: "Faust", author: "Goethe", cat: "Classic" },
  { vi: "Thần Khúc", en: "The Divine Comedy", author: "Dante", cat: "Classic" },
  { vi: "Vua Lear", en: "King Lear", author: "Shakespeare", cat: "Classic" },
  { vi: "Hamlet", en: "Hamlet", author: "Shakespeare", cat: "Classic" },
  { vi: "Odyssey", en: "The Odyssey", author: "Homer", cat: "Classic" },
  { vi: "Iliad", en: "The Iliad", author: "Homer", cat: "Classic" },
  { vi: "Nghìn Lẻ Một Đêm", en: "One Thousand and One Nights", author: "Various", cat: "Classic" },
  { vi: "Hồng Lâu Mộng", en: "Dream of the Red Chamber", author: "Cao Xueqin", cat: "Classic" },
  { vi: "Tây Du Ký", en: "Journey to the West", author: "Wu Cheng'en", cat: "Classic" },
  { vi: "Tam Quốc Diễn Nghĩa", en: "Romance of the Three Kingdoms", author: "Luo Guanzhong", cat: "Classic" },
  { vi: "Thủy Hử", en: "Water Margin", author: "Shi Nai'an", cat: "Classic" },
  { vi: "Truyện Kiều", en: "The Tale of Kieu", author: "Nguyen Du", cat: "VN Classic" },
  { vi: "Trại Súc Vật", en: "Animal Farm", author: "George Orwell", cat: "Classic" },
  { vi: "Bay Trên Tổ Chim Cúc Cu", en: "One Flew Over the Cuckoo's Nest", author: "Ken Kesey", cat: "Classic" },
  { vi: "Lỗ Đen", en: "Black Holes and Baby Universes", author: "Stephen Hawking", cat: "Science" },
  { vi: "Gen Vị Kỷ", en: "The Selfish Gene", author: "Richard Dawkins", cat: "Science" },
  { vi: "Bản Đồ Của Khoảnh Khắc", en: "Einstein's Dreams", author: "Alan Lightman", cat: "Literature" },
  { vi: "Nhật Ký Anne Frank", en: "The Diary of a Young Girl", author: "Anne Frank", cat: "Classic" },
  { vi: "Lối Sống Tối Giản", en: "Goodbye, Things", author: "Fumio Sasaki", cat: "Lifestyle" },
  { vi: "Nghệ Thuật Tư Duy Rành Mạch", en: "The Art of Thinking Clearly", author: "Rolf Dobelli", cat: "Psychology" },
  { vi: "Dám Bị Ghét", en: "The Courage to Be Disliked", author: "Ichiro Kishimi", cat: "Psychology" },
  { vi: "Kỵ Sĩ Không Đầu", en: "The Legend of Sleepy Hollow", author: "Washington Irving", cat: "Classic" },
  { vi: "Bá Tước Monte Cristo", en: "The Count of Monte Cristo", author: "Alexandre Dumas", cat: "Classic" },
  { vi: "Ba Chàng Lính Ngự Lâm", en: "The Three Musketeers", author: "Alexandre Dumas", cat: "Classic" },
  { vi: "Tiến Hóa Vật Lý", en: "The Evolution of Physics", author: "Albert Einstein", cat: "Science" },
  { vi: "Gấp Giấy", en: "The Paper Menagerie", author: "Ken Liu", cat: "Literature" },
  { vi: "Thành Babylon", en: "The Richest Man in Babylon", author: "George S. Clason", cat: "Business" },
  { vi: "Cha Giàu Cha Nghèo", en: "Rich Dad Poor Dad", author: "Robert Kiyosaki", cat: "Business" },
  { vi: "Ăn, Cầu Nguyện, Yêu", en: "Eat, Pray, Love", author: "Elizabeth Gilbert", cat: "Lifestyle" }
];

const MUST_READ_BOOKS = MUST_READ_REAL_TITLES.map((book, i) => ({
  id: i + 1,
  title: book.en,
  title_vi: book.vi,
  author: book.author,
  author_vi: book.author,
  rating: 5,
  rank: i + 1,
  category: book.cat
}));

const BookModal = ({ book, onClose }: { book: typeof NOTABLE_BOOKS[0] | null, onClose: () => void }) => {
  const { config } = useContext(ThemeContext);
  const { lang } = useContext(LanguageContext);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className={`relative w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]`}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="overflow-y-auto w-full">
          {/* Top section: Thumbnail and Information */}
          <div className="flex flex-col md:flex-row p-6 md:p-12 gap-8 border-b border-gray-100">
            <div className="md:w-1/3 flex-shrink-0">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-black/5">
                <img src={(book as any).coverUrl || book.image || (book as any).photoUrl || undefined} className="w-full h-full object-cover" alt={(book as any).title_vi || book.title} />
              </div>
            </div>

            <div className="md:w-2/3 flex flex-col justify-center">
              <div className="flex gap-1 mb-4">
                {[...Array(parseInt((book as any).rating || '5') || 5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />)}
              </div>
              
              <h2 className={`text-3xl md:text-5xl font-black ${config.text} tracking-tighter leading-tight mb-2`}>
                {lang === 'vi' ? (book as any).title_vi || book.title : (book as any).title_en || book.title}
              </h2>
              <p className={`text-sm font-bold ${config.accentText} uppercase tracking-widest mb-6`}>
                {book.author}
              </p>

              {/* Book Metadata */}
              {( (book as any).publisher || (book as any).year || (book as any).translator || (book as any).isbn || (book as any).age ) && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mb-8 text-sm">
                   {(book as any).publisher && (
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40">{lang === 'vi' ? 'Nhà xuất bản' : 'Publisher'}</span>
                         <span className={`font-medium ${config.text} opacity-90 truncate`} title={(book as any).publisher}>{(book as any).publisher}</span>
                      </div>
                   )}
                   {(book as any).year && (
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40">{lang === 'vi' ? 'Năm xuất bản' : 'Publication Year'}</span>
                         <span className={`font-medium ${config.text} opacity-90`}>{(book as any).year}</span>
                      </div>
                   )}
                   {(book as any).translator && (
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40">{lang === 'vi' ? 'Dịch giả' : 'Translator'}</span>
                         <span className={`font-medium ${config.text} opacity-90 truncate`} title={(book as any).translator}>{(book as any).translator}</span>
                      </div>
                   )}
                   {(book as any).isbn && (
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40">ISBN</span>
                         <span className={`font-medium ${config.text} opacity-90`}>{(book as any).isbn}</span>
                      </div>
                   )}
                   {(book as any).age && (
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40">{lang === 'vi' ? 'Lứa tuổi phù hợp' : 'Suitable Age'}</span>
                         <span className={`font-medium ${config.text} opacity-90`}>{(book as any).age}</span>
                      </div>
                   )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-auto pt-4 border-t border-gray-100">
                <a 
                  href={book.tikiUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${config.accent} text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 shadow-lg transition-all inline-flex items-center justify-center gap-3 w-fit text-sm`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {lang === 'vi' ? 'Mua tại tiki.vn' : 'Buy on Tiki.vn'}
                </a>
              </div>
            </div>
          </div>

          {/* Bottom section: Content */}
          <div className="p-6 md:p-12">
            <div className="space-y-8">
              {((book as any).summary_vi || (book as any).description_vi || (book as any).desc_vi || (book as any).desc || (book as any).summary_en || (book as any).description_en) && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-30 mb-4">
                    {lang === 'vi' ? 'Tóm tắt ngắn gọn' : 'Brief Summary'}
                  </h3>
                  <div 
                    className={`prose prose-p:!m-0 ${config.text} text-lg leading-relaxed font-serif italic opacity-90`}
                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? ((book as any).summary_vi || (book as any).description_vi || (book as any).desc_vi || (book as any).desc || '') : ((book as any).summary_en || (book as any).description_en || (book as any).desc_en || (book as any).desc || '')) }}
                  />
                </div>
              )}

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-30 mb-4">
                  {lang === 'vi' ? 'Đánh giá chi tiết' : 'Full Review'}
                </h3>
                <div 
                  className={`prose prose-lg max-w-none hover:prose-a:text-blue-600 ${config.text} opacity-90`}
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? ((book as any).review_vi || (book as any).content_vi || book.review || '') : ((book as any).review_en || (book as any).content_en || book.review_en || '')) }}
                />
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button 
                onClick={onClose}
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all text-sm`}
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        
            {/* Article Reader Overlay Modal */}
            <AnimatePresence>
              {readingArticle && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                    onClick={() => setReadingArticle(null)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden text-left border border-black/5 z-10`}
                  >
                    <div className="px-6 py-4 border-b border-black/[0.05] flex justify-between items-center bg-gray-50/50">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} bg-black/5 py-1 px-3 rounded-full`}>
                        {readingArticle.category || 'Tin sự kiện'}
                      </span>
                      <button onClick={() => setReadingArticle(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                      {readingArticle.image && (
                        <img src={readingArticle.image} alt={readingArticle.title_vi} className="w-full aspect-[21/9] object-cover rounded-2xl border border-black/5 shadow-sm" />
                      )}
                      <div>
                        <h3 className={`text-2xl font-bold ${config.text} leading-tight`}>
                          {lang === 'vi' ? readingArticle.title_vi : readingArticle.title_en || readingArticle.title_vi}
                        </h3>
                        <span className="text-xs opacity-40 block mt-2">{readingArticle.date}</span>
                      </div>
                      <div 
                        className="opacity-90 leading-relaxed text-base max-w-none ql-snow ql-editor p-0"
                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? readingArticle.content_vi : readingArticle.content_en || readingArticle.content_vi) }}
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Lightbox Overlay Modal */}
            <AnimatePresence>
              {mediaLightbox.isOpen && mediaLightbox.items.length > 0 && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
                    onClick={() => setMediaLightbox({ isOpen: false, index: 0, items: [] })}
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center z-10"
                  >
                    <button 
                      onClick={() => setMediaLightbox({ isOpen: false, index: 0, items: [] })} 
                      className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    
                    <div className="relative w-full h-full flex items-center justify-center">
                      {mediaLightbox.items.length > 1 && (
                        <button 
                          onClick={() => setMediaLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }))}
                          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                      )}
                      
                      <img 
                        src={parseDriveUrl(mediaLightbox.items[mediaLightbox.index]?.url || '', 'image')} 
                        alt={mediaLightbox.items[mediaLightbox.index]?.title || 'Lightbox'} 
                        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                        referrerPolicy="no-referrer"
                      />

                      {mediaLightbox.items.length > 1 && (
                        <button 
                          onClick={() => setMediaLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.items.length }))}
                          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                    
                    {mediaLightbox.items[mediaLightbox.index]?.title && (
                      <p className="mt-4 text-sm text-white/80 font-medium">
                        {mediaLightbox.items[mediaLightbox.index].title}
                      </p>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  };

const NewsModal = ({ news, onClose }: { news: typeof SCHOOL_NEWS[0] | null, onClose: () => void }) => {
  const { config } = useContext(ThemeContext);
  const { lang } = useContext(LanguageContext);

  if (!news) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={`${config.card} w-full max-w-3xl rounded-[48px] overflow-hidden relative shadow-2xl overflow-y-auto max-h-[90vh]`}
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="h-72 md:h-96 w-full relative">
            <img src={news.image || undefined} className="w-full h-full object-cover" alt="news" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 right-10">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4 block">{news.date}</span>
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                {lang === 'vi' ? news.title_vi : news.title_en}
              </h2>
            </div>
          </div>

          <div className="p-10 md:p-16">
            <div className={`prose prose-sm max-w-none ${config.text} opacity-80 leading-relaxed space-y-6 text-lg ql-snow`}>
              <div 
                className="ql-editor p-0 text-lg leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const content = lang === 'vi' ? news.content_vi : news.content_en || news.content_vi;
                    const str = content || '';
                    const isHtml = /<[a-z][\s\S]*>/i.test(str);
                    return isHtml ? cleanHtmlContent(str) : str.replace(/\n/g, '<br/>');
                  })()
                }}
              />
            </div>

            <div className="mt-16 pt-8 border-t border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${config.accent} flex items-center justify-center text-white`}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs font-black ${config.text}`}>Sách nhà Mình</p>
                  <p className={`text-[10px] ${config.text} opacity-40 uppercase font-bold tracking-widest`}>Editorial Team</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className={`w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:${config.accent} hover:text-white transition-all`}>
                  <Heart className="w-4 h-4" />
                </button>
                <button className={`w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:${config.accent} hover:text-white transition-all`}>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const BookingModal = ({ isOpen, onClose, initialEventId }: { isOpen: boolean, onClose: () => void, initialEventId?: number | string }) => {
  const { config } = useContext(ThemeContext);
  const { lang } = useContext(LanguageContext);
  const { events: dbEvents } = useContext(DataContext);
  const events = dbEvents.length > 0 ? dbEvents : SHARED_EVENTS;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventId: initialEventId || (events.length > 0 ? events[0].id : ''),
    participants: 1
  });
  const [participantsInfo, setParticipantsInfo] = useState<{name: string, info: string}[]>([]);

  const handleParticipantsChange = (newCount: number) => {
    setFormData({...formData, participants: newCount});
    setParticipantsInfo(prev => {
      const newArr = [...prev];
      const targetCount = newCount > 1 ? newCount - 1 : 0;
      while (newArr.length < targetCount) {
        newArr.push({ name: '', info: '' });
      }
      return newArr.slice(0, targetCount);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('registrations').insert({
         event_id: formData.eventId,
         name: formData.name,
         email: formData.email,
         phone: formData.phone,
         participants: formData.participants,
         participants_info: participantsInfo,
         status: 'pending'
      });
      if (error) throw error;

      // Send Telegram notification
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      
      if (botToken && chatId) {
        const eventInfo = events.find(e => String(e.id) === String(formData.eventId));
        const eventTitle = eventInfo ? (lang === 'vi' ? eventInfo.title_vi : eventInfo.title_en) : formData.eventId;
        
        const text = `🎉 <b>CÓ ĐĂNG KÝ SỰ KIỆN MỚI</b> 🎉\n\n` +
          `📌 <b>Sự kiện:</b> ${eventTitle}\n` +
          `👤 <b>Họ và tên:</b> ${formData.name}\n` +
          `📧 <b>Email:</b> ${formData.email}\n` +
          `📱 <b>SĐT:</b> ${formData.phone}\n` +
          `👥 <b>Số lượng:</b> ${formData.participants} người`;
          
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
          })
        }).then(res => res.json()).then(data => {
          if (!data.ok) console.error('Telegram API error:', data);
        }).catch(err => console.error('Telegram network error:', err));
      }

      setStep(2);
      setTimeout(() => {
        onClose();
        setStep(1);
      }, 3000);
    } catch (error) {
       console.error(error);
       alert('Error submitting registration');
    } finally {
       setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className={`${config.card} w-full max-w-lg rounded-[48px] p-8 md:p-12 relative shadow-2xl overflow-hidden`}
      >
        <button onClick={onClose} className={`absolute top-8 right-8 p-2 rounded-full hover:bg-black/5 transition-all`}>
          <X className="w-6 h-6" />
        </button>

        {step === 1 ? (
          <>
            <h3 className={`text-3xl font-bold ${config.text} mb-2`}>{lang === 'vi' ? 'Đặt Chỗ Tham Gia' : 'Join an Event'}</h3>
            <p className={`${config.text} opacity-80 mb-10 text-sm`}>{lang === 'vi' ? 'Hãy để lại thông tin, chúng mình sẽ sớm liên hệ xác nhận.' : 'Leave your details, we will contact you for confirmation.'}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">{lang === 'vi' ? 'Sự kiện' : 'Event'}</label>
                <select 
                  value={formData.eventId} 
                  onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                  className={`w-full bg-black/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black/10 outline-none text-sm transition-all appearance-none`}
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{lang === 'vi' ? e.title_vi : e.title_en}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">{lang === 'vi' ? 'Họ tên' : 'Full Name'}</label>
                  <input 
                    required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nguyễn Văn A" className={`w-full bg-black/5 border-none rounded-2xl px-6 py-4 outline-none text-sm`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">{lang === 'vi' ? 'Điện thoại' : 'Phone'}</label>
                  <input 
                    required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="090 457 03 83" className={`w-full bg-black/5 border-none rounded-2xl px-6 py-4 outline-none text-sm`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">Email</label>
                  <input 
                    required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="me@email.com" className={`w-full bg-black/5 border-none rounded-2xl px-6 py-4 outline-none text-sm`} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">{lang === 'vi' ? 'Số người tham gia' : 'Participants'}</label>
                <div className="flex bg-black/5 rounded-2xl p-2 items-center justify-between overflow-hidden">
                   <button type="button" onClick={() => handleParticipantsChange(Math.max(1, formData.participants - 1))} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">-</button>
                   <span className="font-bold">{formData.participants}</span>
                   <button type="button" onClick={() => handleParticipantsChange(formData.participants + 1)} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">+</button>
                </div>
              </div>

              {formData.participants > 1 && (
                <div className="space-y-4 max-h-[25vh] overflow-y-auto pr-2 custom-scrollbar">
                  {participantsInfo.map((p, idx) => (
                    <div key={idx} className="p-4 bg-black/5 rounded-2xl space-y-3">
                       <p className="text-xs font-bold opacity-60">
                         {lang === 'vi' ? `Người đi cùng ${idx + 1}` : `Extra Guest ${idx + 1}`}
                       </p>
                       <input
                         required
                         type="text"
                         value={p.name}
                         onChange={(e) => {
                           const newInfo = [...participantsInfo];
                           newInfo[idx].name = e.target.value;
                           setParticipantsInfo(newInfo);
                         }}
                         placeholder={lang === 'vi' ? 'Họ tên' : 'Full Name'}
                         className="w-full bg-white border-none rounded-xl px-4 py-3 outline-none text-sm"
                       />
                       <input
                         type="text"
                         value={p.info}
                         onChange={(e) => {
                           const newInfo = [...participantsInfo];
                           newInfo[idx].info = e.target.value;
                           setParticipantsInfo(newInfo);
                         }}
                         placeholder={lang === 'vi' ? 'Tuổi / Ghi chú thêm' : 'Age / Additional notes'}
                         className="w-full bg-white border-none rounded-xl px-4 py-3 outline-none text-sm"
                       />
                    </div>
                  ))}
                </div>
              )}

              <button disabled={isSubmitting} className={`w-full ${config.accent} text-white py-5 rounded-3xl font-bold hover:brightness-110 transition-all shadow-xl shadow-black/10 mt-4 disabled:opacity-50`}>
                {isSubmitting ? '...' : (lang === 'vi' ? 'Gửi Đăng Ký' : 'Submit Registration')}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className={`w-20 h-20 rounded-full ${config.accent} bg-opacity-10 flex items-center justify-center mx-auto mb-6`}>
               <Sparkles className={`w-10 h-10 ${config.accentText}`} />
            </div>
            <h3 className={`text-2xl font-bold ${config.text} mb-3`}>{lang === 'vi' ? 'Đã nhận thông tin!' : 'Information Received!'}</h3>
            <p className={`${config.text} opacity-80 text-sm leading-relaxed mb-8`}>
              {lang === 'vi' 
                ? 'Email xác nhận đang được gửi. Để được hỗ trợ nhanh nhất, bạn hãy gửi tin nhắn cho Sách nhà Mình qua Messenger nhé!' 
                : 'Confirmation email is being sent. For faster support, please send a message to Sách nhà Mình via Messenger!'}
            </p>
            
            <a 
              href={`https://m.me/sachnhaminh?text=${encodeURIComponent(
                `Chào Sách nhà Mình, mình là ${formData.name}. Mình vừa đăng ký tham gia sự kiện ${events.find(e => String(e.id) === String(formData.eventId))?.title_vi} cho ${formData.participants} người. Mong nhận được xác nhận từ trang!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#0084FF] text-white py-5 rounded-3xl font-bold hover:brightness-110 transition-all shadow-xl shadow-blue-500/20"
            >
              <Facebook className="w-5 h-5 fill-current" />
              {lang === 'vi' ? 'Xác nhận qua Messenger' : 'Confirm via Messenger'}
            </a>
            
            <button onClick={onClose} className={`mt-6 text-xs font-bold opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest`}>
               {lang === 'vi' ? 'Đóng cửa sổ' : 'Close window'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const EventDetailModal = ({ event, isOpen, onClose, onBook }: { event: any, isOpen: boolean, onClose: () => void, onBook: () => void }) => {
  const { config } = useContext(ThemeContext);
  const { lang } = useContext(LanguageContext);
  const { subCategories, classifications = [], articles = [], gallery = [] } = useContext(DataContext);

  const [activeSubTab, setActiveSubTab] = useState<'content' | 'articles' | 'images' | 'videos'>('content');
  const [activeModalVideoId, setActiveModalVideoId] = useState<string | null>(null);
  const [activeModalImageFolderId, setActiveModalImageFolderId] = useState<string | null>(null);
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ isOpen: boolean, index: number, items: any[] }>({ isOpen: false, index: 0, items: [] });

  // Auto reset tabs when event changes
  useEffect(() => {
    if (event) {
      setActiveSubTab('content');
      setActiveModalVideoId(null);
      setActiveModalImageFolderId(null);
    }
  }, [event?.id]);

  if (!isOpen || !event) return null;

  const resolvedSub = resolveEventSubCategory(event, subCategories);
  const mainType = resolveEventCategory(event, classifications);
  const matchedClassification = classifications.find(c => c.id === mainType);
  const resolvedMainTypeName = matchedClassification 
    ? (lang === 'vi' ? matchedClassification.name_vi : matchedClassification.name_en) 
    : (lang === 'vi' ? 'Sách Nhà Mình' : 'Sach Nha Minh'); 
  const resolvedSubCategoryName = lang === 'vi' ? resolvedSub.name_vi : resolvedSub.name_en;

  const approved = getApprovedCount(event);
  const max = event.maxAttendees ? parseInt(event.maxAttendees as string) : 0;
  const isUnlimited = max === 0;
  const remaining = max > 0 ? Math.max(0, max - approved) : 0;
  
  const eventTimeMs = new Date(event.time).getTime();
  const relatedArticles = articles.filter(a => String(a.eventId || a.event_id) === String(event.id));
  const relatedMedia = gallery.filter(g => String(g.eventId || g.event_id) === String(event.id));
  const nowMs = new Date().getTime();
  const isPast = nowMs > eventTimeMs + (3 * 60 * 60 * 1000);

  const handleBookClick = () => {
    if (!isUnlimited && remaining <= 0) {
      alert("Cảm ơn quý khách đã quan tâm đến sự kiện của Sách Nhà Mình. Rất tiếc khi phải thông báo rằng sự kiện quý khách muốn tham gia hiện tại đã đủ số lượng. Kính mong quý khách thông cảm cho sự bất tiện này. Hẹn gặp quý khách vào một sự kiện khác của Sách Nhà Mình. Kính chúc quý khách một ngày vui vẻ! Xin cảm ơn!");
      return;
    }
    onBook();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={`${config.card} w-full max-w-6xl max-h-[90vh] rounded-[48px] overflow-hidden relative flex flex-col`}
      >
        <button onClick={onClose} className={`absolute top-6 right-6 z-10 p-2 bg-black/5 hover:bg-black/10 backdrop-blur-md rounded-full ${config.text} transition-all`}>
          <X className="w-6 h-6" />
        </button>

        <div className="w-full p-10 md:p-14 overflow-y-auto">
           <div className="flex flex-wrap gap-2 mb-6">
             <span className={`text-[10px] font-black uppercase tracking-widest ${config.accentText} bg-black/5 py-1.5 px-4 rounded-full inline-block`}>
                {resolvedMainTypeName}
             </span>
             <span className={`text-[10px] font-black uppercase tracking-widest text-white ${config.accent} py-1.5 px-4 rounded-full inline-block`}>
                {resolvedSubCategoryName}
             </span>
             <span className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-500/10 py-1.5 px-4 rounded-full inline-block`}>
                {lang === 'vi' ? event.type_vi : event.type_en}
             </span>
           </div>
           <h3 className={`text-3xl md:text-5xl font-bold ${config.text} mb-6 leading-tight`}>
             {lang === 'vi' ? event.title_vi : event.title_en}
           </h3>
           
           <div className="flex flex-col md:flex-row gap-8 mb-10">
             {event.image && (
               <div className="md:w-1/2 flex-shrink-0">
                 <img src={event.image} alt="detail" className="w-full h-full object-cover rounded-[32px] aspect-video md:aspect-square shadow-sm" referrerPolicy="no-referrer" />
               </div>
             )}
             <div className="md:w-1/2 flex flex-col justify-center space-y-6">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-black/5 ${config.accentText}`}><Users className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[10px] uppercase font-bold opacity-30">{lang === 'vi' ? 'Đã đăng ký' : 'Registered'}</p>
                     <p className={`${config.text} text-sm font-bold`}>{getApprovedCount(event)} {lang === 'vi' ? 'người' : 'people'}</p>
                  </div>
               </div>
               {(() => {
                  return (
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${isUnlimited || remaining > 0 ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-600/20' : 'bg-rose-500/10 text-rose-600 ring-rose-600/20'} ring-1`}><Ticket className="w-5 h-5" /></div>
                       <div className="flex-grow">
                          <p className="text-[10px] uppercase font-bold opacity-30">{lang === 'vi' ? 'Vé còn lại' : 'Remaining tickets'}</p>
                          <p className={`${config.text} text-sm font-bold ${isUnlimited || remaining > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isUnlimited ? (lang === 'vi' ? 'Không giới hạn' : 'Unlimited') : remaining}
                          </p>
                       </div>
                       {(!isPast) && (
                         <button 
                           onClick={handleBookClick}
                           className={`px-4 py-2 font-bold text-xs uppercase tracking-widest text-white rounded-xl flex items-center gap-2 hover:opacity-90 transition-all ${config.accent}`}
                         >
                           <ShoppingCart className="w-4 h-4" />
                           {lang === 'vi' ? 'Đặt chỗ' : 'Book'}
                         </button>
                       )}
                    </div>
                  );
               })()}
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-black/5 ${config.accentText}`}><Clock className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[10px] uppercase font-bold opacity-30">{lang === 'vi' ? 'Thời gian' : 'Date & Time'}</p>
                     <p className={`${config.text} text-sm font-bold`}>{new Date(event.time).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-black/5 ${config.accentText}`}><MapPin className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[10px] uppercase font-bold opacity-30">{lang === 'vi' ? 'Địa điểm' : 'Location'}</p>
                     <p className={`${config.text} text-sm font-bold`}>{event.location || (event as any).location_vi || ''}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-black/5 ${config.accentText}`}><Heart className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[10px] uppercase font-bold opacity-30">{lang === 'vi' ? 'Chi phí' : 'Fees'}</p>
                     <p className={`${config.text} text-sm font-bold`}>{lang === 'vi' ? event.price_vi : event.price_en}</p>
                  </div>
               </div>
             </div>
           </div>

                       {/* Tài liệu đính kèm (Tabs giống Theo dòng văn hóa) */}
            <div className="mb-10 border-t border-black/5 pt-8">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-4 block">
                {lang === 'vi' ? 'Tài liệu & Truyền thông sự kiện' : 'Event Documentation & Media'}
              </label>
              
              {/* Sub tabs */}
              <div className="flex gap-2 border-b border-black/[0.05] pb-2 mb-6">
                <button
                  onClick={() => setActiveSubTab('content')}
                  className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeSubTab === 'content' 
                      ? `border-black text-black` 
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {lang === 'vi' ? 'Nội dung chương trình' : 'Program Content'}
                </button>
                {relatedArticles.length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('articles')}
                    className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                      activeSubTab === 'articles' 
                        ? `border-black text-black` 
                        : 'border-transparent text-gray-400 hover:text-black'
                    }`}
                  >
                    {lang === 'vi' ? `Tin sự kiện (${relatedArticles.length})` : `Articles (${relatedArticles.length})`}
                  </button>
                )}
                <button
                  onClick={() => setActiveSubTab('images')}
                  className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeSubTab === 'images' 
                      ? `border-black text-black` 
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {lang === 'vi' ? `Hình ảnh (${relatedMedia.filter(m => m.type !== 'video').length})` : `Images (${relatedMedia.filter(m => m.type !== 'video').length})`}
                </button>
                <button
                  onClick={() => setActiveSubTab('videos')}
                  className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeSubTab === 'videos' 
                      ? `border-black text-black` 
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {lang === 'vi' ? `Video (${relatedMedia.filter(m => m.type === 'video').length})` : `Videos (${relatedMedia.filter(m => m.type === 'video').length})`}
                </button>
              </div>

              {/* Tab Panels */}
              <div className="w-full">
                {activeSubTab === 'content' && (
                  <div>
                    {(() => {
                      const contentVal = lang === 'vi' ? event.content_vi : event.content_en;
                      const descVal = lang === 'vi' ? event.desc_vi : event.desc_en;
                      if (contentVal) {
                        return (
                          <div className="ql-snow">
                            <div 
                              className="ql-editor p-0 opacity-90 leading-relaxed max-w-none text-base"
                              dangerouslySetInnerHTML={{ __html: cleanHtmlContent(contentVal) }} 
                            />
                          </div>
                        );
                      }
                      return (
                        <p className={`${config.text} opacity-90 leading-relaxed text-base whitespace-pre-line`}>
                          {descVal}
                        </p>
                      );
                    })()}
                  </div>
                )}

                {activeSubTab === 'articles' && (
                  <div className="space-y-4">
                    {relatedArticles.length > 0 ? (
                      relatedArticles.map(art => (
                        <div 
                          key={art.id}
                          onClick={() => setReadingArticle(art)}
                          className="p-4 rounded-2xl border border-black/5 bg-black/[0.01] hover:bg-black/[0.03] transition-all cursor-pointer flex gap-4 items-center"
                        >
                          {art.image && (
                            <img src={art.image} alt={art.title_vi} className="w-16 h-16 object-cover rounded-xl border border-black/5" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-bold text-base leading-snug line-clamp-1">{lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}</h5>
                            <p className="text-xs opacity-60 line-clamp-2 mt-1">{lang === 'vi' ? art.summary_vi : art.summary_en || art.summary_vi}</p>
                            <span className="text-[10px] opacity-40 block mt-1">{art.date}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-40" />
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                        <FileText className="w-10 h-10 opacity-30 mb-2" />
                        <p className="text-sm">{lang === 'vi' ? 'Chưa có tin sự kiện cho sự kiện này.' : 'No related articles for this event.'}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'images' && (() => {
                  const relatedImages = relatedMedia.filter(m => m.type !== 'video');
                  const imageFolders = relatedImages.filter(item => isDriveFolderUrl(item.url || ''));
                  const directImages = relatedImages.filter(item => !isDriveFolderUrl(item.url || ''));
                  
                  return (
                    <div className="flex flex-col gap-6">
                      {imageFolders.length > 0 && (
                        <div className="flex flex-col gap-4">
                          {(() => {
                            const mainItem = imageFolders.find(v => v.id === activeModalImageFolderId) || imageFolders[0];
                            const mainUrl = parseDriveUrl(mainItem.url || '', 'folder');
                            return (
                              <div className="relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 h-[300px] w-full shadow-sm">
                                <iframe 
                                  src={mainUrl} 
                                  className="absolute top-0 left-0 w-full h-full border-none" 
                                  title={mainItem.title || 'Google Drive Folder'}
                                />
                              </div>
                            );
                          })()}

                          {imageFolders.length > 1 && (
                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mt-4 border border-black/[0.03] rounded-2xl p-2 bg-black/[0.01]">
                              {imageFolders.map(item => {
                                const isActive = activeModalImageFolderId === item.id || (!activeModalImageFolderId && item.id === imageFolders[0].id);
                                const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.url || '', 'image') || '';
                                return (
                                  <div 
                                    key={item.id} 
                                    onClick={() => setActiveModalImageFolderId(item.id)}
                                    className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl border transition-all ${
                                      isActive 
                                        ? 'border-black/10 bg-black/[0.03] shadow-sm' 
                                        : 'border-transparent hover:bg-black/[0.02]'
                                    }`}
                                  >
                                    <div className="w-24 aspect-video rounded-lg overflow-hidden relative bg-black/5 flex-shrink-0">
                                      {thumbUrl !== '' ? (
                                        <img src={thumbUrl} alt="thumb" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                          <ImageIcon className="w-4 h-4 opacity-40" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                        {item.title || 'Thư mục hình ảnh'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {directImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {directImages.map((item, idx) => {
                            const directUrl = parseDriveUrl(item.url || '', 'image');
                            return (
                              <button key={item.id} onClick={() => setMediaLightbox({ isOpen: true, index: idx, items: directImages })} className="block w-full aspect-video relative cursor-pointer group/btn rounded-xl overflow-hidden border border-black/5 bg-black/[0.02]">
                                <img src={directUrl} alt={item.title || 'Image'} className="w-full h-full object-cover transition-transform group-hover/btn:scale-105 duration-300" referrerPolicy="no-referrer" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[9px] font-medium truncate">
                                  {item.title || 'Hình ảnh'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {relatedImages.length === 0 && (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                          <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                          <p className="text-sm">{lang === 'vi' ? 'Chưa có tài liệu hình ảnh.' : 'No image items for this event.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeSubTab === 'videos' && (() => {
                  const relatedVideos = relatedMedia.filter(m => m.type !== 'video');
                  return (
                    <div className="flex flex-col gap-6">
                      {relatedVideos.length > 0 ? (
                        <>
                          {(() => {
                            const mainItem = relatedVideos.find(v => v.id === activeModalVideoId) || relatedVideos[0];
                            const isFolder = isDriveFolderUrl(mainItem.video_url || mainItem.videoUrl || mainItem.url || '');
                            const mainUrl = parseDriveUrl(mainItem.video_url || mainItem.videoUrl || mainItem.url || '', isFolder ? 'folder' : 'video');
                            return (
                              <div className={`relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 ${isFolder ? 'h-[300px]' : 'aspect-video'} w-full shadow-sm`}>
                                <iframe 
                                  src={mainUrl} 
                                  className="absolute top-0 left-0 w-full h-full border-none"
                                  allow="autoplay; encrypted-media" 
                                  allowFullScreen
                                  title={mainItem.title || 'Video'}
                                />
                              </div>
                            );
                          })()}

                          {relatedVideos.length > 1 && (
                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mt-4 border border-black/[0.03] rounded-2xl p-2 bg-black/[0.01]">
                              {relatedVideos.map(item => {
                                const isActive = activeModalVideoId === item.id || (!activeModalVideoId && item.id === relatedVideos[0].id);
                                const isFolder = isDriveFolderUrl(item.video_url || item.videoUrl || item.url || '');
                                const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.video_url || item.videoUrl || item.url || '', 'video') || '';
                                return (
                                  <div 
                                    key={item.id} 
                                    onClick={() => setActiveModalVideoId(item.id)}
                                    className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl border transition-all ${
                                      isActive 
                                        ? 'border-black/10 bg-black/[0.03] shadow-sm' 
                                        : 'border-transparent hover:bg-black/[0.02]'
                                    }`}
                                  >
                                    <div className="w-24 aspect-video rounded-lg overflow-hidden relative bg-black/5 flex-shrink-0">
                                      {thumbUrl !== '' ? (
                                        <img src={thumbUrl} alt="thumb" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                          <Play className="w-4 h-4 opacity-40" />
                                        </div>
                                      )}
                                      {!isFolder && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                                            <Play className="w-3 h-3 fill-current ml-0.5" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                        {item.title || (isFolder ? 'Thư mục video' : 'Video')}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                          <Play className="w-10 h-10 opacity-30 mb-2" />
                          <p className="text-sm">{lang === 'vi' ? 'Chưa có tài liệu video.' : 'No video items for this event.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <button onClick={handleBookClick} className={`w-full ${config.accent} text-white py-5 rounded-3xl font-bold hover:brightness-110 transition-all shadow-xl`}>
             {lang === 'vi' ? 'Đăng Ký Tham Gia' : 'Register Now'}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Components ---

const Countdown = ({ targetDate, isHappening, compact }: { targetDate: string, isHappening?: boolean, compact?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const { lang } = useContext(LanguageContext);

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={`flex ${compact ? 'gap-1.5' : 'gap-3'} text-sm uppercase font-bold tracking-tighter ${isHappening ? 'text-[#0068FF]' : ''}`}>
      <div className={`flex flex-col items-center ${compact ? 'min-w-[20px]' : 'min-w-[32px]'}`}>
        <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-black leading-none`}>{timeLeft.days}</span>
        <span className={`opacity-90 ${compact ? 'text-[9px]' : 'text-[11px]'} mt-0.5`}>{lang === 'vi' ? 'Ngày' : 'Days'}</span>
      </div>
      <span className={`opacity-60 ${compact ? 'pt-0 text-lg' : 'pt-1 text-xl'}`}>:</span>
      <div className={`flex flex-col items-center ${compact ? 'min-w-[20px]' : 'min-w-[32px]'}`}>
        <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-black leading-none`}>{timeLeft.hours}</span>
        <span className={`opacity-90 ${compact ? 'text-[9px]' : 'text-[11px]'} mt-0.5`}>{lang === 'vi' ? 'Giờ' : 'Hrs'}</span>
      </div>
      <span className={`opacity-60 ${compact ? 'pt-0 text-lg' : 'pt-1 text-xl'}`}>:</span>
      <div className={`flex flex-col items-center ${compact ? 'min-w-[20px]' : 'min-w-[32px]'}`}>
        <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-black leading-none`}>{timeLeft.mins}</span>
        <span className={`opacity-90 ${compact ? 'text-[9px]' : 'text-[11px]'} mt-0.5`}>{lang === 'vi' ? 'Phút' : 'Mins'}</span>
      </div>
      <span className={`opacity-60 ${compact ? 'pt-0 text-lg' : 'pt-1 text-xl'}`}>:</span>
      <div className={`flex flex-col items-center ${compact ? 'min-w-[20px]' : 'min-w-[32px]'}`}>
        <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-black leading-none`}>{timeLeft.secs}</span>
        <span className={`opacity-90 ${compact ? 'text-[9px]' : 'text-[11px]'} mt-0.5`}>{lang === 'vi' ? 'Giây' : 'Secs'}</span>
      </div>
    </div>
  );
};

const CompactCalendar = ({ className = "", onEventClick, onBookClick }: { className?: string, onEventClick?: (e: any) => void, onBookClick?: (e: any) => void }) => {
  const { config } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { events: dbEvents, subCategories, classifications = [] } = useContext(DataContext);
  const events = dbEvents.length > 0 ? dbEvents : SHARED_EVENTS;

  const [hoveredEvent, setHoveredEvent] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(() => {
    return events.length > 0 && events[0].time ? new Date(events[0].time) : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const currentMonthEvents = events.filter(e => {
    if (!e.time) return false;
    const eventDate = new Date(e.time);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });

  const busyDays = currentMonthEvents.map(e => e.day || parseInt(e.date?.split('/')[0] || '0') || new Date(e.time).getDate());
  
  const sortedCurrentEvents = [...currentMonthEvents].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const nearestEvent = sortedCurrentEvents[0] || events[0];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      if (scrollPos > 300) {
        setIsScrolled(true);
        // Reset hover when scrolling far away unless specifically interacting
        if (!hoveredEvent) setHoveredEvent(null);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hoveredEvent]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`relative ${className}`}
      onMouseLeave={() => setHoveredEvent(null)}
    >
      <div className={`${config.card} rounded-[32px] ${config.border} border shadow-2xl overflow-hidden relative transition-all duration-500`}>
        {/* Header / Preview Area - Expanded Height to 180px for prominence */}
        <div className="h-[190px] relative overflow-hidden bg-black/[0.02] border-b-[1px] border-black/5 transition-all duration-500">
          <AnimatePresence mode="wait">
            {/* Display hovered event OR nearest event by default */}
            {(() => {
              // Priority: Hovered Event > (If scrolled down: Nearest Event) > (If at top: Nearest Event)
              const displayEvent = hoveredEvent || nearestEvent;
              
              if (!displayEvent) {
                return (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 relative">
                     {/* Background Pattern */}
                     <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
                     <CalendarIcon className="w-6 h-6 mb-2 border border-black/10 rounded-full p-1.5 box-content bg-white shadow-sm" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">{lang === 'vi' ? 'Không có sự kiện' : 'No Events'}</p>
                     <p className="text-[9px] opacity-70 mt-1">{lang === 'vi' ? 'Tháng này chưa có lịch trình' : 'No schedules this month'}</p>
                  </div>
                );
              }

              const timeMs = displayEvent.time ? new Date(displayEvent.time).getTime() : 0;
              const endTimeMs = displayEvent.endTime ? new Date(displayEvent.endTime).getTime() : timeMs + (3 * 60 * 60 * 1000);
              const now = new Date().getTime();
              const isPast = endTimeMs < now;
              const isHappening = now >= timeMs && now <= endTimeMs;

              return (
                <motion.div 
                  key={displayEvent.id + (hoveredEvent ? '-hover' : '-default')}
                  initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                  onClick={() => onEventClick && onEventClick(displayEvent)}
                  className="absolute inset-0 flex cursor-pointer group"
                >
                  <div className="w-28 h-full flex-shrink-0 overflow-hidden relative">
                    <img src={displayEvent.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="thumb" referrerPolicy="no-referrer" />
                    <div className={`absolute top-0 left-0 text-white px-2 py-1 text-[8px] sm:text-[9px] shadow-sm font-bold uppercase rounded-br-xl z-10 w-full whitespace-normal leading-tight bg-opacity-90 ${isHappening ? 'bg-green-600' : (isPast ? 'bg-gray-600' : config.accent)}`}>
                        {isHappening ? (lang === 'vi' ? 'Đang diễn ra' : 'Happening') : (isPast ? (lang === 'vi' ? 'Đã kết thúc' : 'Ended') : (lang === 'vi' ? 'Sắp diễn ra' : 'Upcoming'))}
                    </div>
                  </div>
                  <div className="flex-grow p-4 flex flex-col pt-3 pb-3 justify-center bg-white/95 backdrop-blur-md hover:bg-white transition-colors relative w-[calc(100%-112px)]">
                    <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${config.accentText} leading-none`}>
                          {(() => {
                            const resolvedSub = resolveEventSubCategory(displayEvent, subCategories);
                            const mainType = resolveEventCategory(displayEvent, classifications);
                            const matchedClassification = classifications.find(c => c.id === mainType);
                            const resolvedMainTypeName = matchedClassification 
                              ? (lang === 'vi' ? matchedClassification.name_vi : matchedClassification.name_en) 
                              : (lang === 'vi' ? 'Sách Nhà Mình' : 'Sach Nha Minh'); 
                            const resolvedSubCategoryName = lang === 'vi' ? resolvedSub.name_vi : resolvedSub.name_en;
                            return `${resolvedMainTypeName} > ${resolvedSubCategoryName}`;
                          })()}
                        </span>
                    </div>
                    <h5 className={`font-black ${config.text} text-sm sm:text-base mb-1.5 leading-snug group-hover:${config.accentText} transition-colors tracking-tight line-clamp-3`}>
                      {lang === 'vi' ? displayEvent.title_vi : displayEvent.title_en}
                    </h5>
                    <div className="flex flex-col gap-1.5 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs font-black opacity-70">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(displayEvent.time).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(endTimeMs).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {(displayEvent.location || displayEvent.location_vi) && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60 w-full">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{displayEvent.location || displayEvent.location_vi}</span>
                            </div>
                        )}
                        {(!isPast) && (
                          <div className="origin-left scale-75 whitespace-nowrap -ml-1 mt-1 opacity-80">
                            <Countdown targetDate={isHappening ? new Date(endTimeMs).toISOString() : displayEvent.time} isHappening={isHappening} />
                          </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Calendar Grid Area */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col items-center justify-center mb-6 text-center space-y-3">
             <div className={`text-[10px] font-bold ${config.text} uppercase tracking-[0.2em] opacity-40 flex items-center justify-center gap-1.5`}>
                 <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                 {lang === 'vi' ? 'Lịch sự kiện' : 'Event Calendar'}
             </div>
             <div className="flex items-center gap-5">
                <button 
                  onClick={handlePrevMonth} 
                  className={`p-1.5 rounded-full hover:bg-black/5 opacity-40 hover:opacity-100 transition-all active:scale-95`}
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5 block" />
                </button>
                <div className={`text-sm font-black ${config.text} uppercase tracking-[0.1em] min-w-[120px] text-center leading-tight space-y-0.5`}>
                  <div className="block">{lang === 'vi' ? `Tháng ${month + 1}` : currentDate.toLocaleString('en-US', { month: 'long' })}</div>
                  <div className="block text-[10px] opacity-60 font-bold">{lang === 'vi' ? `năm ${year}` : year}</div>
                </div>
                <button 
                  onClick={handleNextMonth} 
                  className={`p-1.5 rounded-full hover:bg-black/5 opacity-40 hover:opacity-100 transition-all active:scale-95`}
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-5 h-5 block" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {t.days.map(d => (
              <div key={d} className={`text-center py-0.5 text-[9px] font-bold opacity-30 ${config.text} uppercase`}>{d}</div>
            ))}
            
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="h-7 border border-transparent" />
            ))}

            {calendarDays.map(d => {
              const event = currentMonthEvents.find(e => e.day === d || parseInt(e.date?.split('/')[0] || '0') === d || (e.time && new Date(e.time).getDate() === d));
              return (
                <div 
                  key={d} 
                  onMouseEnter={() => event && setHoveredEvent(event)}
                  onClick={() => event && onEventClick && onEventClick(event)}
                  className={`
                    h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-[11px] font-medium transition-all relative cursor-pointer
                    ${busyDays.includes(d) 
                      ? `${config.accent} text-white shadow-md scale-110 z-10 font-bold ring-1 ring-white/20` 
                      : `hover:bg-black/[0.03] ${config.text} opacity-60 hover:opacity-100`
                    }
                  `}
                >
                  {d}
                  {busyDays.includes(d) && <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-yellow-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


const Navbar = ({ onBookClick }: { onBookClick?: () => void }) => {
  const { theme, setTheme, font, setFont, config, siteName, siteLogo, showSpotlight, showBookReview, showCulture } = useContext(ThemeContext);
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', '#' + slug);
    } else {
      // Element not found (we are in detail page). Change hash to navigate back home and trigger scroll
      window.location.hash = '#' + slug;
    }
  };
  const { classifications = [] } = useContext(DataContext);

  const handleCategoryClick = (catId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(NAV_SLUGS[1]);
    if (!element) {
      window.location.hash = '#' + NAV_SLUGS[1];
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('select-news-category', { detail: catId }));
      const targetElement = document.getElementById(NAV_SLUGS[1]);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };
  const { lang, setLang, t } = useContext(LanguageContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${isScrolled || mobileMenuOpen ? `${config.bg}/80 backdrop-blur-xl py-4 shadow-sm` : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className={`text-xl md:text-2xl font-bold tracking-tight ${config.text} flex items-center gap-2 z-50`}>
            {siteLogo ? (
              <img src={siteLogo} alt={siteName || 'Sách nhà Mình'} className="h-8 md:h-10 object-contain" />
            ) : (
              <BookOpen className={`w-6 h-6 md:w-8 h-8 ${config.accentText}`} />
            )}
            <span>{siteName || 'Sách nhà Mình'}</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            {t.nav.map((item, index) => {
              const slug = NAV_SLUGS[index];
              if (slug === 'tieu-diem') {
                if (!showSpotlight) return null;
                return (
                  <div key={item} className="relative group py-2">
                    <a 
                      href={`#${slug}`} 
                      onClick={(e) => handleNavClick(e, slug)} 
                      className={`text-sm font-medium ${config.text} hover:opacity-70 transition-opacity whitespace-nowrap flex items-center gap-1`}
                    >
                      {item}
                      <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform group-hover:rotate-180" />
                    </a>
                    
                    {/* Dropdown list */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 origin-top z-[70]">
                      <div className="flex flex-col">
                        {classifications.map((cl: any) => (
                          <button
                            key={cl.id}
                            onClick={() => handleCategoryClick(cl.id)}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all first:rounded-t-xl last:rounded-b-xl"
                          >
                            {lang === 'vi' ? cl.name_vi : cl.name_en}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              if (slug === 'diem-sach' && !showBookReview) return null;
              return (
                <a key={item} href={`#${slug}`} onClick={(e) => handleNavClick(e, slug)} className={`text-sm font-medium ${config.text} hover:opacity-70 transition-opacity whitespace-nowrap`}>
                  {item}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:gap-4 z-50">
            {/* Lang Switcher */}
            <div className={`flex ${config.bg} p-1 rounded-full border ${config.border} shadow-sm`}>
              {(['vi', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === l ? `${config.accent} text-white shadow-md` : `opacity-40 hover:opacity-100 ${config.text}`} `}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 lg:hidden ${config.text} hover:opacity-70 transition-opacity`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-0 z-50 lg:hidden ${config.bg} pt-24 px-6 flex flex-col`}
          >
            <div className="flex flex-col gap-8 mb-12">
              {t.nav.map((item, index) => {
                const slug = NAV_SLUGS[index];
                if (slug === 'tieu-diem' && !showSpotlight) return null;
                if (slug === 'diem-sach' && !showBookReview) return null;
                return (
                  <a 
                    key={item} 
                    href={`#${slug}`} 
                    onClick={(e) => handleNavClick(e, slug)}
                    className={`text-3xl font-bold ${config.text} hover:opacity-70`}
                  >
                    {item}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = ({ onBookClick, onEventClick, onBookEventClick }: { 
  onBookClick?: () => void, 
  onEventClick?: (e: any) => void,
  onBookEventClick?: (e: any) => void
}) => {
  const { config } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { slides } = useContext(DataContext);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedSlide, setSelectedSlide] = useState<any>(null);

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides]);

  // Default slide logic if no custom slides
  const defaultSlide = {
    imageUrl: heroMainImg,
    heading_vi: t.heroTitle,
    heading_en: t.heroTitle,
    description_vi: t.heroDesc,
    description_en: t.heroDesc,
    effect: 'fade'
  };

  const hasSlides = slides && slides.length > 0;
  const safeIndex = hasSlides ? currentSlideIndex % slides.length : 0;
  const currentSlide = hasSlides ? (slides[safeIndex] || defaultSlide) : defaultSlide;
  const heading = hasSlides ? (lang === 'vi' ? currentSlide?.heading_vi || currentSlide?.heading_en : currentSlide?.heading_en || currentSlide?.heading_vi)?.replace(/\\n/g, '\n') : defaultSlide.heading_vi?.replace(/\\n/g, '\n');
  const description = hasSlides ? (lang === 'vi' ? currentSlide?.description_vi || currentSlide?.description_en : currentSlide?.description_en || currentSlide?.description_vi)?.replace(/\\n/g, '\n') : defaultSlide.description_vi?.replace(/\\n/g, '\n');
  const isSlideHtmlEmpty = (html: string) => {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').trim();
    return text.length === 0;
  };
  const hasDescription = description && description.trim().length > 0;
  const hasContent = hasSlides && (
    (currentSlide?.content_vi && !isSlideHtmlEmpty(currentSlide.content_vi)) || 
    (currentSlide?.content_en && !isSlideHtmlEmpty(currentSlide.content_en))
  );
  const onlyHasTitle = hasSlides && !hasDescription && !hasContent;

  const slideVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 }
    },
    zoom: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.2, opacity: 0 }
    },
    scale: {
      initial: { scale: 1.1, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { opacity: 0 }
    }
  };

  const currentEffect = currentSlide.effect || 'fade';
  const variants = (slideVariants as any)[currentEffect] || slideVariants.fade;

  return (
    <>
    <section id={NAV_SLUGS[0]} className="relative min-h-screen flex items-center overflow-hidden py-32 lg:py-0">
      <AnimatePresence mode="popLayout">
        <motion.div
           key={currentSlide.id || 'default'}
           initial="initial"
           animate="animate"
           exit="exit"
           variants={variants}
           transition={{ duration: 1, ease: 'easeInOut' }}
           className="absolute inset-0 z-0"
        >
          <img 
            src={currentSlide.imageUrl || heroMainImg} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 ${config.overlay}`} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id || 'default-text'}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-8 text-center lg:text-left drop-shadow-lg"
            >
              <div 
                style={(() => {
                  const size = parseInt(currentSlide?.heading_font_size);
                  if (size && !isNaN(size)) {
                    return { fontSize: `clamp(2rem, 8vw, ${size}px)` };
                  }
                  return undefined;
                })()}
                className={`text-4xl md:text-6xl lg:text-7xl font-bold ${config.text} mb-6 leading-[1.1] tracking-tight drop-shadow-xl [&_p]:m-0 [&_p]:p-0 [&_p]:inline-block [&_p]:w-full [&_p]:leading-inherit [&_p]:font-inherit [&_p]:text-inherit break-normal break-words`}
                dangerouslySetInnerHTML={{ __html: cleanHtmlContent(heading) }}
              />
              <p className={`text-lg md:text-xl ${config.text} mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0 opacity-90 drop-shadow-md whitespace-pre-line`}>
                {description}
              </p>
              {!onlyHasTitle && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {hasContent ? (
                  <button onClick={() => setSelectedSlide(currentSlide)} className={`${config.accent} text-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg`}>
                    {lang === 'vi' ? 'Xem chi tiết' : 'Read more'} <BookOpen className="w-4 h-4" />
                  </button>
                ) : (
                  <a href={`#${NAV_SLUGS[1]}`} className={`${config.accent} text-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg`}>
                    {t.heroCta1} <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="hidden lg:block lg:col-span-4">
             <CompactCalendar 
              onEventClick={onEventClick}
              onBookClick={onBookEventClick}
              className="w-full" 
             />
          </div>
        </div>
      </div>

      {hasSlides && slides.length > 1 && (
        <div className="absolute bottom-10 left-0 w-full flex justify-center gap-3 z-20">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`w-12 h-1.5 rounded-full transition-all duration-300 ${idx === currentSlideIndex ? 'bg-white opacity-100 scale-110' : 'bg-white/30 hover:bg-white/50 opacity-100'}`}
            />
          ))}
        </div>
      )}
    </section>

    <AnimatePresence>
      {selectedSlide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedSlide(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden mt-16">
            <div className="relative h-48 md:h-64 shrink-0">
               <img src={selectedSlide.imageUrl} alt="" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
               <button onClick={() => setSelectedSlide(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-[110]">
                 <X className="w-5 h-5" />
               </button>
               <div className="absolute bottom-6 left-6 right-6 text-white drop-shadow-md">
                 <div 
                   className="text-3xl md:text-5xl font-bold mb-2 prose-headings:m-0 prose-p:m-0"
                   dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? selectedSlide.heading_vi || selectedSlide.heading_en : selectedSlide.heading_en || selectedSlide.heading_vi) }}
                 />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50/50">
               <div className="prose prose-lg max-w-none hover:prose-a:text-blue-600 dangerously-set-content text-gray-800"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? selectedSlide.content_vi || selectedSlide.content_en : selectedSlide.content_en || selectedSlide.content_vi) }}
               />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
};

const Services = () => {
  const { config, theme } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { events: dbEvents, gallery: dbGallery } = useContext(DataContext);
  const allEvents = dbEvents.length > 0 ? dbEvents : SHARED_EVENTS;

  const [activeCategory, setActiveCategory] = useState<'school' | 'culture'>('school');

  const gallerySource = dbGallery && dbGallery.length > 0 ? dbGallery : ACTIVITY_GALLERY;
  
  const filteredGallery = gallerySource.filter(i => i.category === activeCategory);
  const filteredEvents = allEvents.filter(i => i.category === activeCategory);
  
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | string | null>(null);
  const [activeMainImage, setActiveMainImage] = useState<string | null>(null);

  const currentEventPhotos = filteredGallery.filter(i => String(i.eventId) === String(selectedEventId) && i.type === 'image');

  useEffect(() => {
    const gallery = gallerySource.filter(i => i.category === activeCategory);
    const events = allEvents.filter(i => i.category === activeCategory);
    const video = gallery.find(i => i.type === 'video');
    setActiveVideo(video);
    
    if (events.length > 0 && !events.find(e => String(e.id) === String(selectedEventId))) {
      setSelectedEventId(events[0].id);
    }
    
    const photos = gallery.filter(i => String(i.eventId) === String(selectedEventId) && i.type === 'image');
    if (photos.length > 0) {
      setActiveMainImage(photos[0].url || null);
    } else {
      const firstImg = gallery.find(i => i.type === 'image');
      setActiveMainImage(firstImg?.url || null);
    }
  }, [selectedEventId, activeCategory, allEvents, gallerySource]);

  const otherVideos = filteredGallery.filter(i => i.type === 'video' && i.id !== activeVideo?.id);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="mb-16">
        <div className="flex flex-col mb-8">
          <div className="flex items-center gap-6 mb-2">
            <span className={`text-xs font-bold ${config.accentText} uppercase tracking-[0.2em]`}>{t.nav[1]}</span>
            <div className={`p-1 rounded-full ${config.card} border ${config.border} shadow-sm inline-flex`}>
              <button 
                onClick={() => setActiveCategory('school')}
                className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${activeCategory === 'school' ? `${config.accent} text-white shadow-sm` : `opacity-40 hover:opacity-100 ${config.text}`}`}
              >
                {t.schoolTab}
              </button>
              <button 
                onClick={() => setActiveCategory('culture')}
                className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${activeCategory === 'culture' ? `${config.accent} text-white shadow-sm` : `opacity-40 hover:opacity-100 ${config.text}`}`}
              >
                {t.cultureTab}
              </button>
            </div>
          </div>
          <div className="space-y-4 mt-2">
            <h2 className={`text-3xl md:text-4xl font-bold ${config.text} tracking-tight uppercase whitespace-nowrap`}>
              {activeCategory === 'school' ? t.servicesTitle : t.cultureTitle}
            </h2>
            <div className={`w-32 h-1.5 ${config.accent} opacity-30`} />
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-16">
        {/* 1. Cinematic Video Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold opacity-30 uppercase tracking-[0.2em]`}>{t.mediaTitle}</h3>
            <div className="h-px flex-grow mx-6 bg-black/5" />
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-black aspect-[16/9] group shrink-0">
              {activeVideo && (
                <iframe 
                  src={activeVideo.videoUrl ? getYoutubeEmbedUrl(activeVideo.videoUrl) : undefined}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
            
            <div className="space-y-4 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 block">{t.videoLabel}</label>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {otherVideos.map(vid => (
                  <motion.div 
                    key={vid.id} 
                    onClick={() => setActiveVideo(vid)}
                    whileHover={{ y: -4 }}
                    className={`flex-shrink-0 w-48 flex flex-col gap-3 group cursor-pointer p-3 rounded-2xl transition-all ${activeVideo?.id === vid.id ? `${config.card} shadow-md border ${config.border}` : 'bg-black/5 hover:bg-black/10'}`}
                  >
                    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative shadow-sm">
                      <img src={vid.thumbnail || undefined} className="w-full h-full object-cover" alt="thumb" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-all">
                        <Play className="w-8 h-8 text-white relative z-10" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className={`text-xs font-bold ${config.text} line-clamp-2 leading-tight`}>{vid.title}</p>
                      <span className="text-[9px] uppercase font-bold opacity-70 tracking-widest">{lang === 'vi' ? 'Video' : 'Video'}</span>
                    </div>
                  </motion.div>
                ))}
                {otherVideos.length === 0 && (
                   <p className="text-[10px] opacity-70 italic py-6 px-4">{t.noMoreVideos}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Expansive Event Gallery */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold opacity-30 uppercase tracking-[0.2em]`}>{t.timelineTitle}</h3>
            <div className="h-px flex-grow mx-6 bg-black/5" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Right: Focused Gallery */}
            <div className="space-y-6 shrink-0 z-10 relative">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedEventId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-4"
                >
                  <div className="relative rounded-[40px] overflow-hidden shadow-xl bg-black/5 aspect-[16/9] group">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={activeMainImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        src={activeMainImage || undefined} 
                        className="w-full h-full object-cover"
                        alt="gallery-main"
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                       <h4 className="text-white text-xl font-bold">{allEvents.find(e => String(e.id) === String(selectedEventId))?.[lang === 'vi' ? 'title_vi' : 'title_en']}</h4>
                    </div>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {currentEventPhotos.map((img) => (
                      <motion.div 
                        key={img.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveMainImage(img.url || null)}
                        className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0 rounded-[20px] overflow-hidden cursor-pointer border-2 transition-all shadow-md ${activeMainImage === img.url ? `${themes[theme].accent.replace('bg-', 'border-')} shadow-lg ring-4 ring-black/5` : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={img.url || undefined} className="w-full h-full object-cover" alt="thumb" referrerPolicy="no-referrer" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Left: Event Selection */}
            <div className="space-y-3 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 block mb-2">{lang === 'vi' ? 'Sự kiện' : 'Events'}</label>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar p-1">
                {filteredEvents.map((ev) => (
                  <motion.div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    whileHover={{ y: -2 }}
                    className={`flex-shrink-0 w-64 flex items-center gap-4 p-3 rounded-[24px] cursor-pointer transition-all ${selectedEventId === ev.id ? `${config.card} shadow-lg border ${config.border} ring-2 ring-black/5` : 'bg-black/5 hover:bg-black/10'}`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 flex-shrink-0 shadow-sm">
                      <img src={ev.image || undefined} className="w-full h-full object-cover" alt="event" />
                    </div>
                    <div className="flex-grow">
                      <span className="text-[9px] font-black opacity-30 block mb-0.5 uppercase tracking-widest">{ev.time.split('T')[0]}</span>
                      <h4 className={`text-[12px] font-bold ${config.text} leading-tight line-clamp-2`}>{lang === 'vi' ? ev.title_vi : ev.title_en}</h4>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Removed Event Description/Content to avoid duplication with Events section */}
          </div>
        </div>
      </div>
    </section>
  );
};

const EventDetailPage = ({ 
  event, 
  onBack,
  onBookEventClick
}: { 
  event: any, 
  onBack: () => void,
  onBookEventClick?: (ev: any) => void
}) => {
  const { config } = useContext(ThemeContext);
  const { lang, t } = useContext(LanguageContext);
  const { classifications = [], articles = [], gallery = [] } = useContext(DataContext);

  const [activeSubTab, setActiveSubTab] = useState<'content' | 'articles' | 'images' | 'videos'>('content');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeImageFolderId, setActiveImageFolderId] = useState<string | null>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ isOpen: boolean, index: number, items: any[] }>({ isOpen: false, index: 0, items: [] });

  const relatedArticles = articles.filter(a => 
    String(a.event_id || a.eventId) === String(event.id) || (a.category && a.category.split('|')[1]?.split(',').includes(String(event.id)))
  );

  const relatedMedia = gallery.filter(g => 
    String(g.event_id || g.eventId) === String(event.id)
  );

  const handleCategoryClick = (clId: string) => {
    onBack();
    setTimeout(() => {
      const element = document.getElementById(NAV_SLUGS[1]);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 self-start"
        >
          ← {lang === 'vi' ? 'Quay lại trang chủ' : 'Back to Home'}
        </button>

        {/* Classification categories tabs */}
        <div className="flex flex-wrap gap-1.5 bg-black/5 p-1.5 rounded-2xl self-start md:self-auto">
          {classifications.map((cl) => {
            const isSelected = String(event.category || 'sachnhaminh') === String(cl.id);
            return (
              <button
                key={cl.id}
                onClick={() => handleCategoryClick(cl.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected 
                    ? `${config.accent} text-white shadow-md` 
                    : `text-gray-500 hover:text-gray-900 hover:bg-black/5`
                }`}
              >
                {lang === 'vi' ? cl.name_vi : cl.name_en}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Event content (Col-span-9) */}
          <div className="lg:col-span-9 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left">
            {event.image && (
              <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                <img src={event.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 font-semibold">
                <span className="flex items-center gap-1">📅 {event.date}</span>
                {event.time && <span className="flex items-center gap-1">⏰ {event.time} {event.end_time ? `- ${event.end_time}` : ''}</span>}
                {event.location && <span className="flex items-center gap-1">📍 {event.location}</span>}
              </div>

              <h1 className={`text-2xl md:text-4xl font-black ${config.text} leading-tight`}>
                {lang === 'vi' ? event.title_vi : event.title_en || event.title_vi}
              </h1>
            </div>

            {event.description_vi && (
              <p className="text-sm font-semibold text-gray-600 leading-relaxed border-l-4 border-black/20 pl-4 py-1 italic bg-black/[0.01]">
                {lang === 'vi' ? event.description_vi : event.description_en || event.description_vi}
              </p>
            )}

            {/* Tabs Navigation */}
            <div className="flex flex-wrap border-b border-gray-200 gap-6 mt-6 shrink-0">
              <button
                onClick={() => setActiveSubTab('content')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeSubTab === 'content'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {lang === 'vi' ? 'Nội dung chương trình' : 'Program Content'}
              </button>
              <button
                onClick={() => setActiveSubTab('articles')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeSubTab === 'articles'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {lang === 'vi' ? 'Tin sự kiện' : 'Event News'}
              </button>
              <button
                onClick={() => setActiveSubTab('images')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeSubTab === 'images'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {lang === 'vi' ? 'Hình ảnh' : 'Images'}
              </button>
              <button
                onClick={() => setActiveSubTab('videos')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeSubTab === 'videos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {lang === 'vi' ? 'Video' : 'Videos'}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
              {activeSubTab === 'content' && (
                <div 
                  className="prose prose-lg max-w-none text-gray-800 leading-relaxed ql-snow"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? event.content_vi : event.content_en || event.content_vi) }}
                />
              )}

              {activeSubTab === 'articles' && (
                <div className="space-y-4">
                  {relatedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        window.location.hash = getArticleSeoUrl(art);
                      }}
                      className="group cursor-pointer p-4 rounded-2xl bg-gray-50 hover:bg-blue-50/20 border border-gray-100 hover:border-blue-100 transition-all flex gap-4 text-left animate-in fade-in duration-300"
                    >
                      {art.image && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                          <img src={art.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">{art.date}</span>
                        <h4 className={`font-bold text-sm ${config.text} group-hover:text-blue-600 transition-colors line-clamp-2`}>
                          {lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lang === 'vi' ? art.summary_vi : art.summary_en || art.summary_vi}</p>
                      </div>
                    </div>
                  ))}
                  {relatedArticles.length === 0 && (
                    <p className="text-sm text-gray-400 italic py-8 text-center">{lang === 'vi' ? 'Chưa có tin sự kiện cho sự kiện này.' : 'No related articles.'}</p>
                  )}
                </div>
              )}

              {activeSubTab === 'images' && (() => {
                const relatedImages = relatedMedia.filter(m => m.type !== 'video');
                const imageFolders = relatedImages.filter(item => isDriveFolderUrl(item.url || ''));
                const directImages = relatedImages.filter(item => !isDriveFolderUrl(item.url || ''));

                return (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    {imageFolders.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {(() => {
                          const mainItem = imageFolders.find(v => v.id === activeImageFolderId) || imageFolders[0];
                          const mainUrl = parseDriveUrl(mainItem.url || '', 'folder');
                          return (
                            <div className="relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 h-[300px] w-full shadow-sm">
                              <iframe 
                                src={mainUrl} 
                                className="absolute top-0 left-0 w-full h-full border-none" 
                                title={mainItem.title || 'Google Drive Folder'}
                              />
                            </div>
                          );
                        })()}

                        {imageFolders.length > 1 && (
                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mt-4 border border-black/[0.03] rounded-2xl p-2 bg-black/[0.01]">
                            {imageFolders.map(item => {
                              const isActive = activeImageFolderId === item.id || (!activeImageFolderId && item.id === imageFolders[0].id);
                              const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.url || '', 'image') || '';
                              return (
                                <div 
                                  key={item.id} 
                                  onClick={() => setActiveImageFolderId(item.id)}
                                  className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl border transition-all ${
                                    isActive 
                                      ? 'border-black/10 bg-black/[0.03] shadow-sm' 
                                      : 'border-transparent hover:bg-black/[0.02]'
                                  }`}
                                >
                                  <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black/5 flex-shrink-0">
                                    {thumbUrl !== '' ? (
                                      <img src={thumbUrl} alt="thumb" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-150">
                                        📁
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                      {item.title || 'Thư mục ảnh'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {directImages.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {directImages.map((img, idx) => {
                          const thumb = img.thumbnail || img.thumbnailUrl || getThumbnailForUrl(img.url || '', 'image') || img.url || '';
                          return (
                            <div 
                              key={img.id}
                              onClick={() => setMediaLightbox({ isOpen: true, index: idx, items: directImages })}
                              className="flex items-center gap-4 cursor-pointer p-2.5 rounded-xl border border-black/5 hover:bg-black/[0.02] transition-all text-left"
                            >
                              <div className="w-20 aspect-video rounded-lg overflow-hidden relative bg-black/5 flex-shrink-0">
                                <img src={thumb} alt={img.title || ''} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-700 block truncate">
                                  {img.title || `Hình ảnh ${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {imageFolders.length === 0 && directImages.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-8 text-center">{lang === 'vi' ? 'Chưa có tài liệu hình ảnh.' : 'No images for this event.'}</p>
                    )}
                  </div>
                );
              })()}

              {activeSubTab === 'videos' && (() => {
                const relatedVideos = relatedMedia.filter(m => m.type === 'video');
                const videoFolders = relatedVideos.filter(item => isDriveFolderUrl(item.url || ''));
                const directVideos = relatedVideos.filter(item => !isDriveFolderUrl(item.url || ''));

                return (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    {videoFolders.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {(() => {
                          const mainItem = videoFolders.find(v => v.id === activeVideoId) || videoFolders[0];
                          const mainUrl = parseDriveUrl(mainItem.url || '', 'folder');
                          return (
                            <div className="relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 h-[300px] w-full shadow-sm">
                              <iframe 
                                src={mainUrl} 
                                className="absolute top-0 left-0 w-full h-full border-none" 
                                title={mainItem.title || 'Google Drive Folder'}
                              />
                            </div>
                          );
                        })()}

                        {videoFolders.length > 1 && (
                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mt-4 border border-black/[0.03] rounded-2xl p-2 bg-black/[0.01]">
                            {videoFolders.map(item => {
                              const isActive = activeVideoId === item.id || (!activeVideoId && item.id === videoFolders[0].id);
                              const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.url || '', 'video') || '';
                              return (
                                <div 
                                  key={item.id} 
                                  onClick={() => setActiveVideoId(item.id)}
                                  className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl border transition-all ${
                                    isActive 
                                      ? 'border-black/10 bg-black/[0.03] shadow-sm' 
                                      : 'border-transparent hover:bg-black/[0.02]'
                                  }`}
                                >
                                  <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black/5 flex-shrink-0">
                                    {thumbUrl !== '' ? (
                                      <img src={thumbUrl} alt="thumb" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-150">
                                        📁
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                      {item.title || 'Thư mục video'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {directVideos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {directVideos.map((video, idx) => {
                          const isFolder = isDriveFolderUrl(video.url || '');
                          const thumbUrl = video.thumbnail || video.thumbnailUrl || getThumbnailForUrl(video.url || '', 'video') || '';
                          const isYoutube = video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'));
                          
                          return (
                            <div 
                              key={video.id}
                              onClick={() => {
                                if (isYoutube) {
                                  setMediaLightbox({ isOpen: true, index: idx, items: directVideos });
                                } else {
                                  window.open(video.url, '_blank');
                                }
                              }}
                              className="flex items-center gap-4 cursor-pointer p-2.5 rounded-xl border border-black/5 hover:bg-black/[0.02] transition-all text-left"
                            >
                              <div className="w-24 aspect-video rounded-lg overflow-hidden relative bg-black/5 flex-shrink-0">
                                {thumbUrl !== '' ? (
                                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                    <Play className="w-4 h-4 opacity-40" />
                                  </div>
                                )}
                                {!isFolder && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-700 block truncate">
                                  {video.title || `Video ${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {videoFolders.length === 0 && directVideos.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-8 text-center">{lang === 'vi' ? 'Chưa có tài liệu video.' : 'No videos for this event.'}</p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Booking Call to Action */}
            <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-left">
                <h4 className="font-bold text-sm text-gray-900">{lang === 'vi' ? 'Đặt chỗ tham gia sự kiện' : 'Book event ticket'}</h4>
                <p className="text-xs text-gray-500">{lang === 'vi' ? 'Hãy đăng ký giữ chỗ ngay hôm nay' : 'Reserve your spot today'}</p>
              </div>
              <button 
                onClick={() => onBookEventClick?.(event)}
                className={`px-8 py-3.5 rounded-full font-bold text-white shadow-lg transition-all hover:brightness-110 ${config.accent}`}
              >
                {lang === 'vi' ? 'Đặt chỗ ngay' : 'Book Now'}
              </button>
            </div>
          </div>

          {/* Right Column: Related Articles (Col-span-3) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left">
            <div className="space-y-4">
              <h3 className={`text-sm font-black uppercase tracking-wider ${config.accentText} border-b pb-2`}>
                📰 {lang === 'vi' ? 'Bài viết liên quan' : 'Related Articles'}
              </h3>
              <div className="space-y-3">
                {relatedArticles.map(art => (
                  <div
                    key={art.id}
                    onClick={() => {
                      window.location.hash = getArticleSeoUrl(art);
                    }}
                    className="group cursor-pointer p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all duration-300 flex flex-col gap-2"
                  >
                    {art.image && (
                      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gray-200">
                        <img src={art.image} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">{art.date}</span>
                      <h4 className={`font-bold text-xs ${config.text} group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug`}>
                        {lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}
                      </h4>
                    </div>
                  </div>
                ))}
                {relatedArticles.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-4">{lang === 'vi' ? 'Không có bài viết nào.' : 'No related articles.'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for EventDetailPage */}
      <AnimatePresence>
        {mediaLightbox.isOpen && (
          <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col justify-center items-center p-4">
            <button 
              onClick={() => setMediaLightbox({ isOpen: false, index: 0, items: [] })}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-[130]"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center">
              {(() => {
                const item = mediaLightbox.items[mediaLightbox.index];
                if (!item) return null;
                const isYoutube = item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'));
                
                if (isYoutube) {
                  const embedUrl = getYoutubeEmbedUrl(item.url);
                  return (
                    <iframe 
                      src={embedUrl} 
                      className="w-full h-full rounded-2xl shadow-2xl border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={item.title || "Youtube Video"}
                    />
                  );
                } else {
                  const imgUrl = parseDriveUrl(item.url || '', 'image');
                  return (
                    <img 
                      src={imgUrl} 
                      alt="" 
                      className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" 
                      referrerPolicy="no-referrer"
                    />
                  );
                }
              })()}

              {mediaLightbox.items.length > 1 && (
                <>
                  <button 
                    onClick={() => setMediaLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }))}
                    className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setMediaLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.items.length }))}
                    className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            {mediaLightbox.items[mediaLightbox.index]?.title && (
              <p className="mt-4 text-sm text-white/80 font-medium">
                {mediaLightbox.items[mediaLightbox.index].title}
              </p>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArticleDetailPage = ({ 
  article, 
  onBack, 
  onEventClick 
}: { 
  article: any, 
  onBack: () => void, 
  onEventClick?: (ev: any) => void 
}) => {
  const { config } = useContext(ThemeContext);
  const { lang, t } = useContext(LanguageContext);
  const { classifications = [], events = [], articles = [] } = useContext(DataContext);

  const [catPart = '', eventPart = ''] = (article.category || '').split('|');
  const categories = catPart.split(',').filter(Boolean);
  const eventIds = eventPart.split(',').filter(Boolean);

  const associatedEvents = events.filter(ev => 
    eventIds.includes(String(ev.id)) || String(ev.id) === String(article.event_id || article.eventId)
  );
  
  // Calculate related articles (same categories, max 3, excluding current)
  const newsSource = articles.length > 0 ? articles : SCHOOL_NEWS;
  const relatedArticles = newsSource.filter(art => {
    if (String(art.id) === String(article.id)) return false;
    const [otherCatPart = ''] = (art.category || '').split('|');
    const otherCats = otherCatPart.split(',').filter(Boolean);
    return otherCats.some(c => categories.includes(c));
  }).slice(0, 3);

  const handleCategoryClick = (clId: string) => {
    onBack();
    setTimeout(() => {
      const element = document.getElementById(NAV_SLUGS[1]);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 self-start"
        >
          ← {lang === 'vi' ? 'Quay lại trang chủ' : 'Back to Home'}
        </button>

        {/* Classification categories tabs */}
        <div className="flex flex-wrap gap-1.5 bg-black/5 p-1.5 rounded-2xl self-start md:self-auto">
          {classifications.map((cl) => {
            const isSelected = categories.includes(cl.id);
            return (
              <button
                key={cl.id}
                onClick={() => handleCategoryClick(cl.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected 
                    ? `${config.accent} text-white shadow-md` 
                    : `text-gray-500 hover:text-gray-900 hover:bg-black/5`
                }`}
              >
                {lang === 'vi' ? cl.name_vi : cl.name_en}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Detailed Article Body (Col-span-9) */}
          <div className="lg:col-span-9 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left">
            {article.image && (
              <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-black/5 shadow-sm">
                <img src={article.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {categories.map(catId => {
                  const match = classifications.find(c => c.id === catId);
                  return (
                    <span key={catId} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {match ? match.name_vi : catId}
                    </span>
                  );
                })}
              </div>
              <h1 className={`text-2xl md:text-4xl font-black ${config.text} leading-tight`}>
                {lang === 'vi' ? article.title_vi : article.title_en || article.title_vi}
              </h1>
              <span className="text-xs text-gray-500 font-semibold block flex items-center gap-1.5 mt-2">
                📅 {lang === 'vi' ? 'Ngày đăng' : 'Published'}: {article.date || (article.created_at ? new Date(article.created_at).toLocaleDateString('vi-VN') : '—')}
              </span>
            </div>

            {article.summary_vi && (
              <p className="text-sm font-semibold text-gray-600 leading-relaxed border-l-4 border-black/20 pl-4 py-1 italic bg-black/[0.01]">
                {lang === 'vi' ? article.summary_vi : article.summary_en || article.summary_vi}
              </p>
            )}

            
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed ql-snow"
              dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? article.content_vi : article.content_en || article.content_vi) }}
            />

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="border-t border-gray-100 pt-8 mt-12 space-y-6">
                <h3 className={`text-lg font-bold uppercase tracking-wider ${config.accentText}`}>
                  📰 {lang === 'vi' ? 'Bài viết liên quan' : 'Related Articles'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        window.location.hash = getArticleSeoUrl(art);
                      }}
                      className="group cursor-pointer flex flex-col gap-3"
                    >
                      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 border border-black/5">
                        {art.image ? (
                          <img src={art.image} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] text-gray-400 font-bold block">
                          {art.date || (art.created_at ? new Date(art.created_at).toLocaleDateString('vi-VN') : '')}
                        </span>
                        <h4 className={`font-bold text-sm ${config.text} group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug`}>
                          {lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Related Events (Col-span-3) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
            <h3 className={`text-sm font-black uppercase tracking-wider ${config.accentText} border-b pb-2 mb-2`}>
              📅 {lang === 'vi' ? 'Sự kiện liên quan' : 'Related Events'}
            </h3>
            <div className="space-y-3">
              {associatedEvents.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => { window.location.hash = getEventSeoUrl(ev); }}
                  className="group cursor-pointer p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all duration-300 flex flex-col gap-2"
                >
                  {ev.image && (
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-200">
                      <img src={ev.image} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold block mb-1">
                      {ev.date} {ev.time ? `• ${ev.time}` : ''}
                    </span>
                    <h4 className={`font-bold text-xs ${config.text} group-hover:text-blue-600 transition-colors line-clamp-2`}>
                      {lang === 'vi' ? ev.title_vi : ev.title_en || ev.title_vi}
                    </h4>
                  </div>
                </div>
              ))}
              {associatedEvents.length === 0 && (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  {lang === 'vi' ? 'Không có sự kiện liên quan.' : 'No related events.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsSection = ({ onEventClick }: { onEventClick?: (event: any) => void }) => {
  const { config } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { articles = [], events = [], classifications = [] } = useContext(DataContext);
  
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (classifications.length > 0 && !activeTab) {
      setActiveTab(classifications[0].id);
    }
  }, [classifications, activeTab]);

  useEffect(() => {
    const handleSelectCategory = (e: Event) => {
      const customEvent = e as CustomEvent;
      const categoryId = customEvent.detail;
      setActiveTab(categoryId);
    };
    window.addEventListener('select-news-category', handleSelectCategory);
    return () => window.removeEventListener('select-news-category', handleSelectCategory);
  }, []);

  const activeTabId = activeTab || (classifications[0]?.id || 'sachnhaminh');

  // Filter events belonging to this classification
  const filteredEvents = events.filter(e => String(e.category || 'sachnhaminh') === String(activeTabId));

  // Filter articles belonging to this classification
  const newsSource = articles.length > 0 ? articles : SCHOOL_NEWS;
  const filteredArticles = newsSource.filter(art => {
    const [catPart = '', eventPart = ''] = (art.category || '').split('|');
    const categories = catPart.split(',').filter(Boolean);
    const eventIds = eventPart.split(',').filter(Boolean);

    // 1. Check if the active tab is one of the selected categories
    if (categories.includes(activeTabId)) {
      return true;
    }

    // 2. Check if any associated events belong to the active tab classification
    const allEventIds = [...eventIds, art.event_id || art.eventId].filter(Boolean);
    if (allEventIds.length > 0) {
      return allEventIds.some(eventId => {
        const ev = events.find(e => String(e.id) === String(eventId));
        return ev && String(ev.category || 'sachnhaminh') === String(activeTabId);
      });
    }

    return false;
  });

  // Extract featured and other articles
  const featuredArticle = filteredArticles[0];
  const otherArticles = filteredArticles.slice(1);

  // Pagination for remaining articles (5 items per page)
  const ARTICLES_PER_PAGE = 5;
  const totalPages = Math.ceil(otherArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedOtherArticles = otherArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  return (
    <section id={NAV_SLUGS[1]} className={`py-24 px-6 border-t ${config.border} bg-black/[0.01]`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4 shrink-0">
             <h2 className={`text-3xl md:text-4xl font-bold ${config.text} tracking-tight uppercase whitespace-nowrap`}>
               {lang === 'vi' ? 'Tin Tức' : 'News'}
             </h2>
             <div className={`w-32 h-1.5 ${config.accent} opacity-30 mx-auto lg:mx-0`} />
          </div>

          {/* Classification categories tabs */}
          <div className="flex flex-wrap justify-center gap-2 bg-black/5 p-1.5 rounded-2xl">
            {classifications.map((cl) => {
              const isActive = activeTabId === cl.id;
              return (
                <button
                  key={cl.id}
                  onClick={() => setActiveTab(cl.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? `${config.accent} text-white shadow-md` 
                      : `text-gray-500 hover:text-gray-900 hover:bg-black/5`
                  }`}
                >
                  {lang === 'vi' ? cl.name_vi : cl.name_en}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Articles/News List */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className={`text-lg font-bold uppercase tracking-wider ${config.accentText} mb-6 text-left`}>
              📰 {lang === 'vi' ? 'Bài viết nổi bật' : 'Featured Articles'}
            </h3>
            
            {/* 1. Main Featured Article */}
            {featuredArticle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => { window.location.hash = getArticleSeoUrl(featuredArticle); }}
                className={`group cursor-pointer rounded-3xl overflow-hidden ${config.card} border ${config.border} shadow-md hover:shadow-lg transition-all duration-500 flex flex-col md:flex-row gap-6 p-6 mb-8 text-left`}
              >
                <div className="md:w-1/2 aspect-[16/10] md:aspect-auto md:h-64 rounded-2xl overflow-hidden bg-gray-100 shrink-0 relative">
                  {featuredArticle.image ? (
                    <img src={featuredArticle.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <BookOpen className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                      {featuredArticle.date || (featuredArticle.created_at ? new Date(featuredArticle.created_at).toLocaleDateString('vi-VN') : '')}
                    </span>
                    <h4 className={`font-black text-xl md:text-2xl ${config.text} group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug`}>
                      {lang === 'vi' ? featuredArticle.title_vi : featuredArticle.title_en || featuredArticle.title_vi}
                    </h4>
                    <p className={`text-sm opacity-80 mt-3 line-clamp-3 md:line-clamp-4 leading-relaxed`}>
                      {lang === 'vi' ? featuredArticle.summary_vi : featuredArticle.summary_en || featuredArticle.summary_vi}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 group-hover:underline inline-flex items-center gap-1">
                    {lang === 'vi' ? 'Xem tiếp' : 'Read more'} →
                  </span>
                </div>
              </motion.div>
            )}

            {/* 2. Smaller Paginated Articles */}
            {paginatedOtherArticles.length > 0 && (
              <div className="space-y-6">
                <h4 className={`text-xs font-black uppercase tracking-widest text-gray-400 mb-4 text-left border-b pb-2`}>
                  {lang === 'vi' ? 'Bài viết khác' : 'Other Articles'}
                </h4>
                <div className="grid sm:grid-cols-2 gap-6">
                  {paginatedOtherArticles.map((art, idx) => (
                    <motion.div
                      key={art.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => { window.location.hash = getArticleSeoUrl(art); }}
                      className={`group cursor-pointer rounded-3xl overflow-hidden ${config.card} border ${config.border} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
                    >
                      <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
                        {art.image ? (
                          <img src={art.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <BookOpen className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1 justify-between gap-4 text-left">
                        <div>
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-2">
                            {art.date || (art.created_at ? new Date(art.created_at).toLocaleDateString('vi-VN') : '')}
                          </span>
                          <h4 className={`font-bold text-base ${config.text} group-hover:text-blue-600 transition-colors line-clamp-2`}>
                            {lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}
                          </h4>
                          <p className={`text-xs opacity-75 mt-2 line-clamp-3 leading-relaxed`}>
                            {lang === 'vi' ? art.summary_vi : art.summary_en || art.summary_vi}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 group-hover:underline inline-flex items-center gap-1">
                          {lang === 'vi' ? 'Xem tiếp' : 'Read more'} →
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!featuredArticle && (
              <p className="text-sm text-gray-400 italic text-center py-12">
                {lang === 'vi' ? 'Không có bài viết nào.' : 'No articles found.'}
              </p>
            )}

            {/* 3. Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    currentPage === 1
                      ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                      : 'border-gray-200 text-gray-600 hover:bg-black/5 bg-white shadow-sm'
                  }`}
                >
                  ← {lang === 'vi' ? 'Trang trước' : 'Prev'}
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                      currentPage === page
                        ? `${config.accent} text-white shadow-md border-transparent`
                        : 'border-gray-250 bg-white text-gray-600 hover:bg-black/5 shadow-sm'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    currentPage === totalPages
                      ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                      : 'border-gray-200 text-gray-600 hover:bg-black/5 bg-white shadow-sm'
                  }`}
                >
                  {lang === 'vi' ? 'Trang sau' : 'Next'} →
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Events List */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className={`text-lg font-bold uppercase tracking-wider ${config.accentText} mb-6 text-left`}>
              📅 {lang === 'vi' ? 'Sự kiện liên quan' : 'Related Events'}
            </h3>
            
            <div className="space-y-4">
              {filteredEvents.map((ev, idx) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => { window.location.hash = getEventSeoUrl(ev); }}
                  className={`group cursor-pointer p-4 rounded-2xl ${config.card} border ${config.border} shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 items-center text-left`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {ev.image ? (
                      <img src={ev.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                      {ev.date} {ev.time ? `• ${ev.time}` : ''}
                    </span>
                    <h4 className={`font-bold text-sm ${config.text} group-hover:text-blue-600 transition-colors truncate`}>
                      {lang === 'vi' ? ev.title_vi : ev.title_en || ev.title_vi}
                    </h4>
                    <span className="text-[10px] opacity-60 truncate block mt-1">
                      📍 {ev.location || '—'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="py-16 text-center text-gray-400 bg-white border border-gray-100 rounded-3xl">
                  <p>{lang === 'vi' ? 'Chưa có sự kiện nào thuộc phân mục này.' : 'No events in this category.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setSelectedNews(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-left ${config.border} border`}
            >
              <div className="px-6 py-4 border-b border-black/[0.05] flex justify-between items-center bg-gray-50/50">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} bg-black/5 py-1 px-3 rounded-full`}>
                  {selectedNews.category || 'Tin tức'}
                </span>
                <button onClick={() => setSelectedNews(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {selectedNews.image && (
                  <img src={selectedNews.image} alt={selectedNews.title_vi} className="w-full aspect-[21/9] object-cover rounded-2xl shadow-sm border border-black/5" referrerPolicy="no-referrer" />
                )}
                <div>
                  <h3 className={`text-2xl md:text-3xl font-black ${config.text} leading-tight`}>
                    {lang === 'vi' ? selectedNews.title_vi : selectedNews.title_en || selectedNews.title_vi}
                  </h3>
                  <span className="text-xs opacity-40 block mt-2">{selectedNews.date}</span>
                </div>

                {selectedNews.summary_vi && (
                  <p className="text-sm font-semibold opacity-70 leading-relaxed border-l-4 border-black/20 pl-4 py-1 italic bg-black/[0.01]">
                    {lang === 'vi' ? selectedNews.summary_vi : selectedNews.summary_en || selectedNews.summary_vi}
                  </p>
                )}

                <div 
                  className="opacity-90 leading-relaxed text-base max-w-none ql-snow"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? selectedNews.content_vi : selectedNews.content_en || selectedNews.content_vi) }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

const ThumbnailWithHover = ({ 
  isActive, thumbUrl, onClick, children 
}: { 
  isActive: boolean, thumbUrl: string, onClick: () => void, children: React.ReactNode 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative flex items-center gap-4 p-2 rounded-xl transition-all duration-300 text-left cursor-pointer ${isActive ? 'bg-black/5 border-black/10' : 'hover:bg-black/5 border-transparent'} border`}
    >
      {children}
    </div>
  );
};

const CultureChronicles = () => {
  const { config } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { events, articles, gallery, subCategories, classifications = [] } = useContext(DataContext);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'images' | 'videos'>('articles');
  const [activeModalVideoId, setActiveModalVideoId] = useState<string | null>(null);
  const [activeModalImageFolderId, setActiveModalImageFolderId] = useState<string | null>(null);
  const [readingArticle, setReadingArticle] = useState<any | null>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ isOpen: boolean, index: number, items: any[] }>({ isOpen: false, index: 0, items: [] });

  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 3;

  // Local filter states
  const [searchStatus, setSearchStatus] = useState<'all' | 'happening' | 'upcoming' | 'past'>('all');
  const [searchMainType, setSearchMainType] = useState<string>('all');
  const [searchSubCategory, setSearchSubCategory] = useState<string>('all');

  // Filter events based on local filter states
  let baseEvents = events.length > 0 ? events : SHARED_EVENTS;

  if (searchMainType !== 'all') {
    baseEvents = baseEvents.filter(e => {
      return resolveEventCategory(e, classifications) === searchMainType;
    });
  }

  if (searchSubCategory !== 'all') {
    baseEvents = baseEvents.filter(e => {
      const resolvedSub = resolveEventSubCategory(e, subCategories);
      return resolvedSub.id === searchSubCategory;
    });
  }

  const now = new Date().getTime();
  const EVENT_DURATION = 3 * 60 * 60 * 1000;
  
  const mappedEvents = baseEvents.map(e => {
    const timeMs = new Date(e.time).getTime();
    const endTimeMs = e.endTime ? new Date(e.endTime).getTime() : timeMs + EVENT_DURATION;
    let status = 'upcoming';
    let sortScore = 0;
    if (now >= timeMs && now <= endTimeMs) {
      status = 'happening';
      sortScore = 1;
    } else if (now > endTimeMs) {
      status = 'past';
      sortScore = -1;
    }
    return { ...e, _timeMs: timeMs, _endTimeMs: endTimeMs, _status: status, _sortScore: sortScore };
  });

  const filteredEvents = mappedEvents.filter((e: any) => searchStatus === 'all' || e._status === searchStatus);

  const sortedEvents = filteredEvents.sort((a, b) => {
    if (a._sortScore !== b._sortScore) return b._sortScore - a._sortScore;
    if (a._sortScore >= 0) return a._timeMs - b._timeMs;
    return b._timeMs - a._timeMs;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;

  const totalPages = Math.ceil(sortedEvents.length / EVENTS_PER_PAGE);
  const currentDisplayedEvents = sortedEvents.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

  // Auto select the first event of the filtered list by default when list changes
  const eventIdsStr = sortedEvents.map(e => e.id).join(',');
  useEffect(() => {
    setCurrentPage(1);
    if (sortedEvents.length > 0) {
      if (!selectedEventId || !sortedEvents.some(e => e.id === selectedEventId)) {
        setSelectedEventId(sortedEvents[0].id);
      }
    } else {
      setSelectedEventId(null);
    }
  }, [eventIdsStr]);

  // Filter linked resources
  const relatedArticles = selectedEvent 
    ? articles.filter(a => String(a.eventId || a.event_id) === String(selectedEvent.id))
    : [];

  const relatedMedia = selectedEvent
    ? gallery.filter(g => String(g.eventId || g.event_id) === String(selectedEvent.id))
    : [];

  return (
    <section id="theo-dong-van-hoa" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden border-t border-black/[0.05]">
      <div className="mb-12 text-center md:text-left">
        {/* Removed CMS Văn Hóa label */}
        <h2 className={`text-4xl md:text-5xl font-black ${config.text} tracking-tight uppercase mb-4`}>
          {lang === 'vi' ? 'Theo Dòng Văn Hóa' : 'Cultural Chronicles'}
        </h2>
        <p className={`${config.text} opacity-60 text-sm max-w-2xl`}>
          {lang === 'vi' 
            ? 'Khám phá các sự kiện văn hóa nổi bật cùng với chuỗi tin sự kiện, hình ảnh và video tư liệu được lưu trữ trực quan.' 
            : 'Explore prominent cultural events along with their chain of satellite articles, photo galleries, and video documentations.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Events List + Filter */}
        <div className="lg:col-span-5 flex flex-col h-full">
          
          {/* Dropdown Filters Panel (2-column dropdown list) */}
          <div className="grid grid-cols-2 gap-3.5 bg-white/50 backdrop-blur-md border border-gray-150/60 rounded-2xl p-4 shadow-sm mb-6">
            {/* Column 1: Main Classification Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                {lang === 'vi' ? 'Phân loại chính' : 'Main Classification'}
              </label>
              <div className="relative">
                <select 
                  value={searchMainType} 
                  onChange={e => setSearchMainType(e.target.value)} 
                  className={`w-full bg-white border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider ${config.text} outline-none focus:ring-2 focus:ring-black/5 focus:border-black/25 transition-all appearance-none cursor-pointer pr-10 shadow-sm`}
                >
                  <option value="all">{lang === 'vi' ? 'Tất cả phân loại' : 'All Classifications'}</option>
                  {classifications.map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'vi' ? c.name_vi : c.name_en}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Column 2: Event Categories Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                {lang === 'vi' ? 'Danh mục sự kiện' : 'Event Categories'}
              </label>
              <div className="relative">
                <select 
                  value={searchSubCategory} 
                  onChange={e => setSearchSubCategory(e.target.value)} 
                  className={`w-full bg-white border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider ${config.text} outline-none focus:ring-2 focus:ring-black/5 focus:border-black/25 transition-all appearance-none cursor-pointer pr-10 shadow-sm`}
                >
                  <option value="all">{lang === 'vi' ? 'Tất cả danh mục' : 'All Categories'}</option>
                  {subCategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {lang === 'vi' ? sub.name_vi : sub.name_en}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* List Header */}
          <div className="bg-black/[0.02] p-4 rounded-3xl border border-black/5 mb-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase opacity-60">
              {lang === 'vi' ? `Danh sách sự kiện (${sortedEvents.length})` : `Events list (${sortedEvents.length})`}
            </span>
          </div>

          {/* Scrollable list container */}
          <div className="space-y-4 pr-2 flex-1 flex flex-col min-h-0">
            {currentDisplayedEvents.map(event => {
              const isSelected = selectedEventId === event.id;
              const eventArts = articles.filter(a => String(a.eventId || a.event_id) === String(event.id));
              const eventGallery = gallery.filter(g => String(g.eventId || g.event_id) === String(event.id));

              return (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setActiveSubTab('articles');
                  }}
                  className={`p-4 rounded-[24px] border transition-all duration-300 cursor-pointer text-left flex gap-4 items-stretch ${
                    isSelected 
                      ? `${config.accent} text-white shadow-lg` 
                      : `${config.card} border-black/[0.05] hover:border-black/[0.15] shadow-sm`
                  }`}
                >
                  {/* Thumbnail Image Container (1/4 width) */}
                  <div className="w-1/4 aspect-square rounded-xl overflow-hidden bg-black/[0.03] flex-shrink-0 border border-black/5 relative">
                    {event.image ? (
                      <img src={event.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Details Container (3/4 width) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-black/5 opacity-60'
                        }`}>
                          {event.day || '12'}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-60">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> {eventArts.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> {eventGallery.length}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-base leading-snug line-clamp-1 mb-1">{lang === 'vi' ? event.title_vi : event.title_en || event.title_vi}</h4>
                    </div>
                    <p className={`text-xs opacity-75 line-clamp-2 leading-relaxed ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                      {lang === 'vi' ? event.description_vi : event.description_en || event.description_vi}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-black/5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold opacity-60">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: CMS details */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {selectedEvent ? (
            <div className={`p-6 md:p-8 rounded-[36px] border border-black/[0.05] ${config.card} shadow-sm space-y-6 text-left flex-1`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className={`text-2xl font-black ${config.text} leading-tight mb-2`}>
                    {lang === 'vi' ? selectedEvent.title_vi : selectedEvent.title_en || selectedEvent.title_vi}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs opacity-60">
                    <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {selectedEvent.date || 'Tháng 5'}</span>
                    {selectedEvent.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedEvent.location}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEventId(null)} 
                  className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub tabs */}
              <div className="flex gap-2 border-b border-black/[0.05] pb-2">
                <button
                  onClick={() => setActiveSubTab('articles')}
                  className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeSubTab === 'articles' 
                      ? `border-black text-black` 
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {lang === 'vi' ? `Tin sự kiện (${relatedArticles.length})` : `Satellite Articles (${relatedArticles.length})`}
                </button>
                <button
                  onClick={() => setActiveSubTab('images')}
                  className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeSubTab === 'images' 
                      ? `border-black text-black` 
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {lang === 'vi' ? `Hình ảnh (${relatedMedia.filter(m => m.type !== 'video').length})` : `Images (${relatedMedia.filter(m => m.type !== 'video').length})`}
                </button>
                <button
                  onClick={() => setActiveSubTab('videos')}
                  className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeSubTab === 'videos' 
                      ? `border-black text-black` 
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {lang === 'vi' ? `Video (${relatedMedia.filter(m => m.type === 'video').length})` : `Videos (${relatedMedia.filter(m => m.type === 'video').length})`}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                {activeSubTab === 'articles' && (
                  <div className="space-y-4">
                    {relatedArticles.length > 0 ? (
                      relatedArticles.map(art => (
                        <div 
                          key={art.id}
                          onClick={() => setReadingArticle(art)}
                          className="p-4 rounded-2xl border border-black/5 bg-black/[0.01] hover:bg-black/[0.03] transition-all cursor-pointer flex gap-4 items-center"
                        >
                          {art.image && (
                            <img src={art.image} alt={art.title_vi} className="w-16 h-16 object-cover rounded-xl border border-black/5" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-bold text-base leading-snug line-clamp-1">{lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}</h5>
                            <p className="text-xs opacity-60 line-clamp-2 mt-1">{lang === 'vi' ? art.summary_vi : art.summary_en || art.summary_vi}</p>
                            <span className="text-[10px] opacity-40 block mt-1">{art.date}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-40" />
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                        <FileText className="w-10 h-10 opacity-30 mb-2" />
                        <p className="text-sm">{lang === 'vi' ? 'Chưa có tin sự kiện cho sự kiện này.' : 'No related articles for this event.'}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'images' && (() => {
                  const relatedImages = relatedMedia.filter(m => m.type !== 'video');
                  const imageFolders = relatedImages.filter(item => isDriveFolderUrl(item.url || ''));
                  const directImages = relatedImages.filter(item => !isDriveFolderUrl(item.url || ''));
                  
                  return (
                    <div className="flex flex-col gap-8">
                      {imageFolders.length > 0 && (
                        <div className="flex flex-col gap-6">
                          {(() => {
                            const mainItem = imageFolders.find(v => v.id === activeModalImageFolderId) || imageFolders[0];
                            const mainUrl = parseDriveUrl(mainItem.url || '', 'folder');
                            return (
                              <div className="relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 h-[400px] md:h-[500px] w-full shadow-md">
                                <div className="w-full h-full relative overflow-hidden">
                                  <iframe 
                                    src={mainUrl} 
                                    className="absolute top-0 left-0 border-none origin-top-left" 
                                    style={{ width: '150%', height: '150%', transform: 'scale(0.666666)' }}
                                    title={mainItem.title || 'Google Drive Folder'}
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {imageFolders.length > 1 && (
                            <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-2 custom-scrollbar bg-white/50 rounded-xl p-2 border border-black/5">
                              {imageFolders.map(item => {
                                const isActive = activeModalImageFolderId === item.id || (!activeModalImageFolderId && item.id === imageFolders[0].id);
                                const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.url || '', 'image') || '';
                                return (
                                  <ThumbnailWithHover 
                                    key={item.id}
                                    isActive={isActive}
                                    thumbUrl={thumbUrl}
                                    onClick={() => setActiveModalImageFolderId(item.id)}
                                  >
                                    <div className="w-28 shrink-0 aspect-video relative group">
                                      <div className="w-full h-full rounded-lg overflow-hidden relative bg-black/5 border border-black/5">
                                        {thumbUrl !== '' ? (
                                          <img src={thumbUrl} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                             <ImageIcon className="w-5 h-5 opacity-40" />
                                          </div>
                                        )}
                                        {isActive && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                                              <ImageIcon className="w-3 h-3 ml-0.5" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                      <h4 className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                                        {item.title || (lang === 'vi' ? 'Thư mục hình ảnh' : 'Image Folder')}
                                      </h4>
                                    </div>
                                  </ThumbnailWithHover>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {directImages.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                          {directImages.map((item, idx) => {
                            const directUrl = parseDriveUrl(item.url || '', 'image');
                            return (
                              <button key={item.id} onClick={() => setMediaLightbox({ isOpen: true, index: idx, items: directImages })} className="block w-full aspect-square md:aspect-video relative cursor-pointer group/btn rounded-2xl overflow-hidden border border-black/5 bg-black/[0.02]">
                                <img src={directUrl} alt={item.title || 'Image'} className="w-full h-full object-cover transition-transform group-hover/btn:scale-105 duration-300" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/btn:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[10px] font-medium truncate">
                                  {item.title || 'Hình ảnh'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {relatedImages.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
                          <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                          <p className="text-sm">{lang === 'vi' ? 'Chưa có tài liệu hình ảnh.' : 'No image items for this event.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeSubTab === 'videos' && (() => {
                  const relatedVideos = relatedMedia.filter(m => m.type === 'video');
                  return (
                    <div className="flex flex-col gap-6">
                      {relatedVideos.length > 0 ? (
                        <>
                          {(() => {
                            const mainItem = relatedVideos.find(v => v.id === activeModalVideoId) || relatedVideos[0];
                            const isMainFolder = isDriveFolderUrl(mainItem.video_url || mainItem.videoUrl || mainItem.url || '');
                            const mainUrl = parseDriveUrl(mainItem.video_url || mainItem.videoUrl || mainItem.url || '', isMainFolder ? 'folder' : 'video');
                            return (
                              <div className={`relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 ${isMainFolder ? 'h-[400px] md:h-[500px]' : 'aspect-video'} w-full shadow-md`}>
                                {isMainFolder ? (
                                  <div className="w-full h-full relative overflow-hidden">
                                    <iframe 
                                      src={mainUrl} 
                                      className="absolute top-0 left-0 border-none origin-top-left" 
                                      style={{ width: '150%', height: '150%', transform: 'scale(0.666666)' }}
                                      title={mainItem.title || 'Google Drive Folder'}
                                    />
                                  </div>
                                ) : (
                                  <iframe 
                                    src={mainUrl} 
                                    className="w-full h-full border-none" 
                                    allowFullScreen 
                                    title={mainItem.title || 'Video'}
                                  />
                                )}
                              </div>
                            );
                          })()}

                          {relatedVideos.length > 2 && (
                            <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-2 custom-scrollbar bg-white/50 rounded-xl p-2 border border-black/5">
                              {relatedVideos.map(item => {
                                const isActive = activeModalVideoId === item.id || (!activeModalVideoId && item.id === relatedVideos[0].id);
                                const isFolder = isDriveFolderUrl(item.video_url || item.videoUrl || item.url || '');
                                const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.video_url || item.videoUrl || item.url || '', 'video') || '';
                                return (
                                  <ThumbnailWithHover 
                                    key={item.id}
                                    isActive={isActive}
                                    thumbUrl={thumbUrl}
                                    onClick={() => setActiveModalVideoId(item.id)}
                                  >
                                    <div className="w-28 shrink-0 aspect-video relative group">
                                      <div className="w-full h-full rounded-lg overflow-hidden relative bg-black/5 border border-black/5">
                                        {thumbUrl !== '' ? (
                                          <img src={thumbUrl} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            {isFolder ? <ImageIcon className="w-5 h-5 opacity-40" /> : <Play className="w-5 h-5 opacity-40" />}
                                          </div>
                                        )}
                                        {isActive && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                                              <Play className="w-3 h-3 ml-0.5" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                      <h4 className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                                        {item.title || (lang === 'vi' ? (isFolder ? 'Thư mục video' : 'Video') : 'Video')}
                                      </h4>
                                    </div>
                                  </ThumbnailWithHover>
                                );
                              })}
                            </div>
                          )}
                          
                          {relatedVideos.length === 2 && (
                            <div className="flex flex-col gap-2">
                              {relatedVideos.map(item => {
                                const isActive = activeModalVideoId === item.id || (!activeModalVideoId && item.id === relatedVideos[0].id);
                                const isFolder = isDriveFolderUrl(item.video_url || item.videoUrl || item.url || '');
                                const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.video_url || item.videoUrl || item.url || '', 'video') || '';
                                return (
                                  <ThumbnailWithHover 
                                    key={item.id}
                                    isActive={isActive}
                                    thumbUrl={thumbUrl}
                                    onClick={() => setActiveModalVideoId(item.id)}
                                  >
                                    <div className="w-28 shrink-0 aspect-video relative group">
                                      <div className="w-full h-full rounded-lg overflow-hidden relative bg-black/5 border border-black/5">
                                        {thumbUrl !== '' ? (
                                          <img src={thumbUrl} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            {isFolder ? <ImageIcon className="w-5 h-5 opacity-40" /> : <Play className="w-5 h-5 opacity-40" />}
                                          </div>
                                        )}
                                        {isActive && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                                              <Play className="w-3 h-3 ml-0.5" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                      <h4 className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                                        {item.title || (lang === 'vi' ? (isFolder ? 'Thư mục video' : 'Video') : 'Video')}
                                      </h4>
                                    </div>
                                  </ThumbnailWithHover>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                          <Play className="w-10 h-10 opacity-30 mb-2" />
                          <p className="text-sm">{lang === 'vi' ? 'Chưa có tài liệu video.' : 'No video items for this event.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-black/10 rounded-[36px] flex flex-col items-center justify-center p-12 text-center text-gray-400 flex-1">
              <Sparkles className={`w-12 h-12 ${config.accentText} opacity-30 mb-4`} />
              <h4 className="font-bold text-lg mb-2 text-gray-700">{lang === 'vi' ? 'Khám Phá Dòng Sự Kiện' : 'Explore Event Stream'}</h4>
              <p className="text-sm max-w-sm">
                {lang === 'vi' 
                  ? 'Hãy chọn một sự kiện bên danh sách để xem chi tiết tin sự kiện, kho ảnh tư liệu và thước phim kết nối từ Google Drive.' 
                  : 'Select an event from the list to view its related articles, documentation archive, and video streams connected from Google Drive.'}
              </p>
            </div>
          )}
        </div>
      </div>

            {/* Lightbox Overlay Modal */}
      <AnimatePresence>
        {mediaLightbox.isOpen && mediaLightbox.items.length > 0 && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
              onClick={() => setMediaLightbox({ isOpen: false, index: 0, items: [] })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center z-10"
            >
              <button 
                onClick={() => setMediaLightbox({ isOpen: false, index: 0, items: [] })} 
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative w-full h-full flex items-center justify-center">
                {mediaLightbox.items.length > 1 && (
                  <button 
                    onClick={() => setMediaLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }))}
                    className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                
                <img 
                  src={parseDriveUrl(mediaLightbox.items[mediaLightbox.index]?.url || '', 'image')} 
                  alt={mediaLightbox.items[mediaLightbox.index]?.title || 'Lightbox'} 
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />

                {mediaLightbox.items.length > 1 && (
                  <button 
                    onClick={() => setMediaLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.items.length }))}
                    className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
              
              {mediaLightbox.items[mediaLightbox.index]?.title && (
                <p className="mt-4 text-sm text-white/80 font-medium">
                  {mediaLightbox.items[mediaLightbox.index].title}
                </p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {readingArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setReadingArticle(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-left ${config.border} border`}
            >
              <div className="px-6 py-4 border-b border-black/[0.05] flex justify-between items-center bg-gray-50/50">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} bg-black/5 py-1 px-3 rounded-full`}>
                  {readingArticle.category || 'Tin sự kiện'}
                </span>
                <button onClick={() => setReadingArticle(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {readingArticle.image && (
                  <img src={readingArticle.image} alt={readingArticle.title_vi} className="w-full aspect-[21/9] object-cover rounded-2xl shadow-sm border border-black/5" />
                )}
                <div>
                  <h3 className={`text-2xl md:text-3xl font-black ${config.text} leading-tight`}>
                    {lang === 'vi' ? readingArticle.title_vi : readingArticle.title_en || readingArticle.title_vi}
                  </h3>
                  <span className="text-xs opacity-40 block mt-2">{readingArticle.date}</span>
                </div>

                {readingArticle.summary_vi && (
                  <p className="text-sm font-semibold opacity-70 leading-relaxed border-l-4 border-black/20 pl-4 py-1 italic bg-black/[0.01]">
                    {lang === 'vi' ? readingArticle.summary_vi : readingArticle.summary_en || readingArticle.summary_vi}
                  </p>
                )}

                <div 
                  className="opacity-90 leading-relaxed text-base max-w-none ql-snow"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? readingArticle.content_vi : readingArticle.content_en || readingArticle.content_vi) }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

const Events = () => {
  const { config } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { events: dbEvents, subCategories, classifications = [] } = useContext(DataContext);
  const [currentEventPage, setCurrentEventPage] = useState(1);
  const EVENTS_PER_PAGE = 5;

  const baseEvents = dbEvents.length > 0 ? dbEvents : SHARED_EVENTS;
  const now = new Date().getTime();
  const EVENT_DURATION = 3 * 60 * 60 * 1000;
  const displayEvents = baseEvents.map(e => {
    const timeMs = new Date(e.time).getTime();
    const endTimeMs = e.endTime ? new Date(e.endTime).getTime() : timeMs + EVENT_DURATION;
    let status = 'upcoming';
    let sortScore = 0;
    if (now >= timeMs && now <= endTimeMs) {
      status = 'happening';
      sortScore = 1;
    } else if (now > endTimeMs) {
      status = 'past';
      sortScore = -1;
    }
    return { ...e, _timeMs: timeMs, _endTimeMs: endTimeMs, _status: status, _sortScore: sortScore };
  }).sort((a, b) => {
    if (a._sortScore !== b._sortScore) return b._sortScore - a._sortScore;
    if (a._sortScore >= 0) return a._timeMs - b._timeMs;
    return b._timeMs - a._timeMs;
  });

  const totalEventPages = Math.ceil(displayEvents.length / EVENTS_PER_PAGE);
  const currentDisplayedEvents = displayEvents.slice((currentEventPage - 1) * EVENTS_PER_PAGE, currentEventPage * EVENTS_PER_PAGE);

  return (
    <section className="py-32 px-6 bg-black/[0.01]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          <div className="lg:col-span-8">
            <div className="mb-12">
              <span className={`text-xs font-bold ${config.accentText} uppercase tracking-[0.2em] mb-4 block`}>{t.eventsSub}</span>
            </div>
            
            <div className="space-y-8">
              {currentDisplayedEvents.map((event: any, idx) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-event', {detail: event}))}
                  className={`flex flex-col md:flex-row gap-8 p-6 rounded-[40px] ${config.card} border ${config.border} shadow-sm group hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer`}
                >
                  <div className="flex-grow min-w-0 p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                       <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const city = getCityFromLocation(event.location || (event as any).location_vi, lang);
                            if (city) {
                              return (
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.text} opacity-80 border border-black/10 bg-white py-1 px-3 rounded-full flex items-center gap-1.5 shadow-sm`}>
                                   <MapPin className="w-3 h-3 opacity-50" />
                                   {city}
                                </span>
                              );
                            }
                            return null;
                          })()}
                          {event._status === 'happening' && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-500/10 ring-1 ring-green-600/20 py-1 px-3 rounded-full flex items-center gap-1.5 animate-pulse`}>
                               <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                               {lang === 'vi' ? 'Đang diễn ra' : 'Happening'}
                            </span>
                          )}
                          {event._status === 'upcoming' && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} bg-black/5 ring-1 ring-black/10 py-1 px-3 rounded-full flex items-center gap-1.5`}>
                               <Clock className="w-3 h-3" />
                               {lang === 'vi' ? 'Sắp diễn ra' : 'Upcoming'}
                            </span>
                          )}
                          {event._status === 'past' && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-500/10 ring-1 ring-gray-500/20 py-1 px-3 rounded-full flex items-center gap-1.5`}>
                               {lang === 'vi' ? 'Đã diễn ra' : 'Ended'}
                            </span>
                          )}
                          {(() => {
                            const resolvedSub = resolveEventSubCategory(event, subCategories);
                            const mainType = resolveEventCategory(event, classifications);
                            const matchedClassification = classifications.find(c => c.id === mainType);
                            const resolvedMainTypeName = matchedClassification 
                              ? (lang === 'vi' ? matchedClassification.name_vi : matchedClassification.name_en) 
                              : (lang === 'vi' ? 'Sách Nhà Mình' : 'Sach Nha Minh'); 
                            const resolvedSubCategoryName = lang === 'vi' ? resolvedSub.name_vi : resolvedSub.name_en;
                            const typeText = lang === 'vi' ? event.type_vi : event.type_en;
                            const hasValidType = typeText && typeText.trim() !== '' && typeText.trim() !== '—' && typeText.trim() !== '-';
                            return (
                              <>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} py-1 px-3 rounded-full bg-black/5`}>
                                   {resolvedMainTypeName}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest text-white ${config.accent} py-1 px-3 rounded-full`}>
                                   {resolvedSubCategoryName}
                                </span>
                                {hasValidType && (
                                  <span className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-500/10 py-1 px-3 rounded-full`}>
                                     {typeText}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                       </div>
                       <div className="text-right mt-0.5">
                          <span className={`text-2xl font-serif font-bold ${config.text} block leading-none`}>{event.day}</span>
                          <span className="text-[10px] uppercase font-bold opacity-40">{lang === 'vi' ? 'Tháng 5' : 'May'}</span>
                       </div>
                    </div>
                    
                    {/* Registration & Ticket Info Group */}
                    <div className="flex flex-wrap items-center gap-2 mt-0 mb-2">
                      <div className={`flex items-center gap-1.5 bg-black/5 ${config.accentText} py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span>
                          {getApprovedCount(event)} {lang === 'vi' ? 'đăng ký' : 'registered'}
                        </span>
                      </div>
                      {(() => {
                        const approved = getApprovedCount(event);
                        const max = (event as any).maxAttendees ? parseInt((event as any).maxAttendees as string) : 0;
                        const isUnlimited = max === 0;
                        const remaining = max > 0 ? Math.max(0, max - approved) : 0;
                        return (
                          <div className={`flex items-center gap-1.5 ${isUnlimited || remaining > 0 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border-rose-500/20'} py-1 px-3 rounded-full border text-[10px] font-bold uppercase tracking-widest`}>
                            <Ticket className="w-3 h-3 flex-shrink-0" />
                            <span>
                              {isUnlimited ? (lang === 'vi' ? 'Không giới hạn vé' : 'Unlimited tickets') : `${lang === 'vi' ? 'Vé còn lại:' : 'Remaining:'} ${remaining}`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <h4 className={`text-2xl font-bold ${config.text} mb-2 group-hover:${config.accentText} transition-colors`}>{lang === 'vi' ? event.title_vi : event.title_en}</h4>
                    <p className={`${config.text} opacity-80 text-sm mb-4 line-clamp-2`}>{lang === 'vi' ? event.desc_vi : event.desc_en}</p>

                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-black/5 w-full">
                      <div className="flex flex-col gap-2">
                        {(event._status === 'upcoming' || event._status === 'happening') && (
                          <span className="text-xs font-bold text-gray-500 tracking-wider">
                            {event._status === 'happening' 
                              ? (lang === 'vi' ? 'Sự kiện diễn ra từ:' : 'Event takes place from:') 
                              : (lang === 'vi' ? 'Sự kiện bắt đầu lúc:' : 'Event starts at:')}
                          </span>
                        )}
                        <div className="flex flex-nowrap overflow-x-auto items-center gap-3 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                          <div className={`flex flex-nowrap items-center gap-2 ${event._status === 'happening' ? 'bg-green-600' : config.accent} py-2.5 px-6 rounded-full text-white shadow-md ring-2 ring-white flex-shrink-0`}>
                            <Clock className="w-5 h-5 flex-shrink-0" />
                            {event._status === 'happening' ? (
                              <span className="text-[13px] sm:text-sm font-black tracking-widest whitespace-nowrap">
                                {new Date(event.time).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                {' '}
                                {new Date(event.time).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                {' - '}
                                {new Date(event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                {' '}
                                {new Date(event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-base sm:text-lg font-black tracking-widest whitespace-nowrap">
                                {new Date(event.time).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                                {' - '}
                                {new Date(event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                                {', '}
                                {new Date(event.time).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div className={`flex flex-nowrap items-center gap-2 bg-black/[0.04] ${config.text} opacity-80 py-2.5 px-6 rounded-full border border-black/5 flex-shrink-0`}>
                            <MapPin className="w-5 h-5 flex-shrink-0" />
                            <span className="text-base font-bold whitespace-nowrap">{event.location || (event as any).location_vi || ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 w-full pt-1">
                        <div className="flex items-center gap-4 flex-wrap">
                          {(event._status === 'upcoming' || event._status === 'happening') && (
                            <div className={`flex-shrink-0 pr-4 md:border-r ${config.border}`}>
                              <Countdown targetDate={event._status === 'happening' ? (event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()) : event.time} isHappening={event._status === 'happening'} />
                            </div>
                          )}
                        {(() => {
                           const max = (event as any).maxAttendees ? parseInt((event as any).maxAttendees as string) : 0;
                           const isUnlimited = max === 0;
                           const approved = getApprovedCount(event);
                           const remaining = max > 0 ? Math.max(0, max - approved) : 0;
                           if (true) {
                             return (
                               <button
                                 onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isUnlimited && remaining <= 0) {
                                      alert("Cảm ơn quý khách đã quan tâm đến sự kiện của Sách Nhà Mình. Rất tiếc khi phải thông báo rằng sự kiện quý khách muốn tham gia hiện tại đã đủ số lượng. Kính mong quý khách thông cảm cho sự bất tiện này. Hẹn gặp quý khách vào một sự kiện khác của Sách Nhà Mình. Kính chúc quý khách một ngày vui vẻ! Xin cảm ơn!");
                                    } else {
                                      typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-booking', {detail: event})); 
                                    }
                                 }}
                                 className={`text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 py-2.5 px-5 rounded-full flex items-center gap-2 transition-all shadow-md shadow-black/10 hover:shadow-lg ${config.accent}`}
                               >
                                  <ShoppingCart className="w-4 h-4" />
                                  {lang === 'vi' ? 'Đặt chỗ' : 'Book'}
                               </button>
                             );
                           }
                           return null;
                        })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {totalEventPages > 1 && (
              <div className="flex items-center gap-2 mt-10">
                <button 
                  onClick={() => setCurrentEventPage(p => Math.max(1, p - 1))}
                  disabled={currentEventPage === 1}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${config.border} ${currentEventPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5'} transition-colors`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({length: totalEventPages}).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentEventPage(idx + 1)}
                      className={`w-2 h-2 rounded-full transition-all ${currentEventPage === idx + 1 ? `w-6 ${config.accent}` : 'bg-black/20 hover:bg-black/40'}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentEventPage(p => Math.min(totalEventPages, p + 1))}
                  disabled={currentEventPage === totalEventPages}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${config.border} ${currentEventPage === totalEventPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5'} transition-colors`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-32">
             <CompactCalendar 
              className="w-full" 
              onEventClick={(event) => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-event', {detail: event}))}
              onBookClick={(event) => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-booking', {detail: event}))}
             />
             <div className={`mt-8 p-6 rounded-[32px] ${config.accent} text-white flex items-center justify-between shadow-xl`}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">{lang === 'vi' ? 'Điểm nhấn tháng' : 'Monthly Highlight'}</h5>
                    <p className="text-xs opacity-80 italic">{lang === 'vi' ? 'Lan tỏa tri thức' : 'Spreading Knowledge'}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BookReview = () => {
  const { config } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const { books: dbBooks } = useContext(DataContext);
  const [currentMustReadPage, setCurrentMustReadPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  let hotBook: any = HOT_BOOK;
  let notableBooks = NOTABLE_BOOKS;
  let mustReadBooks = MUST_READ_BOOKS;

  if (dbBooks.length > 0) {
    const hotDbs = dbBooks.filter((b: any) => b.isHotMonth);
    hotBook = hotDbs.length > 0 ? hotDbs[0] : dbBooks[0];
    
    const typicalDbs = dbBooks.filter((b: any) => b.isTypical10);
    notableBooks = typicalDbs.length > 0 ? typicalDbs : dbBooks.slice(1, 11);
    
    const mustReadDbs = dbBooks.filter((b: any) => b.isMustRead100);
    mustReadBooks = mustReadDbs.length > 0 ? mustReadDbs : dbBooks.slice(11);
  }

  const BOOKS_PER_PAGE = 5;
  const totalMustReadPages = Math.ceil(mustReadBooks.length / BOOKS_PER_PAGE);
  const displayedMustRead = mustReadBooks.slice((currentMustReadPage - 1) * BOOKS_PER_PAGE, currentMustReadPage * BOOKS_PER_PAGE);

  return (
    <section id={NAV_SLUGS[3]} className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <AnimatePresence>
        {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </AnimatePresence>

      <div className="mb-20">
        <span className={`text-xs font-bold ${config.accentText} uppercase tracking-[0.3em] mb-4 block`}>{t.bookReviewSub}</span>
        <h2 className={`text-4xl md:text-5xl font-black ${config.text} tracking-tight uppercase mb-4`}>
          {t.bookReviewTitle}
        </h2>
        <div className={`w-32 h-1.5 ${config.accent} opacity-30`} />
      </div>

      <div className="grid lg:grid-cols-12 gap-16 mb-24 items-stretch">
        {/* Left: Hot Book */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0">
          <div className="space-y-10 group flex flex-col h-full">
            <h3 className={`text-lg font-black opacity-30 uppercase tracking-[0.2em] shrink-0`}>{t.hotBookTitle}</h3>
            {hotBook && (
              <div className={`relative rounded-[48px] overflow-hidden ${config.card} border ${config.border} shadow-2xl flex flex-col md:flex-row hover:shadow-3xl transition-all duration-700 flex-1`}>
                 <div className="md:w-1/2 overflow-hidden shrink-0">
                   <img src={hotBook.coverUrl || hotBook.image || hotBook.photoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Hot Book" />
                 </div>
                 <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
                    <div className="flex gap-1 mb-4">
                      {[...Array( parseInt(hotBook.rating || '5') || 5 )].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />)}
                    </div>
                    <h4 className={`text-3xl md:text-5xl font-black ${config.text} leading-tight mb-4 tracking-tighter`}>{hotBook.title || (lang === 'vi' ? hotBook.title_vi : hotBook.title_en)}</h4>
                    <p className={`text-sm font-bold ${config.accentText} uppercase tracking-widest mb-6`}>{hotBook.author}</p>
                    <div 
                      className={`prose prose-p:!m-0 ${config.text} opacity-80 text-lg leading-relaxed font-serif italic mb-10`}
                      dangerouslySetInnerHTML={{ __html: `"${hotBook.summary_vi || hotBook.summary_en || hotBook.desc || (lang === 'vi' ? hotBook.description_vi || hotBook.desc_vi : hotBook.description_en || hotBook.desc_en) || ''}"` }}
                    />
                    <button onClick={() => setSelectedBook(hotBook)} className={`${config.accent} text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest hover:brightness-110 shadow-xl transition-all w-fit z-10 relative`}>
                      {lang === 'vi' ? 'Đọc thử ngay' : 'Try Preview'}
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Must Read Ranking */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 pt-[68px] lg:pt-0">
          {/* Header spacer only for desktop to align with left title */}
          <h3 className={`text-lg font-black opacity-0 uppercase tracking-[0.2em] shrink-0 hidden lg:block mb-10`}>&nbsp;</h3>
          <div className={`p-10 rounded-[56px] ${config.card} border ${config.border} shadow-2xl flex flex-col flex-1 min-h-0`}>
            <div className="shrink-0 mb-8">
              <h3 className={`text-xl font-black ${config.text} mb-2 tracking-tight uppercase`}>{t.mustReadTitle}</h3>
              <div className={`w-12 h-1 ${config.accent} opacity-30`} />
            </div>

            <div className={`flex-1 overflow-y-auto pr-4 custom-scrollbar`}>
              {displayedMustRead.map((book: any, idx) => (
                <motion.div 
                  key={book.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedBook(book)}
                  className="flex items-center gap-5 p-4 rounded-3xl hover:bg-black/[0.02] transition-colors group cursor-pointer"
                >
                  <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-sm ${(book.rank || idx + 1) <= 3 ? `${config.accent} text-white` : 'bg-black/5 opacity-40'}`}>
                    {book.rank || idx + 1}
                  </div>
                  <div className="flex-grow">
                    <h5 className={`text-sm font-bold ${config.text} line-clamp-1 group-hover:${config.accentText} transition-colors`}>{book.title || (lang === 'vi' ? book.title_vi : book.title_en)}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(parseInt(book.rating || '5') || 5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${config.accentText} fill-current`} />)}
                      </div>
                      <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{book.category}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-20 transition-all" />
                </motion.div>
              ))}
            </div>

            {totalMustReadPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 shrink-0">
                <button 
                  onClick={() => setCurrentMustReadPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentMustReadPage === 1}
                  className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold opacity-60">
                  {currentMustReadPage} / {totalMustReadPages}
                </span>
                <button 
                  onClick={() => setCurrentMustReadPage(prev => Math.min(prev + 1, totalMustReadPages))}
                  disabled={currentMustReadPage === totalMustReadPages}
                  className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notable Books Section */}
      <div className="space-y-10">
        <h3 className={`text-lg font-black opacity-30 uppercase tracking-[0.2em]`}>{t.notableBooksTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {notableBooks.map((book: any) => (
            <motion.div 
              key={book.id}
              whileHover={{ y: -12 }}
              onClick={() => setSelectedBook(book)}
              className="space-y-4 group cursor-pointer"
            >
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border border-black/5 ring-4 ring-transparent group-hover:ring-black/5 transition-all">
                <img src={book.coverUrl || book.image || book.photoUrl || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={book.title} />
              </div>
              <div className="px-1 text-center md:text-left">
                <h5 className={`text-sm font-black ${config.text} line-clamp-1 group-hover:${config.accentText} transition-colors`}>{book.title || (lang === 'vi' ? book.title_vi : book.title_en)}</h5>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">{book.author}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PartnersSection = () => {
  const { config, partners_animation = 'left' } = useContext(ThemeContext);
  const { partners = [] } = useContext(DataContext);
  const { lang } = useContext(LanguageContext);

  if (partners.length === 0) return null;

  const isLeft = partners_animation === 'left';
  const isNone = partners_animation === 'none';

  return (
    <section className="py-16 bg-white border-t border-black/5 overflow-hidden">
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-10rem * ${partners.length} - 2rem * ${partners.length})); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(calc(-10rem * ${partners.length} - 2rem * ${partners.length})); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marquee-left 25s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 25s linear infinite;
        }
        .animate-marquee-left:hover, .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <span className={`text-xs font-bold ${config.accentText} uppercase tracking-[0.2em] block mb-2`}>
          {lang === 'vi' ? 'Đồng hành cùng Sách Nhà Mình' : 'Our Dear Partners'}
        </span>
        <h2 className={`text-2xl md:text-3xl font-black ${config.text}`}>
          {lang === 'vi' ? 'Đối Tác Thân Thiết' : 'Dear Partners'}
        </h2>
      </div>

      <div className="relative w-full flex items-center justify-center">
        {isNone ? (
          <div className="flex flex-wrap gap-8 justify-center items-center max-w-5xl mx-auto px-6">
            {partners.map(p => (
              <a 
                key={p.id} 
                href={p.url || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-36 h-16 flex items-center justify-center p-2 rounded-2xl border border-black/5 bg-black/[0.01] hover:bg-black/[0.03] transition-all hover:scale-105 duration-300"
              >
                <img 
                  src={p.logo || ''} 
                  alt={p.name} 
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="w-full overflow-hidden relative py-4">
            <div className={`flex gap-8 w-max ${isLeft ? 'animate-marquee-left' : 'animate-marquee-right'}`}>
              {[...partners, ...partners, ...partners].map((p, idx) => (
                <a 
                  key={`${p.id}-${idx}`} 
                  href={p.url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-40 h-20 flex items-center justify-center p-4 rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-all hover:scale-105 duration-300 flex-shrink-0"
                >
                  <img 
                    src={p.logo || ''} 
                    alt={p.name} 
                    className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const Footer = () => {
  const { config, siteName, siteLogo, contactAddress, contactPhone, facebookUrl, instagramUrl, showSpotlight, showBookReview, showCulture, partners_animation } = useContext(ThemeContext);
  const { t, lang } = useContext(LanguageContext);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const { error } = await supabase.from('contacts').insert({
        ...formData,
        status: 'new'
      });
      if (error) throw error;
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer id="lien-he" className={`${config.bg} border-t ${config.border} py-20 px-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-20 text-center md:text-left">
          <div className="col-span-full md:col-span-4">
            <div className={`text-2xl font-bold ${config.text} mb-6 flex items-center justify-center md:justify-start gap-2`}>
              {siteLogo ? (
                <img src={siteLogo} alt={siteName || 'Sách nhà Mình'} className="h-10 object-contain" />
              ) : (
                <BookOpen className={`w-8 h-8 ${config.accentText}`} />
              )}
              <span>{siteName || 'Sách nhà Mình'}</span>
            </div>
            <p className={`${config.text} opacity-80 max-w-sm mx-auto md:mx-0 leading-relaxed`}>{t.footerDesc}</p>
            <div className="flex justify-center md:justify-start gap-4 mt-8 mb-6">
               {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full ${config.card} ${config.border} border hover:scale-110 transition-all`}><Facebook className="w-5 h-5" /></a>}
               {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full ${config.card} ${config.border} border hover:scale-110 transition-all`}><Instagram className="w-5 h-5" /></a>}
            </div>
            {facebookUrl && (
              <div className="flex justify-center md:justify-start">
                <iframe 
                  src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookUrl)}&tabs=&width=270&height=130&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`} 
                  width="270" 
                  height="130" 
                  style={{ border: 'none', overflow: 'hidden', borderRadius: '8px' }} 
                  scrolling="no" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title="Sách nhà Mình Facebook Page"
                ></iframe>
              </div>
            )}
          </div>
          
          <div className="md:col-span-2 hidden md:block">
            <h4 className={`font-bold ${config.text} mb-6 uppercase text-sm tracking-widest`}>Menu</h4>
            <ul className="space-y-4">
              {t.nav.map((item, index) => {
                const slug = NAV_SLUGS[index];
                if (slug === 'tieu-diem' && !showSpotlight) return null;
                if (slug === 'diem-sach' && !showBookReview) return null;
                return (
                  <li key={item}>
                    <a href={`#${slug}`} className={`${config.text} opacity-80 hover:opacity-100 transition-all text-sm`}>
                      {item}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className={`font-bold ${config.text} mb-6 uppercase text-sm tracking-widest`}>{t.nav[4]}</h4>
            <ul className="space-y-4">
              <li className="flex items-start justify-center md:justify-start gap-3">
                <MapPin className={`w-5 h-5 ${config.accentText} opacity-60 mt-1 flex-shrink-0`} />
                <span className={`${config.text} opacity-80 leading-relaxed text-sm`}>{contactAddress || '123 Văn Chương, Quận Tri Thức, TP. Hồ Chí Minh'}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Heart className={`w-5 h-5 ${config.accentText} opacity-60 flex-shrink-0`} />
                <span className={`${config.text} opacity-80 text-sm`}>{contactPhone || '090 457 03 83'}</span>
              </li>
            </ul>
          </div>

          <div className="col-span-full md:col-span-3">
            <h4 className={`font-bold ${config.text} mb-6 uppercase text-sm tracking-widest`}>{lang === 'vi' ? 'Liên hệ với chúng tôi' : 'Contact Us'}</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                required
                placeholder={lang === 'vi' ? 'Họ và tên' : 'Full Name'} 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={`w-full p-3 rounded-xl border ${config.border} bg-transparent text-sm focus:outline-none focus:ring-2 ${config.text}`}
              />
              <input 
                type="email" 
                required
                placeholder={lang === 'vi' ? 'Email' : 'Email'} 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className={`w-full p-3 rounded-xl border ${config.border} bg-transparent text-sm focus:outline-none focus:ring-2 ${config.text}`}
              />
              <input 
                type="tel" 
                required
                placeholder={lang === 'vi' ? 'Số điện thoại' : 'Phone'} 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className={`w-full p-3 rounded-xl border ${config.border} bg-transparent text-sm focus:outline-none focus:ring-2 ${config.text}`}
              />
              <textarea 
                required
                placeholder={lang === 'vi' ? 'Lời nhắn' : 'Message'} 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className={`w-full p-3 rounded-xl border ${config.border} bg-transparent text-sm focus:outline-none focus:ring-2 min-h-[80px] custom-scrollbar ${config.text}`}
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-white text-sm transition-all ${config.accent} hover:brightness-110 disabled:opacity-50 shadow-md`}
              >
                {isSubmitting ? '...' : (lang === 'vi' ? 'Gửi liên hệ' : 'Submit')}
              </button>
              {submitStatus === 'success' && <p className="text-green-500 text-xs mt-2 text-center font-medium">{lang === 'vi' ? 'Gửi thành công!' : 'Successfully sent!'}</p>}
              {submitStatus === 'error' && <p className="text-red-500 text-xs mt-2 text-center font-medium">{lang === 'vi' ? 'Có lỗi xảy ra, vui lòng thử lại.' : 'An error occurred, please try again.'}</p>}
            </form>
          </div>
        </div>

        <div className={`pt-8 border-t ${config.border} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <span className={`${config.text} text-[10px] opacity-70 uppercase tracking-widest text-center`}>© 2026 Sách nhà Mình. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

// --- Main App ---

const FloatingButtons = () => {
  const { config, facebookUrl = 'https://www.facebook.com/sachnhaminh', contactPhone = '090 457 03 83' } = useContext(ThemeContext);
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanPhone = contactPhone.replace(/\s+/g, '');
  const zaloUrl = `https://zalo.me/${cleanPhone}`;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
      <AnimatePresence>
        {showScroll && (
          <motion.button
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className={`w-14 h-14 rounded-full ${config.card} border ${config.border} flex items-center justify-center shadow-2xl hover:${config.accent} hover:text-white transition-all group`}
          >
            <ArrowUp className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full bg-[#0084FF] text-white flex items-center justify-center shadow-2xl"
        title="Facebook"
      >
        <Facebook className="w-7 h-7" />
      </motion.a>

      <motion.a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full bg-[#0068FF] text-white flex items-center justify-center shadow-2xl"
        title="Zalo"
      >
         <MessageCircle className="w-7 h-7" />
      </motion.a>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<Theme>('pastelRed');
  const [font, setFont] = useState<Font>('serif');
  const [siteName, setSiteName] = useState<string>('Sách nhà Mình');
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [contactAddress, setContactAddress] = useState<string>('123 Văn Chương, Quận Tri Thức, TP. Hồ Chí Minh');
  const [contactPhone, setContactPhone] = useState<string>('090 457 03 83');
  const [facebookUrl, setFacebookUrl] = useState<string>('https://www.facebook.com/sachnhaminh');
  const [instagramUrl, setInstagramUrl] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('#8B2B2B');
  const [customFont, setCustomFont] = useState<string>('Inter');
  const [lang, setLang] = useState<Language>('vi');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingEventId, setBookingEventId] = useState<number | undefined>(undefined);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [isAdminView, setIsAdminView] = useState(window.location.hash === '#/admin');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchEventQuery, setSearchEventQuery] = useState('');
  const [searchEventDate, setSearchEventDate] = useState('');
  const [searchEventLocation, setSearchEventLocation] = useState('');
  const [searchEventStatus, setSearchEventStatus] = useState<'all' | 'happening' | 'upcoming' | 'past'>('all');
  const [searchEventMainType, setSearchEventMainType] = useState<'all' | 'sachnhaminh' | 'external'>('all');
  const [searchEventSubCategory, setSearchEventSubCategory] = useState<string>('all');

  const [events, setEvents] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [showSpotlight, setShowSpotlight] = useState(true);
  const [showBookReview, setShowBookReview] = useState(true);
  const [showCulture, setShowCulture] = useState(true);
  const [partnersAnimation, setPartnersAnimation] = useState<'left' | 'right' | 'none'>('left');
  const [partners, setPartners] = useState<any[]>([]);

  const [inlineActiveSubTab, setInlineActiveSubTab] = useState<'content' | 'articles' | 'images' | 'videos'>('content');
  const [inlineActiveVideoId, setInlineActiveVideoId] = useState<string | null>(null);
  const [inlineActiveImageFolderId, setInlineActiveImageFolderId] = useState<string | null>(null);
  const [inlineReadingArticle, setInlineReadingArticle] = useState<any | null>(null);
  const [inlineMediaLightbox, setInlineMediaLightbox] = useState<{ isOpen: boolean, index: number, items: any[] }>({ isOpen: false, index: 0, items: [] });

  // Reset inline states when expanded event changes
  useEffect(() => {
    if (expandedEventId) {
      setInlineActiveSubTab('content');
      setInlineActiveVideoId(null);
      setInlineActiveImageFolderId(null);
    }
  }, [expandedEventId]);

  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedEventPage, setSelectedEventPage] = useState<any | null>(null);

  // Scroll to section when returning to home page from detailed views
  useEffect(() => {
    if (!selectedArticle && !selectedEventPage) {
      const hash = window.location.hash.replace('#', '');
      if (hash && NAV_SLUGS.includes(hash)) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  }, [selectedArticle, selectedEventPage]);

  useEffect(() => {
    const handleHash = () => {
      setIsAdminView(window.location.hash === '#/admin');
      
      const newsMatch = window.location.hash.match(/^#\/news\/(.+)$/);
      const eventMatch = window.location.hash.match(/^#\/event\/(.+)$/);
      
      if (newsMatch) {
        const incomingSlug = newsMatch[1];
        const found = articles.find((a: any) => {
          const targetSlug = createSeoSlug(a.title_vi || 'news');
          return targetSlug === incomingSlug || String(a.id) === String(incomingSlug);
        });
        if (found) {
          setSelectedArticle(found);
          setSelectedEventPage(null);
          window.scrollTo(0, 0);
        }
      } else if (eventMatch) {
        const incomingSlug = eventMatch[1];
        const found = events.find((e: any) => {
          const targetSlug = createSeoSlug(e.title_vi || 'event');
          return targetSlug === incomingSlug || String(e.id) === String(incomingSlug);
        });
        if (found) {
          setSelectedEventPage(found);
          setSelectedArticle(null);
          window.scrollTo(0, 0);
        }
      } else {
        setSelectedArticle(null);
        setSelectedEventPage(null);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [articles, events]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { data: settingsData },
          { data: eventsData },
          { data: regsData },
          { data: articlesData },
          { data: galleryData },
          { data: booksData },
          { data: slidesData },
          { data: subCatsData },
          { data: classificationsData }
        ] = await Promise.all([
          supabase.from('site_settings').select('*').eq('id', 'global').single(),
          supabase.from('events').select('*'),
          supabase.from('registrations').select('event_id, participants'),
          supabase.from('articles').select('*'),
          supabase.from('gallery').select('*'),
          supabase.from('books').select('*'),
          supabase.from('slides').select('*').order('order', { ascending: true }),
          supabase.from('sub_categories').select('*'),
          supabase.from('event_classifications').select('*')
        ]);

        if (settingsData) {
          if (settingsData.theme) setTheme(settingsData.theme);
          if (settingsData.font) setFont(settingsData.font);
          if (settingsData.site_name) setSiteName(settingsData.site_name);
          if (settingsData.site_logo) setSiteLogo(settingsData.site_logo);
          if (settingsData.contact_address) setContactAddress(settingsData.contact_address);
          if (settingsData.contact_phone) setContactPhone(settingsData.contact_phone);
          if (settingsData.facebook_url) setFacebookUrl(settingsData.facebook_url);
          if (settingsData.instagram_url) setInstagramUrl(settingsData.instagram_url);
          if (settingsData.custom_color) setCustomColor(settingsData.custom_color);
          if (settingsData.custom_font) setCustomFont(settingsData.custom_font);
          setShowSpotlight(settingsData.show_spotlight !== false);
          setShowBookReview(settingsData.show_book_review !== false);
          setShowCulture(settingsData.show_culture !== false);
          setPartnersAnimation(settingsData.partners_animation || 'left');
        }

        const regsCountMap: Record<string, number> = {};
        if (regsData) {
           regsData.forEach((r: any) => {
              const count = parseInt(r.participants) || 1;
              const eventId = String(r.event_id);
              regsCountMap[eventId] = (regsCountMap[eventId] || 0) + count;
           });
        }

        if (eventsData) {
          setEvents(eventsData.map((ev: any) => ({
            ...ev,
            subCategory: ev.sub_category_id,
            maxAttendees: ev.max_attendees,
            approvedCount: regsCountMap[String(ev.id)] || 0,
            endTime: ev.end_time
          })));
        }

        if (articlesData) {
          setArticles(articlesData.map((art: any) => ({
            ...art,
            eventId: art.event_id
          })));
        }
        
        if (galleryData) {
          setGallery(galleryData.map((item: any) => ({
            ...item,
            eventId: item.event_id,
            videoUrl: item.video_url
          })));
        }
        
        if (booksData) {
          setBooks(booksData.map((b: any) => ({
            ...b,
            coverUrl: b.cover_url,
            tikiUrl: b.tiki_url,
            isHotMonth: b.is_hot_month,
            isTypical10: b.is_typical_10,
            isMustRead100: b.is_must_read_100
          })));
        }
        
        if (slidesData) {
          setSlides(slidesData.map((sl: any) => ({
            ...sl,
            imageUrl: sl.image_url
          })));
        }
        
        if (subCatsData) setSubCategories(subCatsData);

        let fetchedClassifications = [];
        if (classificationsData) {
          fetchedClassifications = classificationsData;
        }
        if (fetchedClassifications.length === 0) {
          fetchedClassifications = [
            { id: 'sachnhaminh', name_vi: 'Sách Nhà Mình', name_en: 'Sach Nha Minh' },
            { id: 'external', name_vi: 'Sự kiện bên ngoài', name_en: 'External Events' }
          ];
        }
        setClassifications(fetchedClassifications);

        let partnersData = null;
        try {
          const { data } = await supabase.from('partners').select('*').order('order', { ascending: true });
          partnersData = data;
        } catch (e) {
          console.error("Error fetching partners:", e);
        }
        if (partnersData) setPartners(partnersData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu từ Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const channel = supabase.channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleOpenEvent = (e: any) => setSelectedEvent(e.detail);
    const handleOpenBookingEvent = (e: any) => handleOpenBooking(e.detail?.id);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('open-event', handleOpenEvent);
      window.addEventListener('open-booking', handleOpenBookingEvent);
      return () => {
        window.removeEventListener('open-event', handleOpenEvent);
        window.removeEventListener('open-booking', handleOpenBookingEvent);
      };
    }
  }, []);

  const customStyles = `
    ${font === 'custom' ? `@import url('https://fonts.googleapis.com/css2?family=${customFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');
    .font-custom { font-family: '${customFont}', sans-serif !important; }` : ''}
    ${theme === 'custom' ? `
    .theme-custom-bg { background-color: ${customColor}15 !important; }
    .theme-custom-text { color: #1a1a1a !important; }
    .theme-custom-accent { background-color: ${customColor} !important; }
    .theme-custom-accentText { color: ${customColor} !important; }
    .theme-custom-card { background-color: #ffffff !important; }
    .theme-custom-border { border-color: ${customColor}30 !important; }
    .theme-custom-overlay { background-color: ${customColor}40 !important; }` : ''}
  `;

  if (isAdminView) {
    return (
      <ThemeContext.Provider value={{ theme, setTheme, font, setFont, config: themes[theme], siteName, siteLogo, contactAddress, contactPhone, facebookUrl, instagramUrl, customColor, customFont, showSpotlight, showBookReview, showCulture, partners_animation: partnersAnimation }}>
         {(theme === 'custom' || font === 'custom') && <style>{customStyles}</style>}
         <Suspense fallback={
           <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <span className="mt-4 text-sm text-gray-500 font-semibold">Đang tải trang quản trị...</span>
           </div>
         }>
           <Admin />
         </Suspense>
      </ThemeContext.Provider>
    )
  }
  
  const config = themes[theme];
  const t = translations[lang];
  const fontClass = fonts[font];
  
  const now = new Date().getTime();
  const EVENT_DURATION = 3 * 60 * 60 * 1000; // 3 hours

  let baseEvents = events.length > 0 ? events : SHARED_EVENTS;
  
  if (searchEventQuery) {
    const q = searchEventQuery.toLowerCase();
    baseEvents = baseEvents.filter(e => 
      (e.title_vi?.toLowerCase().includes(q) || e.title_en?.toLowerCase().includes(q) || 
       e.desc_vi?.toLowerCase().includes(q) || e.desc_en?.toLowerCase().includes(q))
    );
  }
  
  if (searchEventDate) {
    baseEvents = baseEvents.filter(e => e.time && e.time.startsWith(searchEventDate));
  }

  if (searchEventLocation) {
    const loc = searchEventLocation.toLowerCase();
    baseEvents = baseEvents.filter(e => 
      (e.location?.toLowerCase().includes(loc) || e.location_vi?.toLowerCase().includes(loc) || e.location_en?.toLowerCase().includes(loc))
    );
  }

  if (searchEventMainType !== 'all') {
    baseEvents = baseEvents.filter(e => {
      return resolveEventCategory(e, classifications) === searchEventMainType;
    });
  }

  if (searchEventSubCategory !== 'all') {
    baseEvents = baseEvents.filter(e => {
      const resolvedSub = resolveEventSubCategory(e, subCategories);
      return resolvedSub.id === searchEventSubCategory;
    });
  }

  const displayEvents = baseEvents.map(e => {
    const timeMs = new Date(e.time).getTime();
    const endTimeMs = e.endTime ? new Date(e.endTime).getTime() : timeMs + EVENT_DURATION;
    let status = 'upcoming';
    let sortScore = 0;
    if (now >= timeMs && now <= endTimeMs) {
      status = 'happening';
      sortScore = 1;
    } else if (now > endTimeMs) {
      status = 'past';
      sortScore = -1;
    }
    return { ...e, _timeMs: timeMs, _endTimeMs: endTimeMs, _status: status, _sortScore: sortScore };
  }).filter((e: any) => searchEventStatus === 'all' || e._status === searchEventStatus).sort((a: any, b: any) => {
    if (a._sortScore !== b._sortScore) return b._sortScore - a._sortScore;
    if (a._sortScore >= 0) return a._timeMs - b._timeMs;
    return b._timeMs - a._timeMs;
  });

  const handleOpenBooking = (eventId?: number) => {
    setBookingEventId(eventId);
    setIsBookingOpen(true);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, font, setFont, config, siteName, siteLogo, contactAddress, contactPhone, facebookUrl, instagramUrl, customColor, customFont, showSpotlight, showBookReview, showCulture, partners_animation: partnersAnimation }}>
      {(theme === 'custom' || font === 'custom') && <style>{customStyles}</style>}
      <LanguageContext.Provider value={{ lang, setLang, t }}>
        <DataContext.Provider value={{ events, articles, gallery, books, slides, subCategories, classifications, partners }}>
          <div className={`min-h-screen transition-colors duration-1000 ${config.bg} ${config.text} ${fontClass} selection:bg-black selection:text-white`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full">
              <div className="w-12 h-12 border-4 border-current/20 border-t-current rounded-full animate-spin"></div>
              <p className="mt-6 text-sm font-bold tracking-widest uppercase opacity-60">{lang === 'vi' ? 'Welcome to Sách Nhà Mình' : 'Welcome to Sách Nhà Mình'}</p>
            </div>
          ) : (
            <>
          <Navbar onBookClick={() => handleOpenBooking()} />
          
          <AnimatePresence>
            {isBookingOpen && (
              <BookingModal 
                isOpen={isBookingOpen} 
                onClose={() => {
                  setIsBookingOpen(false);
                  setBookingEventId(undefined);
                }} 
                initialEventId={bookingEventId}
              />
            )}
            {selectedEvent && (
              <EventDetailModal 
                event={selectedEvent} 
                isOpen={!!selectedEvent} 
                onClose={() => setSelectedEvent(null)}
                onBook={() => {
                  const id = selectedEvent.id;
                  setSelectedEvent(null);
                  handleOpenBooking(id);
                }}
              />
            )}
          </AnimatePresence>

          {/* Inline Article Reader Overlay Modal */}
          <AnimatePresence>
            {inlineReadingArticle && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                  onClick={() => setInlineReadingArticle(null)} 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden text-left border border-black/5 z-10`}
                >
                  <div className="px-6 py-4 border-b border-black/[0.05] flex justify-between items-center bg-gray-50/50">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} bg-black/5 py-1 px-3 rounded-full`}>
                      {inlineReadingArticle.category || 'Tin sự kiện'}
                    </span>
                    <button onClick={() => setInlineReadingArticle(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {inlineReadingArticle.image && (
                      <img src={inlineReadingArticle.image} alt={inlineReadingArticle.title_vi} className="w-full aspect-[21/9] object-cover rounded-2xl border border-black/5 shadow-sm" />
                    )}
                    <div>
                      <h3 className={`text-2xl font-bold ${config.text} leading-tight`}>
                        {lang === 'vi' ? inlineReadingArticle.title_vi : inlineReadingArticle.title_en || inlineReadingArticle.title_vi}
                      </h3>
                      <span className="text-xs opacity-40 block mt-2">{inlineReadingArticle.date}</span>
                    </div>
                    <div 
                      className="opacity-90 leading-relaxed text-base max-w-none ql-snow ql-editor p-0"
                      dangerouslySetInnerHTML={{ __html: cleanHtmlContent(lang === 'vi' ? inlineReadingArticle.content_vi : inlineReadingArticle.content_en || inlineReadingArticle.content_vi) }}
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Inline Lightbox Overlay Modal */}
          <AnimatePresence>
            {inlineMediaLightbox.isOpen && inlineMediaLightbox.items.length > 0 && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
                  onClick={() => setInlineMediaLightbox({ isOpen: false, index: 0, items: [] })}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center z-10"
                >
                  <button 
                    onClick={() => setInlineMediaLightbox({ isOpen: false, index: 0, items: [] })} 
                    className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="relative w-full h-full flex items-center justify-center">
                    {inlineMediaLightbox.items.length > 1 && (
                      <button 
                        onClick={() => setInlineMediaLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }))}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}
                    
                    <img 
                      src={parseDriveUrl(inlineMediaLightbox.items[inlineMediaLightbox.index]?.url || '', 'image')} 
                      alt={inlineMediaLightbox.items[inlineMediaLightbox.index]?.title || 'Lightbox'} 
                      className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                      referrerPolicy="no-referrer"
                    />

                    {inlineMediaLightbox.items.length > 1 && (
                      <button 
                        onClick={() => setInlineMediaLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.items.length }))}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  
                  {inlineMediaLightbox.items[inlineMediaLightbox.index]?.title && (
                    <p className="mt-4 text-sm text-white/80 font-medium">
                      {inlineMediaLightbox.items[inlineMediaLightbox.index].title}
                    </p>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <main>
            {selectedArticle ? (
              <ArticleDetailPage 
                article={selectedArticle} 
                onBack={() => {
                  window.location.hash = '#/';
                  setSelectedArticle(null);
                }} 
                onEventClick={setSelectedEvent}
              />
            ) : selectedEventPage ? (
              <EventDetailPage
                event={selectedEventPage}
                onBack={() => {
                  window.location.hash = '#/';
                  setSelectedEventPage(null);
                }}
                onBookEventClick={(ev) => handleOpenBooking(ev.id)}
              />
            ) : (
              <>
<Hero 
              onBookClick={() => handleOpenBooking()} 
              onEventClick={setSelectedEvent}
              onBookEventClick={(e) => handleOpenBooking(e.id)}
            />
            {/* Mobile Calendar Section */}
            <div className="lg:hidden p-6 pb-20 bg-black/[0.02]">
               <CompactCalendar 
                onEventClick={setSelectedEvent} 
                onBookClick={(e) => handleOpenBooking(e.id)}
                className="w-full max-w-sm mx-auto" 
               />
            </div>

            
            <section id={NAV_SLUGS[2]} className="py-32 px-6 bg-black/[0.01]">
<div className="max-w-7xl mx-auto">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
<div className="lg:col-span-8">
<div className="mb-12 flex flex-col gap-8">
<span className={`text-xs font-bold ${config.accentText} uppercase tracking-[0.2em] block`}>{t.eventsSub}</span>
                      
                      {/* Search Bar Container */}
                      <div className="flex flex-col md:flex-row gap-3.5 p-1.5 rounded-2xl bg-white border border-gray-100 shadow-md">
                        <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-black/[0.02] rounded-xl focus-within:bg-black/[0.04] transition-all">
                          <Search className="w-4 h-4 opacity-40" />
                          <input type="text" placeholder={lang === 'vi' ? 'Tìm kiếm tên sự kiện...' : 'Search events...'} value={searchEventQuery} onChange={e => setSearchEventQuery(e.target.value)} className={`bg-transparent border-none outline-none w-full text-sm font-semibold ${config.text} placeholder:opacity-40`} />
                        </div>
                        <div className="flex md:w-48 items-center gap-3 px-4 py-2.5 bg-black/[0.02] rounded-xl focus-within:bg-black/[0.04] transition-all">
                          <Calendar className="w-4 h-4 opacity-40" />
                          <input type="date" value={searchEventDate} onChange={e => setSearchEventDate(e.target.value)} className={`bg-transparent border-none outline-none w-full text-sm font-semibold ${config.text} uppercase`} />
                        </div>
                        <div className="flex flex-1 items-center gap-3 px-4 py-2.5 bg-black/[0.02] rounded-xl focus-within:bg-black/[0.04] transition-all">
                          <MapPin className="w-4 h-4 opacity-40" />
                          <input type="text" placeholder={lang === 'vi' ? 'Tìm kiếm địa điểm...' : 'Search location...'} value={searchEventLocation} onChange={e => setSearchEventLocation(e.target.value)} className={`bg-transparent border-none outline-none w-full text-sm font-semibold ${config.text} placeholder:opacity-40`} />
                        </div>
                      </div>
                      
                      {/* Unified Filter Panel (3-column dropdown layout) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white/50 backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-sm">
                        
                        {/* Column 1: Event Status Dropdown */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            {lang === 'vi' ? 'Trạng thái' : 'Status'}
                          </label>
                          <div className="relative">
                            <select 
                              value={searchEventStatus} 
                              onChange={e => setSearchEventStatus(e.target.value)} 
                              className={`w-full bg-white border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider ${config.text} outline-none focus:ring-2 focus:ring-black/5 focus:border-black/25 transition-all appearance-none cursor-pointer pr-10 shadow-sm`}
                            >
                              <option value="all">{lang === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
                              <option value="happening">{lang === 'vi' ? 'Đang diễn ra' : 'Happening'}</option>
                              <option value="upcoming">{lang === 'vi' ? 'Sắp diễn ra' : 'Upcoming'}</option>
                              <option value="past">{lang === 'vi' ? 'Kết thúc' : 'Ended'}</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Main Classification Dropdown */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {lang === 'vi' ? 'Phân loại' : 'Classification'}
                          </label>
                          <div className="relative">
                            <select 
                              value={searchEventMainType} 
                              onChange={e => setSearchEventMainType(e.target.value)} 
                              className={`w-full bg-white border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider ${config.text} outline-none focus:ring-2 focus:ring-black/5 focus:border-black/25 transition-all appearance-none cursor-pointer pr-10 shadow-sm`}
                            >
                              <option value="all">{lang === 'vi' ? 'Tất cả phân loại' : 'All Classifications'}</option>
                              {classifications.map(c => (
                                <option key={c.id} value={c.id}>
                                  {lang === 'vi' ? c.name_vi : c.name_en}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Event Categories Dropdown */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                            {lang === 'vi' ? 'Danh mục' : 'Categories'}
                          </label>
                          <div className="relative">
                            <select 
                              value={searchEventSubCategory} 
                              onChange={e => setSearchEventSubCategory(e.target.value)} 
                              className={`w-full bg-white border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider ${config.text} outline-none focus:ring-2 focus:ring-black/5 focus:border-black/25 transition-all appearance-none cursor-pointer pr-10 shadow-sm`}
                            >
                              <option value="all">{lang === 'vi' ? 'Tất cả danh mục' : 'All Categories'}</option>
                              {subCategories.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                  {lang === 'vi' ? sub.name_vi : sub.name_en}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {displayEvents.map((event, idx) => {
                        const isExpanded = expandedEventId === event.id;
                        const relatedArticles = articles.filter(a => String(a.eventId || a.event_id) === String(event.id));
                        const relatedMedia = gallery.filter(g => String(g.eventId || g.event_id) === String(event.id));
                        const approved = event.approvedCount ? parseInt(event.approvedCount as string) : (((event.id * 13) % 40) + 12);
                        const displayRegistrants = `${approved} ${lang === 'vi' ? 'đăng ký' : 'registered'}`;

                        const resolvedSub = resolveEventSubCategory(event, subCategories);
                        const mainType = resolveEventCategory(event, classifications);
                        const matchedClassification = classifications.find(c => c.id === mainType);
                        const resolvedMainTypeName = matchedClassification 
                          ? (lang === 'vi' ? matchedClassification.name_vi : matchedClassification.name_en) 
                          : (lang === 'vi' ? 'Sách Nhà Mình' : 'Sach Nha Minh'); 
                        const resolvedSubCategoryName = lang === 'vi' ? resolvedSub.name_vi : resolvedSub.name_en;
                        
                        return (
                          <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex flex-col rounded-[40px] ${config.card} border ${config.border} shadow-sm group hover:shadow-2xl transition-all duration-500 overflow-hidden`}
                          >
                            <div 
                              onClick={() => {
                                // Toggle expansion if clicking the card generally
                                setExpandedEventId(isExpanded ? null : event.id);
                              }}
                              className="flex flex-col md:flex-row gap-8 p-1 cursor-pointer"
                            >
                              <div className="md:w-48 flex-shrink-0 flex flex-col gap-4">
                                <div className="h-48 flex-shrink-0 overflow-hidden rounded-[38px]">
                                  <img 
                                    src={event.image || (event.photoUrl)} 
                                    alt={lang === 'vi' ? event.title_vi : event.title_en} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                  {(event._status === 'upcoming' || event._status === 'happening') && (
                                    <div className={`w-full flex justify-center`}>
                                      <Countdown targetDate={event._status === 'happening' ? (event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()) : event.time} isHappening={event._status === 'happening'} compact={true} />
                                    </div>
                                  )}
                                  {(() => {
                                     const max = (event as any).maxAttendees ? parseInt((event as any).maxAttendees as string) : 0;
                                     const isUnlimited = max === 0;
                                     const approved = getApprovedCount(event);
                                     const remaining = max > 0 ? Math.max(0, max - approved) : 0;
                                     if (event._status !== 'past') {
                                       return (
                                         <button
                                            onClick={(e) => { 
                                               e.stopPropagation(); 
                                               if (!isUnlimited && remaining <= 0) {
                                                 alert("Cảm ơn quý khách đã quan tâm đến sự kiện của Sách Nhà Mình. Rất tiếc khi phải thông báo rằng sự kiện quý khách muốn tham gia hiện tại đã đủ số lượng. Kính mong quý khách thông cảm cho sự bất tiện này. Hẹn gặp quý khách vào một sự kiện khác của Sách Nhà Mình. Kính chúc quý khách một ngày vui vẻ! Xin cảm ơn!");
                                               } else {
                                                 typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-booking', {detail: event})); 
                                               }
                                            }}
                                           className={`w-fit self-center justify-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white hover:opacity-90 py-1.5 sm:py-2 px-4 sm:px-5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-black/10 hover:shadow-lg ${config.accent} whitespace-nowrap shrink-0`}
                                         >
                                            <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                                            {lang === 'vi' ? 'Đặt chỗ ngay' : 'Book Now'}
                                         </button>
                                       );
                                     }
                                     return null;
                                  })()}
                                </div>
                              </div>
                              <div className="flex-grow min-w-0 p-4 md:pr-8 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-1">
                                   <div className="flex flex-wrap items-center gap-2">
                                      {(() => {
                                        const city = getCityFromLocation(event.location || (event as any).location_vi, lang);
                                        if (city) {
                                          return (
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${config.text} opacity-80 border border-black/10 bg-white py-1 px-3 rounded-full flex items-center gap-1.5 shadow-sm`}>
                                               <MapPin className="w-3 h-3 opacity-50" />
                                               {city}
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                      {event._status === 'happening' && (
                                        <span className={`text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-500/10 ring-1 ring-green-600/20 py-1 px-3 rounded-full flex items-center gap-1.5 animate-pulse`}>
                                           <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                           {lang === 'vi' ? 'Đang diễn ra' : 'Happening Now'}
                                        </span>
                                      )}
                                      {event._status === 'upcoming' && (
                                        <span className={`text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-600/10 ring-1 ring-emerald-600/20 py-1 px-3 rounded-full flex items-center gap-1.5`}>
                                           <Clock className="w-3 h-3" />
                                           {lang === 'vi' ? 'Sắp diễn ra' : 'Upcoming'}
                                        </span>
                                      )}
                                      {event._status === 'past' && (
                                        <span className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-500/10 ring-1 ring-gray-500/20 py-1 px-3 rounded-full flex items-center gap-1.5`}>
                                           {lang === 'vi' ? 'Đã diễn ra' : 'Passed'}
                                        </span>
                                      )}
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${config.accentText} py-1 px-3 rounded-full bg-black/5`}>
                                         {resolvedMainTypeName}
                                      </span>
                                      <span className={`text-[10px] font-bold uppercase tracking-widest text-white ${config.accent} py-1 px-3 rounded-full`}>
                                         {resolvedSubCategoryName}
                                      </span>
                                      {(() => {
                                        const typeText = lang === 'vi' ? event.type_vi : event.type_en;
                                        if (typeText && typeText.trim() !== '' && typeText.trim() !== '—' && typeText.trim() !== '-') {
                                          return (
                                            <span className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-500/10 py-1 px-3 rounded-full flex items-center gap-1.5`}>
                                               {typeText}
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                   </div>
                                   <div className="text-right mt-0.5">
                                      <span className={`text-2xl font-serif font-bold ${config.text} block leading-none`}>{event.day || (event.date && event.date.split('/')[0])}</span>
                                      <span className="text-[10px] uppercase font-bold opacity-40">{lang === 'vi' ? 'Tháng 5' : 'May'}</span>
                                   </div>
                                </div>
                                {/* Registration & Ticket Info Group */}
                                <div className="flex flex-wrap items-center gap-2 mt-0 mb-2">
                                  <div className={`flex items-center gap-1.5 bg-black/5 ${config.accentText} py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                                    <Users className="w-3 h-3 flex-shrink-0" />
                                    <span>
                                      {getApprovedCount(event)} {lang === 'vi' ? 'đăng ký' : 'registered'}
                                    </span>
                                  </div>
                                  {(() => {
                                    const approved = getApprovedCount(event);
                                    const max = (event as any).maxAttendees ? parseInt((event as any).maxAttendees as string) : 0;
                                    const isUnlimited = max === 0;
                                    const remaining = max > 0 ? Math.max(0, max - approved) : 0;
                                    return (
                                      <div className={`flex items-center gap-1.5 ${isUnlimited || remaining > 0 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border-rose-500/20'} py-1 px-3 rounded-full border text-[10px] font-bold uppercase tracking-widest`}>
                                        <Ticket className="w-3 h-3 flex-shrink-0" />
                                        <span>
                                          {isUnlimited ? (lang === 'vi' ? 'Không giới hạn vé' : 'Unlimited tickets') : `${lang === 'vi' ? 'Vé còn lại:' : 'Remaining:'} ${remaining}`}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <h4 className={`text-2xl font-bold ${config.text} mb-2 group-hover:${config.accentText} transition-colors tracking-tight`}>{lang === 'vi' ? event.title_vi : event.title_en}</h4>
                                <p className={`${config.text} opacity-80 text-sm mb-4 line-clamp-2`}>{lang === 'vi' ? event.desc_vi : event.desc_en}</p>
                                
                                
                                <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-black/5 w-full">
                                  <div className="flex flex-col gap-2">
                                    {(event._status === 'upcoming' || event._status === 'happening') && (
                                      <span className="text-xs font-bold text-gray-500 tracking-wider">
                                        {event._status === 'happening' 
                                          ? (lang === 'vi' ? 'Sự kiện diễn ra từ:' : 'Event takes place from:') 
                                          : (lang === 'vi' ? 'Sự kiện bắt đầu lúc:' : 'Event starts at:')}
                                      </span>
                                    )}
                                    <div className="flex flex-nowrap overflow-x-auto items-center gap-3 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                                      <div className={`flex flex-nowrap items-center gap-2 ${event._status === 'happening' ? 'bg-green-600' : config.accent} py-2.5 px-6 rounded-full text-white shadow-md ring-2 ring-white flex-shrink-0`}>
                                        <Clock className="w-5 h-5 flex-shrink-0" />
                                        {event._status === 'happening' ? (
                                          <span className="text-[13px] sm:text-sm font-black tracking-widest whitespace-nowrap">
                                            {new Date(event.time).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            {' '}
                                            {new Date(event.time).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            {' - '}
                                            {new Date(event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            {' '}
                                            {new Date(event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                          </span>
                                        ) : (
                                          <span className="text-base sm:text-lg font-black tracking-widest whitespace-nowrap">
                                            {new Date(event.time).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                                            {' - '}
                                            {new Date(event.endTime || new Date(new Date(event.time).getTime() + 3 * 60 * 60 * 1000).toISOString()).toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                                            {', '}
                                            {new Date(event.time).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                          </span>
                                        )}
                                      </div>
                                      <div className={`flex flex-nowrap items-center gap-2 bg-black/[0.04] ${config.text} opacity-80 py-2.5 px-6 rounded-full border border-black/5 flex-shrink-0 w-full max-w-[250px] overflow-hidden`}>
                                        <MapPin className="w-5 h-5 flex-shrink-0" />
                                        <marquee scrollamount="4" className="text-base font-bold whitespace-nowrap flex-1">
                                          {event.location || (event as any).location_vi || ''}
                                        </marquee>
                                      </div>

                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-end w-full pt-1 mt-auto">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedEventId(isExpanded ? null : event.id);
                                    }}
                                    className={`text-sm sm:text-xs font-bold uppercase tracking-widest ${config.accentText} flex items-center gap-1 hover:opacity-50 transition-all whitespace-nowrap shrink-0 ml-auto justify-end w-[100px] text-right`}
                                  >
                                    <span className="flex-grow text-right">{isExpanded ? (lang === 'vi' ? 'Thu gọn' : 'Show Less') : (lang === 'vi' ? 'Chi tiết..' : 'Details..')}</span>
                                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="flex-shrink-0">
                                      <ChevronRight className="w-3 h-3" />
                                    </motion.div>
                                  </button>
                                </div>
                                </div>
                              </div>

                            <AnimatePresence>
  {isExpanded && (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden bg-black/[0.02]"
    >
      <div className="p-8 md:p-12 md:px-12 bg-white/40 backdrop-blur-sm">
        <div className="flex flex-col justify-between">
          <div className="space-y-6">
            {/* Tài liệu đính kèm inline (Tabs giống Theo dòng văn hóa) */}
            {(relatedArticles.length > 0 || relatedMedia.length > 0) && (
              <div className="mb-10 border-b border-black/5 pb-8">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-4 block">
                  {lang === 'vi' ? 'Tài liệu & Truyền thông sự kiện' : 'Event Documentation & Media'}
                </label>
                
                {/* Sub tabs */}
                <div className="flex gap-2 border-b border-black/[0.05] pb-2 mb-6">
                  <button
                    onClick={() => setInlineActiveSubTab('content')}
                    className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                      inlineActiveSubTab === 'content' 
                        ? `border-black text-black` 
                        : 'border-transparent text-gray-400 hover:text-black'
                    }`}
                  >
                    {lang === 'vi' ? 'Nội dung chương trình' : 'Program Content'}
                  </button>
                  {relatedArticles.length > 0 && (
                    <button
                      onClick={() => setInlineActiveSubTab('articles')}
                      className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                        inlineActiveSubTab === 'articles' 
                          ? `border-black text-black` 
                          : 'border-transparent text-gray-400 hover:text-black'
                      }`}
                    >
                      {lang === 'vi' ? `Tin sự kiện (${relatedArticles.length})` : `Articles (${relatedArticles.length})`}
                    </button>
                  )}
                  <button
                    onClick={() => setInlineActiveSubTab('images')}
                    className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                      inlineActiveSubTab === 'images' 
                        ? `border-black text-black` 
                        : 'border-transparent text-gray-400 hover:text-black'
                    }`}
                  >
                    {lang === 'vi' ? `Hình ảnh (${relatedMedia.filter(m => m.type !== 'video').length})` : `Images (${relatedMedia.filter(m => m.type !== 'video').length})`}
                  </button>
                  <button
                    onClick={() => setInlineActiveSubTab('videos')}
                    className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                      inlineActiveSubTab === 'videos' 
                        ? `border-black text-black` 
                        : 'border-transparent text-gray-400 hover:text-black'
                    }`}
                  >
                    {lang === 'vi' ? `Video (${relatedMedia.filter(m => m.type === 'video').length})` : `Videos (${relatedMedia.filter(m => m.type === 'video').length})`}
                  </button>
                </div>

                {/* Tab Panels */}
                <div className="w-full">
                  {inlineActiveSubTab === 'content' && (
                    <div>
                      {(() => {
                        const contentVal = lang === 'vi' ? event.content_vi : event.content_en;
                        const descVal = lang === 'vi' ? event.desc_vi : event.desc_en;
                        if (contentVal) {
                          return (
                            <div className="ql-snow">
                              <div 
                                className="ql-editor p-0 opacity-85 leading-relaxed max-w-none text-base"
                                dangerouslySetInnerHTML={{ __html: cleanHtmlContent(contentVal) }} 
                              />
                            </div>
                          );
                        }
                        return (
                          <p className={`${config.text} text-base leading-relaxed opacity-85 whitespace-pre-line`}>
                            {descVal}
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {inlineActiveSubTab === 'articles' && (
                    <div className="space-y-4">
                      {relatedArticles.length > 0 ? (
                        relatedArticles.map(art => (
                          <div 
                            key={art.id}
                            onClick={() => setInlineReadingArticle(art)}
                            className="p-4 rounded-2xl border border-black/5 bg-black/[0.01] hover:bg-black/[0.03] transition-all cursor-pointer flex gap-4 items-center"
                          >
                            {art.image && (
                              <img src={art.image} alt={art.title_vi} className="w-16 h-16 object-cover rounded-xl border border-black/5" />
                            )}
                            <div className="flex-1">
                              <h5 className="font-bold text-base leading-snug line-clamp-1">{lang === 'vi' ? art.title_vi : art.title_en || art.title_vi}</h5>
                              <p className="text-xs opacity-60 line-clamp-2 mt-1">{lang === 'vi' ? art.summary_vi : art.summary_en || art.summary_vi}</p>
                              <span className="text-[10px] opacity-40 block mt-1">{art.date}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-40" />
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                          <FileText className="w-10 h-10 opacity-30 mb-2" />
                          <p className="text-sm">{lang === 'vi' ? 'Chưa có tin sự kiện cho sự kiện này.' : 'No related articles for this event.'}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {inlineActiveSubTab === 'images' && (() => {
                    const relatedImages = relatedMedia.filter(m => m.type !== 'video');
                    const imageFolders = relatedImages.filter(item => isDriveFolderUrl(item.url || ''));
                    const directImages = relatedImages.filter(item => !isDriveFolderUrl(item.url || ''));
                    
                    return (
                      <div className="flex flex-col gap-6">
                        {imageFolders.length > 0 && (
                          <div className="flex flex-col gap-4">
                            {(() => {
                              const mainItem = imageFolders.find(v => v.id === inlineActiveImageFolderId) || imageFolders[0];
                              const mainUrl = parseDriveUrl(mainItem.url || '', 'folder');
                              return (
                                <div className="relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 h-[300px] w-full shadow-sm">
                                  <iframe 
                                    src={mainUrl} 
                                    className="absolute top-0 left-0 w-full h-full border-none" 
                                    title={mainItem.title || 'Google Drive Folder'}
                                  />
                                </div>
                              );
                            })()}

                            {imageFolders.length > 1 && (
                              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mt-4 border border-black/[0.03] rounded-2xl p-2 bg-black/[0.01]">
                                {imageFolders.map(item => {
                                  const isActive = inlineActiveImageFolderId === item.id || (!inlineActiveImageFolderId && item.id === imageFolders[0].id);
                                  const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.url || '', 'image') || '';
                                  return (
                                    <div 
                                      key={item.id} 
                                      onClick={() => setInlineActiveImageFolderId(item.id)}
                                      className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl border transition-all ${
                                        isActive 
                                          ? 'border-black/10 bg-black/[0.03] shadow-sm' 
                                          : 'border-transparent hover:bg-black/[0.02]'
                                      }`}
                                    >
                                      <div className="w-24 aspect-video rounded-lg overflow-hidden relative bg-black/5 flex-shrink-0">
                                        {thumbUrl !== '' ? (
                                          <img src={thumbUrl} alt="thumb" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                            <ImageIcon className="w-4 h-4 opacity-40" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0 text-left">
                                        <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                          {item.title || 'Thư mục hình ảnh'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {directImages.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {directImages.map((item, idx) => {
                              const directUrl = parseDriveUrl(item.url || '', 'image');
                              return (
                                <button key={item.id} onClick={() => setInlineMediaLightbox({ isOpen: true, index: idx, items: directImages })} className="block w-full aspect-video relative cursor-pointer group/btn rounded-xl overflow-hidden border border-black/5 bg-black/[0.02]">
                                  <img src={directUrl} alt={item.title || 'Image'} className="w-full h-full object-cover transition-transform group-hover/btn:scale-105 duration-300" referrerPolicy="no-referrer" />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[9px] font-medium truncate">
                                    {item.title || 'Hình ảnh'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {relatedImages.length === 0 && (
                          <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                            <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                            <p className="text-sm">{lang === 'vi' ? 'Chưa có tài liệu hình ảnh.' : 'No image items for this event.'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {inlineActiveSubTab === 'videos' && (() => {
                    const relatedVideos = relatedMedia.filter(m => m.type === 'video');
                    return (
                      <div className="flex flex-col gap-6">
                        {relatedVideos.length > 0 ? (
                          <>
                            {(() => {
                              const mainItem = relatedVideos.find(v => v.id === inlineActiveVideoId) || relatedVideos[0];
                              const isFolder = isDriveFolderUrl(mainItem.video_url || mainItem.videoUrl || mainItem.url || '');
                              const mainUrl = parseDriveUrl(mainItem.video_url || mainItem.videoUrl || mainItem.url || '', isFolder ? 'folder' : 'video');
                              return (
                                <div className={`relative rounded-2xl overflow-hidden border border-black/5 bg-black/5 ${isFolder ? 'h-[300px]' : 'aspect-video'} w-full shadow-sm`}>
                                  <iframe 
                                    src={mainUrl} 
                                    className="absolute top-0 left-0 w-full h-full border-none"
                                    allow="autoplay; encrypted-media" 
                                    allowFullScreen
                                    title={mainItem.title || 'Video'}
                                  />
                                </div>
                              );
                            })()}

                            {relatedVideos.length > 1 && (
                                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar mt-4 border border-black/[0.03] rounded-2xl p-2 bg-black/[0.01]">
                                  {relatedVideos.map(item => {
                                    const isActive = inlineActiveVideoId === item.id || (!inlineActiveVideoId && item.id === relatedVideos[0].id);
                                    const isFolder = isDriveFolderUrl(item.video_url || item.videoUrl || item.url || '');
                                    const thumbUrl = item.thumbnail || item.thumbnailUrl || getThumbnailForUrl(item.video_url || item.videoUrl || item.url || '', 'video') || '';
                                    return (
                                      <div 
                                        key={item.id} 
                                        onClick={() => setInlineActiveVideoId(item.id)}
                                        className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl border transition-all ${
                                          isActive 
                                            ? 'border-black/10 bg-black/[0.03] shadow-sm' 
                                            : 'border-transparent hover:bg-black/[0.02]'
                                        }`}
                                      >
                                        <div className="w-24 aspect-video rounded-lg overflow-hidden relative bg-black/5 flex-shrink-0">
                                          {thumbUrl !== '' ? (
                                            <img src={thumbUrl} alt="thumb" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                              <Play className="w-4 h-4 opacity-40" />
                                            </div>
                                          )}
                                          {!isFolder && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                                                <Play className="w-3 h-3 fill-current ml-0.5" />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                          <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                            {item.title || (isFolder ? 'Thư mục video' : 'Video')}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </>
                        ) : (
                          <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                            <Play className="w-10 h-10 opacity-30 mb-2" />
                            <p className="text-sm">{lang === 'vi' ? 'Chưa có tài liệu video.' : 'No video items for this event.'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

              </div><div className="flex flex-col gap-4 w-full mt-12">
              {event._status !== 'past' && (
                <button 
                  onClick={() => handleOpenBooking(event.id)}
                  className={`w-full ${config.accent} text-white py-4 rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-black/10`}
                >
                  {lang === 'vi' ? 'Đặt chỗ tham gia ngay' : 'Book a Spot Now'}
                </button>
              )}
            </div>
          </div>
        </div>
    </motion.div>
  )}
</AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <button className={`mt-10 group ${config.text} font-bold flex items-center gap-2 hover:opacity-60 transition-all`}>
                      {t.moreEvents} <div className={`w-8 h-8 rounded-full border ${config.border} flex items-center justify-center group-hover:translate-x-2 transition-transform`}><ChevronRight className="w-4 h-4" /></div>
                    </button>
                  </div>

                  <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-32">
                     <CompactCalendar 
                      onEventClick={setSelectedEvent} 
                      onBookClick={(e) => handleOpenBooking(e.id)}
                      className="w-full" 
                     />
                     <div 
                        onClick={() => handleOpenBooking()}
                        className={`mt-8 p-6 rounded-[32px] ${config.accent} text-white flex items-center justify-between shadow-xl cursor-pointer hover:brightness-110 transition-all`}
                     >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Palette className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm tracking-tight">{lang === 'vi' ? 'Đặt Chỗ Workshop' : 'Book a Workshop'}</h5>
                            <p className="text-xs opacity-80 italic">{lang === 'vi' ? 'Hãy để lại thông tin' : 'Leave your details'}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {showCulture && <CultureChronicles />}
            {/* <Services /> */}
            {showSpotlight && <NewsSection onEventClick={setSelectedEvent} />}
            {showBookReview && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <BookReview />
                </motion.div>
              </AnimatePresence>
            )}
            <PartnersSection />
            <FloatingButtons />
              </>
            )}
          </main>
          <Footer />
          </>
          )}
        </div>
        </DataContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}
