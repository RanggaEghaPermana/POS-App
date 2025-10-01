import { useEffect, useMemo, useRef, useState } from "react";







import { useAuth } from "../AuthContext";







import { apiGet } from "../api";







import { Link } from "react-router-dom";







import {







    Card,







    CardContent,







    CardHeader,







    CardTitle,







} from "../components/ui/card";







import { Button } from "../components/ui/button";







import { Input } from "../components/ui/input";

import { Label } from "../components/ui/label";

import { Textarea } from "../components/ui/textarea";







import { Badge } from "../components/ui/badge";







import {







    Settings,







    Plus,







    Search,







    Edit,







    Trash2,







    ArrowLeft,







    Save,







    X,







    Tag,







    Sparkles,







    Printer,







    Scissors,







    Palette,







    Monitor,







    Bath,







    User,







    UserCheck,







    Package,







    Brush,







    SprayCan,







    Droplet,







    Crown,







    Gift,







} from "lucide-react";















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







};















const ICON_OPTIONS = {







    barbershop: [







        { value: "haircut", label: "Scissors (Potong Rambut)", icon: Scissors },







        {







            value: "beard",







            label: "User (Perawatan Jenggot & Kumis)",







            icon: User,







        },







        { value: "styling", label: "Brush (Hair Styling & Blow)", icon: Brush },







        { value: "wash", label: "Bath (Cuci & Keramas)", icon: Bath },







        {







            value: "consultation",







            label: "UserCheck (Konsultasi Grooming)",







            icon: UserCheck,







        },







        { value: "package", label: "Package (Paket Kombinasi)", icon: Package },







        {







            value: "color",







            label: "Palette (Coloring & Highlight)",







            icon: Palette,







        },







        {







            value: "treatment",







            label: "Sparkles (Hair & Scalp Treatment)",







            icon: Sparkles,







        },







        { value: "deluxe", label: "Crown (VIP / Deluxe Service)", icon: Crown },







        { value: "products", label: "Gift (Produk Grooming)", icon: Gift },







        {







            value: "sterilize",







            label: "SprayCan (Sterilisasi Alat)",







            icon: SprayCan,







        },







        {







            value: "hydration",







            label: "Droplet (Hydration & Tonik)",







            icon: Droplet,







        },







    ],







    default: [







        { value: "printer", label: "Printer (Cetak)", icon: Printer },







        { value: "binding", label: "Scissors (Finishing)", icon: Scissors },







        { value: "palette", label: "Palette (Desain)", icon: Palette },







        { value: "computer", label: "Monitor (Digital)", icon: Monitor },







    ],







};















const HEADER_CONFIG = {







    barbershop: {







        title: "Kategori Treatment",







        subtitle: "Atur kategori treatment dan paket grooming barbershop",







        gradient: "from-pink-600 via-fuchsia-600 to-purple-600",







        icon: Scissors,







    },







    default: {







        title: "Kategori Layanan",







        subtitle: "Atur dan kelola kategori layanan jasa",







        gradient: "from-purple-600 via-indigo-600 to-blue-600",







        icon: Settings,







    },







};















const getIconOptions = (businessType) =>







    ICON_OPTIONS[businessType] || ICON_OPTIONS.default;







const getHeaderConfig = (businessType) =>







    HEADER_CONFIG[businessType] || HEADER_CONFIG.default;







const getDefaultColor = (businessType) =>

    businessType === "barbershop" ? "#8B5CF6" : "#3B82F6";







const getDefaultIconValue = (businessType) =>







    getIconOptions(businessType)[0]?.value || "printer";







const getManageServicesLabel = (businessType) =>

    businessType === "barbershop"

        ? "Buka Manajemen Treatment"

        : "Buka Dashboard Layanan";







const getEmptyStateCopy = (businessType) =>

    businessType === "barbershop"

        ? "Mulai tambahkan kategori treatment pertama untuk barbershop Anda."

        : "Mulai tambahkan kategori layanan pertama untuk bisnis Anda.";















