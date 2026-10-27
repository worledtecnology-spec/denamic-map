/* إعدادات المنصة – عدّلها دون المساس ببقية الشيفرة */
window.APP_CONFIG={
  MINDMAP_PATTERN:"interactive", // نمط الخريطة الذهنية (المتغير التجريبي): "interactive" تفاعلية | "static" ساكنة
  MINDMAP_LAYOUT:"tree",         // شكل خريطة المفهوم داخل الموديول: "tree" أو "radial"
  SEQUENTIAL_MODULES:true,       // الموديول التالي يُفتح تلقائيًا بعد إنهاء السابق
  ALLOW_RETAKE:false,            // السماح بإعادة الاختبار القبلي/البعدي (تُحفظ كل المحاولات)
  SHOW_FEEDBACK_AFTER_QUIZ:true, // عرض الإجابات الصحيحة بعد إنهاء الاختبار (حسب خطة البحث)
  MODULE_PASSWORDS:false,        // قفل إضافي بكلمة مرور لكل موديول (يتطلب ACCESS_ENDPOINT)
  ACCESS_ENDPOINT:"",            // عنوان خدمة التحقق من كلمات مرور الموديولات
  DEV_BYPASS:true,               // وضع التطوير لكلمات مرور الموديولات. اجعله false عند النشر
  WHATSAPP_NUMBER:"201007367717", // رقم واتساب التواصل (بالصيغة الدولية بدون + أو أصفار)
  STUDENT_EMAIL_DOMAIN:"students.zu-elearning.app", // نطاق داخلي لتحويل كود التلميذ إلى حساب (لا يُرسل بريد)
  FIREBASE:{apiKey:"AIzaSyATba-KIGakITT7ajvhKfqYO3a1oF_v_-8",authDomain:"gamafication-8729a.firebaseapp.com",projectId:"gamafication-8729a",storageBucket:"gamafication-8729a.firebasestorage.app",messagingSenderId:"458014779813",appId:"1:458014779813:web:2819ba21bfca1932aca04c"}  // مشروع Firebase الخاص بالبيئة
};
