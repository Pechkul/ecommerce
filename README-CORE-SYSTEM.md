# Guide: ขั้นตอนการติดตั้ง HatYaiBBGun POS & GraphQL API

---

## Requirements (สิ่งที่ต้องเตรียมในเครื่องปลายทาง)

* **PHP:** `>= 8.2` (เปิดใช้งาน Extension: `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `gd`, `fileinfo`)
* **Composer:** `>= 2.x`
* **Node.js:** `>= 18.x` & **NPM**
* **Database:** MySQL / MariaDB
* **Web Server Environment:** Laravel Herd, Laragon, หรือ Nginx/Apache local domains (`.test`)

---

## ส่วนที่ 1: การติดตั้ง Bagisto eCommerce (Core System)

### แตกไฟล์โครงการ (Unzip Project)

นำไฟล์ ZIP โครงการไปแตกไฟล์ลงในโฟลเดอร์ที่ต้องการรันระบบ เช่น `C:\Users\<User>\Documents\GitHub\hatyaibbgun` จากนั้นเปิด Terminal หรือ PowerShell แล้วย้ายตำแหน่งคำสั่งเข้าไปยังโฟลเดอร์โปรเจกต์:

```bash
cd path/to/hatyaibbgun

```

---

### ติดตั้ง Composer Packages

ดาวน์โหลดและติดตั้ง Dependencies ทั้งหมดของ PHP ที่จำเป็นสำหรับระบบ Laravel และ Bagisto:

```bash
composer install

```

---

### คัดลอกและตั้งค่าไฟล์ .env

สร้างไฟล์ตั้งค่าสภาพแวดล้อมโดยคัดลอกไฟล์ตัวอย่าง `.env.example` เป็น `.env`:

```bash
copy .env.example .env

```

เปิดไฟล์ `.env` แล้วกำหนดค่าพื้นฐานให้ตรงกับสภาพแวดล้อมเครื่องของคุณ:

* **`APP_URL`**: กำหนด Domain Local ของเครื่อง (เช่น `[https://hatyaibbgun.test](https://hatyaibbgun.test)`)
* **`DB_DATABASE`**: ชื่อฐานข้อมูลที่ต้องการใช้งาน (เช่น `hatyaibbgun`)
* **`DB_USERNAME`**: Username สำหรับเชื่อมต่อ MySQL
* **`DB_PASSWORD`**: Password สำหรับเชื่อมต่อ MySQL

---

### สร้าง Application Key

สุ่มสร้าง Encryption Key สำหรับใช้ในระบบรักษาความปลอดภัยของ Laravel:

```bash
php artisan key:generate

```

---

### เชื่อมโยง Storage Link

สร้าง Symbolic Link เชื่อมต่อระหว่างโฟลเดอร์เก็บไฟล์สื่อในระบบเข้ากับโฟลเดอร์ Public:

```bash
php artisan storage:link

```

---

### ติดตั้ง NPM และ Build Frontend Assets

ติดตั้ง Dependencies ฝั่ง JavaScript และสั่ง Compile ไฟล์ CSS/JS สำหรับหน้าเว็บ:

```bash
npm install
npm run build

```

---