const getFallbackBarbershopCategories = () => [







    {







        id: "cat-haircut",







        name: "Layanan Potong Rambut",







        description: "Potong rambut signature, klasik, hingga modern",







        icon: "haircut",







        color: "#8B5CF6",







        active: true,







        services_count: 0,







    },







    {







        id: "cat-beard",







        name: "Perawatan Jenggot & Kumis",







        description: "Perapihan dan treatment grooming wajah",







        icon: "beard",







        color: "#F59E0B",







        active: true,







        services_count: 0,







    },







    {







        id: "cat-styling",







        name: "Hair Styling & Treatment",







        description: "Styling harian, blow, hingga hair spa",







        icon: "styling",







        color: "#10B981",







        active: true,







        services_count: 0,







    },







    {







        id: "cat-wash",







        name: "Cuci & Keramas",







        description: "Cuci relaksasi dengan pijat kepala",







        icon: "wash",







        color: "#3B82F6",







        active: true,







        services_count: 0,







    },







    {







        id: "cat-consultation",







        name: "Konsultasi & Grooming",







        description: "Sesi konsultasi gaya & grooming personal",







        icon: "consultation",







        color: "#EF4444",







        active: true,







        services_count: 0,







    },







    {







        id: "cat-package",







        name: "Paket Lengkap",







        description: "Bundling layanan cukur dan grooming",







        icon: "package",







        color: "#6366F1",







        active: true,







        services_count: 0,







    },







];







