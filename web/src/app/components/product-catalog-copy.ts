export const catalogCopy = {
  th: {
    intro: 'จัดการสินค้า ตรวจราคาและต้นทุนในที่เดียว', playgroundLink: 'ลองเงื่อนไขขายใน Playground', loaded: 'สินค้าที่โหลดแล้ว', missingPrice: 'ยังไม่มีราคา', missingCost: 'ยังไม่มีต้นทุน',
    filter: 'ตัวกรอง', sort: 'เรียงลำดับ', clearSearch: 'ล้างการค้นหา', placeholder: 'ค้นหาชื่อสินค้า หรือ SKU', active: 'ตัวกรองที่เลือก', remove: 'นำตัวกรองออก',
    allCosts: 'ต้นทุนทั้งหมด', costStatus: 'สถานะต้นทุน', onlyMissingCost: 'เฉพาะสินค้าที่ยังไม่มีต้นทุน', done: 'เสร็จสิ้น', close: 'ปิดแผง',
    results: 'รายการที่แสดง', of: 'จาก', items: 'รายการ', sortPrefix: 'เรียง:', searchChip: 'ค้นหา',
    emptyTitle: 'ยังไม่เจอสินค้าที่คุณหา', emptyBody: 'ลองใช้ชื่อสั้นลง หรือเปลี่ยนตัวกรองดูนะ', noProductsBody: 'เพิ่มสินค้าชิ้นแรก แล้วค่อยเติมราคาและต้นทุนเมื่อพร้อม',
    loading: 'กำลังโหลดสินค้า', updating: 'กำลังอัปเดตรายการ', loadedScope: 'นับเฉพาะรายการที่โหลดแล้ว', unknown: 'ยังไม่มีข้อมูล', details: 'เปิดรายละเอียด',
    nameAsc: 'ชื่อ: ก → ฮ', nameDesc: 'ชื่อ: ฮ → ก', costAsc: 'ต้นทุน: ต่ำไปสูง', costDesc: 'ต้นทุน: สูงไปต่ำ',
  },
  en: {
    intro: 'Products, prices and costs, in one place.', playgroundLink: 'Try selling scenarios in Playground', loaded: 'Loaded products', missingPrice: 'Missing price', missingCost: 'Missing cost',
    filter: 'Filter', sort: 'Sort', clearSearch: 'Clear search', placeholder: 'Search product name or SKU', active: 'Active filters', remove: 'Remove filter',
    allCosts: 'All costs', costStatus: 'Cost status', onlyMissingCost: 'Only products missing a cost', done: 'Done', close: 'Close panel',
    results: 'Showing', of: 'of', items: 'products', sortPrefix: 'Sorted:', searchChip: 'Search',
    emptyTitle: 'No products found this time', emptyBody: 'Try a shorter name or adjust your filters.', noProductsBody: 'Add your first product, then fill in its price and cost when you are ready.',
    loading: 'Loading products', updating: 'Updating products', loadedScope: 'Counts cover loaded products only', unknown: 'Not recorded', details: 'Open details',
    nameAsc: 'Name: A → Z', nameDesc: 'Name: Z → A', costAsc: 'Cost: low to high', costDesc: 'Cost: high to low',
  },
} as const;
