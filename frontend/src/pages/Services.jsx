import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "../api";
import { useSearchParams, Link } from "react-router-dom";
import { formatMoney } from "../utils/currency";
import useCurrency from "../hooks/useCurrency";
import { loadBarbersFromStorage } from '../utils/barbershopData';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
    Scissors,
    Plus,
    Search,
    Edit,
    Trash2,
    ArrowLeft,
    Save,
    X,
    Clock,
    Package,
    Sparkles,
    Crown,
    Gift,
    Bath,
    User,
    UserCheck,
    Brush,
    SprayCan,
    Droplet,
    Palette,
    Monitor,
    Printer,
    Settings,
    Grid,
    List,
    Filter,
    Eye,
    Star,
    Timer,
    Loader2,
    AlertCircle,
    Utensils,
    ChefHat,
    Coffee,
    Check,
    Tag,
    TrendingUp,
    Users,
    Calendar,
    MapPin,
    Heart,
    CakeSlice,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

// Enhanced Icon Map
const ICON_MAP = {
    printer: Printer,
    binding: Scissors,
    palette: Palette,
    computer: Monitor,
    haircut: Scissors,
    beard: User,
    styling: Brush,
    wash: Bath,
    consultation: UserCheck,
    package: Package,
    color: Palette,
    treatment: Sparkles,
    deluxe: Crown,
    products: Gift,
    sterilize: SprayCan,
    hydration: Droplet,
    // Restaurant specific icons
    food: Utensils,
    drink: Coffee,
    dessert: CakeSlice,
    appetizer: ChefHat,
    rice: ChefHat,
    noodle: Utensils,
    soup: Coffee,
    meat: Utensils,
    vegetable: Utensils,
    seafood: Utensils,
    snack: Package,
    beverage: Coffee,
};

// Enhanced Business Configuration
const BUSINESS_CONFIG = {
    restaurant: {
        title: "Kelola Menu",
        subtitle: "Kelola menu restaurant dengan variasi hidangan yang lezat",
        gradient: "from-orange-900 via-red-900 to-orange-900",
        icon: Utensils,
        serviceLabel: "Menu",
        serviceLabelPlural: "Menu",
        emptyDescription: "Mulai tambahkan menu pertama untuk restaurant Anda",
        defaultUnit: "porsi",
        codePlaceholder: "Contoh: MENU-001",
        namePlaceholder: "Contoh: Nasi Gudeg Jogja",
        searchPlaceholder: "Cari menu berdasarkan nama, kode, atau kategori...",
        unitOptions: [
            { value: "porsi", label: "Porsi", icon: Utensils },
            { value: "paket", label: "Paket Menu", icon: Package },
            { value: "gelas", label: "Per Gelas", icon: Coffee },
            { value: "botol", label: "Per Botol", icon: Coffee },
            { value: "item", label: "Per Item", icon: ChefHat },
        ],
        pricingModes: {
            fixed: { label: "Harga Menu", description: "Harga tetap per porsi" },
            variant: { label: "Harga Bervariasi", description: "Berdasarkan ukuran/level" },
            seasonal: { label: "Harga Musiman", description: "Berubah sesuai musim/ketersediaan" }
        },
        sizeOptions: [
            { value: "small", label: "Kecil", multiplier: 0.8 },
            { value: "regular", label: "Regular", multiplier: 1.0 },
            { value: "large", label: "Besar", multiplier: 1.3 },
            { value: "jumbo", label: "Jumbo", multiplier: 1.6 }
        ],
        spicyLevels: [
            { value: "0", label: "Tidak Pedas" },
            { value: "1", label: "Pedas Ringan" },
            { value: "2", label: "Pedas Sedang" },
            { value: "3", label: "Pedas" },
            { value: "4", label: "Extra Pedas" },
            { value: "5", label: "Sangat Pedas" }
        ],
        durationOptions: [
            { value: 5, label: "5 menit" },
            { value: 10, label: "10 menit" },
            { value: 15, label: "15 menit" },
            { value: 20, label: "20 menit" },
            { value: 30, label: "30 menit" },
            { value: 45, label: "45 menit" },
            { value: 60, label: "1 jam" },
        ],
    },
    barbershop: {
        title: "Kelola Layanan",
        subtitle: "Kelola layanan grooming premium dengan pengalaman yang memukau",
        gradient: "from-slate-900 via-purple-900 to-slate-900",
        icon: Sparkles,
        serviceLabel: "Layanan",
        serviceLabelPlural: "Layanan",
        emptyDescription: "Mulai tambahkan layanan signature pertama untuk barbershop Anda",
        defaultUnit: "layanan",
        codePlaceholder: "Contoh: LY-PREM-001",
        namePlaceholder: "Contoh: Potong Rambut Premium",
        searchPlaceholder: "Cari layanan berdasarkan nama, kode, atau kategori...",
        unitOptions: [
            { value: "layanan", label: "Layanan", icon: Scissors },
            { value: "paket", label: "Paket Premium", icon: Package },
            { value: "session", label: "Sesi Layanan", icon: Sparkles },
            { value: "menit", label: "Per Menit", icon: Clock },
            { value: "jam", label: "Per Jam", icon: Timer },
        ],
        pricingModes: {
            fixed: { label: "Harga Tetap", description: "Tarif fixed per layanan" },
            barber: { label: "Tarif Barber", description: "Sesuai tarif barber" },
            combined: { label: "Kombinasi", description: "Barber + treatment fee" }
        },
        staffLabel: "Barber",
        staffSelectLabel: "Pilih Barber",
        staffRateLabel: "Tarif Barber",
        additionalFeeLabel: "Treatment Fee",
        additionalFeeDescription: "Biaya tambahan untuk bahan/alat treatment khusus",
        durationOptions: [
            { value: 15, label: "15 menit" },
            { value: 30, label: "30 menit" },
            { value: 45, label: "45 menit" },
            { value: 60, label: "1 jam" },
            { value: 75, label: "1 jam 15 menit" },
            { value: 90, label: "1 jam 30 menit" },
            { value: 105, label: "1 jam 45 menit" },
            { value: 120, label: "2 jam" },
            { value: 135, label: "2 jam 15 menit" },
            { value: 150, label: "2 jam 30 menit" },
            { value: 165, label: "2 jam 45 menit" },
            { value: 180, label: "3 jam" },
            { value: 210, label: "3 jam 30 menit" },
            { value: 240, label: "4 jam" },
            { value: 270, label: "4 jam 30 menit" },
            { value: 300, label: "5 jam" },
        ],
        popularityLevels: [
            { value: "trending", label: "🔥 Trending", color: "bg-gray-100 text-gray-800" },
            { value: "popular", label: "⭐ Popular", color: "bg-gray-100 text-gray-800" },
            { value: "signature", label: "👑 Signature", color: "bg-gray-100 text-gray-800" },
            { value: "seasonal", label: "🌟 Seasonal", color: "bg-gray-100 text-gray-800" },
            { value: "standard", label: "📋 Standard", color: "bg-gray-100 text-gray-800" },
        ]
    },
    default: {
        title: "Manajemen Layanan",
        subtitle: "Kelola layanan jasa bisnis Anda",
        gradient: "from-indigo-600 via-blue-600 to-cyan-600",
        icon: Settings,
        serviceLabel: "Layanan",
        serviceLabelPlural: "Layanan",
        emptyDescription: "Mulai tambahkan layanan pertama untuk bisnis Anda.",
        defaultUnit: "pcs",
        codePlaceholder: "Contoh: FC-A4",
        namePlaceholder: "Nama layanan...",
        searchPlaceholder: "Cari nama layanan atau kode...",
        unitOptions: [
            { value: "pcs", label: "Pcs" },
            { value: "lembar", label: "Lembar" },
            { value: "meter", label: "Meter" },
            { value: "halaman", label: "Halaman" },
        ],
    },
};

