import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { apiGet } from "../api";
import { formatMoney } from "../utils/currency";
import useCurrency from "../hooks/useCurrency";
import { Link } from "react-router-dom";
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
import { LoadingSpinner } from "../components/ui/loading";
import { Textarea } from "../components/ui/textarea";
import {
    Wrench,
    Plus,
    Search,
    Edit,
    Trash2,
    ArrowLeft,
    Save,
    X,
    Clock,
    FileText,
    Settings,
    DollarSign,
    Package,
    Scissors,
} from "lucide-react";

const BUSINESS_CONFIG = {
    barbershop: {
        title: "Manajemen Treatment",
        subtitle: "Kelola layanan cukur, grooming, dan paket barbershop",
        gradient: "from-fuchsia-600 via-purple-600 to-indigo-600",
        icon: Scissors,
        serviceLabel: "Treatment",
        serviceLabelPlural: "Treatment",
        emptyDescription:
            "Mulai tambahkan treatment pertama untuk barbershop Anda.",
        defaultUnit: "layanan",
        codePlaceholder: "Contoh: HC-BASIC",
        namePlaceholder: "Contoh: Haircut Premium",
        searchPlaceholder: "Cari nama treatment atau kode...",
        unitOptions: [
            { value: "layanan", label: "Layanan" },
            { value: "paket", label: "Paket" },
            { value: "session", label: "Sesi" },
            { value: "menit", label: "Menit" },
            { value: "jam", label: "Jam" },
        ],
    },
    default: {
        title: "Manajemen Layanan",
        subtitle: "Kelola layanan jasa bisnis Anda",
        gradient: "from-indigo-600 via-blue-600 to-cyan-600",
        icon: Wrench,
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
            { value: "dokumen", label: "Dokumen" },
            { value: "foto", label: "Foto" },
            { value: "file", label: "File" },
            { value: "disc", label: "Disc" },
            { value: "design", label: "Design" },
            { value: "potong", label: "Potong" },
        ],
    },
};

const getBusinessConfig = (businessType) =>
    BUSINESS_CONFIG[businessType] || BUSINESS_CONFIG.default;

