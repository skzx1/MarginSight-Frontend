// Price planning uses the catalog; a report about declining sales still uses actual orders.
export const isCatalogDiscountQuestion=(question:string)=>/ลดราคา|ส่วนลด|discount|ถ้า[^\n]*ลด|ลด\s*(?:-?\d|สิบ|ยี่สิบ)/i.test(question);
