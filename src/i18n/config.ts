import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      app: {
        name: 'Occamy Field Ops',
        tagline: 'Field Activity Logging System'
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        loggingIn: 'Logging in...',
        invalidCredentials: 'Invalid email or password'
      },
      dashboard: {
        title: 'Dashboard',
        startDay: 'Start Day',
        endDay: 'End Day',
        todaysMeetings: "Today's Meetings",
        distanceTraveled: 'Distance Traveled',
        pendingSync: 'Pending Sync',
        km: 'Km',
        activities: 'Activities',
        noActivities: 'No activities today',
        syncNow: 'Sync Now',
        syncing: 'Syncing...',
        viewAll: 'View All',
        welcomeBack: 'Welcome back,',
        visits: 'Visits',
        queue: 'Queue',
        todaysRoute: "Today's Route",
        viewMap: 'View Map',
        recentActivity: 'Recent Activity',
        history: 'History'
      },
      farms: {
        todaysAssignedRoute: "Today's Assigned Route",
        locationsVisited: '{{completed}} of {{total}} locations visited',
        startNavigation: 'Start Navigation',
        kmAway: '{{distance}} km away'
      },
      actions: {
        logActivity: 'Log Activity',
        addFarm: 'Add Farm',
        farmDatabase: 'Farm Database'
      },
      activity: {
        newActivity: 'New Activity',
        selectType: 'Select Activity Type',
        oneOnOne: 'One-on-One Meeting',
        groupMeeting: 'Group Meeting',
        sampleDistribution: 'Sample Distribution',
        sale: 'Sale',
        step: 'Step',
        of: 'of',
        next: 'Next',
        back: 'Back',
        save: 'Save',
        saving: 'Saving...',
        saved: 'Activity saved locally',
        confirmLocation: 'Confirm Location',
        locationConfirmed: 'Location confirmed',
        accuracy: 'GPS accurate to {{meters}} meters',
        review: 'Review',
        edit: 'Edit',
        details: 'Activity Details',
        delete: 'Delete Activity',
        deleteConfirmTitle: 'Delete Activity?',
        deleteConfirmDesc: 'Are you sure you want to delete this activity? This action cannot be undone.',
        fullHistory: 'View Full Activity History',
        pullToRefresh: 'Pull down to refresh',
        updated: 'Updated',
        failed: 'Failed',
        pending: 'Pending',
        updatedToManager: 'Updated to Manager',
        pendingUpdate: 'Pending Update',
        locationVerified: 'Location verified',
        updateToManager: 'Update to Manager',
        photos: 'Photos',
        topicsDiscussed: 'Topics Discussed',
        concerns: "Farmer's Concerns",
        recommendations: 'Recommendations Given',
        nextSteps: 'Next Steps',
        attendees: 'Attendees',
        people: 'people',
        keyTopics: 'Key Topics',
        interestLevel: 'Farmer Interest Level',
        recipient: 'Recipient',
        customer: 'Customer',
        paymentMode: 'Payment Mode'
      },
      oneOnOne: {
        personName: 'Person Name',
        category: 'Category',
        selectCategory: 'Select category',
        farmer: 'Farmer',
        seller: 'Seller',
        influencer: 'Influencer',
        contact: 'Contact (Optional)',
        contactPlaceholder: 'Phone number',
        businessPotential: 'Business Potential',
        notes: 'Notes',
        notesPlaceholder: 'Additional notes...'
      },
      groupMeeting: {
        villageName: 'Village Name',
        attendeeCount: 'Number of Attendees',
        meetingType: 'Meeting Type',
        selectType: 'Select meeting type',
        awareness: 'Awareness',
        productDemo: 'Product Demo',
        training: 'Training',
        feedback: 'Feedback',
        photos: 'Photos',
        addPhoto: 'Add Photo',
        retake: 'Retake'
      },
      sampleDistribution: {
        product: 'Product',
        selectProduct: 'Select product',
        quantity: 'Quantity',
        recipientName: 'Recipient Name',
        purpose: 'Purpose'
      },
      sale: {
        saleType: 'Sale Type',
        b2c: 'B2C (Direct to Consumer)',
        b2b: 'B2B (Business to Business)',
        productSku: 'Product SKU',
        packSize: 'Pack Size',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        totalAmount: 'Total Amount'
      },
      offline: {
        banner: 'You are offline. Activities will be saved locally and synced when online.'
      },
      common: {
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        error: 'Error',
        success: 'Success',
        loading: 'Loading...',
        required: 'Required',
        optional: 'Optional',
        close: 'Close',
        unknownLocation: 'Unknown Location',
        noDetails: 'No details'
      },
      adminDashboard: {
        overview: 'Dashboard Overview',
        commandCenter: 'Manager Command Center',
        systemStatus: 'SYSTEM STATUS',
        liveFeed: 'LIVE DATA FEED',
        activeOfficers: 'Active Officers',
        total: 'total', // context: "out of X total"
        farmsVisited: 'Farms Visited',
        scheduledToday: 'scheduled today', // context: "vs X scheduled today"
        syncQueue: 'Sync Queue',
        pendingSync: 'estimated data pending sync',
        completionRate: 'Completion Rate',
        dailyTarget: 'of daily targets achieved',
        recentAlerts: 'Recent Field Alerts',
        emergency: 'SOS Signal - Emergency Reported',
        managerTip: 'Manager Tip',
        reviewTerritories: 'Review Territories',
        tipContent: 'Territory coverage is currently peaking in the North region. Consider re-allocating 2 officers to the South-West village cluster to meet the 5 PM target.',
        officerReported: 'Officer <strong>{{name}}</strong> reported an issue at <strong>{{location}}</strong>.'
      }
    }
  },
  hi: {
    translation: {
      app: {
        name: 'ओकैमी फील्ड ऑप्स',
        tagline: 'फील्ड गतिविधि लॉगिंग प्रणाली'
      },
      auth: {
        login: 'लॉग इन',
        logout: 'लॉग आउट',
        email: 'ईमेल',
        password: 'पासवर्ड',
        loggingIn: 'लॉग इन हो रहा है...',
        invalidCredentials: 'अमान्य ईमेल या पासवर्ड'
      },
      dashboard: {
        title: 'डैशबोर्ड',
        startDay: 'दिन शुरू करें',
        endDay: 'दिन समाप्त करें',
        todaysMeetings: 'आज की बैठकें',
        distanceTraveled: 'तय की गई दूरी',
        pendingSync: 'सिंक के लिए लंबित',
        km: 'किमी',
        activities: 'गतिविधियां',
        noActivities: 'आज कोई गतिविधि नहीं',
        syncNow: 'अभी सिंक करें',
        syncing: 'सिंक हो रहा है...',
        viewAll: 'सभी देखें',
        welcomeBack: 'वापस स्वागत है,',
        visits: 'यात्राएं',
        queue: 'कतार',
        todaysRoute: 'आज का मार्ग',
        viewMap: 'मानचित्र देखें',
        recentActivity: 'हाल की गतिविधि',
        history: 'इतिहास'
      },
      farms: {
        todaysAssignedRoute: 'आज का असाइन किया गया मार्ग',
        locationsVisited: '{{total}} में से {{completed}} स्थान देखे गए',
        startNavigation: 'नेविगेशन शुरू करें',
        kmAway: '{{distance}} किमी दूर'
      },
      actions: {
        logActivity: 'गतिविधि लॉग करें',
        addFarm: 'फार्म जोड़ें',
        farmDatabase: 'फार्म डेटाबेस'
      },
      activity: {
        newActivity: 'नई गतिविधि',
        selectType: 'गतिविधि प्रकार चुनें',
        oneOnOne: 'एक-on-एक बैठक',
        groupMeeting: 'समूह बैठक',
        sampleDistribution: 'नमूना वितरण',
        sale: 'बिक्री',
        step: 'चरण',
        of: 'का',
        next: 'अगला',
        back: 'पीछे',
        save: 'सहेजें',
        saving: 'सहेज रहा है...',
        saved: 'गतिविधि स्थानीय रूप से सहेजी गई',
        confirmLocation: 'स्थान की पुष्टि करें',
        locationConfirmed: 'स्थान की पुष्टि हो गई',
        accuracy: 'GPS {{meters}} मीटर सटीक',
        review: 'समीक्षा',
        edit: 'संपादित करें',
        details: 'गतिविधि विवरण',
        delete: 'गतिविधि हटाएं',
        deleteConfirmTitle: 'गतिविधि हटाएं?',
        deleteConfirmDesc: 'क्या आप वाकई इस गतिविधि को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
        fullHistory: 'पूरा गतिविधि इतिहास देखें',
        pullToRefresh: 'तरोताजा करने के लिए नीचे खींचें',
        updated: 'सफल',
        failed: 'विफल',
        pending: 'लंबित',
        updatedToManager: 'मैनेजर को अपडेट किया गया',
        pendingUpdate: 'अपडेट लंबित',
        locationVerified: 'स्थान सत्यापित',
        updateToManager: 'मैनेजर को अपडेट करें',
        photos: 'फोटो',
        topicsDiscussed: 'चर्चा किए गए विषय',
        concerns: 'किसान की चिंताएं',
        recommendations: 'दी गई सिफारिशें',
        nextSteps: 'अगले कदम',
        attendees: 'उपस्थित लोग',
        people: 'लोग',
        keyTopics: 'प्रमुख विषय',
        interestLevel: 'किसान रुचि स्तर',
        recipient: 'प्राप्तकर्ता',
        customer: 'ग्राहक',
        paymentMode: 'भुगतान का तरीका'
      },
      oneOnOne: {
        personName: 'व्यक्ति का नाम',
        category: 'श्रेणी',
        selectCategory: 'श्रेणी चुनें',
        farmer: 'किसान',
        seller: 'विक्रेता',
        influencer: 'प्रभावक',
        contact: 'संपर्क (वैकल्पिक)',
        contactPlaceholder: 'फोन नंबर',
        businessPotential: 'व्यावसायिक क्षमता',
        notes: 'नोट्स',
        notesPlaceholder: 'अतिरिक्त नोट्स...'
      },
      groupMeeting: {
        villageName: 'गांव का नाम',
        attendeeCount: 'उपस्थित लोगों की संख्या',
        meetingType: 'बैठक का प्रकार',
        selectType: 'बैठक का प्रकार चुनें',
        awareness: 'जागरूकता',
        productDemo: 'उत्पाद प्रदर्शन',
        training: 'प्रशिक्षण',
        feedback: 'प्रतिक्रिया',
        photos: 'फोटो',
        addPhoto: 'फोटो जोड़ें',
        retake: 'फिर से लें'
      },
      sampleDistribution: {
        product: 'उत्पाद',
        selectProduct: 'उत्पाद चुनें',
        quantity: 'मात्रा',
        recipientName: 'प्राप्तकर्ता का नाम',
        purpose: 'उद्देश्य'
      },
      sale: {
        saleType: 'बिक्री प्रकार',
        b2c: 'B2C (सीधे उपभोक्ता को)',
        b2b: 'B2B (व्यवसाय से व्यवसाय)',
        productSku: 'उत्पाद SKU',
        packSize: 'पैक आकार',
        quantity: 'मात्रा',
        unitPrice: 'इकाई मूल्य',
        totalAmount: 'कुल राशि'
      },
      offline: {
        banner: 'आप ऑफलाइन हैं। गतिविधियां स्थानीय रूप से सहेजी जाएंगी और ऑनलाइन होने पर सिंक की जाएंगी।'
      },
      common: {
        cancel: 'रद्द करें',
        confirm: 'पुष्टि करें',
        delete: 'हटाएं',
        error: 'त्रुटि',
        success: 'सफल',
        loading: 'लोड हो रहा है...',
        required: 'आवश्यक',
        optional: 'वैकल्पिक',
        close: 'बंद करें',
        unknownLocation: 'अज्ञात स्थान',
        noDetails: 'कोई विवरण नहीं'
      },
      adminDashboard: {
        overview: 'डैशबोर्ड अवलोकन',
        commandCenter: 'प्रबंधक कमांड सेंटर',
        systemStatus: 'सिस्टम स्थिति',
        liveFeed: 'लाइव डेटा फ़ीड',
        activeOfficers: 'सक्रिय अधिकारी',
        total: 'कुल',
        farmsVisited: 'फार्म का दौरा',
        scheduledToday: 'आज निर्धारित',
        syncQueue: 'सिंक कतार',
        pendingSync: 'डेटा सिंक लंबित (अनुमानित)',
        completionRate: 'पूर्णता दर',
        dailyTarget: 'दैनिक लक्ष्य पूरा',
        recentAlerts: 'हाल ही में फील्ड अलर्ट',
        emergency: 'एसओएस (SOS) - आपातकालीन रिपोर्ट',
        managerTip: 'प्रबंधक टिप',
        reviewTerritories: 'क्षेत्रों की समीक्षा करें',
        tipContent: 'उत्तर क्षेत्र में कवरेज चरम पर है। 5 बजे का लक्ष्य पूरा करने के लिए दक्षिण-पश्चिम में 2 अधिकारियों को भेजें।',
        officerReported: 'अधिकारी <strong>{{name}}</strong> ने <strong>{{location}}</strong> पर समस्या रिपोर्ट की।'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
