'use client';

import { useId, useRef, useState } from 'react';
import { useLanguage } from '../language';
import { Icon } from '../ui';
import { ErrorNotice } from './forms';
import { money, bangkokDate, dateAt } from '../../lib/format';
import { request } from '../../lib/auth';
import {importProductRows,type ImportCheckpoint} from '../../lib/product-import-service';
import type { CatalogProduct, FeatureProps } from '../../lib/types';
import {
  parseCsvText,
  processProductCsv,
  generateProductCsvTemplate,
  generateProductCsvSample,
  generateErrorReportCsv,
  triggerBlobDownload,
  cleanNumberText,
  parseAmountToSatang,
  parseQuantity,
  type CsvProductRow,
  type CsvParseResult,
  type DuplicatePolicy
} from '../../lib/product-csv';

interface ProductCsvImportProps extends FeatureProps {
  existingProducts?: CatalogProduct[];
  onImportComplete: (imported: CatalogProduct[]) => void;
  onNavigateToProducts: () => void;
}

export default function ProductCsvImport({
  base,
  origin,
  existingProducts = [],
  onImportComplete,
  onNavigateToProducts
}: ProductCsvImportProps) {
  const { t, locale } = useLanguage();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkpoints = useRef(new Map<number,ImportCheckpoint>());

  // Flow states
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip');

  // Editing state for inline edits
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editSku, setEditSku] = useState('');

  // Execution states
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importSkippedCount, setImportSkippedCount] = useState<number>(0);
  const [importError, setImportError] = useState<string | null>(null);

  // Handle incoming file
  const handleFile = async (selectedFile: File) => {
    setImportError(null);
    setImportSuccessCount(null);

    // Limit checks
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setImportError('กรุณาเลือกไฟล์ที่มีนามสกุล .csv เท่านั้น');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setImportError('ขนาดไฟล์เกิน 5 MB กรุณาลดขนาดไฟล์ก่อนนำเข้า');
      return;
    }

    checkpoints.current.clear();
    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const rawRows = parseCsvText(text);
      const processed = processProductCsv(rawRows, existingProducts, duplicatePolicy);
      setParseResult(processed);
    } catch {
      setImportError('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ CSV รูปแบบ UTF-8 ที่ถูกต้อง');
    }
  };

  // Re-run validation when duplicate policy changes
  const handlePolicyChange = (newPolicy: DuplicatePolicy) => {
    setDuplicatePolicy(newPolicy);
    if (parseResult) {
      // Re-map rows
      const rowsHeader = [
        ['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน', 'รหัสสินค้า', 'หน่วย'],
        ...parseResult.rows.map(r => [
          r.name,
          r.sellingPriceText,
          r.quantityText,
          r.costText,
          r.skuText,
          r.unitText
        ])
      ];
      const reprocessed = processProductCsv(rowsHeader, existingProducts, newPolicy);
      setParseResult(reprocessed);
    }
  };

  // Start inline editing a row
  const startEditRow = (row: CsvProductRow) => {
    setEditingIndex(row.index);
    setEditName(row.name);
    setEditPrice(row.sellingPriceText);
    setEditCost(row.costText);
    setEditQty(row.quantityText);
    setEditSku(row.skuText || row.sku);
  };

  // Save inline edits
  const saveInlineEdit = (rowIndex: number) => {
    if (!parseResult) return;
    const updatedRows = parseResult.rows.map(r => {
      if (r.index !== rowIndex) return r;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate edited Name
      const cleanName = editName.trim();
      if (!cleanName) {
        errors.push(`แถว ${rowIndex}: ไม่ได้ระบุชื่อสินค้า`);
      }

      // Validate edited Price
      const priceParsed = parseAmountToSatang(editPrice);
      if (!editPrice.trim()) {
        errors.push(`แถว ${rowIndex}: ไม่ได้ระบุราคาขาย`);
      } else if (priceParsed.error) {
        errors.push(`แถว ${rowIndex}: ราคาขาย ${priceParsed.error}`);
      }

      // Validate edited Cost
      let costSatang: number | null = null;
      if (!editCost.trim()) {
        warnings.push('ยังไม่ระบุต้นทุน (จะยังคำนวณกำไรไม่ได้)');
      } else {
        const costParsed = parseAmountToSatang(editCost);
        if (costParsed.error) {
          errors.push(`แถว ${rowIndex}: ต้นทุน ${costParsed.error}`);
        } else {
          costSatang = costParsed.satang;
        }
      }

      // Price vs Cost warning
      if (priceParsed.satang != null && costSatang != null && priceParsed.satang < costSatang) {
        warnings.push(`ราคาขายต่ำกว่าต้นทุน (ขาย ฿${money(priceParsed.satang)} < ทุน ฿${money(costSatang)})`);
      }

      // Validate Quantity
      const qtyParsed = parseQuantity(editQty);
      if (qtyParsed.error) {
        errors.push(`แถว ${rowIndex}: ${qtyParsed.error}`);
      }

      // Validate SKU
      const cleanSku = editSku.trim();
      if (cleanSku && !/^[A-Za-z0-9_.-]{1,100}$/.test(cleanSku)) {
        errors.push(`แถว ${rowIndex}: รหัสสินค้า (SKU) ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข ขีด (-) จุด (.) เท่านั้น`);
      }

      const status: 'valid' | 'warning' | 'error' =
        errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

      return {
        ...r,
        name: cleanName,
        sellingPriceText: editPrice.trim(),
        costText: editCost.trim(),
        quantityText: editQty.trim(),
        skuText: cleanSku,
        sku: cleanSku || r.sku,
        sellingPriceSatang: priceParsed.satang,
        costSatang,
        quantity: qtyParsed.quantity ?? 1,
        status,
        errors,
        warnings
      };
    });

    const validCount = updatedRows.filter(r => r.status === 'valid').length;
    const warningCount = updatedRows.filter(r => r.status === 'warning').length;
    const errorCount = updatedRows.filter(r => r.status === 'error').length;

    setParseResult({
      ...parseResult,
      rows: updatedRows,
      validCount,
      warningCount,
      errorCount
    });
    setEditingIndex(null);
  };

  // Execute import of valid + warning rows
  const handleExecuteImport = async () => {
    if (!parseResult) return;
    setIsImporting(true);
    setImportError(null);

    // Filter rows eligible for import (valid + warning)
    const importableRows = parseResult.rows.filter(r => r.status !== 'error');
    if (!importableRows.length) {
      setImportError('ไม่มีรายการที่พร้อมนำเข้า กรุณาแก้ไขข้อผิดพลาดในตารางก่อนดำเนินการ');
      setIsImporting(false);
      return;
    }

    setImportProgress({ current: 0, total: importableRows.length });
    try {
      const result=await importProductRows(request,base,importableRows,existingProducts,duplicatePolicy,origin,dateAt(bangkokDate()),checkpoints.current,current=>setImportProgress({current,total:importableRows.length}));
      if(result.products.length)onImportComplete(result.products);
      setImportSkippedCount(result.skipped);
      if(result.failures.length){
        const details=result.failures.slice(0,10).map(f=>locale==='th'?'แถว '+f.index+': '+f.code+(f.productSaved?' (บันทึกสินค้าแล้ว แต่ต้นทุนยังไม่สำเร็จ)':''):'Row '+f.index+': '+f.code+(f.productSaved?' (product saved; cost incomplete)':'')).join(' · ')+(result.failures.length>10?' · …':'');
        setImportError((locale==='th'?'บันทึกครบ '+result.completed+' รายการ มี '+result.failures.length+' แถวที่ต้องแก้หรือลองใหม่ กดนำเข้าอีกครั้งเพื่อลองเฉพาะรายการที่ยังไม่สำเร็จ: ':'Saved '+result.completed+' rows; retry incomplete rows: ')+details);
      }else setImportSuccessCount(result.completed);
    }catch(error){setImportError(error instanceof Error?error.message:'IMPORT_FAILED');}
    finally{setIsImporting(false);setImportProgress(null);}
  };

  // Reset to import another file
  const handleReset = () => {
    checkpoints.current.clear();
    setFile(null);
    setParseResult(null);
    setImportSuccessCount(null);
    setImportSkippedCount(0);
    setImportError(null);
    setEditingIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download handlers
  const handleDownloadTemplate = () => {
    const blob = generateProductCsvTemplate();
    triggerBlobDownload(blob, 'MarginShot-Product-Template.csv');
  };

  const handleDownloadSample = () => {
    const blob = generateProductCsvSample();
    triggerBlobDownload(blob, 'MarginShot-Product-Sample.csv');
  };

  const handleDownloadErrors = () => {
    if (!parseResult) return;
    const failed = parseResult.rows.filter(r => r.status === 'error');
    const blob = generateErrorReportCsv(failed);
    triggerBlobDownload(blob, 'MarginShot-Import-Errors.csv');
  };

  // --- RENDER SUCCESS STATE ---
  if (importSuccessCount !== null) {
    return (
      <div className="csv-success-container panel" role="status" aria-live="polite">
        <div className="success-banner">
          <span className="success-icon" aria-hidden="true">
            <Icon name="check" />
          </span>
          <div>
            <h3>{t('csvImportSuccessTitle')}</h3>
            <p>
              นำเข้าสำเร็จ <strong>{importSuccessCount}</strong> {t('itemsUnit')}
              {importSkippedCount > 0 && ` (ข้ามรายการซ้ำ ${importSkippedCount} รายการ)`}
            </p>
          </div>
        </div>

        <p className="notice">{locale==='th'?'บันทึก SKU ชื่อสินค้า หน่วยขาย และต้นทุนเท่านั้น ราคาขายและจำนวนในไฟล์ใช้ตรวจร่าง ยังไม่ถูกบันทึกเป็นราคาขายหรือสต็อก และไม่ใช่กำไรสุทธิ':'Saves SKU, name, selling unit and cost only. CSV prices and quantities are draft checks, not saved sale prices, inventory or net profit.'}</p>
        <div className="csv-success-actions">
          <button type="button" onClick={onNavigateToProducts} className="primary-btn">
            <Icon name="products" />
            <span>{t('goToProductsPage')}</span>
          </button>
          <button type="button" onClick={handleReset} className="secondary">
            <Icon name="refresh" />
            <span>{t('importNewCsvAction')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="csv-import-flow" role="region" aria-label={t('addCsvTab')}>
      <p className="notice">{locale==='th'?'บันทึก SKU ชื่อสินค้า หน่วยขาย และต้นทุนเท่านั้น ราคาขายและจำนวนในไฟล์ใช้ตรวจร่าง ยังไม่ถูกบันทึกเป็นราคาขายหรือสต็อก และไม่ใช่กำไรสุทธิ':'Saves SKU, name, selling unit and cost only. CSV prices and quantities are draft checks, not saved sale prices, inventory or net profit.'}</p>
      {/* 3-Step Merchant Hint */}
      <ol className="steps" aria-label="ขั้นตอนการนำเข้าสินค้าจาก CSV">
        <li className={!file ? 'current' : ''}>
          <span>1</span>
          {t('csvStep1')}
        </li>
        <li className={file && !parseResult ? 'current' : ''}>
          <span>2</span>
          {t('csvStep2')}
        </li>
        <li className={parseResult ? 'current' : ''}>
          <span>3</span>
          {t('csvStep3')}
        </li>
      </ol>

      {/* Global Error Banner */}
      {importError && (
        <div className="notice error-notice" role="alert">
          <strong>{t('errorTitle')}</strong>
          <p>{importError}</p>
        </div>
      )}

      {/* Top Template Download Links */}
      <div className="csv-template-bar">
        <span className="caption">ต้องการไฟล์ตัวอย่างก่อนเริ่มต้น?</span>
        <div className="csv-template-buttons">
          <button
            type="button"
            className="secondary"
            onClick={handleDownloadTemplate}
          >
            <Icon name="upload" />
            <span>{t('downloadTemplateBtn')}</span>
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handleDownloadSample}
          >
            <Icon name="sparkles" />
            <span>{t('downloadSampleBtn')}</span>
          </button>
        </div>
      </div>

      {/* Drop Zone (Only when no file parsed yet or want to re-upload) */}
      {!parseResult && (
        <div
          className={`csv-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) void handleFile(dropped);
          }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={t('csvDropzoneTitle')}
        >
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={e => {
              const selected = e.target.files?.[0];
              if (selected) void handleFile(selected);
            }}
          />
          <div className="dropzone-content">
            <span className="dropzone-icon" aria-hidden="true">
              <Icon name="upload" />
            </span>
            <strong className="dropzone-title">{t('csvDropzoneTitle')}</strong>
            <p className="dropzone-mobile-btn">{t('csvDropzoneMobile')}</p>
            <small className="dropzone-hint">{t('csvFileLimitNote')}</small>
          </div>
        </div>
      )}

      {/* File Parsing Error */}
      {parseResult?.fileError && (
        <div className="notice error-notice" role="alert">
          <strong>{t('errorTitle')}</strong>
          <p>{parseResult.fileError}</p>
          <div className="actions" style={{ marginTop: '12px' }}>
            <button type="button" className="secondary" onClick={handleReset}>
              {t('importNewCsvAction')}
            </button>
            <button type="button" className="secondary" onClick={handleDownloadTemplate}>
              {t('downloadTemplateBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Preview Table & Management (When rows successfully parsed) */}
      {parseResult && !parseResult.fileError && (
        <section className="csv-preview-section panel" aria-label="ตรวจสอบรายการสินค้าก่อนนำเข้า">
          {/* Summary Strip & Duplicate Selector */}
          <div className="csv-preview-header">
            <div>
              <h2>ตรวจสอบข้อมูล ({parseResult.totalRows} รายการ)</h2>
              <div className="csv-summary-badges" role="status" aria-live="polite">
                <span className="badge badge-success">
                  <Icon name="check" /> {t('readyToImportCount')} {parseResult.validCount}
                </span>
                {parseResult.warningCount > 0 && (
                  <span className="badge calm-warning">
                    ⚠ {t('warningCountLabel')} {parseResult.warningCount}
                  </span>
                )}
                {parseResult.errorCount > 0 && (
                  <span className="badge badge-danger">
                    ✗ {t('errorCountLabel')} {parseResult.errorCount}
                  </span>
                )}
              </div>
            </div>

            {/* Duplicate Strategy Option */}
            <div className="duplicate-policy-box">
              <label htmlFor="dup-select" className="caption">
                <strong>{t('duplicatePolicyLabel')}:</strong>
              </label>
              <select
                id="dup-select"
                value={duplicatePolicy}
                onChange={e => handlePolicyChange(e.target.value as DuplicatePolicy)}
                disabled={isImporting}
                className="duplicate-select"
              >
                <option value="skip">{t('duplicateSkip')}</option>
                <option value="update">{t('duplicateUpdate')}</option>
                <option value="new">{t('duplicateNew')}</option>
              </select>
            </div>
          </div>

          {/* Desktop Preview Table */}
          <div className="csv-table-scroll-container">
            <table className="csv-preview-table" aria-label="ตารางตรวจสอบสินค้าก่อนนำเข้า">
              <thead>
                <tr>
                  <th style={{ width: '48px' }}>#</th>
                  <th>สถานะ</th>
                  <th>ชื่อสินค้า</th>
                  <th style={{ textAlign: 'right' }}>ราคาขาย</th>
                  <th style={{ textAlign: 'right' }}>ต้นทุน</th>
                  <th style={{ textAlign: 'right' }}>จำนวน</th>
                  <th>รหัสสินค้า (SKU)</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.rows.map(row => {
                  const isEditing = editingIndex === row.index;

                  if (isEditing) {
                    return (
                      <tr key={row.index} className="editing-row">
                        <td>{row.index}</td>
                        <td>
                          <span className="badge">กำลังแก้ไข</span>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="ชื่อสินค้า"
                            className="inline-input"
                            aria-label={`แก้ไขชื่อแถว ${row.index}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            placeholder="0.00"
                            className="inline-input"
                            style={{ textAlign: 'right' }}
                            aria-label={`แก้ไขราคาขายแถว ${row.index}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editCost}
                            onChange={e => setEditCost(e.target.value)}
                            placeholder="0.00"
                            className="inline-input"
                            style={{ textAlign: 'right' }}
                            aria-label={`แก้ไขต้นทุนแถว ${row.index}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                            placeholder="1"
                            className="inline-input"
                            style={{ textAlign: 'right', width: '70px' }}
                            aria-label={`แก้ไขจำนวนแถว ${row.index}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editSku}
                            onChange={e => setEditSku(e.target.value)}
                            placeholder="SKU"
                            className="inline-input"
                            aria-label={`แก้ไขรหัสแถว ${row.index}`}
                          />
                        </td>
                        <td>
                          <div className="inline-action-btns">
                            <button
                              type="button"
                              className="inline-btn save-btn"
                              onClick={() => saveInlineEdit(row.index)}
                            >
                              {t('saveRow')}
                            </button>
                            <button
                              type="button"
                              className="inline-btn cancel-btn"
                              onClick={() => setEditingIndex(null)}
                            >
                              {t('cancelEdit')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={row.index}
                      className={
                        row.status === 'error'
                          ? 'row-status-error'
                          : row.status === 'warning'
                          ? 'row-status-warning'
                          : ''
                      }
                    >
                      <td className="row-num">{row.index}</td>
                      <td>
                        {row.status === 'valid' && (
                          <span className="badge badge-success">
                            ✓ {t('rowValidBadge')}
                          </span>
                        )}
                        {row.status === 'warning' && (
                          <span className="badge calm-warning">
                            ⚠ {t('rowWarnBadge')}
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span className="badge badge-danger">
                            ✗ {t('rowErrorBadge')}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong className="product-table-name">{row.name || '—'}</strong>
                        {row.warnings.map((w, i) => (
                          <small key={i} className="row-msg-warning">
                            ⚠ {w}
                          </small>
                        ))}
                        {row.errors.map((e, i) => (
                          <small key={i} className="row-msg-error">
                            ✗ {e}
                          </small>
                        ))}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tabular-num">
                        {row.sellingPriceSatang != null ? (
                          '฿' + money(row.sellingPriceSatang, locale)
                        ) : (
                          <span className="muted">{row.sellingPriceText || '—'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tabular-num">
                        {row.costSatang != null ? (
                          '฿' + money(row.costSatang, locale)
                        ) : (
                          <span className="calm-warning-inline">ยังไม่ระบุ</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tabular-num">
                        {row.quantity ?? '—'} {row.unit}
                      </td>
                      <td>
                        <span className="sku-sub">{row.sku}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ghost edit-row-btn"
                          onClick={() => startEditRow(row)}
                          disabled={isImporting}
                          aria-label={`แก้ไขแถวที่ ${row.index}`}
                        >
                          {t('editRow')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (Screen width <= 768px) */}
          <div className="csv-mobile-card-list" aria-label="รายการสินค้าที่ตรวจพบ">
            {parseResult.rows.map(row => (
              <div
                key={row.index}
                className={`csv-mobile-card ${
                  row.status === 'error'
                    ? 'card-error'
                    : row.status === 'warning'
                    ? 'card-warning'
                    : ''
                }`}
              >
                <div className="card-top-row">
                  <span className="card-index">#{row.index}</span>
                  <div>
                    {row.status === 'valid' && (
                      <span className="badge badge-success">✓ {t('rowValidBadge')}</span>
                    )}
                    {row.status === 'warning' && (
                      <span className="badge calm-warning">⚠ {t('rowWarnBadge')}</span>
                    )}
                    {row.status === 'error' && (
                      <span className="badge badge-danger">✗ {t('rowErrorBadge')}</span>
                    )}
                  </div>
                </div>

                <h3 className="card-product-name">{row.name || '—'}</h3>
                <span className="sku-sub">{row.sku}</span>

                <dl className="card-details-grid">
                  <div>
                    <dt>ราคาขาย</dt>
                    <dd className="tabular-num">
                      {row.sellingPriceSatang != null
                        ? '฿' + money(row.sellingPriceSatang, locale)
                        : row.sellingPriceText || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>ต้นทุน</dt>
                    <dd className="tabular-num">
                      {row.costSatang != null ? (
                        '฿' + money(row.costSatang, locale)
                      ) : (
                        <span className="calm-warning-inline">ยังไม่ระบุ</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>จำนวน</dt>
                    <dd className="tabular-num">
                      {row.quantity ?? '—'} {row.unit}
                    </dd>
                  </div>
                </dl>

                {row.warnings.map((w, i) => (
                  <p key={i} className="row-msg-warning">
                    ⚠ {w}
                  </p>
                ))}
                {row.errors.map((e, i) => (
                  <p key={i} className="row-msg-error">
                    ✗ {e}
                  </p>
                ))}

                <button
                  type="button"
                  className="secondary edit-card-btn"
                  onClick={() => startEditRow(row)}
                  disabled={isImporting}
                >
                  {t('editRow')}
                </button>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="csv-bottom-actions">
            {/* Primary Action Button */}
            <button
              type="button"
              className="primary-btn"
              onClick={() => void handleExecuteImport()}
              disabled={isImporting || parseResult.validCount + parseResult.warningCount === 0}
            >
              <Icon name="check" />
              <span>
                {isImporting && importProgress
                  ? `กำลังนำเข้า ${importProgress.current}/${importProgress.total}…`
                  : `${t('importProductsAction')} ${parseResult.validCount + parseResult.warningCount} ${t('itemsUnit')}`}
              </span>
            </button>

            {/* Error Report Download (if any errors exist) */}
            {parseResult.errorCount > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={handleDownloadErrors}
                disabled={isImporting}
              >
                <Icon name="upload" />
                <span>{t('downloadErrorReportBtn')} ({parseResult.errorCount})</span>
              </button>
            )}

            {/* Re-choose File Button */}
            <button
              type="button"
              className="ghost"
              onClick={handleReset}
              disabled={isImporting}
            >
              {t('importNewCsvAction')}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
