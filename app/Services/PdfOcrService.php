<?php

namespace App\Services;

use Symfony\Component\Process\Process;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Str;

class PdfOcrService
{
    // ✅ আপনার PC অনুযায়ী এগুলো ঠিক করে দিন
    private string $pdftoppm = 'C:\poppler\Library\bin\pdftoppm.exe';
    private string $tesseract = 'C:\Program Files\Tesseract-OCR\tesseract.exe';
    private string $pdftotext = 'C:\poppler\Library\bin\pdftotext.exe';

    public function extract(string $pdfFullPath, int $dpi = 300): array
    {
        $workDir = storage_path('app/tmp/pdf_' . Str::random(10));
        if (!is_dir($workDir)) mkdir($workDir, 0777, true);

        // 1) Try normal text layer (works for digital PDFs)
        $textLayer = '';
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($pdfFullPath);
            $textLayer = trim($pdf->getText());
        } catch (\Throwable $e) {
            $textLayer = '';
        }

        // 2) PDF -> PNG pages (for OCR)
        // Creates: page-1.png, page-2.png ...
        $this->run([$this->pdftoppm, '-png', '-r', (string)$dpi, $pdfFullPath, $workDir . '\page']);

        $pageImages = glob($workDir . '\page-*.png') ?: [];
        sort($pageImages);

        // 3) OCR each page image
        $ocrPages = [];
        foreach ($pageImages as $img) {
            $outBase = $workDir . '\ocr_' . pathinfo($img, PATHINFO_FILENAME);

            // ben+eng => Bangla + English
            $this->run([$this->tesseract, $img, $outBase, '-l', 'ben+eng']);

            $txtFile = $outBase . '.txt';
            $ocrPages[] = file_exists($txtFile) ? trim(file_get_contents($txtFile)) : '';
        }

        $ocrText = trim(implode("\n\n---PAGE---\n\n", $ocrPages));
        $finalText = trim(($textLayer ? $textLayer . "\n\n---OCR---\n\n" : '') . $ocrText);

        return [
            'text_layer' => $textLayer,
            'ocr_text' => $ocrText,
            'text' => $finalText,
            'pages_count' => count($pageImages),
        ];
    }

    private function run(array $cmd): void
    {
        $p = new Process($cmd);
        $p->setTimeout(180);
        $p->run();

        if (!$p->isSuccessful()) {
            throw new \RuntimeException($p->getErrorOutput() ?: 'Command failed');
        }
    }
}