export default function ServiceCategories() {







    const { token, activeTenant } = useAuth();







    const isMockMode =







        import.meta.env.VITE_MOCK_BARBERSHOP === "true" || !token;







    const [q, setQ] = useState("");







    const [list, setList] = useState({ data: [], meta: {} });







    const [name, setName] = useState("");







    const [description, setDescription] = useState("");







    const [icon, setIcon] = useState(getDefaultIconValue("barbershop"));







    const [color, setColor] = useState(getDefaultColor("barbershop"));







    const [editing, setEditing] = useState(null);







    const [businessType, setBusinessType] = useState(

        activeTenant?.business_type || "barbershop",

    );

    const [showForm, setShowForm] = useState(false);















    async function load(page = 1) {







        if (isMockMode) {







            setList({ data: getFallbackBarbershopCategories(), meta: {} });







            return;







        }















        const params = new URLSearchParams();







        if (q) params.set("q", q);







        params.set("per_page", 100);







        params.set("page", page);







        try {







            setList(







                await apiGet(`/service-categories?${params.toString()}`, token),







            );







        } catch (error) {







            console.warn(







                "Falling back to barbershop categories:",







                error?.message || error,







            );







            setList({ data: getFallbackBarbershopCategories(), meta: {} });







        }







    }















    async function loadBusinessType() {







        if (isMockMode) {







            setBusinessType("barbershop");







            return;







        }















        try {







            const config = await apiGet("/config", token);







            const configType = config.business_type;







            if (configType && ICON_OPTIONS[configType]) {







                setBusinessType(configType);







            } else {







                setBusinessType("barbershop");







            }







        } catch (error) {







            console.warn(







                "Failed to load business type, using barbershop preset:",







                error?.message || error,







            );







            setBusinessType("barbershop");







        }







    }















    useEffect(() => {







        loadBusinessType();







        load();







    }, []);















    useEffect(() => {







        if (!editing) {







            setIcon(getDefaultIconValue(businessType));







            setColor(getDefaultColor(businessType));







        }







    }, [businessType, editing]);















    useEffect(() => {







        const availableIcons = new Set(







            getIconOptions(businessType).map((option) => option.value),







        );







        if (!availableIcons.has(icon)) {







            setIcon(getDefaultIconValue(businessType));







        }







    }, [businessType, icon]);















    useEffect(() => {







        if (isMockMode) {







            setBusinessType("barbershop");







            return;







        }







        const tenantType = activeTenant?.business_type;







        if (tenantType && ICON_OPTIONS[tenantType]) {







            setBusinessType(tenantType);







        } else {







            setBusinessType("barbershop");







        }







    }, [activeTenant, isMockMode]);















    async function save() {







        if (!name) return;















        if (isMockMode) {







            alert("Mode mock: data disimpan secara lokal.");







            resetForm();







            load();







            return;







        }















        const base = import.meta.env.VITE_API_BASE || "http://localhost/api/v1";







        const method = editing ? "PUT" : "POST";







        const url = editing







            ? `${base}/service-categories/${editing}`







            : `${base}/service-categories`;















        const res = await fetch(url, {







            method,







            headers: {







                "Content-Type": "application/json",







                Authorization: `Bearer ${token}`,







            },







            body: JSON.stringify({







                name,







                description,







                icon,







                color,







                active: true,







            }),







        });















        const data = await res.json().catch(() => ({}));







        if (!res.ok) {







            alert(data.message || "Gagal simpan");







            return;







        }















        resetForm();







        load();







    }















    async function del(id) {







        if (!confirm("Hapus kategori layanan?")) return;















        if (isMockMode) {







            alert("Mode mock: kategori dihapus secara lokal.");







            setList({







                data: getFallbackBarbershopCategories().filter(







                    (cat) => cat.id !== id,







                ),







                meta: {},







            });







            return;







        }















        const base = import.meta.env.VITE_API_BASE || "http://localhost/api/v1";







        const res = await fetch(`${base}/service-categories/${id}`, {







            method: "DELETE",







            headers: { Authorization: `Bearer ${token}` },







        });















        if (!res.ok) {







            const data = await res.json().catch(() => ({}));







            alert(data.message || "Gagal hapus");







        }















        load();







    }















    function editCategory(category) {







        setEditing(category.id);







        setName(category.name);







        setDescription(category.description || "");







        setIcon(category.icon || getDefaultIconValue(businessType));







        setColor(category.color || getDefaultColor(businessType));

        setShowForm(true);

    }















    function resetForm() {







        setEditing(null);







        setName("");







        setDescription("");







        setIcon(getDefaultIconValue(businessType));







        setColor(getDefaultColor(businessType));

        setShowForm(false);

    }



    async function save() {

        if (!name.trim()) {

            alert("Nama kategori wajib diisi");

            return;

        }



        const payload = {

            name: name.trim(),

            description: description.trim(),

            icon: icon,

            color: color,

            active: true

        };



        try {

            const url = editing

                ? `${base}/service-categories/${editing}`

                : `${base}/service-categories`;



            const method = editing ? "PUT" : "POST";



            const res = await fetch(url, {

                method,

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify(payload)

            });



            if (!res.ok) {

                const data = await res.json().catch(() => ({}));

                alert(data.message || "Gagal menyimpan kategori");

                return;

            }



            resetForm();

            load();

        } catch (err) {

            console.error("Error saving category:", err);

            alert("Gagal menyimpan kategori");

        }

    }



    function showCreateForm() {

        resetForm();

        setShowForm(true);

    }































    const headerConfig = getHeaderConfig(businessType);







    const HeaderIcon = headerConfig.icon;







    const iconOptions = getIconOptions(businessType);







    const manageServicesLabel = getManageServicesLabel(businessType);







    const isBarbershop = businessType === "barbershop";







    const categoryDataset = list.data || [];







    const activeCount = categoryDataset.filter((c) => c.active).length;







    const totalTreatmentCount = categoryDataset.reduce(
        (sum, c) => sum + (c.services_count || 0),
        0,
    );

    const activePercentage =
        categoryDataset.length > 0
            ? Math.round((activeCount / categoryDataset.length) * 100)
            : 0;

    const quickIconChips = iconOptions.slice(0, 6);






    const barbershopReferenceCategories =







        isBarbershop && categoryDataset.length === 0







            ? getFallbackBarbershopCategories()







            : categoryDataset;







    const trendingCategories = isBarbershop







        ? Array.from(barbershopReferenceCategories)







              .sort((a, b) => (b.services_count || 0) - (a.services_count || 0))







              .slice(0, 3)







        : [];







    const heroHighlights = isBarbershop







        ? [







              { icon: Sparkles, label: "Kurasi paket grooming premium" },







              { icon: Brush, label: "Style konsisten antar barber" },







              { icon: Crown, label: "Upsell membership eksklusif" },







          ]







        : [];







    const searchPlaceholder = isBarbershop







        ? "Cari kategori treatment atau highlight signature..."







        : "Cari kategori layanan...";







    const barbershopMetricCards = [
        {
            label: "Total Kategori",
            value: categoryDataset.length,
            caption: "Kurasi menu signature dan paket premium",
            icon: Settings,
            gradient: "from-white/30 via-white/5 to-transparent",
            iconBg: "border border-white/15 bg-white/10",
            meta:
                activeCount > 0
                    ? `${activeCount} kategori aktif`
                    : "Belum ada kategori aktif",
        },
        {
            label: "Kategori Aktif",
            value: activeCount,
            caption: "Tampil di katalog pelanggan & POS",
            icon: Sparkles,
            gradient: "from-fuchsia-400/25 via-purple-500/15 to-transparent",
            iconBg: "border border-fuchsia-200/30 bg-fuchsia-500/20",
            meta: `${activePercentage}% aktif`,
        },
        {
            label: "Total Treatment",
            value: totalTreatmentCount,
            caption: "Mapping layanan dalam berbagai kategori",
            icon: Package,
            gradient: "from-sky-400/25 via-indigo-500/15 to-transparent",
            iconBg: "border border-sky-200/30 bg-sky-500/20",
            meta:
                totalTreatmentCount > 0
                    ? `${totalTreatmentCount} layanan siap dijual`
                    : "Siapkan treatment unggulan",
        },
        {
            label: "Preset Ikon",
            value: iconOptions.length,
            caption: "Sesuaikan ikon & warna sesuai identitas brand",
            icon: Palette,
            gradient: "from-amber-400/25 via-orange-500/15 to-transparent",
            iconBg: "border border-amber-200/30 bg-amber-500/20",
            meta: "Desain kategori lebih ekspresif",
        },
    ];






























    return (















        <div className="space-y-8">















































            <div

                className={`relative overflow-hidden ${

                    isBarbershop

                        ? "rounded-[2.75rem] border border-white/10 bg-slate-950 px-8 py-14 text-white shadow-[0_40px_100px_-45px_rgba(76,29,149,0.85)] sm:px-10 lg:px-14 lg:py-16"

                        : `rounded-lg bg-gradient-to-r ${headerConfig.gradient} px-8 py-12 text-white`

                }`}

            >

                {isBarbershop ? (

                    <>

                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.45),_transparent_58%)]" />

                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,0.72),_rgba(24,24,27,0.38))]" />

                        <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />

                        <div className="pointer-events-none absolute -right-28 -bottom-20 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />

                    </>

                ) : (

                    <div className="absolute inset-0 bg-black/20" />

                )}



                <div

                    className={`relative z-10 ${

                        isBarbershop

                            ? "grid gap-12 lg:grid-cols-[1.7fr,1fr] lg:items-start"

                            : "flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"

                    }`}

                >

                    {isBarbershop ? (

                        <>

                            <div className="flex flex-col gap-10">

                                <div className="space-y-6">

                                    <div className="flex flex-wrap items-center gap-3">

                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">

                                            Signature Treatment Suite

                                        </span>

                                        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-white/60">

                                            Elevate UX

                                        </span>

                                    </div>



                                    <div className="space-y-4">

                                        <h1 className="text-4xl font-semibold leading-[1.1] md:text-5xl">

                                            {headerConfig.title}

                                        </h1>

                                        <p className="max-w-2xl text-base text-white/75 md:text-lg">

                                            {headerConfig.subtitle} Hadirkan suasana barbershop yang eksklusif dengan kategori curated, paket loyalti, dan highlight treatment yang terasa premium.

                                        </p>

                                    </div>

                                </div>



                                {heroHighlights.length > 0 && (

                                    <div className="grid gap-3 sm:grid-cols-2">

                                        {heroHighlights.map(({ icon: HighlightIcon, label }) => (

                                            <div

                                                key={label}

                                                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white/80 backdrop-blur transition hover:border-white/25 hover:bg-white/15"

                                            >

                                                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/90 transition group-hover:scale-105">

                                                    <HighlightIcon className="h-4 w-4" />

                                                </span>

                                                <p className="text-sm leading-snug">{label}</p>

                                            </div>

                                        ))}

                                    </div>

                                )}



                                <div className="flex flex-wrap items-center gap-3">

                                    <Button

                                        asChild

                                        variant="ghost"

                                        size="lg"

                                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white px-6 py-3 text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:bg-white/90"

                                    >

                                        <Link to="/services">

                                            <ArrowLeft className="h-5 w-5" />

                                            {manageServicesLabel}

                                        </Link>

                                    </Button>



                                    <Button

                                        onClick={showCreateForm}

                                        variant="ghost"

                                        size="lg"

                                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:from-violet-400 hover:via-purple-400 hover:to-fuchsia-400"

                                    >

                                        <Plus className="h-5 w-5" />

                                        Tambah Kategori

                                    </Button>

                                </div>



                                <div className="flex flex-wrap gap-4 text-xs text-white/50">

                                    <span className="inline-flex items-center gap-2">

                                        <Sparkles className="h-3.5 w-3.5" />

                                        Pengalaman check-in mulus

                                    </span>

                                    <span className="inline-flex items-center gap-2">

                                        <Tag className="h-3.5 w-3.5" />

                                        Ikon & warna custom brand

                                    </span>

                                    <span className="inline-flex items-center gap-2">

                                        <Settings className="h-3.5 w-3.5" />

                                        Sinkron otomatis ke kasir

                                    </span>

                                </div>

                            </div>



                            <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">

                                <div className="flex items-center justify-between text-white/70">

                                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em]">

                                        Trending Treatment

                                    </p>

                                    <Sparkles className="h-4 w-4" />

                                </div>



                                <div className="space-y-4">

                                    {trendingCategories.length > 0 ? (

                                        trendingCategories.map((category, index) => {

                                            const servicesCount = category.services_count || 0;



                                            return (

                                                <div

                                                    key={category.id || category.name}

                                                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white/80 backdrop-blur-sm"

                                                >

                                                    <div className="flex items-center gap-3">

                                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-semibold text-white">

                                                            {index + 1}

                                                        </span>

                                                        <div className="space-y-1">

                                                            <p className="text-sm font-semibold text-white">

                                                                {category.name}

                                                            </p>

                                                            {category.description && (

                                                                <p className="text-xs text-white/65">

                                                                    {category.description}

                                                                </p>

                                                            )}

                                                        </div>

                                                    </div>

                                                    <Badge

                                                        variant="outline"

                                                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white"

                                                    >

                                                        {servicesCount} treatment

                                                    </Badge>

                                                </div>

                                            );

                                        })

                                    ) : (

                                        <p className="text-sm text-white/70">

                                            Belum ada data trending. Tandai kategori favorit pelanggan untuk mengisi daftar ini.

                                        </p>

                                    )}

                                </div>



                                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/65 backdrop-blur-sm">

                                    Sorot kategori dengan foto editorial dan highlight membership untuk meningkatkan upsell.

                                </div>

                            </div>

                        </>

                    ) : (

                        <>

                            <div className="space-y-5">

                                <div className="flex items-center gap-3">

                                    <div className="rounded-full bg-white/10 p-3">

                                        <HeaderIcon className="h-8 w-8 text-white" />

                                    </div>

                                    <div>

                                        <h1 className="text-4xl font-bold">{headerConfig.title}</h1>

                                        <p className="text-purple-100">{headerConfig.subtitle}</p>

                                    </div>

                                </div>

                            </div>



                            <div className="flex items-center gap-3">

                                <Button

                                    asChild

                                    variant="secondary"

                                    size="lg"

                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"

                                >

                                    <Link to="/services">

                                        <ArrowLeft className="h-5 w-5" />

                                        {manageServicesLabel}

                                    </Link>

                                </Button>

                                <Button

                                    onClick={showCreateForm}

                                    variant="default"

                                    size="lg"

                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20"

                                >

                                    <Plus className="h-5 w-5" />

                                    Tambah Kategori

                                </Button>

                            </div>

                        </>

                    )}

                </div>

            </div>



            {/* Form untuk Create/Edit Kategori */}
            {showForm && (
                <Card className="mb-8">
                    <CardHeader>

                        <CardTitle className="flex items-center gap-2">

                            {editing ? (

                                <>

                                    <Edit className="h-5 w-5 text-amber-600" />

                                    <span>Edit Kategori Treatment</span>

                                </>

                            ) : (

                                <>

                                    <Plus className="h-5 w-5 text-green-600" />

                                    <span>Tambah Kategori Treatment Baru</span>

                                </>

                            )}

                        </CardTitle>

                    </CardHeader>

                    <CardContent>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                            <div>

                                <Label htmlFor="categoryName">

                                    Nama Kategori *

                                </Label>

                                <Input

                                    id="categoryName"

                                    placeholder="Contoh: Haircut & Styling"

                                    value={name}

                                    onChange={(e) => setName(e.target.value)}

                                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"

                                />

                            </div>

                            <div>

                                <Label htmlFor="categoryIcon">Icon</Label>

                                <select

                                    id="categoryIcon"

                                    value={icon}

                                    onChange={(e) => setIcon(e.target.value)}

                                    className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 rounded-md transition-all"

                                >

                                    {getIconOptions(businessType).map((option) => (

                                        <option key={option.value} value={option.value}>

                                            {option.label}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <Label htmlFor="categoryColor">Warna</Label>

                                <div className="flex gap-2 items-center">

                                    <input

                                        id="categoryColor"

                                        type="color"

                                        value={color}

                                        onChange={(e) => setColor(e.target.value)}

                                        className="w-12 h-10 rounded border-0 bg-gray-50 cursor-pointer"

                                    />

                                    <Input

                                        value={color}

                                        onChange={(e) => setColor(e.target.value)}

                                        placeholder="#8B5CF6"

                                        className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"

                                    />

                                </div>

                            </div>

                        </div>



                        <div className="mb-4">

                            <Label htmlFor="categoryDescription">Deskripsi</Label>

                            <Textarea

                                id="categoryDescription"

                                placeholder="Deskripsi kategori treatment..."

                                value={description}

                                onChange={(e) => setDescription(e.target.value)}

                                className="border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"

                                rows={3}

                            />

                        </div>



                        <div className="flex gap-4">

                            <Button

                                onClick={save}

                                size="lg"

                                className={

                                    editing

                                        ? "h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"

                                        : "h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"

                                }

                            >

                                <Save className="h-4 w-4 mr-2" />

                                {editing ? "Update Kategori" : "Tambah Kategori"}

                            </Button>

                            <Button

                                onClick={resetForm}

                                variant="outline"

                                size="lg"

                                className="h-12"

                            >

                                <X className="h-4 w-4 mr-2" />

                                Batal

                            </Button>

                        </div>

                    </CardContent>

                </Card>

            )}



            {categoryDataset.length === 0 ? (

                <div className="flex flex-col items-center justify-center py-16 px-4">

                    <div className="rounded-lg bg-gray-100 p-6 mb-6">

                        <Settings className="h-12 w-12 text-gray-400" />

                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">

                        Belum ada kategori

                    </h3>

                    <p className="text-gray-500 text-center max-w-sm mb-6">

                        {getEmptyStateCopy(businessType)}

                    </p>



                    <Button

                        onClick={showCreateForm}

                        size="lg"

                        className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-3 text-white font-medium"

                    >

                        <Plus className="h-5 w-5" />

                        Buat Kategori Pertama

                    </Button>

                </div>

            ) : (

                <>

                    {isBarbershop ? (

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {barbershopMetricCards.map((card) => {
                                const MetricIcon = card.icon;

                                return (
                                    <div
                                        key={card.label}
                                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_24px_60px_-30px_rgba(76,29,149,0.75)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_34px_80px_-24px_rgba(168,85,247,0.6)]"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                                        <div className="relative flex h-full flex-col justify-between gap-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                                                    {card.label}
                                                </p>
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg} text-white`}>
                                                    <MetricIcon className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-3xl font-semibold leading-tight">{card.value}</p>
                                                <p className="text-sm text-white/70">{card.caption}</p>
                                            </div>
                                            {card.meta && (
                                                <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                                                    {card.meta}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                            <Card className="hover:shadow-lg transition-shadow">

                                <CardContent className="p-6">

                                    <div className="flex items-center">

                                        <div className="flex-shrink-0">

                                            <div className="rounded-full bg-purple-100 p-3">

                                                <Settings className="h-6 w-6 text-purple-600" />

                                            </div>

                                        </div>

                                        <div className="ml-4">

                                            <p className="text-sm font-medium text-gray-500">Total Kategori</p>

                                            <p className="text-2xl font-bold text-gray-900">{categoryDataset.length}</p>

                                        </div>

                                    </div>

                                </CardContent>

                            </Card>



                            <Card className="hover:shadow-lg transition-shadow">

                                <CardContent className="p-6">

                                    <div className="flex items-center">

                                        <div className="flex-shrink-0">

                                            <div className="rounded-full bg-green-100 p-3">

                                                <Plus className="h-6 w-6 text-green-600" />

                                            </div>

                                        </div>

                                        <div className="ml-4">

                                            <p className="text-sm font-medium text-gray-500">Kategori Aktif</p>

                                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>

                                        </div>

                                    </div>

                                </CardContent>

                            </Card>



                            <Card className="hover:shadow-lg transition-shadow">

                                <CardContent className="p-6">

                                    <div className="flex items-center">

                                        <div className="flex-shrink-0">

                                            <div className="rounded-full bg-blue-100 p-3">

                                                <Sparkles className="h-6 w-6 text-blue-600" />

                                            </div>

                                        </div>

                                        <div className="ml-4">

                                            <p className="text-sm font-medium text-gray-500">Total Layanan</p>

                                            <p className="text-2xl font-bold text-gray-900">{totalTreatmentCount}</p>

                                        </div>

                                    </div>

                                </CardContent>

                            </Card>

                        </div>

                    )}



                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {categoryDataset.map((category) => {
                            const IconComponent = ICON_MAP[category.icon] || Settings;
                            const servicesCount = category.services_count || 0;
                            const baseColor = category.color || getDefaultColor(businessType);
                            const iconStyle = isBarbershop
                                ? {
                                      background: `linear-gradient(135deg, ${baseColor} 0%, rgba(255, 255, 255, 0.25) 100%)`,
                                      boxShadow: `0 18px 40px -20px ${baseColor}80`,
                                  }
                                : { backgroundColor: baseColor };
                            const badgeVariant = isBarbershop
                                ? "outline"
                                : category.active
                                ? "default"
                                : "secondary";
                            const badgeClass = isBarbershop
                                ? category.active
                                    ? "rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                                    : "rounded-full border border-white/20 bg-white/5 text-white/60"
                                : category.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600";
                            const descriptionClass = isBarbershop
                                ? "text-sm text-white/70"
                                : "text-sm text-gray-600";
                            const metaRowClass = isBarbershop
                                ? "flex items-center justify-between text-sm text-white/70"
                                : "flex items-center justify-between text-sm text-gray-500";
                            const tagIconClass = isBarbershop ? "h-3 w-3 text-white/60" : "h-3 w-3";
                            const editButtonClass = isBarbershop
                                ? "flex-1 h-9 rounded-full border border-white/15 bg-white/10 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                                : "flex-1 h-8 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50";
                            const deleteButtonClass = isBarbershop
                                ? "flex-1 h-9 rounded-full border border-rose-400/30 bg-rose-500/10 text-xs font-medium text-rose-200 backdrop-blur transition hover:bg-rose-500/20"
                                : "flex-1 h-8 text-xs rounded-md border border-gray-200 text-red-600 hover:bg-red-50";
                            const actionsWrapperClass = isBarbershop
                                ? "mt-auto flex items-center gap-2 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                                : "mt-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100";

                            return (
                                <Card
                                    key={category.id}
                                    className={`group border-0 transition-all duration-300 ${
                                        isBarbershop
                                            ? "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_25px_70px_-35px_rgba(76,29,149,0.8)] hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_35px_90px_-30px_rgba(168,85,247,0.7)]"
                                            : "bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-indigo-50 hover:shadow-lg"
                                    }`}
                                >
                                    {isBarbershop && (
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_65%)]" />
                                    )}
                                    <CardContent
                                        className={`relative flex h-full flex-col gap-5 p-6 ${
                                            isBarbershop ? "text-white" : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${
                                                        isBarbershop ? "ring-1 ring-white/10 backdrop-blur" : "shadow-sm"
                                                    }`}
                                                    style={iconStyle}
                                                >
                                                    <IconComponent className="h-6 w-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className={`text-lg font-semibold ${isBarbershop ? "text-white" : "text-gray-900"}`}>
                                                        {category.name}
                                                    </h3>
                                                    {category.description && (
                                                        <p className={descriptionClass}>{category.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={badgeVariant} className={badgeClass}>
                                                {category.active ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </div>

                                        <div className={metaRowClass}>
                                            <span>{servicesCount} layanan terkait</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Tag className={tagIconClass} />
                                                {category.icon || "custom"}
                                            </span>
                                        </div>

                                        <div className={actionsWrapperClass}>
                                            <Button
                                                onClick={() => editCategory(category)}
                                                variant="ghost"
                                                size="sm"
                                                className={editButtonClass}
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => del(category.id)}
                                                variant="ghost"
                                                size="sm"
                                                className={deleteButtonClass}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>

                </>

            )}



            {/* Floating Action Button untuk Create Category */}

            <div className="fixed bottom-8 right-8 z-50">

                <Button

                    onClick={showCreateForm}

                    className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"

                >

                    <Plus className="h-5 w-5 text-white" />

                </Button>

            </div>



        </div>







    );







}
















