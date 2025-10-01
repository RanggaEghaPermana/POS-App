// Shared data storage utilities for barbershop
export const CATEGORIES_STORAGE_KEY = 'barbershop_categories';
export const SERVICES_STORAGE_KEY = 'barbershop_services';
export const BARBERS_STORAGE_KEY = 'barbershop_barbers';
export const APPOINTMENTS_STORAGE_KEY = 'barbershop_appointments';

// Centralized category management
export function loadCategoriesFromStorage() {
    try {
        const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load categories from localStorage:', error);
    }
    return getDefaultCategories();
}

export function saveCategoresToStorage(categories) {
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
        console.warn('Failed to save categories to localStorage:', error);
    }
}

// Centralized service management
export function loadServicesFromStorage() {
    try {
        const stored = localStorage.getItem(SERVICES_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load services from localStorage:', error);
    }
    return getDefaultServices();
}

export function saveServicesToStorage(services) {
    try {
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
        // Auto-update category service counts
        updateCategoryServiceCounts(services);
    } catch (error) {
        console.warn('Failed to save services to localStorage:', error);
    }
}

// Auto-update category service counts
function updateCategoryServiceCounts(services) {
    const categories = loadCategoriesFromStorage();
    const updatedCategories = categories.map(cat => {
        const categoryServices = services.filter(srv => srv.service_category_id === cat.id);
        return { ...cat, services_count: categoryServices.length };
    });
    saveCategoresToStorage(updatedCategories);
}

// Default data - centralized
export function getDefaultCategories() {
    return [
        {
            id: "cat-haircut",
            name: "Layanan Potong Rambut",
            description: "Pilihan potong rambut signature, klasik, hingga trend terbaru",
            icon: "haircut",
            color: "#8B5CF6",
            active: true,
            services_count: 0,
            created_at: new Date().toISOString(),
        },
        {
            id: "cat-beard",
            name: "Perawatan Jenggot & Kumis",
            description: "Trimming, shaping, dan perawatan untuk jenggot & kumis",
            icon: "beard",
            color: "#F59E0B",
            active: true,
            services_count: 0,
            created_at: new Date().toISOString(),
        },
        {
            id: "cat-treatment",
            name: "Hair Styling & Treatment",
            description: "Styling harian, treatment vitamin, hingga coloring rambut",
            icon: "styling",
            color: "#10B981",
            active: true,
            services_count: 0,
            created_at: new Date().toISOString(),
        },
        {
            id: "cat-wash",
            name: "Cuci & Keramas",
            description: "Cuci rambut relaksasi lengkap dengan pijat kepala",
            icon: "wash",
            color: "#3B82F6",
            active: true,
            services_count: 0,
            created_at: new Date().toISOString(),
        },
        {
            id: "cat-consultation",
            name: "Konsultasi & Grooming",
            description: "Sesi konsultasi gaya personal dan grooming total",
            icon: "consultation",
            color: "#EF4444",
            active: true,
            services_count: 0,
            created_at: new Date().toISOString(),
        },
        {
            id: "cat-package",
            name: "Paket Lengkap",
            description: "Bundling hemat untuk layanan lengkap barbershop",
            icon: "package",
            color: "#6366F1",
            active: true,
            services_count: 0,
            created_at: new Date().toISOString(),
        },
    ];
}

export function getDefaultServices() {
    return [
        {
            id: "srv-haircut-001",
            name: "Signature Haircut",
            code: "TR-SIGN-001",
            service_category_id: "cat-haircut",
            base_price: 85000,
            unit: "layanan",
            description: "Potong rambut eksklusif dengan konsultasi styling personal dan finishing premium",
            estimated_duration: 45,
            requirements: "Cuci rambut terlebih dahulu",
            active: true,
            popularity: "signature",
            created_at: new Date().toISOString(),
            booking_count: 156,
            rating: 4.9,
        },
        {
            id: "srv-haircut-002",
            name: "Classic Men's Cut",
            code: "TR-CLAS-001",
            service_category_id: "cat-haircut",
            base_price: 65000,
            unit: "layanan",
            description: "Potongan rambut klasik pria dengan teknik traditional barbering",
            estimated_duration: 30,
            requirements: "Cuci rambut terlebih dahulu",
            active: true,
            popularity: "standard",
            created_at: new Date().toISOString(),
            booking_count: 89,
            rating: 4.7,
        },
        {
            id: "srv-haircut-003",
            name: "Modern Fade Cut",
            code: "TR-FADE-001",
            service_category_id: "cat-haircut",
            base_price: 75000,
            unit: "layanan",
            description: "Potongan fade modern dengan gradasi halus dan rapi",
            estimated_duration: 40,
            requirements: "Cuci rambut terlebih dahulu",
            active: true,
            popularity: "popular",
            created_at: new Date().toISOString(),
            booking_count: 124,
            rating: 4.8,
        },
        {
            id: "srv-beard-001",
            name: "Beard Sculpting Premium",
            code: "TR-BEARD-001",
            service_category_id: "cat-beard",
            base_price: 65000,
            unit: "layanan",
            description: "Pembentukan jenggot profesional dengan teknik sculpting dan grooming premium",
            estimated_duration: 30,
            requirements: "Jenggot minimal 2cm",
            active: true,
            popularity: "popular",
            created_at: new Date().toISOString(),
            booking_count: 89,
            rating: 4.8,
        },
        {
            id: "srv-beard-002",
            name: "Mustache & Beard Trim",
            code: "TR-TRIM-001",
            service_category_id: "cat-beard",
            base_price: 45000,
            unit: "layanan",
            description: "Perawatan kumis dan jenggot dengan trimming presisi",
            estimated_duration: 25,
            requirements: "Jenggot minimal 1cm",
            active: true,
            popularity: "standard",
            created_at: new Date().toISOString(),
            booking_count: 67,
            rating: 4.6,
        },
        {
            id: "srv-treatment-001",
            name: "Hair & Scalp Treatment",
            code: "TR-TREAT-001",
            service_category_id: "cat-treatment",
            base_price: 120000,
            unit: "session",
            description: "Treatment intensif untuk rambut dan kulit kepala dengan teknologi modern dan produk premium",
            estimated_duration: 60,
            requirements: "Konsultasi preliminary required",
            active: true,
            popularity: "trending",
            created_at: new Date().toISOString(),
            booking_count: 234,
            rating: 5.0,
        },
        {
            id: "srv-treatment-002",
            name: "Hair Vitamin Therapy",
            code: "TR-VIT-001",
            service_category_id: "cat-treatment",
            base_price: 95000,
            unit: "session",
            description: "Terapi vitamin rambut untuk nutrisi dan pertumbuhan optimal",
            estimated_duration: 45,
            requirements: "Konsultasi terlebih dahulu",
            active: true,
            popularity: "popular",
            created_at: new Date().toISOString(),
            booking_count: 143,
            rating: 4.7,
        },
        {
            id: "srv-treatment-003",
            name: "Professional Hair Styling",
            code: "TR-STYLE-001",
            service_category_id: "cat-treatment",
            base_price: 85000,
            unit: "layanan",
            description: "Styling rambut profesional untuk acara khusus dan gaya sehari-hari",
            estimated_duration: 35,
            requirements: "Rambut dalam kondisi bersih",
            active: true,
            popularity: "standard",
            created_at: new Date().toISOString(),
            booking_count: 78,
            rating: 4.5,
        },
    ];
}

// Centralized barber management
export function loadBarbersFromStorage() {
    try {
        const stored = localStorage.getItem(BARBERS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load barbers from localStorage:', error);
    }
    return getDefaultBarbers();
}

export function saveBarbersToStorage(barbers) {
    try {
        localStorage.setItem(BARBERS_STORAGE_KEY, JSON.stringify(barbers));
    } catch (error) {
        console.warn('Failed to save barbers to localStorage:', error);
    }
}

// Default barbers data - centralized
export function getDefaultBarbers() {
    return [
        {
            id: "barber-001",
            name: "Ahmad Rizki",
            specialty: "Classic & Modern Cut",
            experience_years: 5,
            rating: 4.8,
            phone: "081234567890",
            email: "ahmad.rizki@barbershop.com",
            active: true,
            skills: ["Classic Cut", "Modern Fade", "Beard Sculpting"],
            hourly_rate: 50000, // Actually service_rate per layanan
            bio: "Barber berpengalaman dengan spesialisasi potongan klasik dan modern. Telah melayani lebih dari 1000+ pelanggan.",
            schedule: {
                monday: { start: "09:00", end: "17:00" },
                tuesday: { start: "09:00", end: "17:00" },
                wednesday: { start: "09:00", end: "17:00" },
                thursday: { start: "09:00", end: "17:00" },
                friday: { start: "09:00", end: "17:00" },
                saturday: { start: "09:00", end: "15:00" },
                sunday: "off"
            },
            created_at: new Date().toISOString(),
            total_appointments: 156,
            completed_appointments: 142
        },
        {
            id: "barber-002",
            name: "Budi Santoso",
            specialty: "Beard & Mustache Expert",
            experience_years: 8,
            rating: 4.9,
            phone: "081234567891",
            email: "budi.santoso@barbershop.com",
            active: true,
            skills: ["Beard Trimming", "Mustache Styling", "Traditional Shaving"],
            hourly_rate: 60000, // Actually service_rate per layanan
            bio: "Ahli perawatan jenggot dan kumis dengan teknik traditional barbering yang autentik.",
            schedule: {
                monday: { start: "10:00", end: "18:00" },
                tuesday: { start: "10:00", end: "18:00" },
                wednesday: { start: "10:00", end: "18:00" },
                thursday: { start: "10:00", end: "18:00" },
                friday: { start: "10:00", end: "18:00" },
                saturday: { start: "09:00", end: "16:00" },
                sunday: "off"
            },
            created_at: new Date().toISOString(),
            total_appointments: 203,
            completed_appointments: 189
        },
        {
            id: "barber-003",
            name: "Cahyo Pratama",
            specialty: "Premium Styling & Treatment",
            experience_years: 6,
            rating: 4.7,
            phone: "081234567892",
            email: "cahyo.pratama@barbershop.com",
            active: true,
            skills: ["Hair Treatment", "Premium Styling", "Hair Coloring"],
            hourly_rate: 75000, // Actually service_rate per layanan
            bio: "Spesialis treatment rambut dan styling premium dengan sertifikasi internasional.",
            schedule: {
                monday: { start: "08:00", end: "16:00" },
                tuesday: { start: "08:00", end: "16:00" },
                wednesday: { start: "08:00", end: "16:00" },
                thursday: { start: "08:00", end: "16:00" },
                friday: { start: "08:00", end: "16:00" },
                saturday: { start: "08:00", end: "14:00" },
                sunday: "off"
            },
            created_at: new Date().toISOString(),
            total_appointments: 134,
            completed_appointments: 121
        },
        {
            id: "barber-004",
            name: "Dika",
            specialty: "semua bisa",
            experience_years: 4,
            rating: 4.6,
            phone: "081234567893",
            email: "dika@barbershop.com",
            active: true,
            skills: ["Classic Cut", "Modern Fade", "Beard Trimming", "Hair Treatment"],
            hourly_rate: 80000, // Actually service_rate per layanan
            bio: "Barber yang fleksibel dengan kemampuan menyeluruh untuk semua jenis layanan.",
            schedule: {
                monday: { start: "09:00", end: "17:00" },
                tuesday: { start: "09:00", end: "17:00" },
                wednesday: { start: "09:00", end: "17:00" },
                thursday: { start: "09:00", end: "17:00" },
                friday: { start: "09:00", end: "17:00" },
                saturday: { start: "09:00", end: "15:00" },
                sunday: "off"
            },
            created_at: new Date().toISOString(),
            total_appointments: 95,
            completed_appointments: 87
        }
    ];
}

// Centralized appointments management
export function loadAppointmentsFromStorage() {
    try {
        const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load appointments from localStorage:', error);
    }
    return getDefaultAppointments();
}

export function saveAppointmentsToStorage(appointments) {
    try {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    } catch (error) {
        console.warn('Failed to save appointments to localStorage:', error);
    }
}

// Default appointments data - centralized
export function getDefaultAppointments() {
    const today = new Date().toISOString().slice(0, 10);
    return [
        {
            id: "apt-001",
            customer_name: "John Doe",
            customer_phone: "081234567890",
            barber_id: "barber-001",
            service_ids: ["srv-haircut-001"],
            appointment_date: today,
            start_time: "10:00",
            end_time: "10:45",
            status: "scheduled",
            total_duration: 45,
            total_price: 85000,
            notes: "Potongan tidak terlalu pendek",
            created_at: new Date().toISOString()
        },
        {
            id: "apt-002",
            customer_name: "Jane Smith",
            customer_phone: "081234567891",
            barber_id: "barber-002",
            service_ids: ["srv-beard-001"],
            appointment_date: today,
            start_time: "14:00",
            end_time: "14:30",
            status: "confirmed",
            total_duration: 30,
            total_price: 65000,
            notes: "Pertama kali trim jenggot",
            created_at: new Date().toISOString()
        },
        {
            id: "apt-003",
            customer_name: "Budi Prasetyo",
            customer_phone: "081234567892",
            barber_id: "barber-001",
            service_ids: ["srv-haircut-003"],
            appointment_date: today,
            start_time: "15:00",
            end_time: "15:40",
            status: "in_progress",
            total_duration: 40,
            total_price: 75000,
            notes: "Sudah memulai layanan fade cut",
            created_at: new Date().toISOString(),
            started_at: (() => {
                // Set started_at to 5 minutes ago for testing countdown
                const now = new Date();
                now.setMinutes(now.getMinutes() - 5);
                return now.toISOString();
            })()
        }
    ];
}

// Function to update barber completed appointments count
export function updateBarberCompletedAppointments(barberId) {
    try {
        const barbers = loadBarbersFromStorage();
        const updatedBarbers = barbers.map(barber => {
            if (barber.id === barberId) {
                return {
                    ...barber,
                    completed_appointments: (barber.completed_appointments || 0) + 1,
                    total_appointments: (barber.total_appointments || 0) + 1,
                    updated_at: new Date().toISOString()
                };
            }
            return barber;
        });
        saveBarbersToStorage(updatedBarbers);
        console.log(`Updated barber ${barberId} completed appointments`);
    } catch (error) {
        console.warn('Failed to update barber completed appointments:', error);
    }
}

// Function to get barber by ID
export function getBarberById(barberId) {
    const barbers = loadBarbersFromStorage();
    return barbers.find(barber => barber.id === barberId);
}

// Initialize default data if needed
export function initializeBarbershopData() {
    // Initialize categories if empty
    if (!localStorage.getItem(CATEGORIES_STORAGE_KEY)) {
        saveCategoresToStorage(getDefaultCategories());
    }

    // Initialize services if empty
    if (!localStorage.getItem(SERVICES_STORAGE_KEY)) {
        saveServicesToStorage(getDefaultServices());
    }

    // Initialize barbers if empty
    if (!localStorage.getItem(BARBERS_STORAGE_KEY)) {
        saveBarbersToStorage(getDefaultBarbers());
    }

    // Initialize appointments if empty
    if (!localStorage.getItem(APPOINTMENTS_STORAGE_KEY)) {
        saveAppointmentsToStorage(getDefaultAppointments());
    }
}