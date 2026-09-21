## ส่วนที่ 3: การติดตั้งและตั้งค่า GraphQL API

### รายละเอียดการกำหนดค่า GraphQL ที่มีอยู่ในไฟล์ ZIP (สำหรับตรวจสอบ)

ในไฟล์โครงการที่ถูกคัดลอกมา มีการติดตั้งและตั้งค่าแพ็กเกจ Bagisto GraphQL API ไว้เรียบร้อยแล้ว ดังนี้:

* **`composer.json`**: มีการระบุ Package หลักอย่าง `bagisto/graphql-api` และ `nuwave/lighthouse` ไว้ในส่วน `require` เรียบร้อยแล้ว ไม่จำเป็นต้องสั่ง `composer require` เพิ่มเติม
* **`config/graphql.php` & `config/lighthouse.php**`: มีการปรับแต่ง Endpoint หลักให้ชี้ไปที่ `/graphql` พร้อมกำหนดค่า Guard/Authentication สำหรับการยืนยันตัวตนของ Customer และ Admin
* **`graphql/` (Root Directory)**: มีไฟล์ Schema หลัก (เช่น `schema.graphql`) และการแยกประเภท Query/Mutation ของ Bagisto ที่พร้อมรันร่วมกับฐานข้อมูล

---

### Publish Assets และ GraphQL Schema

สั่ง install ไฟล์ที่เกี่ยวข้องกับการใช้งาน graphql (ระวังปัญหาจากการ migrate database ถ้ามีไฟล์ migrations ใดซ้ำให้ลบออก)
สั่ง Publish ไฟล์ Schema และ Configuration ต่างๆ เพื่ออัปเดตไฟล์สเปกของ GraphQL ลงสู่โฟลเดอร์ทำงานของเครื่องใหม่:

```bash
compose install
php artisan bagisto-graphql:install

php artisan vendor:publish --tag=lighthouse-schema --force
php artisan vendor:publish --tag=graphql-schema --force

```

---

### Dump Autoload เพื่ออัปเดต Class ในระบบ

อัปเดตการโหลด Class และ Mapping ของแพ็กเกจ GraphQL ให้ PHP ในเครื่องใหม่รับรู้โครงสร้างล่าสุด:

```bash
composer dump-autoload

```

---

### ตรวจสอบและลบไฟล์ Compiled Schema ค้างเก่า

หากในไฟล์ ZIP มีไฟล์ Compiled Schema ที่ถูกสร้างสะสมไว้จากเครื่องต้นทาง ให้เข้าไปตรวจสอบและลบไฟล์นี้ออกเพื่อให้ระบบสร้างขึ้นใหม่แบบไดนามิก:

* **ตำแหน่งไฟล์ที่ต้องตรวจสอบ:** `bootstrap/cache/lighthouse-schema.php`
  *(หากพบไฟล์นี้อยู่ในโฟลเดอร์ ให้ทำการกดลบไฟล์ทิ้งทันที แต่หากไม่พบ สามารถข้ามไปขั้นตอนถัดไปได้)*

---

### เคลียร์ Schema Cache ของ Lighthouse และ Laravel

สั่งล้างแคชของ GraphQL และ Laravel เพื่อบังคับให้ระบบสร้าง Schema Structure ใหม่ให้สอดคล้องกับเครื่องปัจจุบัน:

```bash
php artisan lighthouse:clear-cache
php artisan optimize:clear

```

---
