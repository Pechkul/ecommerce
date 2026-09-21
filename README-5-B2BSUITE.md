## 📌 ส่วนที่ 5: การติดตั้ง B2BSuite

### สิ่งที่ตั้งค่าและแนบมาให้แล้วในไฟล์ ZIP (สำหรับตรวจสอบ)

* **โฟลเดอร์ระบบ B2BSuite:** รวมไฟล์โมดูลทั้งหมดไว้ที่ `packages/Webkul/B2BSuite/src` เรียบร้อยแล้ว
* **`composer.json`:** เพิ่มการเชื่อมโยงระบบ `"Webkul\\B2BSuite\\": "packages/Webkul/B2BSuite/src"` ในส่วนของ `autoload` ไว้แล้ว
* **`bootstrap/providers.php`:** ลงทะเบียนการทำงาน `Webkul\B2BSuite\Providers\B2BSuiteServiceProvider::class` ไว้แล้ว
* **ระบบสิทธิ์และการตั้งค่า (ACL & Config):** รวมไฟล์ตั้งค่าบทบาทผู้ใช้งาน (B2B Buyer/Admin) และการกำหนดราคาพิเศษสำหรับลูกค้ารายใหญ่ (Tier Pricing) ไว้ครบถ้วน

---

### สั่งรันคำสั่งติดตั้ง B2BSuite บนเครื่องใหม่

เปิด Terminal แล้วรันคำสั่งเพื่อลงทะเบียนระบบ B2BSuite และ Migration ตารางข้อมูลลงฐานข้อมูล:

```bash
composer dump-autoload
php artisan b2bsuite:install