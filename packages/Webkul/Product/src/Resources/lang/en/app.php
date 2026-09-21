<?php

return [
    'checkout' => [
        'cart' => [
            'integrity' => [
                'qty-missing' => 'ต้องมีสินค้าอย่างน้อย 1 รายการที่มีจำนวนมากกว่า 1 ชิ้น',
            ],

            'invalid-file-extension' => 'พบนามสกุลไฟล์ที่ไม่ถูกต้อง',
            'inventory-warning' => 'ไม่มีจำนวนสินค้าตามที่คำขอไว้ กรุณาลองใหม่อีกครั้งในภายหลัง',
            'missing-links' => 'ไม่พบลิงก์สำหรับดาวน์โหลดสำหรับสินค้านี้',
            'missing-options' => 'ยังไม่ได้เลือกตัวเลือกสำหรับสินค้านี้',
            'selected-products-simple' => 'สินค้าที่เลือกต้องเป็นประเภทสินค้าทั่วไป (Simple product)',
        ],
    ],

    'datagrid' => [
        'copy-of-slug' => 'copy-of-:value',
        'copy-of' => 'สำเนาของ :value',
        'variant-already-exist-message' => 'รูปแบบสินค้า (Variant) ที่มีตัวเลือกคุณลักษณะนี้มีอยู่แล้วในระบบ',
    ],

    'response' => [
        'product-can-not-be-copied' => 'ไม่สามารถคัดลอกสินค้าประเภท :type ได้',
    ],

    'sort-by' => [
        'options' => [
            'cheapest-first' => 'ราคา: ต่ำสุด - สูงสุด',
            'expensive-first' => 'ราคา: สูงสุด - ต่ำสุด',
            'from-a-z' => 'ชื่อ: A - Z',
            'from-z-a' => 'ชื่อ: Z - A',
            'latest-first' => 'มาใหม่ล่าสุด',
            'oldest-first' => 'เก่าที่สุด',
        ],
    ],

    'type' => [
        'abstract' => [
            'offers' => 'ซื้อ :qty ชิ้น ในราคาชิ้นละ :price ประหยัดทันที :discount',
        ],

        'bundle' => 'สินค้าจัดเซ็ต (Bundle)',
        'booking' => 'สินค้าประเภทการจอง (Booking)',
        'configurable' => 'สินค้ามีตัวเลือก (Configurable)',
        'downloadable' => 'สินค้าแบบดาวน์โหลด (Downloadable)',
        'grouped' => 'สินค้าจับกลุ่ม (Grouped)',
        'simple' => 'สินค้าทั่วไป (Simple)',
        'virtual' => 'สินค้าเสมือน/บริการ (Virtual)',
    ],
];
