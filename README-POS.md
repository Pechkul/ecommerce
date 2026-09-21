## 📌 ส่วนที่ 4: การตั้งค่าระบบ POS (Point of Sale)

### สิ่งที่ตั้งค่าและแนบมาให้แล้วในไฟล์ ZIP (สำหรับตรวจสอบ)

* **โฟลเดอร์ระบบ POS:** รวมไฟล์ทั้งหมดไว้ที่ `packages/Webkul/Pos/src` เรียบร้อยแล้ว
* **`composer.json`:** เพิ่มการเชื่อมโยงระบบ `"Webkul\\Pos\\": "packages/Webkul/Pos/src"` ไว้แล้ว
* **`bootstrap/providers.php`:** ลงทะเบียนการทำงาน `Webkul\Pos\Providers\PosServiceProvider::class` ไว้แล้ว
* **`app/Providers/AppServiceProvider.php`:** ใส่โค้ดข้ามการตรวจ SSL บนเครื่อง Local ไว้แล้ว ช่วยให้ดึงรูปภาพมาแสดงบนสลิปใบเสร็จได้โดยไม่ติดข้อผิดพลาดดังนี้

```php
public function boot(): void
{
    if ($this->app->environment('local')) {
        stream_context_set_default([
            'ssl' => [
                'verify_peer'      => false,
                'verify_peer_name' => false,
            ],
        ]);
    }
}
```

* **`resources/views/`:** ลงทะเบียนฟอนต์ภาษาไทย (`THSarabunNew` / `Sarabun`) และจัดรูปแบบสลิปขนาด 80mm

---

### สั่งรันคำสั่งติดตั้ง POS บนเครื่องใหม่

เปิด Terminal แล้วรันคำสั่งเพื่อลงทะเบียนระบบและสร้างตารางข้อมูล POS:

```bash
composer dump-autoload
php artisan pos:install

```

---

### ล้างแคชและประกอบไฟล์หน้าเว็บ

สั่งอัปเดตไฟล์ฝั่งหน้าเว็บและเคลียร์แคชทั้งหมดของระบบ:

```bash
npm run build
php artisan optimize:clear

```

---

### การเข้าใช้งานระบบ POS

* **หน้าร้าน POS:** `https://hatyaibbgun.test/pos`
* **ระบบหลังร้าน (Admin):** `https://hatyaibbgun.test/admin` (สำหรับจัดการเครื่อง EDC, พนักงานขาย, และคลังสินค้า)

---
