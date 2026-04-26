# Linkaty - لينكاتي

بوابة شخصية للوصول السريع إلى المواقع والأدوات الرقمية.

🔗 **Live**: [linkaty-pro.netlify.app](https://linkaty-pro.netlify.app/)

## ✨ المميزات

- 🎨 تصميم عصري وسريع
- 🌓 الوضع الداكن والمضيء (مع اكتشاف ثيم النظام)
- ❤️ نظام المفضلة مع السحب والإفلات
- 🔍 بحث وتصفية ذكي (يتعامل مع الفئات)
- 📱 متجاوب مع جميع الأجهزة
- ⚡ PWA Support
- ⌨️ اختصارات لوحة المفاتيح (Ctrl+K للبحث، Escape للمسح)

## 📁 هيكل المشروع

```
linkaty/
├── public/
│   ├── css/
│   │   ├── clean-design.css    # التصميم الرئيسي + Dark Mode
│   │   └── drag-drop.css       # أنماط السحب والإفلات
│   │
│   ├── js/
│   │   └── simple-app.js       # كل المنطق في ملف واحد مستقل
│   │
│   ├── images/
│   │   ├── icons/              # أيقونات المواقع (PNG/SVG)
│   │   └── star-factory-icon.jpg
│   │
│   ├── index.html              # الصفحة الرئيسية
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   ├── robots.txt              # SEO
│   └── sitemap.xml             # SEO
│
├── server.js                    # خادم Node.js للتطوير المحلي
├── netlify.toml                 # إعدادات Netlify + Security Headers
├── package.json
└── README.md
```

## 🚀 التشغيل

### المتطلبات

- Node.js 22.x أو أحدث

### التثبيت والتشغيل

```bash
# تشغيل السيرفر
node server.js

# أو باستخدام npm
npm start
```

افتح المتصفح على: `http://localhost:3001`

## 🎯 الوحدات

### simple-app.js

ملف واحد مستقل يحتوي على كل المنطق:

- **Theme**: تبديل الوضع الداكن/المضيء مع اكتشاف ثيم النظام
- **Search**: بحث فوري يتعامل مع الفئة النشطة
- **Favorites**: إضافة/إزالة + سحب وإفلات + حفظ في localStorage
- **Categories**: تصفية حسب الفئات مع عدادات
- **Drag & Drop**: إعادة ترتيب البطاقات والمفضلة
- **Toast**: إشعارات تفاعلية
- **Keyboard**: Ctrl+K للبحث، Escape للمسح
- **Icon Fallback**: بديل تلقائي للأيقونات المعطلة
- **Security**: حماية XSS عبر `escapeHTML()`

## 🎨 التخصيص

### إضافة رابط جديد

أضف البطاقة في `index.html`:

```html
<div
  class="card"
  data-category="tools"
  data-url="https://example.com"
  data-title="اسم الموقع"
  data-description="وصف الموقع"
>
  <button class="favorite-btn" title="إضافة للمفضلة">
    <i class="far fa-heart"></i>
  </button>
  <a href="https://example.com" target="_blank" rel="noopener noreferrer">
    <img
      src="/images/icons/your-icon.png"
      alt="اسم الموقع"
      class="icon-image"
      loading="lazy"
      onerror="this.onerror=null; this.src='/images/icons/default-icon.svg';"
    />
    <span class="title">اسم الموقع</span>
    <span class="description">وصف الموقع</span>
  </a>
</div>
```

### تعديل الألوان

عدّل المتغيرات في `css/clean-design.css`:

```css
:root {
  --primary-blue: #5e72e4;
  --light-blue: #e8eaff;
  /* ... */
}
```

## 🔒 الأمان

- ✅ Content Security Policy (موحّد بين Netlify و Server)
- ✅ XSS Protection (escapeHTML + Security Headers)
- ✅ `rel="noopener noreferrer"` على كل الروابط الخارجية
- ✅ Path Traversal Protection في Server
- ✅ No external tracking
- ✅ Secure localStorage handling

## 📱 PWA Support

- تثبيت على الشاشة الرئيسية
- العمل بدون إنترنت (Service Worker)
- تحديثات تلقائية

## 📝 الترخيص

MIT License - مفتوح المصدر

## 👨‍💻 المطور

**Islam Glab**
