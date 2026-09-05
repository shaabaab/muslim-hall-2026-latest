<?php

namespace Tests\Feature;

use App\Models\Exhibition;
use App\Models\ExhibitionBoard;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression cover for the "my exhibition is not submitting" reports: an
 * external link or a long rich-text caption made the insert fail after the
 * media had already been written to S3, so the user got a silent 500 and the
 * bucket kept an orphaned folder.
 */
class UserExhibitionSubmissionTest extends TestCase
{
    use DatabaseTransactions;

    private function board(User $owner): ExhibitionBoard
    {
        return ExhibitionBoard::create([
            'user_id' => $owner->id,
            'title' => 'Test Board ' . uniqid(),
            'slug' => 'test-board-' . uniqid(),
            'approval_status' => ExhibitionBoard::STATUS_APPROVED,
            'is_active' => true,
        ]);
    }

    private function payload(ExhibitionBoard $board, array $overrides = []): array
    {
        return array_merge([
            'board_mode' => 'existing',
            'exhibition_board_id' => $board->id,
            'title' => '<p>A caption</p>',
            'description' => '<p>Some description</p>',
            'type' => 'art',
            'image' => UploadedFile::fake()->image('main.jpg'),
        ], $overrides);
    }

    public function test_submission_with_an_external_link_is_stored(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $board = $this->board($user);

        $response = $this->actingAs($user)->post(
            route('user.exhibitions.store'),
            $this->payload($board, ['link' => 'https://example.com/my-artwork'])
        );

        $response->assertRedirect(route('user.exhibitions.index'));

        $exhibition = Exhibition::where('user_id', $user->id)->latest('id')->first();
        $this->assertNotNull($exhibition, 'The exhibition row was not created.');
        $this->assertSame('https://example.com/my-artwork', $exhibition->link);
    }

    public function test_submission_with_a_long_rich_text_caption_is_stored(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $board = $this->board($user);

        // Comfortably past the old varchar(255) limit once Quill markup counts.
        $caption = '<p><strong>' . str_repeat('a long formatted caption ', 40) . '</strong></p>';

        $response = $this->actingAs($user)->post(
            route('user.exhibitions.store'),
            $this->payload($board, ['title' => $caption])
        );

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('user.exhibitions.index'));

        $exhibition = Exhibition::where('user_id', $user->id)->latest('id')->first();
        $this->assertNotNull($exhibition, 'The exhibition row was not created.');
        $this->assertGreaterThan(255, strlen($exhibition->title));
    }

    public function test_a_failed_submission_leaves_no_orphaned_uploads(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $board = $this->board($user);

        // A board that passes `exists:` validation but not the approved()/active()
        // scopes, so the write fails after uploadMainFiles() has run.
        $unusable = $this->board($user);
        $unusable->update(['approval_status' => ExhibitionBoard::STATUS_PENDING]);

        $before = Exhibition::where('user_id', $user->id)->count();

        $this->actingAs($user)->post(
            route('user.exhibitions.store'),
            $this->payload($unusable, ['exhibition_board_id' => $unusable->id])
        );

        $this->assertSame($before, Exhibition::where('user_id', $user->id)->count());
        $this->assertEmpty(
            Storage::disk('s3')->allFiles('exhibitions'),
            'Uploads were left in the bucket after the submission failed.'
        );

        unset($board);
    }
}