export default function Services() {
    const { token } = useAuth();
    const [q, setQ] = useState("");
    const [list, setList] = useState({ data: [], meta: {} });
    const [categories, setCategories] = useState([]);
    const currency = useCurrency("IDR");
    const [loading, setLoading] = useState(true);
    const [businessType, setBusinessType] = useState("general");

    // Form states
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [unit, setUnit] = useState("pcs");
    const [description, setDescription] = useState("");
    const [estimatedDuration, setEstimatedDuration] = useState("");
    const [requirements, setRequirements] = useState("");
    const [editing, setEditing] = useState(null);

    const businessConfig = getBusinessConfig(businessType);
    const ServiceIcon = businessConfig.icon;

    async function load(page = 1) {
        setLoading(true);
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        p.set("per_page", 50);
        p.set("page", page);
        try {
            setList(await apiGet(`/services?${p.toString()}`, token));
        } finally {
            setLoading(false);
        }
    }

    async function loadCategories() {
        const cats = await apiGet("/service-categories?per_page=100", token);
        setCategories(cats.data || []);
    }

    async function loadBusinessType() {
        try {
            const config = await apiGet("/config", token);
            setBusinessType(config.business_type || "general");
        } catch (error) {
            console.error("Failed to load business type:", error);
            setBusinessType("general");
        }
    }

    useEffect(() => {
        loadBusinessType();
        load();
        loadCategories();
    }, []);

    useEffect(() => {
        if (!editing) {
            const defaultUnit = getBusinessConfig(businessType).defaultUnit;
            setUnit(defaultUnit);
        }
    }, [businessType, editing]);

    async function save() {
        if (!name || !code || !categoryId || !basePrice) {
            alert("Nama, kode, kategori, dan harga harus diisi");
            return;
        }

        const base = import.meta.env.VITE_API_BASE || "http://localhost/api/v1";
        const method = editing ? "PUT" : "POST";
        const url = editing
            ? `${base}/services/${editing}`
            : `${base}/services`;

        const payload = {
            name,
            code,
            service_category_id: parseInt(categoryId),
            base_price: parseFloat(basePrice),
            unit,
            description: description || null,
            estimated_duration: estimatedDuration
                ? parseInt(estimatedDuration)
                : null,
            requirements: requirements || null,
            active: true,
        };

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
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
        if (!confirm(`Hapus ${businessConfig.serviceLabel.toLowerCase()}?`))
            return;
        const base = import.meta.env.VITE_API_BASE || "http://localhost/api/v1";
        const res = await fetch(`${base}/services/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.message || "Gagal hapus");
        }
        load();
    }

    function edit(service) {
        setEditing(service.id);
        setName(service.name);
        setCode(service.code);
        setCategoryId(service.service_category_id.toString());
        setBasePrice(service.base_price.toString());
        setUnit(service.unit);
        setDescription(service.description || "");
        setEstimatedDuration(
            service.estimated_duration
                ? service.estimated_duration.toString()
                : "",
        );
        setRequirements(service.requirements || "");
    }

    function resetForm() {
        setEditing(null);
        setName("");
        setCode("");
        setCategoryId("");
        setBasePrice("");
        const defaultUnit = getBusinessConfig(businessType).defaultUnit;
        setUnit(defaultUnit);
        setDescription("");
        setEstimatedDuration("");
        setRequirements("");
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div
                className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${businessConfig.gradient} px-8 py-12 text-white`}
            >
                <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-white/10 p-3">
                                <ServiceIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold">
                                    {businessConfig.title}
                                </h1>
                                <p className="text-blue-100">
                                    {businessConfig.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            asChild
                            variant="secondary"
                            size="lg"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                        >
                            <Link
                                to="/service-categories"
                                className="flex items-center gap-2"
                            >
                                <Settings className="h-5 w-5" />
                                Kategori {businessConfig.serviceLabelPlural}
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="secondary"
                            size="lg"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                        >
                            <Link
                                to="/inventory"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                Kembali ke Inventory
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
            </div>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-full bg-blue-100 p-3">
                                    <ServiceIcon className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Total {businessConfig.serviceLabelPlural}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {list.data?.length || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-full bg-green-100 p-3">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Harga Rata-rata
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {list.data?.length > 0
                                        ? formatMoney(
                                              list.data.reduce(
                                                  (sum, s) =>
                                                      sum +
                                                      parseFloat(s.base_price),
                                                  0,
                                              ) / list.data.length,
                                              currency,
                                          )
                                        : formatMoney(0, currency)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-full bg-purple-100 p-3">
                                    <Clock className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Durasi Rata-rata
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {list.data?.filter(
                                        (s) => s.estimated_duration,
                                    ).length > 0
                                        ? Math.round(
                                              list.data
                                                  .filter(
                                                      (s) =>
                                                          s.estimated_duration,
                                                  )
                                                  .reduce(
                                                      (sum, s) =>
                                                          sum +
                                                          s.estimated_duration,
                                                      0,
                                                  ) /
                                                  list.data.filter(
                                                      (s) =>
                                                          s.estimated_duration,
                                                  ).length,
                                          )
                                        : 0}{" "}
                                    min
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-full bg-orange-100 p-3">
                                    <Package className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Kategori
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {categories.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Search Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        <span>
                            Pencarian {businessConfig.serviceLabelPlural}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder={businessConfig.searchPlaceholder}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <Button
                            onClick={() => load()}
                            size="lg"
                            className="h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Cari
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {/* Add/Edit Form */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {editing ? (
                            <>
                                <Edit className="h-5 w-5 text-amber-600" />
                                <span>Edit {businessConfig.serviceLabel}</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 text-green-600" />
                                <span>
                                    Tambah {businessConfig.serviceLabel} Baru
                                </span>
                            </>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <Label htmlFor="name">
                                Nama {businessConfig.serviceLabel} *
                            </Label>
                            <Input
                                id="name"
                                placeholder={businessConfig.namePlaceholder}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <Label htmlFor="code">
                                Kode {businessConfig.serviceLabel} *
                            </Label>
                            <Input
                                id="code"
                                placeholder={businessConfig.codePlaceholder}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">Kategori *</Label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-md transition-all"
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="price">
                                Harga Dasar * ({currency})
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={basePrice}
                                onChange={(e) => setBasePrice(e.target.value)}
                                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <Label htmlFor="unit">Satuan</Label>
                            <select
                                id="unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-md transition-all"
                            >
                                {businessConfig.unitOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="duration">
                                Estimasi Durasi (menit)
                            </Label>
                            <Input
                                id="duration"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={estimatedDuration}
                                onChange={(e) =>
                                    setEstimatedDuration(e.target.value)
                                }
                                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                placeholder={`Deskripsi ${businessConfig.serviceLabel.toLowerCase()}...`}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="requirements">
                                Persyaratan Khusus
                            </Label>
                            <Textarea
                                id="requirements"
                                placeholder="Persyaratan atau catatan khusus..."
                                value={requirements}
                                onChange={(e) =>
                                    setRequirements(e.target.value)
                                }
                                className="border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                rows={3}
                            />
                        </div>
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
                            {editing
                                ? `Update ${businessConfig.serviceLabel}`
                                : `Tambah ${businessConfig.serviceLabel}`}
                        </Button>
                        {editing && (
                            <Button
                                onClick={resetForm}
                                variant="outline"
                                size="lg"
                                className="h-12 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Batal
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Services List */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ServiceIcon className="h-5 w-5 text-blue-600" />
                            <span>
                                Daftar {businessConfig.serviceLabelPlural}
                            </span>
                        </div>
                        <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700"
                        >
                            {list.data?.length || 0}{" "}
                            {businessConfig.serviceLabelPlural.toLowerCase()}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                            <LoadingSpinner size="sm" />
                            <span>
                                Memuat{" "}
                                {businessConfig.serviceLabelPlural.toLowerCase()}
                                ...
                            </span>
                        </div>
                    ) : list.data?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <ServiceIcon className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Belum ada{" "}
                                {businessConfig.serviceLabelPlural.toLowerCase()}
                            </h3>
                            <p className="text-gray-500 text-center mb-6 max-w-sm">
                                {businessConfig.emptyDescription}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                            {list.data?.map((service) => (
                                <Card
                                    key={service.id}
                                    className="hover:shadow-lg transition-all duration-200 group border-0 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-cyan-50"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                        {service.name}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {service.code}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {service.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>
                                                        Kategori:{" "}
                                                        {
                                                            service
                                                                .service_category
                                                                ?.name
                                                        }
                                                    </span>
                                                    {service.estimated_duration && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {
                                                                service.estimated_duration
                                                            }{" "}
                                                            menit
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-blue-600">
                                                    {formatMoney(
                                                        service.base_price,
                                                        currency,
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    per {service.unit}
                                                </div>
                                            </div>
                                        </div>

                                        {service.requirements && (
                                            <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm font-medium text-yellow-800">
                                                            Persyaratan:
                                                        </div>
                                                        <div className="text-sm text-yellow-700">
                                                            {
                                                                service.requirements
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                onClick={() => edit(service)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 flex-1 hover:bg-amber-100 hover:text-amber-700"
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => del(service.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 flex-1 hover:bg-red-100 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