const getBusinessConfig = (businessType) => BUSINESS_CONFIG[businessType] || BUSINESS_CONFIG.barbershop;

// Helper function to get the staff pricing mode value based on business type
const getStaffPricingMode = (businessType) => {
    return businessType === 'restaurant' ? 'chef' : 'barber';
};

// Helper function to get appropriate icon based on business type and category
const getBusinessAwareIcon = (categoryIcon, businessType) => {
    if (businessType === 'restaurant') {
        // Map barbershop icons to restaurant equivalents
        const restaurantIconMap = {
            'haircut': ChefHat,
            'beard': Utensils,
            'styling': Coffee,
            'wash': Coffee,
            'treatment': ChefHat,
            'consultation': Utensils,
            'package': Package
        };
        return restaurantIconMap[categoryIcon] || ChefHat;
    }
    // Default behavior for barbershop and other business types
    return ICON_MAP[categoryIcon] || Sparkles;
};

// Utility functions for currency formatting
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID').format(number);
};

const parseRupiah = (formattedValue) => {
    return parseInt(formattedValue.replace(/\D/g, ''), 10) || 0;
};

// Storage helpers - same as ServiceCategories
const CATEGORIES_STORAGE_KEY = 'barbershop_categories';
const SERVICES_STORAGE_KEY = 'barbershop_services';

function loadCategoriesFromStorage() {
    try {
        const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (stored) {
            const parsedCategories = JSON.parse(stored);
            // Return stored categories if they exist and have data
            if (parsedCategories && parsedCategories.length > 0) {
                return parsedCategories;
            }
        }
    } catch (error) {
        console.warn('Failed to load categories from localStorage:', error);
    }

    // Fallback to default categories and save them to localStorage
    const fallbackCategories = getFallbackCategories();
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(fallbackCategories));
    } catch (error) {
        console.warn('Failed to save fallback categories to localStorage:', error);
    }
    return fallbackCategories;
}

// Default categories for barbershop - Sinkron dengan ServiceCategories.jsx
const getFallbackCategories = () => [
    {
        id: "cat-haircut",
        name: "Potong Rambut",
        description: "Layanan potong rambut mulai dari gaya klasik hingga model terkini sesuai kepribadian Anda",
        icon: "haircut",
        color: "#8B5CF6",
        active: true,
        services_count: 0,
        created_at: new Date().toISOString(),
    },
    {
        id: "cat-beard",
        name: "Perawatan Jenggot & Kumis",
        description: "Layanan pemangkasan, pembentukan, dan perawatan jenggot serta kumis dengan teknik profesional",
        icon: "beard",
        color: "#F59E0B",
        active: true,
        services_count: 0,
        created_at: new Date().toISOString(),
    },
    {
        id: "cat-treatment",
        name: "Styling & Perawatan Rambut",
        description: "Layanan styling rambut harian, perawatan nutrisi, dan pewarnaan rambut profesional",
        icon: "styling",
        color: "#10B981",
        active: true,
        services_count: 0,
        created_at: new Date().toISOString(),
    },
    {
        id: "cat-wash",
        name: "Cuci & Keramas",
        description: "Layanan cuci rambut relaksasi dengan shampo berkualitas dan pijat kepala yang menyegarkan",
        icon: "wash",
        color: "#3B82F6",
        active: true,
        services_count: 0,
        created_at: new Date().toISOString(),
    },
    {
        id: "cat-consultation",
        name: "Konsultasi & Grooming",
        description: "Konsultasi penampilan personal dan layanan grooming menyeluruh untuk tampilan maksimal",
        icon: "consultation",
        color: "#EF4444",
        active: true,
        services_count: 0,
        created_at: new Date().toISOString(),
    },
    {
        id: "cat-package",
        name: "Paket Lengkap",
        description: "Paket bundling hemat yang menggabungkan berbagai layanan barbershop untuk nilai terbaik",
        icon: "package",
        color: "#6366F1",
        active: true,
        services_count: 0,
        created_at: new Date().toISOString(),
    },
];

