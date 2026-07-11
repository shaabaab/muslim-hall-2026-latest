<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            'exhibition_videos' => ['parent' => 'exhibition_id', 'table' => 'exhibitions', 'column' => 'video'],
            'exhibition_pdfs' => ['parent' => 'exhibition_id', 'table' => 'exhibitions', 'column' => 'pdf'],
            'exhibition_audios' => ['parent' => 'exhibition_id', 'table' => 'exhibitions', 'column' => 'audio'],
            'community_videos' => ['parent' => 'community_id', 'table' => 'communities', 'column' => 'video'],
            'community_pdfs' => ['parent' => 'community_id', 'table' => 'communities', 'column' => 'pdf'],
            'community_audios' => ['parent' => 'community_id', 'table' => 'communities', 'column' => 'audio'],
        ] as $tableName => $meta) {
            if (!Schema::hasTable($tableName)) {
                Schema::create($tableName, function (Blueprint $table) use ($meta) {
                    $table->id();
                    $table->foreignId($meta['parent'])->constrained($meta['table'])->cascadeOnDelete();
                    $table->string($meta['column'])->nullable();
                    $table->timestamps();
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_audios');
        Schema::dropIfExists('community_pdfs');
        Schema::dropIfExists('community_videos');
        Schema::dropIfExists('exhibition_audios');
        Schema::dropIfExists('exhibition_pdfs');
        Schema::dropIfExists('exhibition_videos');
    }
};
