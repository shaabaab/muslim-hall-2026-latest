<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\Language;
use App\Models\Seo;
use App\Services\ServiceClass;
use App\Traits\HasSeo;

class Category extends Model
{
    use HasFactory, HasSeo;

    protected $fillable = [
        'name',
        'slug',
        'img',
        'description',
        'status',
        'lang_id',
        'parent_id',
    ];

    const ACTIVE = 1;
    const INACTIVE = 0;


    public function post()
    {
        return $this->hasMany(Post::class);
    }

    // Self-referential relationship for parent category
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Relationship for child categories
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }


    // Relationship with Language model
    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id', 'id');
    }


    //local scope for active with parent categories
    public function scopeActiveWithParent($query)
    {
        return $query->where('status', self::ACTIVE)->whereNull('parent_id');
    }

    //local scope for active categories
    public function scopeActive($query)
    {
        return $query->where('status', self::ACTIVE);
    }


    // Search scope
    public function scopeSearch($query, $search)
    {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhereHas('language', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
        });
    }

    //status scope
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    //langId scope
    public function scopeLangId($query, $lang_id)
    {
        return $query->where('lang_id', $lang_id);
    }


    public function updateCategory(array $data): void
    {
        if(isset($data['img']) && $data['img'] != null){
            $imagePath = ServiceClass::updateFile($data['img'], 'Category', $this->img);
        } else {
            $imagePath = $this->img;
        }

   

        $this->update([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'status' => $data['status'],
            'lang_id' => $data['lang_id'],
            'img' => $imagePath,
            'parent_id' => $data['parent_id'] ?? null,
        ]);
    }


    /**
     * Store a new category.
     *
     * @param array $data
     * @return Category
     */
    public static function storeCategory(array $data): Category
    {
        $imagePath = null;

        if (!empty($data['img'])) {
            $imagePath = ServiceClass::uploadFile($data['img'], 'Category');
        }

        return self::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'status' => $data['status'],
            'lang_id' => $data['lang_id'],
            'img' => $imagePath,
            'parent_id' => $data['parent_id'] ?? null,
        ]);
    }

}