function loadServicesFromStorage() {
    try {
        const stored = localStorage.getItem(SERVICES_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load services from localStorage:', error);
    }
    return [];
}

function saveServicesToStorage(data) {
    try {
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save services to localStorage:', error);
    }
}

// Mock services data
const getFallbackServices = () => [
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

export default function Services() {
    const { token, activeTenant } = useAuth();
    const [searchParams] = useSearchParams();
    const currency = useCurrency("IDR");

    // State management
    const [q, setQ] = useState("");
    const [list, setList] = useState({ data: [], meta: {} });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [businessType, setBusinessType] = useState(activeTenant?.business_type || "barbershop");
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [viewMode, setViewMode] = useState("grid");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterPopularity, setFilterPopularity] = useState("all");
    const [sortBy, setSortBy] = useState("name");

    // Form states
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [formattedPrice, setFormattedPrice] = useState("");
    const [unit, setUnit] = useState("layanan");
    const [description, setDescription] = useState("");
    const [estimatedDuration, setEstimatedDuration] = useState("");
    const [requirements, setRequirements] = useState("");
    const [popularity, setPopularity] = useState("standard");
    const [editing, setEditing] = useState(null);

    // New states for barber pricing
    const [barbers, setBarbers] = useState([]);
    const [barbersLoading, setBarbersLoading] = useState(false);
    const [barbersLoaded, setBarbersLoaded] = useState(false);
    const [pricingMode, setPricingMode] = useState("fixed"); // fixed, barber, combined
    const [selectedBarberId, setSelectedBarberId] = useState("");
    const [barberRate, setBarberRate] = useState(0);
    const [treatmentFee, setTreatmentFee] = useState(0);
    const [formattedTreatmentFee, setFormattedTreatmentFee] = useState("");

    // Calculate final price based on pricing mode
    const calculateFinalPrice = () => {
        switch (pricingMode) {
            case "fixed":
                return parseFloat(basePrice) || 0;
            case "barber":
                return barberRate;
            case "combined":
                return barberRate + treatmentFee;
            default:
                return parseFloat(basePrice) || 0;
        }
    };

    // Handle barber selection
    const handleBarberChange = (barberId) => {
        setSelectedBarberId(barberId);
        const selectedBarber = barbers.find(b => b.id == barberId); // Use == untuk compare integer dan string
        console.log('Selected barber:', selectedBarber, 'from barbers:', barbers, 'barberId:', barberId);
        if (selectedBarber) {
            const rate = parseFloat(selectedBarber.hourly_rate) || 0;
            console.log('Setting barber rate:', rate, 'from hourly_rate:', selectedBarber.hourly_rate);
            setBarberRate(rate);
        } else {
            console.log('No barber found, setting rate to 0');
            setBarberRate(0);
        }
    };

    const businessConfig = getBusinessConfig(businessType);
    const ServiceIcon = businessConfig.icon;

    // Check for category parameter from URL
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        const categoryName = searchParams.get('name');

        if (categoryParam) {
            setCategoryId(categoryParam);
            setFilterCategory(categoryParam);
            if (categoryName) {
                // Show notification or highlight that we're filtering by this category
                // Filtering by category: ${categoryName}
            }
        }
    }, [searchParams]);

    // Load data functions - memoized to prevent unnecessary re-creations
    const loadBarbers = useCallback(async (force = false) => {
        // Prevent redundant loading unless forced
        if ((barbersLoaded || barbersLoading) && !force) {
            return;
        }

        setBarbersLoading(true);

        try {
            // Load from API database first
            const result = await apiGet('/setup/barbers', token);
            const activeBarbers = result.data ? result.data.filter(barber => barber.active) : [];
            setBarbers(activeBarbers);
            setBarbersLoaded(true);
            console.log('Loaded barbers from API:', activeBarbers);
        } catch (error) {
            console.warn("Failed to load barbers from API:", error);
            // Fallback to localStorage if API fails
            try {
                const storedBarbers = loadBarbersFromStorage();
                const activeBarbers = storedBarbers.filter(barber => barber.active);
                setBarbers(activeBarbers);
                setBarbersLoaded(true);
                console.log('Loaded barbers from localStorage:', activeBarbers);
            } catch (fallbackError) {
                console.warn("Failed to load barbers from storage:", fallbackError);
                setBarbers([]);
            }
        } finally {
            setBarbersLoading(false);
        }
    }, [barbersLoaded, barbersLoading, token]);

    // Update barber rate when selectedBarberId changes
    useEffect(() => {
        if (selectedBarberId && barbers.length > 0) {
            const selectedBarber = barbers.find(b => b.id == selectedBarberId);
            if (selectedBarber) {
                const rate = parseFloat(selectedBarber.hourly_rate) || 0;
                console.log('Auto-updating barber rate:', rate, 'for barber:', selectedBarber.name);
                setBarberRate(rate);
            }
        }
    }, [selectedBarberId, barbers]);

    async function loadCategories() {
        setIsLoading(true);

        try {
            const cats = await apiGet("/setup/service-categories?per_page=100", token);
            setCategories(cats.data || []);
        } catch (error) {
            console.error("Failed to load categories from API:", error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }

    async function load(page = 1) {
        setLoading(true);

        const p = new URLSearchParams();
        if (q) p.set("q", q);
        p.set("per_page", 50);
        p.set("page", page);

        try {
            const result = await apiGet(`/setup/services?${p.toString()}`, token);
            setList(result);
        } catch (error) {
            console.error("Failed to load services from API:", error);
            setList({ data: [], meta: {} });
        } finally {
            setLoading(false);
        }
    }

    // Form validation
    function validateForm() {
        const errors = {};

        if (!name.trim()) {
            errors.name = `Nama ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} wajib diisi`;
        } else if (name.trim().length < 3) {
            errors.name = `Nama ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} minimal 3 karakter`;
        }

        if (!code.trim()) {
            errors.code = `Kode ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} wajib diisi`;
        } else if (code.trim().length < 3) {
            errors.code = `Kode ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} minimal 3 karakter`;
        }

        if (!categoryId) {
            errors.categoryId = `Kategori ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} wajib dipilih`;
        }

        // Validate pricing based on mode
        if (pricingMode === "fixed") {
            if (!basePrice || parseFloat(basePrice) <= 0) {
                errors.basePrice = "Harga harus diisi dengan nilai yang valid";
            }
        } else if (businessType !== 'restaurant' && (pricingMode === getStaffPricingMode(businessType) || pricingMode === "combined")) {
            if (!selectedBarberId) {
                errors.barberSelect = `${getBusinessConfig(businessType).staffLabel || "Staff"} wajib dipilih untuk mode tarif ini`;
            }
        }

        if (estimatedDuration && (parseInt(estimatedDuration) < 5 || parseInt(estimatedDuration) > 480)) {
            errors.estimatedDuration = "Durasi harus antara 5-480 menit";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    // Save function
    async function save() {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        const finalPrice = calculateFinalPrice();

        const newService = {
            id: editing || `srv-${Date.now()}`,
            name: name.trim(),
            code: code.trim(),
            service_category_id: categoryId,
            base_price: finalPrice, // Use calculated price
            unit,
            description: description.trim(),
            estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
            requirements: requirements.trim(),
            popularity,
            active: true,
            created_at: editing ? undefined : new Date().toISOString(),
            booking_count: 0,
            rating: 5.0,
            // New pricing fields
            pricing_mode: pricingMode,
            barber_id: selectedBarberId || null,
            barber_rate: barberRate,
            treatment_fee: treatmentFee,
            original_price: pricingMode === "fixed" ? parseFloat(basePrice) || 0 : null,
        };

        // API save logic
        try {
            const finalPrice = calculateFinalPrice();

            const payload = {
                name: name.trim(),
                code: code.trim(),
                service_category_id: parseInt(categoryId),
                base_price: finalPrice,
                unit,
                description: description.trim() || null,
                estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
                requirements: requirements.trim() || null,
                active: true,
                // New pricing fields
                pricing_mode: pricingMode,
                barber_id: selectedBarberId || null,
                barber_rate: barberRate,
                treatment_fee: treatmentFee,
                original_price: pricingMode === "fixed" ? parseFloat(basePrice) || 0 : null,
            };

            let result;
            if (editing) {
                result = await apiPut(`/setup/services/${editing}`, payload, token);
            } else {
                result = await apiPost(`/setup/services`, payload, token);
            }

            resetForm();
            load();
        } catch (err) {
            console.error("Error saving service:", err);
            const errorMessage = err.message || `Gagal menyimpan ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}`;
            setFormErrors({ submit: errorMessage });
            // Don't auto-reset form on error, let user see the error and try again
        } finally {
            setIsLoading(false);
        }
    }

    // Delete function
    async function del(id) {
        if (!confirm(`Hapus ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} ini? Tindakan tidak dapat dibatalkan.`)) return;

        setIsLoading(true);

        try {
            await apiDelete(`/setup/services/${id}`, token);
            load();
        } catch (err) {
            console.error("Error deleting service:", err);
            alert(err.message || `Gagal menghapus ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}`);
        } finally {
            setIsLoading(false);
        }
    }

    // Delete all function
    async function deleteAll() {
        if (!confirm(`Hapus SEMUA ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}? Tindakan ini tidak dapat dibatalkan!`)) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus SEMUA ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}? Data akan hilang permanen!`)) return;

        setIsLoading(true);

        try {
            const result = await apiDelete(`/setup/services`, token);
            alert(result.message || `Berhasil menghapus semua ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}`);
            load();
        } catch (err) {
            console.error("Error deleting all services:", err);
            alert(err.message || `Gagal menghapus semua ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}`);
        } finally {
            setIsLoading(false);
        }
    }

    // Handle price formatting
    const handlePriceChange = (e) => {
        const value = e.target.value;
        const numericValue = parseRupiah(value);
        setBasePrice(numericValue.toString());
        setFormattedPrice(numericValue > 0 ? formatRupiah(numericValue) : "");
    };

    // Handle treatment fee formatting
    const handleTreatmentFeeChange = (e) => {
        const value = e.target.value;
        const numericValue = parseRupiah(value);
        setTreatmentFee(numericValue);
        setFormattedTreatmentFee(numericValue > 0 ? formatRupiah(numericValue) : "");
    };

    function editService(service) {
        setEditing(service.id);
        setName(service.name);
        setCode(service.code);
        setCategoryId(service.service_category_id);
        setBasePrice(service.original_price ? service.original_price.toString() : service.base_price.toString());
        setFormattedPrice(formatRupiah(service.original_price || service.base_price));
        setUnit(service.unit);
        setDescription(service.description || "");
        setEstimatedDuration(service.estimated_duration ? service.estimated_duration.toString() : "");
        setRequirements(service.requirements || "");
        setPopularity(service.popularity || "standard");

        // Load pricing data
        setPricingMode(service.pricing_mode || "fixed");
        setSelectedBarberId(service.barber_id || "");
        setBarberRate(parseFloat(service.barber_rate) || 0);
        const feeAmount = parseFloat(service.treatment_fee) || 0;
        setTreatmentFee(feeAmount);
        setFormattedTreatmentFee(feeAmount > 0 ? formatRupiah(feeAmount) : "");

        // Only load barbers if not already loaded
        if (!barbersLoaded && !barbersLoading) {
            loadBarbers();
        }
        setShowForm(true);
        setFormErrors({});
    }

    function resetForm() {
        setEditing(null);
        setName("");
        setCode("");
        setCategoryId(searchParams.get('category') || "");
        setBasePrice("");
        setFormattedPrice("");
        setUnit(businessConfig.defaultUnit);
        setDescription("");
        setEstimatedDuration("");
        setRequirements("");
        setPopularity("standard");
        // Reset pricing states
        setPricingMode("fixed");
        setSelectedBarberId("");
        setBarberRate(0);
        setTreatmentFee(0);
        setFormattedTreatmentFee("");
        setShowForm(false);
        setFormErrors({});
    }

    function showCreateForm() {
        resetForm();
        // Only load barbers if not already loaded
        if (!barbersLoaded && !barbersLoading) {
            loadBarbers();
        }
        setShowForm(true);
    }

    // Filtering and sorting
    const filteredAndSortedServices = useMemo(() => {
        let services = list.data || [];

        // Apply category filter
        if (filterCategory !== "all") {
            services = services.filter(service => service.service_category_id === filterCategory);
        }

        // Apply popularity filter
        if (filterPopularity !== "all") {
            services = services.filter(service => service.popularity === filterPopularity);
        }

        // Apply search filter
        if (q) {
            services = services.filter(service =>
                service.name.toLowerCase().includes(q.toLowerCase()) ||
                service.code.toLowerCase().includes(q.toLowerCase()) ||
                (service.description && service.description.toLowerCase().includes(q.toLowerCase()))
            );
        }

        // Apply sorting
        services.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "price":
                    return b.base_price - a.base_price;
                case "popularity":
                    return (b.booking_count || 0) - (a.booking_count || 0);
                case "rating":
                    return (b.rating || 0) - (a.rating || 0);
                case "duration":
                    return (b.estimated_duration || 0) - (a.estimated_duration || 0);
                default:
                    return 0;
            }
        });

        return services;
    }, [list.data, filterCategory, filterPopularity, q, sortBy]);

    // Load data on mount and when page becomes visible
    useEffect(() => {
        loadCategories();
        // Load barbers immediately for barbershop business type
        if (businessType === "barbershop") {
            loadBarbers();
        }
        load();

        // Listen for storage changes to sync with ServiceCategories page
        const handleStorageChange = (e) => {
            if (e.key === CATEGORIES_STORAGE_KEY) {
                // Reload categories when they change in another tab/page
                loadCategories();
            }
        };

        // Also listen for custom events from same page
        const handleCategoryUpdate = () => {
            loadCategories();
        };

        // Reload categories when page becomes visible (user switches tabs)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadCategories();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('categoriesUpdated', handleCategoryUpdate);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('categoriesUpdated', handleCategoryUpdate);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Update defaults when business type changes
    useEffect(() => {
        if (!editing) {
            setUnit(businessConfig.defaultUnit);
        }
    }, [businessType, editing]);

    // Handle body scroll lock when modal is open
    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (showForm) {
            // Lock main container scroll when modal opens
            if (mainElement) {
                mainElement.style.setProperty('overflow', 'hidden', 'important');
                mainElement.style.setProperty('padding-right', '0', 'important');
            }
        } else {
            // Restore main container scroll when modal closes
            if (mainElement) {
                mainElement.style.removeProperty('overflow');
                mainElement.style.removeProperty('padding-right');
            }
        }

        // Cleanup on unmount
        return () => {
            if (mainElement) {
                mainElement.style.removeProperty('overflow');
                mainElement.style.removeProperty('padding-right');
            }
        };
    }, [showForm]);

    const isBarbershop = businessType === "barbershop";
    const serviceDataset = filteredAndSortedServices;
    const allServices = list.data || [];
    const activeCount = allServices.filter(s => s.active).length;
    const totalRevenue = allServices.reduce((sum, s) => sum + (s.base_price || 0), 0);
    const avgRating = allServices.length > 0
        ? allServices.reduce((sum, s) => sum + (s.rating || 0), 0) / allServices.length
        : 0;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {/* Modern Header with Glass Effect */}
                <div className="relative">
                    {/* Background Gradient - Neutral */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-100 to-gray-100 rounded-2xl border border-gray-200/60" />

                    {/* Subtle Card */}
                    <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            {/* Title Section */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                            {(() => {
                                                const IconComponent = getBusinessConfig(businessType).icon
                                                return <IconComponent className="h-4 w-4 text-slate-600" />
                                            })()}
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl lg:text-3xl">{getBusinessConfig(businessType).title}</h1>
                                            <p className="text-slate-600 text-sm">{getBusinessConfig(businessType).subtitle}</p>
                                            {searchParams.get('category') && (
                                                <div className="mt-1 inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200">
                                                    <Tag className="mr-1 h-3 w-3" />
                                                    Filter: {searchParams.get('name') || 'Category'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Improved Stats Cards - Horizontal Layout */}
                                <div className="grid grid-cols-5 gap-3 md:gap-4">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="p-0.5 bg-slate-100 rounded">
                                                <Package className="h-3 w-3 text-slate-600" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">Layanan</span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-800">{allServices.length}</div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="p-0.5 bg-green-100 rounded">
                                                <Check className="h-3 w-3 text-green-600" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">Aktif</span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-800">{activeCount}</div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="p-0.5 bg-amber-100 rounded">
                                                <TrendingUp className="h-3 w-3 text-amber-600" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">Pendapatan</span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-800">{formatMoney(totalRevenue / 1000)}K</div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="p-0.5 bg-amber-100 rounded">
                                                <Star className="h-3 w-3 text-amber-600" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">Penilaian</span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-800">{avgRating.toFixed(1)}</div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="p-0.5 bg-blue-100 rounded">
                                                <Timer className="h-3 w-3 text-blue-600" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">Rata-rata</span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-800">{Math.round(allServices.reduce((sum, s) => sum + (s.estimated_duration || 0), 0) / allServices.length || 0)}m</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Clean Layout */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                {/* Primary Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={showCreateForm}
                                        size="sm"
                                        className="bg-slate-800 text-white hover:bg-slate-700 font-medium"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah {getBusinessConfig(businessType).serviceLabel}
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-50"
                                    >
                                        <Link to="/service-categories">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Kategori
                                        </Link>
                                    </Button>
                                </div>

                                {/* Secondary Actions */}
                                <div className="flex gap-2 border-l border-gray-200 pl-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-50"
                                        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                                    >
                                        {viewMode === "grid" ? (
                                            <>
                                                <List className="mr-2 h-4 w-4" />
                                                List
                                            </>
                                        ) : (
                                            <>
                                                <Grid className="mr-2 h-4 w-4" />
                                                Grid
                                            </>
                                        )}
                                    </Button>

                                    {/* Danger Zone - Hapus Semua */}
                                    {allServices.length > 0 && (
                                        <Button
                                            onClick={deleteAll}
                                            variant="outline"
                                            size="sm"
                                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 font-medium transition-colors"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-2 h-4 w-4" />
                                            )}
                                            Hapus Semua
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Search and Filters */}
                <div className="mt-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Modern Search */}
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={getBusinessConfig(businessType).searchPlaceholder}
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all duration-200"
                                />
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                        viewMode === "grid"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <Grid className="h-4 w-4 mr-1" />
                                    Kotak
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                        viewMode === "list"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <List className="h-4 w-4 mr-1" />
                                    Daftar
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        <div className="mt-4 border-t pt-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium">Kategori</Label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="all">Semua Kategori</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Popularitas</Label>
                                    <select
                                        value={filterPopularity}
                                        onChange={(e) => setFilterPopularity(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="all">Semua Level</option>
                                        {businessConfig.popularityLevels?.map((level) => (
                                            <option key={level.value} value={level.value}>
                                                {level.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Urutkan</Label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="name">Nama A-Z</option>
                                        <option value="price">Harga Tertinggi</option>
                                        <option value="popularity">Paling Populer</option>
                                        <option value="rating">Nilai Tertinggi</option>
                                        <option value="duration">Durasi Terlama</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFilterCategory("all");
                                            setFilterPopularity("all");
                                            setSortBy("name");
                                            setQ("");
                                        }}
                                        className="w-full"
                                    >
                                        Reset Filter
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Treatment Form Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="pb-4">
                            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                                {editing ? (
                                    <>
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Edit className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <span>Edit {getBusinessConfig(businessType).serviceLabel}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Plus className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <span>Tambah {getBusinessConfig(businessType).serviceLabel} Baru</span>
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 mt-2">
                                {editing
                                    ? (businessType === 'restaurant' ?
                                        "Perbarui informasi menu dengan detail yang akurat untuk pengalaman kuliner terbaik" :
                                        `Perbarui informasi ${getBusinessConfig(businessType).serviceLabel?.toLowerCase() || "layanan"} dengan detail yang akurat`)
                                    : (businessType === 'restaurant' ?
                                        "Tambahkan menu baru untuk melengkapi koleksi kuliner restaurant Anda" :
                                        `Tambahkan ${getBusinessConfig(businessType).serviceLabel?.toLowerCase() || "layanan"} baru untuk melengkapi bisnis Anda`)
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 space-y-6">
                            {formErrors.submit && (
                                <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">{formErrors.submit}</span>
                                </div>
                            )}

                            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="serviceName">
                                        Nama {getBusinessConfig(businessType).serviceLabel} *
                                    </Label>
                                    <Input
                                        id="serviceName"
                                        placeholder={businessConfig.namePlaceholder}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`${formErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    {formErrors.name && (
                                        <p className="text-sm text-red-600">{formErrors.name}</p>
                                    )}
                                </div>

                                {/* Code Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="serviceCode">
                                        Kode {getBusinessConfig(businessType).serviceLabel} *
                                    </Label>
                                    <Input
                                        id="serviceCode"
                                        placeholder={businessConfig.codePlaceholder}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className={`${formErrors.code ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    {formErrors.code && (
                                        <p className="text-sm text-red-600">{formErrors.code}</p>
                                    )}
                                </div>

                                {/* Category Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="serviceCategory">
                                        Kategori {getBusinessConfig(businessType).serviceLabel} *
                                    </Label>
                                    <select
                                        id="serviceCategory"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className={`w-full rounded-md border px-3 py-2 ${
                                            formErrors.categoryId ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
                                        }`}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.categoryId && (
                                        <p className="text-sm text-red-600">{formErrors.categoryId}</p>
                                    )}
                                </div>

                                {/* Pricing Mode Selection - Full Width */}
                                <div className="lg:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold text-slate-900">
                                            {businessType === 'restaurant' ? 'Tipe Harga Menu *' : `Mode Tarif ${getBusinessConfig(businessType).serviceLabel} *`}
                                        </Label>
                                        {/* Current Mode Indicator */}
                                        {pricingMode && (
                                            <div className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                                                <Tag className="mr-1 h-3 w-3" />
                                                Mode: {pricingMode === "fixed" ? "Harga Tetap" : pricingMode === "barber" ? "Tarif Barber" : "Kombinasi"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                            pricingMode === "fixed" ? "border-slate-400 bg-slate-100 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                                        }`}>
                                            <input
                                                type="radio"
                                                value="fixed"
                                                checked={pricingMode === "fixed"}
                                                onChange={(e) => setPricingMode(e.target.value)}
                                                className="sr-only"
                                            />
                                            <div className="flex items-start gap-3 w-full">
                                                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                                                    pricingMode === "fixed" ? "border-slate-600 bg-slate-600" : "border-slate-300"
                                                }`}>
                                                    {pricingMode === "fixed" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-slate-900 mb-1">{businessType === 'restaurant' ? '🍽️ Harga Menu Standar' : 'Harga Tetap'}</div>
                                                    <div className="text-sm text-slate-500 leading-relaxed">{businessType === 'restaurant' ? 'Harga tetap per porsi regular' : `Tarif fixed per ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}`}</div>
                                                </div>
                                            </div>
                                        </label>

                                        {businessType !== 'restaurant' && (
                                            <>
                                                <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                    pricingMode === getStaffPricingMode(businessType) ? "border-slate-400 bg-slate-100 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        value={getStaffPricingMode(businessType)}
                                                        checked={pricingMode === getStaffPricingMode(businessType)}
                                                        onChange={(e) => setPricingMode(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-start gap-3 w-full">
                                                        <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                                                            pricingMode === getStaffPricingMode(businessType) ? "border-slate-600 bg-slate-600" : "border-slate-300"
                                                        }`}>
                                                            {pricingMode === getStaffPricingMode(businessType) && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-slate-900 mb-1">{getBusinessConfig(businessType).pricingModes?.barber?.label || "Tarif Staff"}</div>
                                                            <div className="text-sm text-slate-500 leading-relaxed">{getBusinessConfig(businessType).pricingModes?.barber?.description || "Sesuai tarif staff"}</div>
                                                        </div>
                                                    </div>
                                                </label>

                                                <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                    pricingMode === "combined" ? "border-slate-400 bg-slate-100 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        value="combined"
                                                        checked={pricingMode === "combined"}
                                                        onChange={(e) => setPricingMode(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-start gap-3 w-full">
                                                        <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                                                            pricingMode === "combined" ? "border-slate-600 bg-slate-600" : "border-slate-300"
                                                        }`}>
                                                            {pricingMode === "combined" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-slate-900 mb-1">{getBusinessConfig(businessType).pricingModes?.combined?.label || "Kombinasi"}</div>
                                                            <div className="text-sm text-slate-500 leading-relaxed">{getBusinessConfig(businessType).pricingModes?.combined?.description || "Staff + biaya tambahan"}</div>
                                                        </div>
                                                    </div>
                                                </label>
                                            </>
                                        )}

                                        {businessType === 'restaurant' && (
                                            <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                pricingMode === "variant" ? "border-orange-400 bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                                            }`}>
                                                <input
                                                    type="radio"
                                                    value="variant"
                                                    checked={pricingMode === "variant"}
                                                    onChange={(e) => setPricingMode(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-start gap-3 w-full">
                                                    <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                                                        pricingMode === "variant" ? "border-orange-600 bg-orange-600" : "border-slate-300"
                                                    }`}>
                                                        {pricingMode === "variant" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-slate-900 mb-1">📏 Harga Bervariasi</div>
                                                        <div className="text-sm text-slate-500 leading-relaxed">Berdasarkan ukuran porsi (Kecil, Regular, Besar)</div>
                                                    </div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic Pricing Fields - Full Width */}
                                {pricingMode === "fixed" && (
                                    <div className="lg:col-span-2 space-y-2">
                                        <Label htmlFor="servicePrice">
                                            Harga {getBusinessConfig(businessType).serviceLabel} *
                                        </Label>
                                        <div className="relative max-w-md">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                                                Rp
                                            </div>
                                            <Input
                                                id="servicePrice"
                                                type="text"
                                                placeholder="85.000"
                                                value={formattedPrice}
                                                onChange={handlePriceChange}
                                                className={`pl-9 ${formErrors.basePrice ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                                            />
                                        </div>
                                        {formErrors.basePrice && (
                                            <p className="text-sm text-red-600">{formErrors.basePrice}</p>
                                        )}
                                    </div>
                                )}

                                {businessType !== 'restaurant' && (pricingMode === getStaffPricingMode(businessType) || pricingMode === "combined") && (
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="barberSelect">
                                                    {getBusinessConfig(businessType).staffSelectLabel || "Pilih Staff"} *
                                                </Label>
                                                {/* Selected Barber Info */}
                                                {selectedBarberId && (
                                                    <div className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-md border border-green-200">
                                                        <UserCheck className="mr-1 h-3 w-3" />
                                                        {barbers.find(b => b.id == selectedBarberId)?.name || `${getBusinessConfig(businessType).staffLabel || "Staff"} Terpilih`}
                                                    </div>
                                                )}
                                            </div>

                                            <select
                                                id="barberSelect"
                                                value={selectedBarberId}
                                                onChange={(e) => handleBarberChange(e.target.value)}
                                                className={`w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                                                    formErrors.barberSelect ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
                                                }`}
                                            >
                                                <option value="">
                                                    {barbers.length > 0 ? getBusinessConfig(businessType).staffSelectLabel || "Pilih Staff" : `Tidak ada ${getBusinessConfig(businessType).staffLabel?.toLowerCase() || "staff"} tersedia`}
                                                </option>
                                                {barbers.length > 0 ? (
                                                    barbers.map((barber) => (
                                                        <option key={barber.id} value={barber.id}>
                                                            {barber.name} - {formatRupiah(barber.hourly_rate)}/layanan
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled value="">Tidak ada barber aktif tersedia</option>
                                                )}
                                            </select>

                                            {/* Barber Rate Display */}
                                            {selectedBarberId && barberRate > 0 && (
                                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="text-sm text-blue-700">
                                                        <span className="font-medium">{getBusinessConfig(businessType).staffRateLabel || "Tarif Staff"}: </span>
                                                        <span className="font-semibold">{formatRupiah(barberRate)}</span> per layanan
                                                    </div>
                                                </div>
                                            )}

                                            {barbers.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    ⚠️ Pastikan sudah ada barber aktif di halaman Kelola Barber
                                                </p>
                                            )}
                                            {formErrors.barberSelect && (
                                                <p className="text-sm text-red-600">{formErrors.barberSelect}</p>
                                            )}
                                        </div>

                                        {pricingMode === "combined" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="treatmentFee">
                                                    {getBusinessConfig(businessType).additionalFeeLabel || "Biaya Tambahan"}
                                                </Label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                                                        Rp
                                                    </div>
                                                    <Input
                                                        id="treatmentFee"
                                                        type="text"
                                                        placeholder="25.000"
                                                        value={formattedTreatmentFee}
                                                        onChange={handleTreatmentFeeChange}
                                                        className="pl-9"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {getBusinessConfig(businessType).additionalFeeDescription || "Biaya tambahan khusus"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Restaurant Size Variants - Only for variant pricing */}
                                {businessType === 'restaurant' && pricingMode === "variant" && (
                                    <div className="lg:col-span-2 space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <Label className="text-base font-semibold text-orange-900">
                                            Varian Ukuran Porsi
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {getBusinessConfig(businessType).sizeOptions?.map((size) => (
                                                <div key={size.value} className="p-3 bg-white rounded-lg border border-orange-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-gray-900">{size.label}</span>
                                                        <span className="text-sm text-gray-500">x{size.multiplier}</span>
                                                    </div>
                                                    <div className="text-lg font-semibold text-orange-600">
                                                        {formatRupiah(Math.round((parseFloat(basePrice) || 0) * size.multiplier))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                                            💡 Harga otomatis dihitung berdasarkan harga dasar yang Anda masukkan
                                        </div>
                                    </div>
                                )}

                                {/* Restaurant Additional Options */}
                                {businessType === 'restaurant' && (
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Spicy Level */}
                                            <div className="space-y-2">
                                                <Label htmlFor="spicyLevel">
                                                    Level Pedas (opsional)
                                                </Label>
                                                <select
                                                    id="spicyLevel"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                                                >
                                                    <option value="">Pilih Level Pedas</option>
                                                    {getBusinessConfig(businessType).spicyLevels?.map((level) => (
                                                        <option key={level.value} value={level.value}>
                                                            {level.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Allergen Info */}
                                            <div className="space-y-2">
                                                <Label htmlFor="allergens">
                                                    Informasi Alergen (opsional)
                                                </Label>
                                                <Input
                                                    id="allergens"
                                                    type="text"
                                                    placeholder="Contoh: Mengandung gluten, kacang, seafood"
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Price Summary with Mode Clarification - Full Width */}
                                <div className="lg:col-span-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                                    {/* Header with mode info */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="font-medium text-gray-700">Ringkasan Harga</span>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                            {businessType === 'restaurant' ?
                                                (pricingMode === "fixed" ? "Mode: Harga Menu Standar" :
                                                 pricingMode === "variant" ? "Mode: Harga Bervariasi" :
                                                 "Mode: Harga Musiman") :
                                                (pricingMode === "fixed" ? `Mode: ${getBusinessConfig(businessType).pricingModes?.fixed?.label || "Harga Tetap"}` :
                                                 pricingMode === getStaffPricingMode(businessType) ? `Mode: ${getBusinessConfig(businessType).pricingModes?.barber?.label || "Tarif Staff"}` :
                                                 `Mode: ${getBusinessConfig(businessType).pricingModes?.combined?.label || "Kombinasi"}`)
                                            }
                                        </div>
                                    </div>

                                    {/* Price breakdown */}
                                    {pricingMode === "fixed" && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Harga per {getBusinessConfig(businessType).serviceLabel?.toLowerCase() || "layanan"}:</span>
                                                <span className="font-medium">{formatRupiah(parseFloat(basePrice) || 0)}</span>
                                            </div>
                                            <hr className="border-blue-200" />
                                        </div>
                                    )}

                                    {pricingMode === getStaffPricingMode(businessType) && selectedBarberId && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Barber: {barbers.find(b => b.id == selectedBarberId)?.name}</span>
                                                <span className="font-medium">{formatRupiah(barberRate)}</span>
                                            </div>
                                            <hr className="border-blue-200" />
                                        </div>
                                    )}

                                    {pricingMode === "combined" && (
                                        <div className="space-y-2">
                                            {selectedBarberId && (
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>Barber: {barbers.find(b => b.id == selectedBarberId)?.name}</span>
                                                    <span className="font-medium">{formatRupiah(barberRate)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Biaya Treatment:</span>
                                                <span className="font-medium">{formatRupiah(treatmentFee)}</span>
                                            </div>
                                            <hr className="border-blue-200" />
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-lg font-semibold text-gray-800">Total Harga:</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatRupiah(calculateFinalPrice())}
                                        </span>
                                    </div>

                                    {/* Additional info */}
                                    {businessType !== 'restaurant' && (pricingMode === getStaffPricingMode(businessType) || pricingMode === "combined") && !selectedBarberId && (
                                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                            <p className="text-xs text-yellow-700">💡 Pilih {getBusinessConfig(businessType).staffLabel?.toLowerCase() || "staff"} untuk melihat total harga</p>
                                        </div>
                                    )}
                                </div>

                                {/* Unit and Duration Fields Row */}
                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Unit Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="serviceUnit">
                                            Satuan
                                        </Label>
                                        <select
                                            id="serviceUnit"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        >
                                            {businessConfig.unitOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Duration Field */}
                                    <div className="space-y-2">
                                    <Label htmlFor="serviceDuration">
                                        Estimasi Durasi (menit)
                                    </Label>
                                    <div className="relative">
                                        <style>{`
                                            .service-duration-select option {
                                                padding: 8px 12px;
                                                font-size: 14px;
                                            }
                                            .service-duration-select {
                                                appearance: none;
                                                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                                                background-position: right 8px center;
                                                background-repeat: no-repeat;
                                                background-size: 16px 16px;
                                                padding-right: 40px;
                                                cursor: pointer;
                                            }

                                            .service-duration-select {
                                                transition: all 0.2s ease;
                                            }

                                            .service-duration-select:hover {
                                                background-color: #f8fafc;
                                                border-color: #3b82f6;
                                                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                                transform: translateY(-1px);
                                            }

                                            .service-duration-select:not([size]) {
                                                height: 40px !important;
                                                overflow: hidden !important;
                                            }

                                            .service-duration-select[size] {
                                                height: 180px !important;
                                                max-height: 180px !important;
                                                overflow-y: auto !important;
                                                border-radius: 8px !important;
                                                appearance: listbox !important;
                                                background-image: none !important;
                                                padding: 4px !important;
                                                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                                                border: 2px solid #3b82f6;
                                            }

                                            .service-duration-select option {
                                                padding: 8px 12px;
                                                font-size: 14px;
                                                border: none;
                                                background: white;
                                                transition: all 0.15s ease;
                                                cursor: pointer;
                                            }

                                            .service-duration-select option:hover {
                                                background-color: #dbeafe;
                                                color: #1d4ed8;
                                                font-weight: 500;
                                            }

                                            .service-duration-select option:checked {
                                                background-color: #3b82f6;
                                                color: white;
                                                font-weight: 600;
                                            }
                                        `}</style>
                                        <select
                                            id="serviceDuration"
                                            value={estimatedDuration}
                                            onChange={(e) => {
                                                setEstimatedDuration(e.target.value);
                                                e.target.blur();
                                            }}
                                            onClick={(e) => {
                                                if (!e.target.hasAttribute('size')) {
                                                    e.target.setAttribute('size', '6');
                                                }
                                            }}
                                            onFocus={(e) => {
                                                if (!e.target.hasAttribute('size')) {
                                                    e.target.setAttribute('size', '6');
                                                }
                                            }}
                                            onBlur={(e) => {
                                                e.target.removeAttribute('size');
                                            }}
                                            className={`service-duration-select w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                                                formErrors.estimatedDuration ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-gray-400 focus:ring-gray-300"
                                            }`}
                                        >
                                            <option value="">Pilih Durasi</option>
                                            {businessConfig.durationOptions?.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {formErrors.estimatedDuration && (
                                        <p className="text-sm text-red-600">{formErrors.estimatedDuration}</p>
                                    )}
                                </div>

                                </div>

                                {/* Popularity Level */}
                                {isBarbershop && (
                                    <div className="space-y-2">
                                        <Label htmlFor="servicePopularity">
                                            Level Popularitas
                                        </Label>
                                        <select
                                            id="servicePopularity"
                                            value={popularity}
                                            onChange={(e) => setPopularity(e.target.value)}
                                            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
                                        >
                                            {businessConfig.popularityLevels?.map((level) => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Description Field */}
                                <div className="space-y-2 lg:col-span-2">
                                    <Label htmlFor="serviceDescription">
                                        Deskripsi {getBusinessConfig(businessType).serviceLabel}
                                        <span className="text-sm text-gray-500 ml-1">(opsional)</span>
                                    </Label>
                                    <Textarea
                                        id="serviceDescription"
                                        placeholder={businessType === 'restaurant' ? 'Jelaskan detail menu, bahan utama, dan cita rasa...' : 'Jelaskan detail treatment, teknik yang digunakan, dan manfaatnya...'}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                {/* Requirements Field */}
                                <div className="space-y-2 lg:col-span-2">
                                    <Label htmlFor="serviceRequirements">
                                        {businessType === 'restaurant' ? 'Catatan Menu' : 'Persyaratan Treatment'}
                                        <span className="text-sm text-gray-500 ml-1">(opsional)</span>
                                    </Label>
                                    <Textarea
                                        id="serviceRequirements"
                                        placeholder="Contoh: Cuci rambut terlebih dahulu, minimal panjang rambut 3cm..."
                                        value={requirements}
                                        onChange={(e) => setRequirements(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </div>

                        </div>

                        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">
                                <Button
                                    onClick={resetForm}
                                    variant="outline"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Batal
                                </Button>
                                <Button
                                    onClick={save}
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {editing ? `Update ${getBusinessConfig(businessType).serviceLabel}` : `Tambah ${getBusinessConfig(businessType).serviceLabel}`}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Enhanced Content Area */}
                <div className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-600" />
                                <p className="mt-2 text-gray-600">Memuat {getBusinessConfig(businessType).serviceLabel.toLowerCase()}...</p>
                            </div>
                        </div>
                    ) : serviceDataset.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-300">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="rounded-full bg-gray-100 p-6 mb-6">
                                    <Sparkles className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {q || filterCategory !== "all" || filterPopularity !== "all"
                                        ? `Tidak ada ${getBusinessConfig(businessType).serviceLabel.toLowerCase()} yang ditemukan`
                                        : `Belum ada ${getBusinessConfig(businessType).serviceLabel.toLowerCase()}`
                                    }
                                </h3>
                                <p className="text-gray-500 max-w-sm mb-6">
                                    {q || filterCategory !== "all" || filterPopularity !== "all"
                                        ? "Coba ubah filter atau kata kunci pencarian"
                                        : businessConfig.emptyDescription
                                    }
                                </p>
                                {(!q && filterCategory === "all" && filterPopularity === "all") && (
                                    <Button
                                        onClick={showCreateForm}
                                        size="lg"
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah {getBusinessConfig(businessType).serviceLabel} Pertama
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className={`grid gap-6 ${
                            viewMode === "grid"
                                ? "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                : "grid-cols-1"
                        }`}>
                            {serviceDataset.map((service) => {
                                const category = categories.find(cat => cat.id === service.service_category_id);
                                const categoryName = category?.name || "Uncategorized";
                                const categoryColor = category?.color || "#6B7280";
                                const IconComponent = getBusinessAwareIcon(category?.icon, businessType);
                                const popularityLevel = businessConfig.popularityLevels?.find(p => p.value === service.popularity);

                                return (
                                    <div
                                        key={service.id}
                                        className={`group relative bg-white rounded-2xl border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                            viewMode === "list" ? "flex items-center p-4" : "p-5"
                                        }`}
                                    >
                                        {/* Modern gradient background */}
                                        <div
                                            className="absolute inset-0 rounded-2xl opacity-[0.02] transition-opacity group-hover:opacity-[0.04]"
                                            style={{ background: `linear-gradient(135deg, ${categoryColor}, transparent)` }}
                                        />

                                        <div className={`relative z-10 ${
                                            viewMode === "list"
                                                ? "flex w-full items-center gap-4"
                                                : "flex h-full flex-col"
                                        }`}>
                                            {/* Header Section */}
                                            <div className={`${viewMode === "list" ? "flex items-center gap-4 flex-1" : "space-y-3"}`}>
                                                {/* Icon & Title Row */}
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ring-1 ring-gray-200/50 flex-shrink-0"
                                                        style={{
                                                            backgroundColor: categoryColor + '20', // 20% opacity background
                                                            color: categoryColor
                                                        }}
                                                    >
                                                        <IconComponent className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                                                {service.name}
                                                            </h3>
                                                            {popularityLevel && (
                                                                <div className={`px-2 py-1 text-xs font-medium rounded-md flex-shrink-0 ${popularityLevel.color}`}>
                                                                    {popularityLevel.label}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm text-gray-500">
                                                                {service.code} • {categoryName}
                                                            </p>
                                                            {/* Barber Info for Barber/Combined Pricing */}
                                                            {((service.pricing_mode === "barber" || service.pricing_mode === "chef") || service.pricing_mode === "combined") && service.barber_id && (
                                                                <div className="flex items-center gap-1">
                                                                    <UserCheck className="h-3 w-3 text-blue-500" />
                                                                    <span className="text-xs text-blue-600 font-medium">
                                                                        {getBusinessConfig(businessType).staffLabel || "Staff"}: {(() => {
                                                                            const barber = barbers.find(b => b.id == service.barber_id);
                                                                            return barber ? barber.name : `${getBusinessConfig(businessType).staffLabel || "Staff"} Tidak Ditemukan`;
                                                                        })()}
                                                                    </span>
                                                                    {service.pricing_mode === "combined" && (
                                                                        <span className="text-xs text-gray-500 ml-1">
                                                                            (+ {getBusinessConfig(businessType).additionalFeeLabel || "Biaya Tambahan"})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Pricing Mode Badge */}
                                                            {service.pricing_mode && service.pricing_mode !== "fixed" && (
                                                                <div className="inline-flex items-center">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
                                                                        (service.pricing_mode === "barber" || service.pricing_mode === "chef")
                                                                            ? "bg-green-100 text-green-700 border border-green-200"
                                                                            : "bg-purple-100 text-purple-700 border border-purple-200"
                                                                    }`}>
                                                                        <Tag className="h-3 w-3 mr-1" />
                                                                        {(service.pricing_mode === "barber" || service.pricing_mode === "chef") ?
                                                                            (getBusinessConfig(businessType).pricingModes?.barber?.label || getBusinessConfig(businessType).pricingModes?.chef?.label || "Tarif Staff") :
                                                                            (getBusinessConfig(businessType).pricingModes?.combined?.label || "Kombinasi")
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {service.description && viewMode === "grid" && (
                                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                        {service.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Stats Section - Grid View */}
                                            {viewMode === "grid" && (
                                                <div className="mt-4 space-y-3">
                                                    {/* Price & Duration Row */}
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-xl font-bold text-gray-900">
                                                                {formatMoney(service.base_price)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">per {service.unit}</div>
                                                        </div>
                                                        {service.estimated_duration && (
                                                            <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                                                                <Clock className="h-4 w-4" />
                                                                <span className="font-medium">{service.estimated_duration}m</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Rating & Bookings Row */}
                                                    {isBarbershop && (
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Star className="h-4 w-4 text-yellow-500" />
                                                                <span className="font-medium">{service.rating?.toFixed(1) || "5.0"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Users className="h-4 w-4" />
                                                                <span className="font-medium">{service.booking_count || 0}</span>
                                                                <span>bookings</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stats Section - List View */}
                                            {viewMode === "list" && (
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {formatMoney(service.base_price)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">per {service.unit}</div>
                                                    </div>
                                                    {service.estimated_duration && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <Clock className="h-4 w-4" />
                                                            <span>{service.estimated_duration}m</span>
                                                        </div>
                                                    )}
                                                    {isBarbershop && (
                                                        <>
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Star className="h-4 w-4 text-yellow-500" />
                                                                <span>{service.rating?.toFixed(1) || "5.0"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Users className="h-4 w-4" />
                                                                <span>{service.booking_count || 0}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {/* Barber Info in List View */}
                                                    {((service.pricing_mode === "barber" || service.pricing_mode === "chef") || service.pricing_mode === "combined") && service.barber_id && (
                                                        <div className="flex items-center gap-1 text-sm text-blue-600">
                                                            <UserCheck className="h-4 w-4" />
                                                            <span className="font-medium">
                                                                {(() => {
                                                                    const barber = barbers.find(b => b.id == service.barber_id);
                                                                    return barber ? barber.name : 'Unknown';
                                                                })()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Pricing Mode Badge in List View */}
                                                    {service.pricing_mode && service.pricing_mode !== "fixed" && (
                                                        <div className={`px-2 py-1 text-xs font-medium rounded-md ${
                                                            (service.pricing_mode === "barber" || service.pricing_mode === "chef")
                                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                                : "bg-purple-100 text-purple-700 border border-purple-200"
                                                        }`}>
                                                            {(service.pricing_mode === "barber" || service.pricing_mode === "chef") ?
                                                                (getBusinessConfig(businessType).pricingModes?.barber?.label || getBusinessConfig(businessType).pricingModes?.chef?.label || "Tarif Staff") :
                                                                (getBusinessConfig(businessType).pricingModes?.combined?.label || "Kombinasi")
                                                            }
                                                        </div>
                                                    )}
                                                    {popularityLevel && (
                                                        <div className={`px-2 py-1 text-xs font-medium rounded-md ${popularityLevel.color}`}>
                                                            {popularityLevel.label}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Modern Actions */}
                                            <div className={`flex gap-2 mt-4 ${
                                                viewMode === "list"
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            }`}>
                                                <button
                                                    onClick={() => editService(service)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    {viewMode === "list" && "Ubah"}
                                                </button>
                                                <button
                                                    onClick={() => del(service.id)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    {viewMode === "list" && "Hapus"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modern Floating Action Button */}
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={showCreateForm}
                        className="group h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                    >
                        <Plus className="h-5 w-5 text-white transition-transform duration-200 group-hover:rotate-90" />
                    </button>
                </div>
            </div>
        </div>
    );
}