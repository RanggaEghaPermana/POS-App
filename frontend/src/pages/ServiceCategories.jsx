import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import { apiGet, apiDelete } from "../api";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

import {
    Settings,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Grid,
    List,
    ArrowLeft,
    Check,
    X,
    Package,
    Sparkles,
    Crown,
    Bath,
    Scissors,
    User,
    Brush,
    UserCheck,
    Gift,
    SprayCan,
    Droplet,
    Palette,
    Printer,
    Monitor,
    Wrench,
    Heart,
    Loader2,
} from "lucide-react";

// Icon mapping untuk kategori
const ICON_MAP = {
    haircut: Scissors,
    beard: User,
    styling: Brush,
    wash: Bath,
    consultation: UserCheck,
    package: Package,
    treatment: Sparkles,
};

export default function ServiceCategories() {
    const { token } = useAuth();

    const [q, setQ] = useState("");
    const [list, setList] = useState({ data: [], meta: {} });
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editing, setEditing] = useState(null);

    // Form states
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [categoryIcon, setCategoryIcon] = useState("haircut");
    const [categoryColor, setCategoryColor] = useState("#8B5CF6");
    const [categoryActive, setCategoryActive] = useState(true);


    // Load categories from API
    async function loadCategories() {
        try {
            const result = await apiGet('/setup/service-categories?per_page=100', token);
            setList({ data: result.data || [], meta: result.meta || {} });
        } catch (error) {
            console.error('Failed to load categories from API:', error);
            setList({ data: [], meta: {} });
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

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

    // Form functions
    const resetForm = () => {
        setEditing(null);
        setCategoryName("");
        setCategoryDescription("");
        setCategoryIcon("haircut");
        setCategoryColor("#8B5CF6");
        setCategoryActive(true);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            alert("Silakan masukkan nama kategori terlebih dahulu");
            return;
        }

        setFormLoading(true);

        try {
            const newCategory = {
                id: editing || `cat-${Date.now()}`,
                name: categoryName.trim(),
                description: categoryDescription.trim(),
                icon: categoryIcon,
                color: categoryColor,
                active: categoryActive,
                services_count: 0,
                created_at: editing ? undefined : new Date().toISOString(),
            };

            // API save logic
            const base = import.meta.env.VITE_API_BASE || "/api/v1";
            const method = editing ? "PUT" : "POST";
            const url = editing ? `${base}/setup/service-categories/${editing}` : `${base}/setup/service-categories`;

            const payload = {
                name: categoryName.trim(),
                description: categoryDescription.trim(),
                icon: categoryIcon,
                color: categoryColor,
                active: categoryActive,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Gagal menyimpan kategori');
            }

            alert(editing ? "Kategori berhasil diperbarui!" : "Kategori baru berhasil ditambahkan!");
            resetForm();
            loadCategories(); // Reload data
            setFormLoading(false);
        } catch (error) {
            alert("Terjadi kesalahan saat menyimpan kategori. Silakan coba lagi.");
            setFormLoading(false);
        }
    };

    const editCategory = (category) => {
        setEditing(category.id);
        setCategoryName(category.name);
        setCategoryDescription(category.description);
        setCategoryIcon(category.icon);
        setCategoryColor(category.color);
        setCategoryActive(category.active);
        setShowForm(true);
    };

    const deleteCategory = async (categoryId) => {
        if (!confirm("Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.")) return;

        try {
            await apiDelete(`/setup/service-categories/${categoryId}`, token);
            alert("Kategori berhasil dihapus!");
            loadCategories(); // Reload data from API
        } catch (error) {
            console.error('Delete error:', error);
            alert("Terjadi kesalahan saat menghapus kategori. Silakan coba lagi.");
        }
    };

    // Delete all categories function
    const deleteAll = async () => {
        if (!confirm("Hapus SEMUA kategori? Tindakan ini tidak dapat dibatalkan!")) return;
        if (!confirm("Apakah Anda yakin ingin menghapus SEMUA kategori? Data akan hilang permanen!")) return;

        setLoading(true);

        try {
            const base = import.meta.env.VITE_API_BASE || "/api/v1";
            const res = await fetch(`${base}/setup/service-categories`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.message || "Gagal menghapus semua kategori");
            } else {
                const data = await res.json();
                alert(data.message || "Berhasil menghapus semua kategori");
                loadCategories();
            }
        } catch (err) {
            console.error("Error deleting all categories:", err);
            alert("Gagal menghapus semua kategori");
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = useMemo(() => {
        let categories = list.data || [];
        if (q) {
            categories = categories.filter(cat =>
                cat.name.toLowerCase().includes(q.toLowerCase())
            );
        }
        return categories;
    }, [list.data, q]);

    const allCategories = list.data || [];
    const activeCount = allCategories.filter(c => c.active).length;
    const totalTreatmentCount = allCategories.reduce((sum, c) => sum + (c.services_count || 0), 0);

    return (
        <div className="space-y-6">
            {/* Compact Professional Header */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-5 overflow-x-auto">
                    <div className="flex items-center justify-between gap-4 min-w-0">
                        {/* Title & Breadcrumb */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Settings className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Kategori Layanan</h1>
                                    <p className="text-sm text-gray-500">Kelola kategori layanan barbershop Anda</p>
                                </div>
                            </div>

                            {/* Stats dengan spacing yang lebih kompak */}
                            <div className="hidden xl:flex items-center gap-6 ml-8 pl-6 border-l border-gray-200">
                                <div className="text-center min-w-[50px]">
                                    <div className="text-lg font-bold text-gray-900">{allCategories.length}</div>
                                    <div className="text-xs text-gray-500">Kategori</div>
                                </div>
                                <div className="text-center min-w-[50px]">
                                    <div className="text-lg font-bold text-green-600">{activeCount}</div>
                                    <div className="text-xs text-gray-500">Aktif</div>
                                </div>
                                <div className="text-center min-w-[50px]">
                                    <div className="text-lg font-bold text-blue-600">{totalTreatmentCount}</div>
                                    <div className="text-xs text-gray-500">Layanan</div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Responsive Layout */}
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setShowForm(true)}
                                    size="sm"
                                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium whitespace-nowrap"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-600 border-gray-300 hover:bg-gray-50 whitespace-nowrap"
                                >
                                    <Link to="/dashboard" className="flex items-center gap-1">
                                        <ArrowLeft className="h-4 w-4" />
                                        Kembali
                                    </Link>
                                </Button>

                                {/* Danger Zone - Hapus Semua */}
                                {allCategories.length > 0 && (
                                    <>
                                        <div className="h-4 w-px bg-gray-300"></div>
                                        <Button
                                            onClick={deleteAll}
                                            variant="outline"
                                            size="sm"
                                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 font-medium transition-colors whitespace-nowrap"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-1 h-4 w-4" />
                                            )}
                                            Hapus
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-lg font-semibold text-gray-900">{allCategories.length}</div>
                                <div className="text-xs text-gray-500">Total Kategori</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-green-600">{activeCount}</div>
                                <div className="text-xs text-gray-500">Kategori Aktif</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-blue-600">{totalTreatmentCount}</div>
                                <div className="text-xs text-gray-500">Total Layanan</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Cari nama kategori atau deskripsi..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500/20"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 mr-2">Lihat sebagai:</span>
                            <div className="flex items-center bg-gray-100 rounded-md p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                        viewMode === "grid"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                        viewMode === "list"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Content Area */}
            <div>
                {filteredCategories.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-300">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-6">
                                <Settings className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {q ? "Tidak ada kategori yang ditemukan" : "Belum ada kategori layanan"}
                            </h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                {q
                                    ? `Tidak ditemukan kategori yang cocok dengan pencarian "${q}"`
                                    : "Mulai tambahkan kategori layanan pertama untuk barbershop Anda"
                                }
                            </p>
                            {!q && (
                                <Button
                                    onClick={() => setShowForm(true)}
                                    size="lg"
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Kategori Pertama
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className={`grid gap-4 ${
                        viewMode === "grid"
                            ? "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                            : "grid-cols-1"
                    }`}>
                        {filteredCategories.map((category) => {
                            const servicesCount = category.services_count || 0;
                            const IconComponent = ICON_MAP[category.icon] || Scissors;
                            return (
                                <div
                                    key={category.id}
                                    className={`group relative bg-white rounded-2xl border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                        viewMode === "list" ? "flex items-center p-4" : "p-5"
                                    }`}
                                >
                                    {viewMode === "grid" ? (
                                        <>
                                            <div className="flex items-start justify-between mb-4">
                                                <div
                                                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg shadow-md"
                                                    style={{ backgroundColor: category.color }}
                                                >
                                                    <IconComponent className="h-6 w-6" />
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                                        onClick={() => editCategory(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                                                        onClick={() => deleteCategory(category.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                                        {category.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {category.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={category.active ? "default" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            {category.active ? "Aktif" : "Nonaktif"}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {servicesCount} layanan
                                                        </div>
                                                        <div className="text-xs text-gray-500">terdaftar</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold"
                                                    style={{ backgroundColor: category.color }}
                                                >
                                                    <IconComponent className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                                    <p className="text-sm text-gray-600 line-clamp-1">{category.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge
                                                    variant={category.active ? "default" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {category.active ? "Aktif" : "Nonaktif"}
                                                </Badge>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {servicesCount} layanan
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => editCategory(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600"
                                                        onClick={() => deleteCategory(category.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            {editing ? "Ubah Kategori Layanan" : "Tambah Kategori Layanan"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing ? "Perbarui informasi kategori layanan" : "Buat kategori layanan baru untuk barbershop Anda"}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">Nama Kategori *</Label>
                            <Input
                                id="categoryName"
                                placeholder="Contoh: Potong Rambut & Styling"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoryDescription">Deskripsi Kategori</Label>
                            <Textarea
                                id="categoryDescription"
                                placeholder="Jelaskan jenis layanan yang termasuk dalam kategori ini..."
                                value={categoryDescription}
                                onChange={(e) => setCategoryDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoryIcon">Ikon Kategori</Label>
                                <Select value={categoryIcon} onValueChange={setCategoryIcon}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="haircut">✂️ Potong Rambut</SelectItem>
                                        <SelectItem value="beard">🧔 Perawatan Jenggot</SelectItem>
                                        <SelectItem value="styling">💇 Styling & Penataan</SelectItem>
                                        <SelectItem value="wash">🚿 Cuci & Keramas</SelectItem>
                                        <SelectItem value="consultation">👤 Konsultasi</SelectItem>
                                        <SelectItem value="package">📦 Paket Hemat</SelectItem>
                                        <SelectItem value="treatment">✨ Perawatan Khusus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categoryColor">Warna Tema</Label>
                                <Select value={categoryColor} onValueChange={setCategoryColor}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="#8B5CF6">🟣 Ungu</SelectItem>
                                        <SelectItem value="#F59E0B">🟡 Kuning Emas</SelectItem>
                                        <SelectItem value="#10B981">🟢 Hijau</SelectItem>
                                        <SelectItem value="#3B82F6">🔵 Biru</SelectItem>
                                        <SelectItem value="#EF4444">🔴 Merah</SelectItem>
                                        <SelectItem value="#6366F1">🟦 Biru Tua</SelectItem>
                                        <SelectItem value="#EC4899">🩷 Merah Muda</SelectItem>
                                        <SelectItem value="#14B8A6">🟢 Hijau Tosca</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoryActive">Status Kategori</Label>
                            <Select value={categoryActive ? "active" : "inactive"} onValueChange={(value) => setCategoryActive(value === "active")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">✅ Aktif - Dapat digunakan</SelectItem>
                                    <SelectItem value="inactive">❌ Nonaktif - Disembunyikan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={formLoading}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {formLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        {editing ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                        {editing ? "Simpan Perubahan" : "Tambah Kategori"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}