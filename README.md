# Retail & Service Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Laravel](https://img.shields.io/badge/Laravel-12.0-red.svg)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org)
[![PHP](https://img.shields.io/badge/PHP-8.2+-purple.svg)](https://php.net)

Sistem manajemen retail dan layanan jasa yang komprehensif dengan fitur Point of Sale (POS), manajemen inventori, analitik penjualan, dan dukungan multi-cabang. Dibangun dengan Laravel 12, React 19, dan Tailwind CSS 4.

## 📋 Deskripsi

**Retail & Service Management System** adalah aplikasi web full-stack yang dirancang untuk mengelola bisnis retail dan layanan jasa (seperti barbershop, fotocopy, dan bisnis serupa) dengan kemampuan multi-tenant. Aplikasi ini menyediakan solusi lengkap untuk mengelola penjualan, stok produk, layanan, karyawan, pelanggan, dan analitik bisnis dalam satu platform terintegrasi.

### Mengapa Aplikasi Ini Berguna?

- **Efisiensi Operasional**: Otomatisasi proses penjualan, inventori, dan pencatatan transaksi
- **Multi-Tenant**: Satu instalasi dapat melayani banyak bisnis dengan data yang terpisah dan aman
- **Multi-Branch**: Kelola beberapa cabang dari satu dashboard terpusat
- **Analitik Real-time**: Pantau performa bisnis dengan laporan dan grafik yang komprehensif
- **Manajemen Inventori Cerdas**: Tracking stok otomatis dengan alert dan transfer antar cabang
- **Fleksibel**: Cocok untuk berbagai jenis bisnis retail dan layanan jasa

## ✨ Fitur Utama

### 🏪 Point of Sale (POS)
- **Transaksi Penjualan**: Interface POS yang cepat dan intuitif untuk proses checkout
- **Multiple Payment Methods**: Mendukung cash, debit, credit, e-wallet, dan payment gateway
- **Invoice Generation**: Generate invoice otomatis untuk setiap transaksi
- **Return Management**: Kelola retur produk dengan mudah
- **Hardware Integration**: Dukungan untuk barcode scanner, thermal printer, dan cash drawer

### 📦 Manajemen Inventori
- **Product Management**: CRUD produk lengkap dengan kategori, harga, dan variasi
- **Stock Tracking**: Monitoring stok real-time per cabang
- **Stock Alerts**: Notifikasi otomatis untuk stok menipis
- **Stock Transfer**: Transfer stok antar cabang dengan tracking lengkap
- **Stock Movement History**: Riwayat pergerakan stok yang detail
- **Price History**: Tracking perubahan harga produk
- **Supplier Management**: Kelola supplier dan produk dari supplier

### 💈 Manajemen Layanan
- **Service Categories**: Kategorisasi layanan untuk kemudahan manajemen
- **Service Pricing**: Atur harga layanan dengan dynamic pricing rules
- **Appointments**: Sistem booking janji temu untuk layanan
- **Barber/Staff Scheduling**: Jadwal kerja karyawan dan booking
- **Service Checkout**: Proses pembayaran layanan yang terintegrasi

### 👥 Manajemen Pelanggan
- **Customer Profiles**: Database pelanggan dengan riwayat transaksi
- **Loyalty Program**: Sistem poin loyalitas untuk pelanggan setia
- **Customer Communication**: Fitur komunikasi dengan pelanggan
- **Customer Analytics**: Analisis perilaku dan preferensi pelanggan

### 📊 Analitik & Laporan
- **Sales Analytics**: Analisis penjualan harian, mingguan, bulanan, dan tahunan
- **Product Performance**: Laporan produk terlaris dan slow-moving
- **Revenue Reports**: Laporan pendapatan per cabang, kategori, atau periode
- **Staff Performance**: Tracking performa karyawan
- **Custom Reports**: Generate laporan sesuai kebutuhan bisnis

### 🏢 Multi-Tenant & Multi-Branch
- **Tenant Isolation**: Setiap tenant memiliki data yang terpisah dan aman
- **Branch Management**: Kelola beberapa cabang dalam satu tenant
- **Centralized Control**: Dashboard terpusat untuk semua cabang
- **Role-Based Access**: Kontrol akses berbasis role dan permission

### 👨‍💼 Manajemen Karyawan
- **User Management**: Kelola user dengan role dan permission
- **Shift Management**: Pengaturan shift kerja karyawan
- **Staff Schedules**: Jadwal kerja dan booking untuk staff
- **Activity Logs**: Tracking aktivitas user untuk audit trail

### 🔧 Konfigurasi & Pengaturan
- **Business Type**: Kustomisasi sesuai jenis bisnis
- **App Settings**: Konfigurasi aplikasi yang fleksibel
- **Payment Gateway**: Integrasi dengan Midtrans dan payment gateway lain
- **E-commerce Integration**: Integrasi dengan marketplace (Shopee, Tokopedia)
- **Backup & Restore**: Sistem backup otomatis dan manual

### 🔐 Keamanan
- **Authentication**: Laravel Sanctum untuk API authentication
- **Authorization**: Spatie Laravel Permission untuk role & permission management
- **Tenant Middleware**: Memastikan isolasi data antar tenant
- **Activity Logging**: Log semua aktivitas penting untuk audit

## 🛠️ Tech Stack

### Backend
- **Laravel 12** - PHP Framework
- **MySQL/PostgreSQL** - Database
- **Laravel Sanctum** - API Authentication
- **Spatie Laravel Permission** - Role & Permission Management
- **Picqer Barcode Generator** - Barcode Generation

### Frontend
- **React 19** - UI Library
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS 4** - Utility-First CSS Framework
- **Axios** - HTTP Client

### DevOps
- **Laravel Sail** - Docker Development Environment
- **Laravel Pint** - Code Style Fixer
- **PHPUnit** - Testing Framework

## 📋 Requirements

- PHP 8.2 or higher
- Composer
- Node.js 18+ & NPM
- MySQL 8.0+ or PostgreSQL 13+
- Redis (optional, for caching and queues)

## 📄 License

Proyek ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail lengkap.

## 👨‍💻 Developer

Dikembangkan dengan ❤️ untuk membantu bisnis retail dan layanan jasa berkembang lebih baik.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP Framework for Web Artisans
- [React](https://reactjs.org) - A JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission) - Associate users with roles and permissions
