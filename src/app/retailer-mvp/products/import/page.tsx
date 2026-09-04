'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  readProductImportFile,
  type ProductImportReadResult,
} from '@/services/importer/product-import-reader';
import {
  suggestProductImportMappings,
  getProductImportTargetFields,
  getRequiredProductImportFields,
  mapProductImportRows,
} from '@/services/importer/product-import-mapper';
import type { ProductImportMapping, ProductImportPreviewResult, ProductImportRow } from '@/types/importer/product-import';
import { previewBulkProductImport, createBulkProductImportJob, updateBulkProductImportJob, executeBulkProductImport } from '../import-actions';

const PRODUCT_FIELD_LABELS: Record<string, string> = { name: 'Product Name', category: 'Category', price: 'Price', currency: 'Currency', retailerSku: 'Retailer SKU', barcode: 'Barcode', gtin: 'GTIN', brand: 'Brand', description: 'Description', subcategory: 'Subcategory', department: 'Department', promotionalPrice: 'Promotional Price', imageUrl: 'Image URL' };

const CONFIDENCE_LABELS: Record<string, string> = { HIGH: 'High confidence', MEDIUM: 'Medium confidence', LOW: 'Low confidence' };

function downloadImportErrorReport(
  readResult: ProductImportReadResult,
  previewResult: ProductImportPreviewResult,
  executionErrors: ProductImportRow[]
) {
  const rows = [
    ...previewResult.rows.filter((row) => row.status === "REJECTED"),
    ...executionErrors,
  ].filter(
    (row, index, allRows) =>
      allRows.findIndex((candidate) => candidate.rowNumber === row.rowNumber) === index
  );

  if (rows.length === 0) return;

  const sourceRows = new Map(
    readResult.rows.map((row) => [row.rowNumber, row.values])
  );

  const headers = [
    ...readResult.columns,
    "Row Number",
    "Status",
    "Issue Code",
    "Issue Message",
  ];

  const escapeCsv = (value: unknown) =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => {
      const source = sourceRows.get(row.rowNumber) || {};
      return [
        ...readResult.columns.map((column) => source[column]),
        row.rowNumber,
        row.status,
        row.issues.map((issue) => issue.code).join("; "),
        row.issues.map((issue) => issue.message).join("; "),
      ].map(escapeCsv).join(",");
    }),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "iNteract-import-errors.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function BulkProductImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const retailerId = user?.retailerId || 'unknown';

  const [file, setFile] = useState<File | null>(null);
  const [readResult, setReadResult] =
    useState<ProductImportReadResult | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [mappings, setMappings] = useState<ProductImportMapping[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [previewResult, setPreviewResult] = useState<ProductImportPreviewResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<Awaited<ReturnType<typeof executeBulkProductImport>> | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importStage, setImportStage] = useState<"idle" | "validating" | "importing" | "finalising" | "complete">("idle");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setReadResult(null);
    setPreviewResult(null);
    setIsReading(true);

    try {
      const result = await readProductImportFile(selectedFile);
      setReadResult(result);
    } catch (error) {
      setFile(null);

      toast({
        title: 'Import File Error',
        description:
          error instanceof Error
            ? error.message
            : 'The import file could not be read.',
        variant: 'destructive',
      });
    } finally {
      setIsReading(false);
    }

    event.target.value = '';
  };

  const clearFile = () => {
    setFile(null);
    setReadResult(null);
    setPreviewResult(null);
    setMappings([]);
    setShowMapping(false);
  };

  const buildInitialMappings = (columns: string[]): ProductImportMapping[] => {
    const suggestions = suggestProductImportMappings(columns);
    const suggestionMap = new Map(suggestions.map((item) => [item.sourceColumn, item.targetField]));

    return columns.filter((column) => column.trim() !== '').map((sourceColumn) => ({
      sourceColumn,
      targetField: suggestionMap.get(sourceColumn) || '',
    }));
  };

  const startMapping = () => {
    if (!readResult) return;

    setMappings(buildInitialMappings(readResult.columns));

    setShowMapping(true);
  };

  const handleContinueToValidation = async () => {
    if (!readResult || mappingHasConflicts) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in again before continuing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImportStage("validating");
      const idToken = await user.getIdToken();

      const job = await createBulkProductImportJob(idToken, {
        requestedRetailerId: retailerId,
        filename: readResult.filename,
        fileType: readResult.fileType,
        mappings,
        totalRows: readResult.rows.length,
      });

      if (job.success === false) {
        throw new Error(job.error);
      }

      setImportJobId(job.job.importJobId);

      await updateBulkProductImportJob(
        idToken,
        job.job.importJobId,
        { status: "VALIDATING" }
      );

      const mappedRows = mapProductImportRows(
        readResult.rows,
        mappings
      );

      const previewRows = mappedRows.map((row) => ({
        rowNumber: row.rowNumber,
        mapped: row.mapped,
      }));

      const result = await previewBulkProductImport(
        idToken,
        retailerId,
        previewRows
      );

      await updateBulkProductImportJob(
        idToken,
        job.job.importJobId,
        {
          status: "READY",
          totalRows: result.totalRows,
          validRows: result.validRows,
          warningRows: result.warningRows,
          rejectedRows: result.rejectedRows,
          duplicateRows: result.duplicateRows,
        }
      );

      setPreviewResult(result);
      setImportStage("idle");
    } catch (error) {
      setImportStage("idle");
      toast({
        title: "Validation Error",
        description:
          error instanceof Error
            ? error.message
            : "The product import could not be validated.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!readResult || !previewResult || !user) {
      toast({
        title: "Import Unavailable",
        description: "Please complete validation before importing.",
        variant: "destructive",
      });
      return;
    }

    const importRows = previewResult.rows
      .filter((row) => row.status === "VALID" || row.status === "WARNING")
      .map((row) => ({
        rowNumber: row.rowNumber,
        mapped: row.mapped,
      }));

    if (importRows.length === 0) {
      toast({
        title: "Nothing to Import",
        description: "There are no valid products available for import.",
      });
      return;
    }

    setIsImporting(true);

    let idToken: string | undefined;

    try {
      setImportStage("importing");
      idToken = await user.getIdToken();

      if (importJobId) {
        await updateBulkProductImportJob(
          idToken,
          importJobId,
          { status: "IMPORTING" }
        );
      }

      const result = await executeBulkProductImport(
        idToken,
        retailerId,
        importRows
      );

      setImportStage("finalising");
      const finalRejectedRows =
        previewResult.rejectedRows + result.rejectedRows;

      const finalStatus =
        finalRejectedRows > 0
          ? "COMPLETED_WITH_ERRORS"
          : "COMPLETED";

      if (importJobId) {
        await updateBulkProductImportJob(
          idToken,
          importJobId,
          {
            status: finalStatus,
            completedAt: new Date().toISOString(),
            createdRows: result.importedRows,
            duplicateRows:
              previewResult.duplicateRows + result.duplicateRows,
            rejectedRows: finalRejectedRows,
          }
        );
      }

      setImportStage("complete");
      setImportResult(result);

      toast({
        title: "Import Complete",
        description: `${result.importedRows} product${result.importedRows === 1 ? "" : "s"} imported successfully.`,
      });
    } catch (error) {
      setImportStage("idle");
      if (idToken && importJobId) {
        try {
          await updateBulkProductImportJob(
            idToken,
            importJobId,
            {
              status: "FAILED",
              completedAt: new Date().toISOString(),
            }
          );
        } catch {
          // Preserve the original import error if audit update also fails.
        }
      }

      toast({
        title: "Import Error",
        description:
          error instanceof Error
            ? error.message
            : "The product import could not be completed.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const requiredFields = getRequiredProductImportFields();

  const mappedTargetFields = mappings
    .map((mapping) => mapping.targetField)
    .filter((field) => field !== "");

  const missingRequiredFields = requiredFields.filter(
    (field) => !mappedTargetFields.includes(field)
  );

  const duplicateTargetFields = mappedTargetFields.filter(
    (field, index) => mappedTargetFields.indexOf(field) !== index
  );

  const uniqueDuplicateTargetFields = [...new Set(duplicateTargetFields)];

  const mappingHasConflicts =
    missingRequiredFields.length > 0 ||
    uniqueDuplicateTargetFields.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/retailer-mvp/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">
            Bulk Product Import
          </h2>
          <p className="text-sm text-muted-foreground">
            Import products from a CSV or XLSX file.
          </p>
        </div>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Upload className="h-12 w-12 text-muted-foreground/40 mb-4" />

          <h3 className="text-xl font-bold">
            Upload your product file
          </h3>

          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Select a CSV or XLSX file to begin. Your file will be read and
            checked before any products are imported.
          </p>

          <div className="mt-6">
            <Input
              id="product-import-file"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              disabled={isReading}
              className="max-w-sm"
            />
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Maximum file size: 10 MB
          </p>
        </CardContent>
      </Card>

      {isReading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm font-medium">
              Reading your product file...
            </p>
          </CardContent>
        </Card>
      )}

      {readResult && file && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-6 w-6 mt-1 text-muted-foreground" />

                <div>
                  <h3 className="font-bold">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {readResult.fileType} file detected
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rows detected
                </p>
                <p className="text-2xl font-black mt-1">
                  {readResult.rows.length}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Columns detected
                </p>
                <p className="text-2xl font-black mt-1">
                  {readResult.columns.length}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Retailer
                </p>
                <p className="text-sm font-bold mt-2">
                  {retailerId === 'unknown' ? 'Not linked' : retailerId}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold mb-3">
                Source columns
              </p>

              <div className="flex flex-wrap gap-2">
                {readResult.columns.map((column) => (
                  <span
                    key={column}
                    className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium"
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>

            {readResult.rows.length === 0 && (
              <p className="text-sm text-destructive">
                No product rows were detected in this file.
              </p>
            )}

            {readResult.rows.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={startMapping}>
                  Continue to Column Mapping
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showMapping && readResult && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Column Mapping</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Confirm how each column in your file should map to an iNteract product field.
              </p>
            </div>

            <div className="space-y-3">
              {mappings.map((mapping, index) => {
                const required = getRequiredProductImportFields().includes(mapping.targetField as any);
                const suggestion = suggestProductImportMappings([mapping.sourceColumn]).find(
                  (item) => item.sourceColumn === mapping.sourceColumn
                );

                return (
                  <div key={mapping.sourceColumn} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center rounded-lg border p-4">
                    <div>
                      <p className="font-semibold text-sm">{mapping.sourceColumn}</p>
                      {suggestion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {CONFIDENCE_LABELS[suggestion.confidence]}
                        </p>
                      )}
                    </div>

                    <Select
                      value={mapping.targetField || "none"}
                      onValueChange={(value) => {
                        setMappings((current) => current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, targetField: value === "none" ? "" : value }
                            : item
                        ));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Do not import" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Do not import</SelectItem>
                        {getProductImportTargetFields().map((field) => (
                          <SelectItem key={field} value={field}>
                            {PRODUCT_FIELD_LABELS[field]}{getRequiredProductImportFields().includes(field) ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-xs text-muted-foreground">
                      {required ? "Required" : "Optional"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-6 space-y-3">
              {missingRequiredFields.length > 0 && (
                <p className="text-sm text-destructive">
                  Required fields still need to be mapped:{" "}
                  {missingRequiredFields.map((field) => PRODUCT_FIELD_LABELS[field]).join(", ")}
                </p>
              )}

              {uniqueDuplicateTargetFields.length > 0 && (
                <p className="text-sm text-destructive">
                  Each target field can only be mapped once. Duplicate mappings:{" "}
                  {uniqueDuplicateTargetFields.map((field) => PRODUCT_FIELD_LABELS[field]).join(", ")}
                </p>
              )}

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  * Required fields must be mapped before validation can continue.
                </p>
                <Button onClick={handleContinueToValidation} disabled={mappingHasConflicts}>
                  Continue to Validation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importStage !== "idle" && importStage !== "complete" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <h3 className="font-bold">Import in progress</h3>
                <p className="text-sm text-muted-foreground">
                  Please keep this page open while we process your products.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: "validating", label: "Preparing & validating" },
                { key: "importing", label: "Importing products" },
                { key: "finalising", label: "Finalising import" },
              ].map((stage) => {
                const stages = ["validating", "importing", "finalising"];
                const currentIndex = stages.indexOf(importStage);
                const stageIndex = stages.indexOf(stage.key);
                const complete = stageIndex < currentIndex;
                const active = stage.key === importStage;

                return (
                  <div
                    key={stage.key}
                    className={`rounded-lg border p-4 ${active ? "bg-muted/40" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {complete ? (
                        <span className="text-sm font-bold">Done</span>
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                      )}
                      <span className="text-sm font-semibold">
                        {stage.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {previewResult && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Validation Results</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review the validation results before importing your products.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total
                </p>
                <p className="text-2xl font-black mt-1">
                  {previewResult.totalRows}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Valid
                </p>
                <p className="text-2xl font-black mt-1">
                  {previewResult.validRows}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Warnings
                </p>
                <p className="text-2xl font-black mt-1">
                  {previewResult.warningRows}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rejected
                </p>
                <p className="text-2xl font-black mt-1">
                  {previewResult.rejectedRows}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Skipped as duplicates
                </p>
                <p className="text-2xl font-black mt-1">
                  {previewResult.duplicateRows}
                </p>
              </div>
            </div>

            {previewResult.rows.some((row) => row.issues.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold">
                    Rows requiring attention
                  </p>
                  {readResult && previewResult && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadImportErrorReport(readResult, previewResult)
                      }
                    >
                      Download error report
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {previewResult.rows
                    .filter((row) => row.issues.length > 0)
                    .map((row) => (
                      <div
                        key={row.rowNumber}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-sm">
                              Row {row.rowNumber}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Status: {row.status}
                            </p>
                          </div>

                          {row.duplicateClassification && (
                            <span className="text-xs font-medium">
                              {row.duplicateClassification}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-1">
                          {row.issues.map((issue, issueIndex) => (
                            <p
                              key={`${row.rowNumber}-${issue.code}-${issueIndex}`}
                              className="text-sm"
                            >
                              <span className="font-semibold">
                                {issue.severity}:
                              </span>{" "}
                              {issue.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {previewResult.validRows + previewResult.warningRows > 0
                    ? `${previewResult.validRows + previewResult.warningRows} product${previewResult.validRows + previewResult.warningRows === 1 ? "" : "s"} ready for import.`
                    : "There are no new products available for import."}
                </p>
                {previewResult.duplicateRows > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {previewResult.duplicateRows} duplicate{previewResult.duplicateRows === 1 ? "" : "s"} will be skipped.
                  </p>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={
                  isImporting ||
                  previewResult.validRows + previewResult.warningRows === 0
                }
              >
                {isImporting ? "Importing..." : "Import Products"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Import Results</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The import has finished. Review the results below.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Imported
                </p>
                <p className="text-2xl font-black mt-1">
                  {importResult.importedRows}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Skipped as duplicates
                </p>
                <p className="text-2xl font-black mt-1">
                  {previewResult?.duplicateRows ?? 0}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rejected
                </p>
                <p className="text-2xl font-black mt-1">
                  {(previewResult?.rejectedRows ?? 0) + importResult.rejectedRows}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Job ID
                </p>
                <p className="text-sm font-mono mt-2 break-all">
                  {importJobId || "Unavailable"}
                </p>
              </div>
            </div>

            {importResult.rows.some((row) => row.status === "REJECTED") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold">
                    Rows requiring attention
                  </p>
                  {readResult && previewResult && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadImportErrorReport(readResult, previewResult, importResult.errors)
                      }
                    >
                      Download error report
                    </Button>
                  )}
                </div>


                <div className="space-y-2">
                  {importResult.rows
                    .filter((row) => row.status === "REJECTED")
                    .map((row) => (
                      <div
                        key={row.rowNumber}
                        className="rounded-lg border p-4"
                      >
                        <p className="font-semibold text-sm">
                          Row {row.rowNumber}
                        </p>

                        {row.issues.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {row.issues.map((issue, issueIndex) => (
                              <p
                                key={`${row.rowNumber}-${issue.code}-${issueIndex}`}
                                className="text-sm"
                              >
                                <span className="font-semibold">
                                  {issue.severity}:
                                </span>{" "}
                                {issue.message}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            The row could not be imported.
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
