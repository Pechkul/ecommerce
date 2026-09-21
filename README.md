# eCommerce, B2BSuite & POS System

โปรเจกต์ระบบบริหารจัดการร้านค้าออนไลน์ B2B/B2C และระบบขายหน้าร้าน (Point of Sale) สำเร็จรูปในตัวเดียวกัน พัฒนาขึ้นเพื่อใช้งานภายในองค์กร เพื่อเชื่อมโยงการขายส่ง การขายหน้าร้าน และออนไลน์เข้าด้วยกันแบบไร้รอยต่อ

---

## ภาพรวมระบบ (Overview)

ระบบนี้ถูกพัฒนาและต่อยอดบนโครงสร้างหลักของ **Bagisto (Open Source Headless eCommerce Framework)** ร่วมกับส่วนขยาย **Bagisto B2BSuite**, **Bagisto POS** และ **Bagisto GraphQL API** เพื่อให้ครอบคลุมการทำงานทั้งการขายหน้าร้าน การขายส่งสำหรับลูกค้าองค์กร และการขายผ่านหน้าเว็บออนไลน์

---

## คุณสมบัติและความสามารถหลัก (Features)

### ระบบร้านค้าออนไลน์และขายส่ง (Bagisto Core & B2BSuite)

* **Product & Inventory Management:** รองรับสินค้าหลากหลายประเภท (Simple, Configurable, Bundle, Grouped, Virtual, Booking) พร้อมระบบจัดการคลังสินค้า
* **B2B Wholesale Capabilities:** รองรับการขายส่งเต็มรูปแบบ ระบบราคาส่งตามปริมาณ (Tier Pricing), การสมัครสมาชิกองค์กร, ระบบเครดิตเทอม และพอร์ตัลจัดการสำหรับลูกค้ารายใหญ่ (B2B Customer Portal)
* **Multi-Channel & Multi-Currency:** รองรับการขายหลายช่องทาง สลับสกุลเงิน และระบบหลายภาษา
* **Marketing & Customer Management:** ระบบสมัครสมาชิก ประวัติการสั่งซื้อ คูปองส่วนลด การจัดโปรโมชัน และระบบส่งอีเมลแจ้งเตือน

### ระบบขายหน้าร้าน (Bagisto POS Extension)

* **Real-time Sync:** เชื่อมโยงข้อมูลสินค้า สต็อก และคำสั่งซื้อระหว่างหน้าร้านและออนไลน์แบบเรียลไทม์
* **Multi-Outlet Support:** รองรับการจัดการหลายสาขาและหลายจุดขาย (Drawer/Register)
* **Cart & Payment Handling:** ระบบถือตะกร้าสินค้าชั่วคราว (Hold/Resume Cart) และรองรับการชำระเงินทั้งเงินสด บัตรเครดิต หรือการเพิ่มรายการสินค้าแบบกำหนดเอง (Custom Product)
* **Thermal Printing & Thai Font Support:** ระบบสร้างและสแกนบาร์โค้ด พิมพ์สลิปใบเสร็จรับเงินขนาด 80mm (Thermal Printer 80x80mm) **รองรับฟอนต์ภาษาไทย Noto Sans Thai สมบูรณ์แบบ** (ทดสอบการแสดงผลบนเอกสาร PDF เรียบร้อยแล้ว)

### ระบบเชื่อมต่อ API (GraphQL API Extension)

* **Headless Architecture:** รองรับการเชื่อมต่อกับแอปพลิเคชันภายนอก ทั้ง Mobile App และ Frontend อื่นๆ ผ่าน **GraphQL Endpoint (`/graphql`)** (ทดสอบการทำงานกับ GraphQL API เรียบร้อยแล้ว)
* **High Performance:** รับ-ส่งข้อมูลได้อย่างรวดเร็วและปลอดภัยด้วยมาตรฐาน Lighthouse GraphQL

---

## โครงสร้างคู่มือการติดตั้ง (Documentation Index)

คู่มือการติดตั้งระบบถูกแบ่งออกเป็นส่วนๆ อย่างชัดเจน เพื่อความสะดวกในการตั้งค่าบนเครื่องใหม่ (Local / Production Environment):

* **[ส่วนที่ 1: การติดตั้ง Bagisto eCommerce (Core System)](README-CORE-SYSTEM.md)**
* **[ส่วนที่ 2: การนำเข้าฐานข้อมูล (Database Import)](README-DATABASE-BACKUP.md)**
* **[ส่วนที่ 3: การติดตั้งและตั้งค่า GraphQL API](README-GRAPHQL.md)**
* **[ส่วนที่ 4: การตั้งค่าระบบ POS (Point of Sale)](README-POS.md)**
* **[ส่วนที่ 5: การติดตั้ง B2BSuite](README-B2BSUITE.md)**

---

## Requirements (สิ่งที่ต้องมีในเครื่อง)

* **PHP:** `>= 8.2`
* **Composer:** `>= 2.x`
* **Node.js:** `>= 18.x` & **NPM**
* **Database:** MySQL / MariaDB
* **Web Server Environment:** Laragon, Laravel Herd หรือ Local Domain (`.test`)